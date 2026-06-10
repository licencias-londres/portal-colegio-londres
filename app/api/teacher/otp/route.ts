import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { TEACHER_DATA, SUPER_ADMINS } from '@/lib/teacher-data'
import { sendOtpEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(request: Request) {
  const body = await request.json()
  const { action, email, code } = body

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email requerido' }, { status: 400 })
  }

  const emailLower = email.toLowerCase().trim()

  // Permitir super admins
  const isTeacher = !!TEACHER_DATA[emailLower]
  const isSuperAdmin = SUPER_ADMINS.includes(emailLower)
  if (!isTeacher && !isSuperAdmin) {
    return NextResponse.json({ success: false, error: 'No estás registrado como docente.' })
  }

  const teacherName = TEACHER_DATA[emailLower]?.nombre || 'Administrador'

  // — ENVIAR OTP —
  if (action === 'send') {
    const newCode  = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    await supabase.from('otp_tokens').upsert(
      { email: emailLower, code: newCode, expires_at: expiresAt.toISOString() },
      { onConflict: 'email' }
    )

    try {
      await sendOtpEmail(emailLower, newCode, teacherName)
    } catch (err: any) {
      console.error('Error enviando OTP:', err.message)
      // En dev sin SMTP, el código se loguea en consola pero no fallamos
    }

    return NextResponse.json({ success: true })
  }

  // — VERIFICAR OTP —
  if (action === 'verify') {
    if (!code) {
      return NextResponse.json({ success: false, error: 'Código requerido' })
    }

    const { data: token } = await supabase
      .from('otp_tokens')
      .select('code, expires_at')
      .eq('email', emailLower)
      .maybeSingle()

    if (!token) {
      return NextResponse.json({ success: false, error: 'Código no encontrado. Solicita uno nuevo.' })
    }

    if (new Date(token.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'El código expiró. Solicita uno nuevo.' })
    }

    if (token.code !== String(code).trim()) {
      return NextResponse.json({ success: false, error: 'Código incorrecto.' })
    }

    // Limpiar token usado
    await supabase.from('otp_tokens').delete().eq('email', emailLower)

    return NextResponse.json({
      success: true,
      email: emailLower,
      nombre: teacherName,
      isSuperAdmin
    })
  }

  return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 })
}
