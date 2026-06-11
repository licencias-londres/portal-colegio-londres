import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { normalizeGrade, getFormType, GRADE_NAMES, SUPER_ADMINS } from '@/lib/teacher-data'
import { sendReminderEmail, sendPlatformNotifEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getTeacherMap() {
  const { data: rows } = await supabase
    .from('docentes')
    .select('email, nombre, grado, materia')
    .eq('activo', true)
    .order('nombre')

  const map: Record<string, { nombre: string; materias: Record<string, string[]> }> = {}
  for (const row of (rows || [])) {
    if (SUPER_ADMINS.includes(row.email)) continue
    if (!map[row.email]) map[row.email] = { nombre: row.nombre, materias: {} }
    if (!map[row.email].materias[row.grado]) map[row.email].materias[row.grado] = []
    if (!map[row.email].materias[row.grado].includes(row.materia)) {
      map[row.email].materias[row.grado].push(row.materia)
    }
  }
  return map
}

export async function POST(request: Request) {
  const body = await request.json()
  const { action, periodo, anio } = body

  // — Notificar a todos los estudiantes pendientes —
  if (action === 'notifyPending') {
    const teacherMap = await getTeacherMap()

    const { data: allStudents } = await supabase.from('estudiantes').select('nombre, email, grado')
    const { data: bachResp } = await supabase.from('respuestas_bachillerato')
      .select('correo, materia, grado').eq('periodo', periodo).eq('anio', anio)
    const { data: globalResp } = await supabase.from('respuestas_global')
      .select('nombre, grado').eq('periodo', periodo).eq('anio', anio)

    const normalizedStudents = (allStudents || []).map(s => ({ ...s, gradeNorm: normalizeGrade(s.grado) }))

    let sent = 0
    const errors: string[] = []

    for (const [, info] of Object.entries(teacherMap)) {
      for (const [grade, materias] of Object.entries(info.materias)) {
        const gradeNorm     = normalizeGrade(grade)
        const formType      = getFormType(gradeNorm)
        const gradeLabel    = GRADE_NAMES[gradeNorm] || grade
        const gradeStudents = normalizedStudents.filter(s => s.gradeNorm === gradeNorm)

        for (const materia of materias) {
          let pendingEmails: string[] = []
          let pendingNames:  string[] = []

          if (formType === 'global') {
            const submittedNames = new Set((globalResp || []).filter(r => normalizeGrade(r.grado) === gradeNorm).map(r => r.nombre))
            const pending = gradeStudents.filter(s => s.email && !submittedNames.has(s.nombre))
            pendingEmails = pending.map(s => s.email!)
            pendingNames  = pending.map(s => s.nombre)
          } else if (formType === 'bachillerato') {
            const submittedEmails = new Set((bachResp || []).filter(r => normalizeGrade(r.grado) === gradeNorm && r.materia === materia).map(r => r.correo))
            const pending = gradeStudents.filter(s => s.email && !submittedEmails.has(s.email))
            pendingEmails = pending.map(s => s.email!)
            pendingNames  = pending.map(s => s.nombre)
          }

          for (let i = 0; i < pendingEmails.length; i++) {
            if (!pendingEmails[i]) continue
            try {
              await sendReminderEmail(pendingEmails[i], pendingNames[i], materia, gradeLabel, periodo, anio)
              sent++
            } catch(err: any) { errors.push(err.message) }
          }
        }
      }
    }

    return NextResponse.json({ success: true, sent, errors })
  }

  // — Notificar apertura/cierre a todos los docentes —
  if (action === 'notifyPlatform') {
    const { platformAction } = body
    const teacherMap = await getTeacherMap()
    let sent = 0
    const errors: string[] = []

    for (const [tEmail, info] of Object.entries(teacherMap)) {
      try {
        await sendPlatformNotifEmail(tEmail, info.nombre, platformAction, periodo, anio)
        sent++
      } catch(err: any) { errors.push(`${tEmail}: ${err.message}`) }
    }
    return NextResponse.json({ success: true, sent, errors })
  }

  return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 })
}
