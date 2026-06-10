import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('configuracion')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()

  const { error } = await supabase
    .from('configuracion')
    .update({
      periodo:           body.periodo,
      anio:              body.anio,
      estado:            body.estado || 'abierto',
      mensaje:           body.mensaje || '',
      institucion:       body.institucion || 'Colegio Londres',
      platform_schedule: body.platformSchedule || {},
      periodo_1_inicio:  body.periodoDates?.[0]?.inicio || null,
      periodo_1_fin:     body.periodoDates?.[0]?.fin    || null,
      periodo_2_inicio:  body.periodoDates?.[1]?.inicio || null,
      periodo_2_fin:     body.periodoDates?.[1]?.fin    || null,
      periodo_3_inicio:  body.periodoDates?.[2]?.inicio || null,
      periodo_3_fin:     body.periodoDates?.[2]?.fin    || null,
      periodo_4_inicio:  body.periodoDates?.[3]?.inicio || null,
      periodo_4_fin:     body.periodoDates?.[3]?.fin    || null,
      updated_at:        new Date().toISOString()
    })
    .eq('id', 1)

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}