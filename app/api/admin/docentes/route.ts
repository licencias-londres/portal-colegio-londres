import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TEACHER_DATA } from '@/lib/teacher-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function seedIfEmpty() {
  const { count } = await supabase
    .from('docentes')
    .select('*', { count: 'exact', head: true })

  if ((count ?? 0) > 0) return

  const rows: any[] = []
  for (const [email, info] of Object.entries(TEACHER_DATA)) {
    for (const [grado, materias] of Object.entries(info.materias)) {
      for (const materia of materias) {
        rows.push({ email, nombre: info.nombre, grado, materia, activo: true })
      }
    }
  }
  if (rows.length > 0) {
    await supabase.from('docentes').insert(rows)
  }
}

export async function GET() {
  await seedIfEmpty()
  const { data, error } = await supabase
    .from('docentes')
    .select('*')
    .eq('activo', true)
    .order('nombre')
    .order('grado')
    .order('materia')

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true, docentes: data })
}

export async function POST(request: Request) {
  const { email, nombre, grado, materia } = await request.json()

  if (!email || !nombre || !grado || !materia) {
    return NextResponse.json({ success: false, error: 'Todos los campos son requeridos' }, { status: 400 })
  }

  const { error } = await supabase.from('docentes').insert({
    email:   email.toLowerCase().trim(),
    nombre:  nombre.trim(),
    grado:   grado.trim(),
    materia: materia.trim(),
    activo:  true
  })

  if (error) {
    const msg = error.code === '23505' ? 'Ya existe esa asignación (misma materia y grado para ese docente)' : error.message
    return NextResponse.json({ success: false, error: msg })
  }
  return NextResponse.json({ success: true })
}

export async function PUT(request: Request) {
  const { email, nombre } = await request.json()
  if (!email || !nombre) {
    return NextResponse.json({ success: false, error: 'Faltan parámetros' }, { status: 400 })
  }
  const { error } = await supabase
    .from('docentes')
    .update({ nombre: nombre.trim() })
    .eq('email', email.toLowerCase().trim())

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })

  const { error } = await supabase.from('docentes').delete().eq('id', id)

  if (error) return NextResponse.json({ success: false, error: error.message })
  return NextResponse.json({ success: true })
}
