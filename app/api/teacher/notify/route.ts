import { NextResponse } from 'next/server'
import { sendReminderEmail } from '@/lib/email'

export async function POST(request: Request) {
  const body = await request.json()
  const { pendingEmails, pendingNames, materia, grado, periodo, anio } = body

  if (!pendingEmails || !Array.isArray(pendingEmails)) {
    return NextResponse.json({ success: false, error: 'Lista de emails requerida' }, { status: 400 })
  }

  let sent = 0
  const errors: string[] = []

  for (let i = 0; i < pendingEmails.length; i++) {
    const emailTo = pendingEmails[i]
    const nombre  = pendingNames?.[i] || emailTo
    if (!emailTo) continue
    try {
      await sendReminderEmail(emailTo, nombre, materia, grado, periodo, anio)
      sent++
    } catch (err: any) {
      errors.push(`${nombre}: ${err.message}`)
    }
  }

  return NextResponse.json({ success: true, sent, errors })
}
