import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { GRADE_NAMES, normalizeGrade, getFormType, SUPER_ADMINS } from '@/lib/teacher-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const periodo = searchParams.get('periodo') || ''
  const anio    = searchParams.get('anio') || ''

  // Cargar docentes desde BD
  const { data: docentesRows } = await supabase
    .from('docentes')
    .select('email, nombre, grado, materia')
    .eq('activo', true)
    .order('nombre')

  // Agrupar por email
  const teacherMap: Record<string, { nombre: string; materias: Record<string, string[]> }> = {}
  for (const row of (docentesRows || [])) {
    if (SUPER_ADMINS.includes(row.email)) continue
    if (!teacherMap[row.email]) teacherMap[row.email] = { nombre: row.nombre, materias: {} }
    if (!teacherMap[row.email].materias[row.grado]) teacherMap[row.email].materias[row.grado] = []
    if (!teacherMap[row.email].materias[row.grado].includes(row.materia)) {
      teacherMap[row.email].materias[row.grado].push(row.materia)
    }
  }

  const { data: allStudents } = await supabase
    .from('estudiantes').select('nombre, email, grado')

  const normalizedStudents = (allStudents || []).map(s => ({
    ...s,
    gradeNorm: normalizeGrade(s.grado)
  }))

  const { data: bachResp } = await supabase
    .from('respuestas_bachillerato').select('correo, nombre, materia, grado')
    .eq('periodo', periodo).eq('anio', anio)

  const { data: globalResp } = await supabase
    .from('respuestas_global').select('correo, nombre, grado')
    .eq('periodo', periodo).eq('anio', anio)

  const teachers: any[] = []
  let totalSubmitted = 0
  let totalPending   = 0

  for (const [email, info] of Object.entries(teacherMap)) {
    if (Object.keys(info.materias).length === 0) continue

    const tGroups: any[] = []
    let teacherSubmitted = 0
    let teacherTotal     = 0

    for (const [grade, materias] of Object.entries(info.materias)) {
      const gradeNorm     = normalizeGrade(grade)
      const formType      = getFormType(gradeNorm)
      const gradeLabel    = GRADE_NAMES[gradeNorm] || grade
      const gradeStudents = normalizedStudents.filter(s => s.gradeNorm === gradeNorm)

      if (formType === 'none') {
        for (const materia of materias) {
          tGroups.push({ grade: gradeNorm, gradeLabel, materia, formType, total: gradeStudents.length, submitted: 0 })
          teacherTotal += gradeStudents.length
        }
      } else if (formType === 'global') {
        const submittedNames = new Set(
          (globalResp || []).filter(r => normalizeGrade(r.grado) === gradeNorm).map(r => r.nombre)
        )
        for (const materia of materias) {
          tGroups.push({ grade: gradeNorm, gradeLabel, materia, formType, total: gradeStudents.length, submitted: submittedNames.size })
          teacherSubmitted += submittedNames.size
          teacherTotal     += gradeStudents.length
        }
      } else {
        for (const materia of materias) {
          const submittedCount = (bachResp || []).filter(
            r => normalizeGrade(r.grado) === gradeNorm && r.materia === materia
          ).length
          tGroups.push({ grade: gradeNorm, gradeLabel, materia, formType, total: gradeStudents.length, submitted: submittedCount })
          teacherSubmitted += submittedCount
          teacherTotal     += gradeStudents.length
        }
      }
    }

    if (tGroups.length === 0) continue

    totalSubmitted += teacherSubmitted
    totalPending   += Math.max(0, teacherTotal - teacherSubmitted)

    teachers.push({
      email,
      nombre: info.nombre,
      groups: tGroups,
      total: teacherTotal,
      submitted: teacherSubmitted,
      pending: Math.max(0, teacherTotal - teacherSubmitted),
      pct: teacherTotal > 0 ? Math.round((teacherSubmitted / teacherTotal) * 100) : 0
    })
  }

  teachers.sort((a, b) => a.pct - b.pct)

  const totalStudents = normalizedStudents.length

  return NextResponse.json({
    success: true,
    teachers,
    stats: {
      totalStudents,
      totalSubmitted,
      totalPending,
      pct: totalStudents > 0 ? Math.round((totalSubmitted / totalStudents) * 100) : 0
    },
    periodo,
    anio
  })
}
