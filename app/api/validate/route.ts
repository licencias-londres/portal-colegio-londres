import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { normalizeGrade } from '@/lib/teacher-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SUPER_ADMINS = [
  'sistemas@colegiolondres.edu.co',
  'licencias@colegiolondres.edu.co'
]

export async function POST(request: Request) {
  const { email, selectedGradeKey } = await request.json()
  const emailLower = email.trim().toLowerCase()

  if (SUPER_ADMINS.includes(emailLower)) {
    const nombre = emailLower.split('@')[0]
    return NextResponse.json({
      valid: true,
      nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
      grado: selectedGradeKey,
      gradeKey: normalizeGrade(selectedGradeKey),
      isSuperAdmin: true
    })
  }

  if (!emailLower.endsWith('@colegiolondres.edu.co')) {
    return NextResponse.json({
      valid: false,
      error: 'domain',
      message: 'Debes ingresar tu correo institucional (@colegiolondres.edu.co)'
    })
  }

  const { data, error } = await supabase
    .from('estudiantes')
    .select('email, nombre, grado')
    .eq('email', emailLower)
    .single()

  if (error || !data) {
    return NextResponse.json({
      valid: false,
      error: 'not_found',
      message: `El correo ${emailLower} no fue encontrado. Verifica que sea correcto o contacta al administrador.`
    })
  }

  const studentGradeKey = normalizeGrade(data.grado)
  const selectedNorm    = normalizeGrade(selectedGradeKey)

  if (studentGradeKey !== selectedNorm) {
    return NextResponse.json({
      valid: false,
      error: 'wrong_grade',
      nombre: data.nombre,
      correctGrade: data.grado,
      correctGradeKey: studentGradeKey,
      message: `Tu correo está registrado en ${data.grado}, pero seleccionaste el grado ${selectedGradeKey}°.`
    })
  }

  return NextResponse.json({
    valid: true,
    nombre: data.nombre,
    grado: data.grado,
    gradeKey: studentGradeKey
  })
}