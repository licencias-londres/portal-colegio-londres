import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET — listar todos los estudiantes
export async function GET() {
  const { data, error } = await supabase
    .from('estudiantes')
    .select('id, nombre, email, grado')
    .order('grado').order('nombre')

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, students: data || [] })
}

// POST — agregar estudiante
export async function POST(request: Request) {
  const body = await request.json()
  const { nombre, email, grado } = body

  if (!nombre || !grado) {
    return NextResponse.json({ success: false, error: 'Nombre y grado son requeridos' }, { status: 400 })
  }

  const { error } = await supabase.from('estudiantes').insert({
    nombre: nombre.trim(),
    email:  (email || '').trim().toLowerCase(),
    grado:  grado.trim()
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE — eliminar estudiante por id
export async function DELETE(request: Request) {
  const body = await request.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
  }

  const { error } = await supabase.from('estudiantes').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
