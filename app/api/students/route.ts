import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { normalizeGrade } from '@/lib/teacher-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const grade = searchParams.get('grade')

  if (!grade) {
    return NextResponse.json({ success: false, error: 'Grado requerido' }, { status: 400 })
  }

  const gradeNorm = normalizeGrade(grade)

  const { data, error } = await supabase
    .from('estudiantes')
    .select('nombre, grado')
    .order('nombre', { ascending: true })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const students = (data || [])
    .filter(s => normalizeGrade(s.grado) === gradeNorm)
    .map(s => s.nombre)

  return NextResponse.json({ success: true, students })
}