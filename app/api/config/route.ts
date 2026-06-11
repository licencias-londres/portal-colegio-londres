import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function toH24(hour: string, min: string, ampm: string): string {
  let h = parseInt(hour || '12')
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2,'0')}:${(min || '00').padStart(2,'0')}:00`
}

export async function GET() {
  const { data, error } = await supabase
    .from('configuracion')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calcular período activo según fecha actual vs rangos de inicio/fin
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let activePeriodo = String(data.periodo) // respaldo: período guardado manualmente

  for (const p of [1, 2, 3, 4]) {
    const inicio = data[`periodo_${p}_inicio`]
    const fin    = data[`periodo_${p}_fin`]
    if (inicio && fin) {
      const start = new Date(inicio + 'T00:00:00')
      const end   = new Date(fin    + 'T23:59:59')
      if (today >= start && today <= end) {
        activePeriodo = String(p)
        break
      }
    }
  }
  data.periodo = activePeriodo

  // Calcular estado efectivo desde platform_schedule si hay fechas configuradas
  const ps = (data.platform_schedule || {})[activePeriodo]
  if (ps?.openDate && ps?.closeDate) {
    const now   = new Date()
    const open  = new Date(`${ps.openDate}T${toH24(ps.openHour, ps.openMin, ps.openAmPm || 'AM')}`)
    const close = new Date(`${ps.closeDate}T${toH24(ps.closeHour, ps.closeMin, ps.closeAmPm || 'PM')}`)
    data.estado = (now >= open && now <= close) ? 'abierto' : 'cerrado'
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