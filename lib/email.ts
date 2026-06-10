import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

const FROM = `"${process.env.SMTP_FROM_NAME || 'Colegio Londres'}" <${process.env.SMTP_USER}>`

export async function sendOtpEmail(to: string, code: string, teacherName: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL DEV] OTP para ${to}: ${code}`)
    return
  }
  const t = createTransport()
  await t.sendMail({
    from: FROM,
    to,
    subject: `Código de acceso — Portal Docentes Colegio Londres`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
        <div style="background:#1e3a5f;color:#fff;padding:20px 24px;border-radius:8px;margin-bottom:24px">
          <h2 style="margin:0;font-size:18px">Colegio Londres</h2>
          <p style="margin:4px 0 0;opacity:.8;font-size:13px">Portal de Docentes</p>
        </div>
        <p style="color:#374151">Hola, <strong>${teacherName}</strong></p>
        <p style="color:#6b7280;font-size:14px">Tu código de acceso de un solo uso es:</p>
        <div style="background:#1e3a5f;color:#fff;font-size:36px;font-weight:800;letter-spacing:10px;padding:24px;text-align:center;border-radius:8px;margin:16px 0">
          ${code}
        </div>
        <p style="color:#9ca3af;font-size:12px">Este código expira en 10 minutos. No lo compartas con nadie.</p>
      </div>
    `
  })
}

export async function sendReminderEmail(to: string, studentName: string, materia: string, grado: string, periodo: string, anio: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL DEV] Recordatorio a ${to} (${studentName}): ${materia} - ${grado}`)
    return
  }
  const t = createTransport()
  await t.sendMail({
    from: FROM,
    to,
    subject: `Recordatorio: Autoevaluación pendiente — ${materia}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
        <div style="background:#1e3a5f;color:#fff;padding:20px 24px;border-radius:8px;margin-bottom:24px">
          <h2 style="margin:0;font-size:18px">Colegio Londres</h2>
          <p style="margin:4px 0 0;opacity:.8;font-size:13px">Autoevaluación Estudiantil</p>
        </div>
        <p style="color:#374151">Hola, <strong>${studentName}</strong></p>
        <p style="color:#374151">Te recordamos que tienes pendiente la autoevaluación del <strong>${periodo}° Periodo ${anio}</strong> en la asignatura:</p>
        <div style="background:#dbeafe;color:#1e40af;font-size:20px;font-weight:700;padding:16px;text-align:center;border-radius:8px;margin:16px 0">
          ${materia} — ${grado}
        </div>
        <p style="color:#374151">Ingresa con tu correo institucional en:</p>
        <div style="text-align:center;margin:16px 0">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/autoevaluacion"
             style="background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Ir a Autoevaluación →
          </a>
        </div>
      </div>
    `
  })
}

export async function sendPlatformNotifEmail(to: string, teacherName: string, action: 'open' | 'close', periodo: string, anio: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL DEV] Notif plataforma a ${to}: ${action}`)
    return
  }
  const t = createTransport()
  const isOpen = action === 'open'
  await t.sendMail({
    from: FROM,
    to,
    subject: `Plataforma de Autoevaluación — ${isOpen ? 'Apertura' : 'Cierre'} ${periodo}° Periodo`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px">
        <div style="background:#1e3a5f;color:#fff;padding:20px 24px;border-radius:8px;margin-bottom:24px">
          <h2 style="margin:0">Colegio Londres</h2>
          <p style="margin:4px 0 0;opacity:.8;font-size:13px">Sistema de Autoevaluación</p>
        </div>
        <p style="color:#374151">Hola, <strong>${teacherName}</strong></p>
        <p style="color:#374151;font-size:16px">
          La plataforma de autoevaluación del <strong>${periodo}° Periodo ${anio}</strong> ha sido
          <strong style="color:${isOpen ? '#16a34a' : '#dc2626'}">${isOpen ? 'abierta' : 'cerrada'}</strong>.
        </p>
        ${isOpen ? `<p style="color:#6b7280;font-size:14px">Tus estudiantes ya pueden ingresar y realizar su autoevaluación.</p>` :
                   `<p style="color:#6b7280;font-size:14px">El período de autoevaluación ha concluido.</p>`}
      </div>
    `
  })
}
