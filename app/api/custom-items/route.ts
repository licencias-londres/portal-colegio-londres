import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { normalizeGrade } from '@/lib/teacher-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET ?grade=&periodo=&anio= — para el formulario del estudiante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const grade   = searchParams.get('grade')
  const periodo = searchParams.get('periodo')
  const anio    = searchParams.get('anio')

  if (!grade || !periodo || !anio) {
    return NextResponse.json({ success: true, items: {} })
  }

  const gradeNorm = normalizeGrade(grade)

  const { data, error } = await supabase
    .from('items_personalizados')
    .select('materia, item_1, item_2')
    .eq('grado', gradeNorm)
    .eq('periodo', periodo)
    .eq('anio', anio)

  if (error) return NextResponse.json({ success: true, items: {} })

  const items: Record<string, { item1: string; item2: string }> = {}
  for (const row of data || []) {
    if (row.item_1 || row.item_2) {
      items[row.materia] = { item1: row.item_1 || '', item2: row.item_2 || '' }
    }
  }

  return NextResponse.json({ success: true, items })
}

// POST — guardar ítems personalizados (portal docente)
export async function POST(request: Request) {
  const body = await request.json()
  const { emailDocente, grado, materia, periodo, anio, item1, item2 } = body

  if (!emailDocente || !grado || !materia || !periodo || !anio) {
    return NextResponse.json({ success: false, error: 'Parámetros requeridos' }, { status: 400 })
  }

  const gradeNorm = normalizeGrade(grado)

  const { error } = await supabase
    .from('items_personalizados')
    .upsert({
      email_docente: emailDocente.toLowerCase(),
      grado: gradeNorm,
      materia,
      periodo,
      anio,
      item_1: item1 || '',
      item_2: item2 || '',
      updated_at: new Date().toISOString()
    }, { onConflict: 'email_docente,grado,materia,periodo,anio' })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// GET ?emailDocente=&grado=&materia=&periodo=&anio= — obtener ítems de un docente/grupo específico
export async function PATCH(request: Request) {
  const body = await request.json()
  const { emailDocente, grado, materia, periodo, anio } = body
  const gradeNorm = normalizeGrade(grado || '')

  const { data, error } = await supabase
    .from('items_personalizados')
    .select('item_1, item_2')
    .eq('email_docente', emailDocente?.toLowerCase())
    .eq('grado', gradeNorm)
    .eq('materia', materia)
    .eq('periodo', periodo)
    .eq('anio', anio)
    .maybeSingle()

  if (error) return NextResponse.json({ success: false, error: error.message })

  return NextResponse.json({
    success: true,
    item1: data?.item_1 || '',
    item2: data?.item_2 || ''
  })
}
