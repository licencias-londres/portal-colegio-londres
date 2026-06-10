import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { normalizeGrade } from '@/lib/teacher-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET ?grade=&materia=&periodo=&anio= — respuestas detalladas de un grupo
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const grade   = searchParams.get('grade')
  const materia = searchParams.get('materia')
  const periodo = searchParams.get('periodo')
  const anio    = searchParams.get('anio')

  if (!grade || !materia || !periodo || !anio) {
    return NextResponse.json({ success: false, error: 'Parámetros requeridos' }, { status: 400 })
  }

  const gradeNorm = normalizeGrade(grade)

  // Buscar en respuestas_bachillerato por grado (el grado puede estar almacenado en varios formatos)
  const { data, error } = await supabase
    .from('respuestas_bachillerato')
    .select('*')
    .eq('periodo', periodo)
    .eq('anio', anio)
    .eq('materia', materia)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  // Filtrar por grado normalizado
  const filtered = (data || []).filter(r => normalizeGrade(r.grado) === gradeNorm)

  return NextResponse.json({ success: true, responses: filtered })
}
