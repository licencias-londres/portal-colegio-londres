import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  const body = await request.json()

  try {
    if (body.tipo === 'global') {
      const { error } = await supabase
        .from('respuestas_global')
        .insert({
          periodo:       body.periodo,
          anio:          body.anio,
          correo:        body.email,
          nombre:        body.nombre,
          grado:         body.grado,
          participacion: body.participacion,
          puntualidad:   body.puntualidad,
          cumplimiento:  body.cumplimiento,
          autonomia:     body.autonomia,
          atencion:      body.atencion,
          nota_final:    body.notaFinal,
          reflexion:     body.reflexion,
          compromiso:    body.compromiso
        })

      if (error) throw error

    } else if (body.tipo === 'bachillerato') {
      const rows = body.materias.map((m: any) => ({
        periodo:                   body.periodo,
        anio:                      body.anio,
        correo:                    body.email,
        nombre:                    body.nombre,
        grado:                     body.grado,
        materia:                   m.nombre,
        c1: m.c1,   c2: m.c2,   c3: m.c3,   c4: m.c4,
        c5: m.c5,   c6: m.c6,   c7: m.c7,   c8: m.c8,
        c9: m.c9,   c10: m.c10, c11: m.c11, c12: m.c12,
        nota_final:                m.notaFinal,
        reflexion:                 m.reflexion,
        item_personalizado_1:      m.ci1  ?? null,
        item_pers_1_justificacion: m.ci1j ?? null,
        item_personalizado_2:      m.ci2  ?? null,
        item_pers_2_justificacion: m.ci2j ?? null
      }))

      const { error } = await supabase
        .from('respuestas_bachillerato')
        .insert(rows)

      if (error) throw error
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    )
  }
}