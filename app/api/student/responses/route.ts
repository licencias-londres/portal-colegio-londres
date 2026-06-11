import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { GRADE_NAMES, normalizeGrade } from '@/lib/teacher-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET ?tipo=bachillerato&correo=&grado=&periodo=&anio=
// GET ?tipo=global&nombre=&grado=&periodo=&anio=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tipo    = searchParams.get('tipo')
  const correo  = searchParams.get('correo')
  const nombre  = searchParams.get('nombre')
  const grado   = searchParams.get('grado')
  const periodo = searchParams.get('periodo')
  const anio    = searchParams.get('anio')

  if (!grado || !periodo || !anio) {
    return NextResponse.json({ success: false, error: 'Faltan parámetros' }, { status: 400 })
  }

  // El grado en la BD está guardado como label (ej: "Grado 6°")
  const gradoLabel = GRADE_NAMES[normalizeGrade(grado)] || grado

  if (tipo === 'bachillerato' && correo) {
    const { data, error } = await supabase
      .from('respuestas_bachillerato')
      .select('materia, c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12, nota_final, reflexion, item_personalizado_1, item_pers_1_justificacion, item_personalizado_2, item_pers_2_justificacion')
      .eq('correo', correo.toLowerCase())
      .eq('grado', gradoLabel)
      .eq('periodo', periodo)
      .eq('anio', anio)

    if (error) return NextResponse.json({ success: false, error: error.message })

    // Convertir filas a mapa por materia
    const submitted: Record<string, any> = {}
    for (const row of data || []) {
      submitted[row.materia] = {
        c1: row.c1, c2: row.c2, c3: row.c3, c4: row.c4,
        c5: row.c5, c6: row.c6, c7: row.c7, c8: row.c8,
        c9: row.c9, c10: row.c10, c11: row.c11, c12: row.c12,
        nota_final: row.nota_final,
        reflexion: row.reflexion,
        ci1:  row.item_personalizado_1,
        ci1j: row.item_pers_1_justificacion,
        ci2:  row.item_personalizado_2,
        ci2j: row.item_pers_2_justificacion,
      }
    }
    return NextResponse.json({ success: true, tipo: 'bachillerato', submitted })
  }

  if (tipo === 'global' && nombre) {
    const { data, error } = await supabase
      .from('respuestas_global')
      .select('participacion, puntualidad, cumplimiento, autonomia, atencion, nota_final, reflexion, compromiso')
      .eq('nombre', nombre)
      .eq('grado', gradoLabel)
      .eq('periodo', periodo)
      .eq('anio', anio)
      .maybeSingle()

    if (error) return NextResponse.json({ success: false, error: error.message })
    return NextResponse.json({ success: true, tipo: 'global', submitted: data || null })
  }

  return NextResponse.json({ success: true, submitted: null })
}
