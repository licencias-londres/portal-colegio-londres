import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { GRADE_NAMES, normalizeGrade, getFormType } from '@/lib/teacher-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email   = searchParams.get('email')
  const periodo = searchParams.get('periodo') || ''
  const anio    = searchParams.get('anio') || ''

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email requerido' }, { status: 400 })
  }

  const emailLower = email.toLowerCase().trim()

  const { data: dbRows } = await supabase
    .from('docentes')
    .select('nombre, grado, materia')
    .eq('email', emailLower)
    .eq('activo', true)

  if (!dbRows || dbRows.length === 0) {
    return NextResponse.json({ success: false, error: 'Docente no encontrado' }, { status: 404 })
  }

  const materias: Record<string, string[]> = {}
  for (const row of dbRows) {
    if (!materias[row.grado]) materias[row.grado] = []
    if (!materias[row.grado].includes(row.materia)) materias[row.grado].push(row.materia)
  }
  const teacherInfo = { nombre: dbRows[0].nombre, materias }

  // Cargar todos los estudiantes una vez
  const { data: allStudents } = await supabase
    .from('estudiantes')
    .select('nombre, email, grado')

  const normalizedStudents = (allStudents || []).map(s => ({
    ...s,
    gradeNorm: normalizeGrade(s.grado)
  }))

  // Cargar respuestas bachillerato del período
  const { data: bachResp } = await supabase
    .from('respuestas_bachillerato')
    .select('correo, nombre, materia, grado')
    .eq('periodo', periodo)
    .eq('anio', anio)

  // Cargar respuestas global del período
  const { data: globalResp } = await supabase
    .from('respuestas_global')
    .select('correo, nombre, grado')
    .eq('periodo', periodo)
    .eq('anio', anio)

  // Cargar ítems personalizados del docente
  const { data: customItems } = await supabase
    .from('items_personalizados')
    .select('grado, materia, item_1, item_2')
    .eq('email_docente', emailLower)
    .eq('periodo', periodo)
    .eq('anio', anio)

  const ciMap: Record<string, Record<string, { item1: string; item2: string }>> = {}
  for (const ci of customItems || []) {
    if (!ciMap[ci.grado]) ciMap[ci.grado] = {}
    ciMap[ci.grado][ci.materia] = { item1: ci.item_1 || '', item2: ci.item_2 || '' }
  }

  const groups: any[] = []

  for (const [grade, materias] of Object.entries(teacherInfo.materias)) {
    const gradeNorm  = normalizeGrade(grade)
    const formType   = getFormType(gradeNorm)
    const gradeLabel = GRADE_NAMES[gradeNorm] || grade

    // Estudiantes de este grado
    const gradeStudents = normalizedStudents.filter(s => s.gradeNorm === gradeNorm)

    if (formType === 'none') {
      // Transición / 1°: sin autoevaluación individual
      for (const materia of materias) {
        groups.push({
          grade: gradeNorm, gradeLabel, materia, formType,
          totalStudents: gradeStudents.length,
          submitted: 0, pendingCount: gradeStudents.length,
          pendingNames: gradeStudents.map(s => s.nombre),
          pendingEmails: gradeStudents.map(s => s.email || '').filter(Boolean),
          ci: ciMap[gradeNorm]?.[materia] || { item1: '', item2: '' }
        })
      }
    } else if (formType === 'global') {
      // 2° / 3°: form global — una respuesta por estudiante, sin materia
      const submittedNames = new Set(
        (globalResp || [])
          .filter(r => normalizeGrade(r.grado) === gradeNorm)
          .map(r => r.nombre)
      )
      const pending = gradeStudents.filter(s => !submittedNames.has(s.nombre))

      for (const materia of materias) {
        groups.push({
          grade: gradeNorm, gradeLabel, materia, formType,
          totalStudents: gradeStudents.length,
          submitted: submittedNames.size,
          pendingCount: pending.length,
          pendingNames: pending.map(s => s.nombre),
          pendingEmails: pending.map(s => s.email || '').filter(Boolean),
          ci: { item1: '', item2: '' }
        })
      }
    } else {
      // Bachillerato (4°–11°): respuesta por materia
      for (const materia of materias) {
        const submittedEmails = new Set(
          (bachResp || [])
            .filter(r => normalizeGrade(r.grado) === gradeNorm && r.materia === materia)
            .map(r => r.correo)
        )
        const pending = gradeStudents.filter(s => s.email && !submittedEmails.has(s.email))

        groups.push({
          grade: gradeNorm, gradeLabel, materia, formType,
          totalStudents: gradeStudents.length,
          submitted: submittedEmails.size,
          pendingCount: pending.length,
          pendingNames: pending.map(s => s.nombre),
          pendingEmails: pending.map(s => s.email || '').filter(Boolean),
          ci: ciMap[gradeNorm]?.[materia] || { item1: '', item2: '' }
        })
      }
    }
  }

  // Ordenar: primero los incompletos, luego por grado
  groups.sort((a, b) => {
    if (a.pendingCount > 0 && b.pendingCount === 0) return -1
    if (a.pendingCount === 0 && b.pendingCount > 0) return 1
    return a.grade.localeCompare(b.grade)
  })

  return NextResponse.json({
    success: true,
    teacher: teacherInfo.nombre,
    email: emailLower,
    groups,
    periodo,
    anio
  })
}
