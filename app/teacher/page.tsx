'use client'

import { useEffect, useState } from 'react'
import { GRADE_NAMES, SUPER_ADMINS } from '@/lib/teacher-data'

const SESSION_KEY = 'teacher_session_v2'
const SESSION_TTL = 8 * 60 * 60 * 1000 // 8 horas

// Contraseña temporal compartida para todos los docentes
// TODO: reemplazar por sistema OTP cuando se configure el proveedor de email
const TEACHER_PASSWORD = 'Colondres1989'

interface TeacherSession { email: string; nombre: string; expires: number }
interface Group {
  grade: string; gradeLabel: string; materia: string; formType: string
  totalStudents: number; submitted: number; pendingCount: number
  pendingNames: string[]; pendingEmails: string[]
  ci: { item1: string; item2: string }
}
interface DashboardData {
  teacher: string; email: string; groups: Group[]; periodo: string; anio: string
}

function Ring({ pct, size = 64 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct === 100 ? '#16a34a' : pct >= 60 ? '#2563eb' : '#dc2626'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={size*0.22} fontWeight="bold">
        {pct}%
      </text>
    </svg>
  )
}

export default function TeacherPage() {
  // — Login por contraseña (activo) —
  const [phase, setPhase] = useState<'login' | 'dashboard'>('login')
  const [loginEmail, setLoginEmail]       = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError]       = useState('')
  const [logging, setLogging]             = useState(false)

  /* ── CÓDIGO OTP — comentado hasta configurar proveedor de email ──────────
  // const [phase, setPhase] = useState<'login' | 'otp' | 'dashboard'>('login')
  // const [otpCode, setOtpCode]   = useState('')
  // const [sending, setSending]   = useState(false)
  // const [verifying, setVerifying] = useState(false)
  // ─────────────────────────────────────────────────────────────────────── */

  const [session, setSession]     = useState<TeacherSession | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading]     = useState(false)
  const [periodoFilter, setPeriodoFilter] = useState('')

  // Modales
  const [pendingGroup, setPendingGroup]   = useState<Group | null>(null)
  const [ciGroup, setCiGroup]             = useState<Group | null>(null)
  const [ciItem1, setCiItem1]             = useState('')
  const [ciItem2, setCiItem2]             = useState('')
  const [savingCi, setSavingCi]           = useState(false)
  const [notifying, setNotifying]         = useState(false)
  const [notifyResult, setNotifyResult]   = useState('')

  // Modal de configuración (solo super admins)
  const [cfgOpen, setCfgOpen]         = useState(false)
  const [cfgTab, setCfgTab]           = useState<'general' | 'periodos' | 'estudiantes'>('general')
  const [cfgData, setCfgData]         = useState<any>({})
  const [savingCfg, setSavingCfg]     = useState(false)
  const [cfgSaved, setCfgSaved]       = useState(false)
  const [cfgStudents, setCfgStudents] = useState<any[]>([])
  const [loadingCfgSt, setLoadingCfgSt]     = useState(false)
  const [newStNombre, setNewStNombre]       = useState('')
  const [newStEmail, setNewStEmail]         = useState('')
  const [newStGrado, setNewStGrado]         = useState('')
  const [addingCfgSt, setAddingCfgSt]       = useState(false)
  const [cfgStFilter, setCfgStFilter]       = useState('')

  // Restaurar sesión guardada
  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return
    try {
      const s: TeacherSession = JSON.parse(raw)
      if (Date.now() < s.expires) {
        setSession(s); setPhase('dashboard')
      } else {
        localStorage.removeItem(SESSION_KEY)
      }
    } catch { /**/ }
  }, [])

  useEffect(() => {
    if (phase === 'dashboard' && session) loadDashboard(session.email, periodoFilter)
  }, [phase, session, periodoFilter])

  async function loadDashboard(email: string, per?: string) {
    setLoading(true)
    const params = new URLSearchParams({ email })
    if (per) params.set('periodo', per)
    const r = await fetch(`/api/teacher/dashboard?${params}`)
    const d = await r.json()
    setLoading(false)
    if (d.success) {
      setDashboard(d)
      if (!periodoFilter && d.periodo) setPeriodoFilter(d.periodo)
    }
  }

  // — Login con contraseña —
  async function handleLogin() {
    if (!loginEmail.trim()) { setLoginError('Ingresa tu correo'); return }
    if (!loginPassword)     { setLoginError('Ingresa tu contraseña'); return }
    if (loginPassword !== TEACHER_PASSWORD) {
      setLoginError('Contraseña incorrecta')
      return
    }
    setLogging(true); setLoginError('')
    const r = await fetch('/api/teacher/otp', { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkEmail', email: loginEmail.trim() }) })
    const d = await r.json()
    setLogging(false)
    if (d.success) {
      const sess: TeacherSession = { email: d.email, nombre: d.nombre, expires: Date.now() + SESSION_TTL }
      localStorage.setItem(SESSION_KEY, JSON.stringify(sess))
      setSession(sess); setPhase('dashboard')
    } else {
      setLoginError(d.error || 'Correo no registrado como docente')
    }
  }

  /* ── CÓDIGO OTP — comentado hasta configurar proveedor de email ──────────
  // async function handleSendOtp() {
  //   if (!loginEmail.trim()) { setLoginError('Ingresa tu correo'); return }
  //   setSending(true); setLoginError('')
  //   const r = await fetch('/api/teacher/otp', { method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ action: 'send', email: loginEmail.trim() }) })
  //   const d = await r.json()
  //   setSending(false)
  //   if (d.success) setPhase('otp')
  //   else setLoginError(d.error || 'Error enviando código')
  // }
  //
  // async function handleVerifyOtp() {
  //   if (!otpCode.trim()) { setLoginError('Ingresa el código'); return }
  //   setVerifying(true); setLoginError('')
  //   const r = await fetch('/api/teacher/otp', { method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ action: 'verify', email: loginEmail.trim(), code: otpCode.trim() }) })
  //   const d = await r.json()
  //   setVerifying(false)
  //   if (d.success) {
  //     const sess: TeacherSession = { email: d.email, nombre: d.nombre, expires: Date.now() + SESSION_TTL }
  //     localStorage.setItem(SESSION_KEY, JSON.stringify(sess))
  //     setSession(sess); setPhase('dashboard')
  //   } else {
  //     setLoginError(d.error || 'Código incorrecto')
  //   }
  // }
  // ─────────────────────────────────────────────────────────────────────── */

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY)
    setSession(null); setPhase('login'); setDashboard(null)
    setLoginEmail(''); setLoginPassword(''); setPeriodoFilter('')
  }

  function openCiModal(group: Group) {
    setCiGroup(group)
    setCiItem1(group.ci?.item1 || '')
    setCiItem2(group.ci?.item2 || '')
  }

  async function saveCi() {
    if (!ciGroup || !session || !dashboard) return
    setSavingCi(true)
    await fetch('/api/custom-items', { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailDocente: session.email,
        grado: ciGroup.grade,
        materia: ciGroup.materia,
        periodo: dashboard.periodo,
        anio: dashboard.anio,
        item1: ciItem1.trim(),
        item2: ciItem2.trim()
      }) })
    setSavingCi(false)
    setCiGroup(null)
    loadDashboard(session.email, periodoFilter)
  }

  async function sendNotification(group: Group) {
    if (!group.pendingEmails.length) { setNotifyResult('No hay correos disponibles de estudiantes pendientes.'); return }
    setNotifying(true); setNotifyResult('')
    const r = await fetch('/api/teacher/notify', { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pendingEmails: group.pendingEmails,
        pendingNames:  group.pendingNames,
        materia:  group.materia,
        grado:    group.gradeLabel,
        periodo:  dashboard?.periodo || '',
        anio:     dashboard?.anio    || ''
      }) })
    const d = await r.json()
    setNotifying(false)
    setNotifyResult(d.success ? `✅ Se enviaron ${d.sent} recordatorio(s).` : `❌ ${d.error}`)
  }

  // ── Funciones de configuración (super admin) ──────────────────────────
  async function openCfgModal() {
    const r = await fetch('/api/config')
    const d = await r.json()
    setCfgData(d)
    setCfgTab('general')
    setCfgStudents([])
    setCfgOpen(true)
  }

  async function saveCfgData() {
    setSavingCfg(true)
    const periodoDates = [1,2,3,4].map(p => ({
      inicio: cfgData[`periodo_${p}_inicio`] || null,
      fin:    cfgData[`periodo_${p}_fin`]    || null
    }))
    await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        periodo: cfgData.periodo, anio: cfgData.anio, estado: cfgData.estado,
        mensaje: cfgData.mensaje, institucion: cfgData.institucion,
        platformSchedule: cfgData.platform_schedule || {}, periodoDates
      }) })
    setSavingCfg(false)
    setCfgSaved(true)
    setTimeout(() => setCfgSaved(false), 3000)
  }

  async function loadCfgStudents() {
    setLoadingCfgSt(true)
    const r = await fetch('/api/admin/students')
    const d = await r.json()
    setLoadingCfgSt(false)
    if (d.success) setCfgStudents(d.students)
  }

  async function addCfgStudent() {
    if (!newStNombre.trim() || !newStGrado.trim()) return
    setAddingCfgSt(true)
    const r = await fetch('/api/admin/students', { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: newStNombre, email: newStEmail, grado: newStGrado }) })
    const d = await r.json()
    setAddingCfgSt(false)
    if (d.success) { setNewStNombre(''); setNewStEmail(''); setNewStGrado(''); loadCfgStudents() }
  }

  async function deleteCfgStudent(id: string) {
    if (!confirm('¿Eliminar este estudiante?')) return
    await fetch('/api/admin/students', { method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadCfgStudents()
  }

  function setPsVal(p: string, key: string, val: string) {
    setCfgData((prev: any) => ({
      ...prev,
      platform_schedule: {
        ...(prev.platform_schedule || {}),
        [p]: { ...((prev.platform_schedule || {})[p] || {}), [key]: val }
      }
    }))
  }

  function handlePrintGroup(group: Group) {
    if (!dashboard) return
    const win = window.open('', '_blank')!
    const rows = group.pendingNames.map(n => `<tr><td>${n}</td><td style="color:#dc2626">Pendiente</td></tr>`).join('')
    win.document.write(`
      <html><head><title>${group.materia} ${group.gradeLabel}</title>
      <style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:8px;text-align:left}h2{color:#1e3a5f}</style></head>
      <body>
        <h2>Reporte de Pendientes — ${group.materia} ${group.gradeLabel}</h2>
        <p>${dashboard.periodo}° Periodo ${dashboard.anio} · Docente: ${dashboard.teacher}</p>
        <p>Enviados: ${group.submitted} / Total: ${group.totalStudents} · Pendientes: ${group.pendingCount}</p>
        <table><tr><th>Estudiante</th><th>Estado</th></tr>${rows}</table>
      </body></html>`)
    win.document.close(); win.print()
  }

  // ====================================================== LOGIN
  if (phase === 'login') return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-900 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-3">🎓</div>
          <h1 className="text-xl font-bold text-blue-900">Portal Docente</h1>
          <p className="text-sm text-gray-500">Colegio Londres</p>
        </div>

        <label className="block text-sm font-semibold text-blue-900 mb-1">Correo institucional</label>
        <input type="email" value={loginEmail}
          onChange={e => { setLoginEmail(e.target.value); setLoginError('') }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="tunombre@colegiolondres.edu.co"
          className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:border-blue-900 outline-none mb-3" />

        <label className="block text-sm font-semibold text-blue-900 mb-1">Contraseña</label>
        <input type="password" value={loginPassword}
          onChange={e => { setLoginPassword(e.target.value); setLoginError('') }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="••••••••••"
          className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:border-blue-900 outline-none mb-3" />

        {loginError && <p className="text-red-500 text-sm mb-3">{loginError}</p>}

        <button onClick={handleLogin} disabled={logging}
          className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50">
          {logging ? 'Verificando...' : 'Ingresar al portal'}
        </button>

        {/* ── BOTÓN OTP — comentado hasta configurar email ──────────────────
        <button onClick={handleSendOtp} disabled={sending}
          className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50">
          {sending ? 'Enviando código...' : 'Recibir código OTP'}
        </button>
        ─────────────────────────────────────────────────────────────────── */}

        <p className="text-center text-xs text-gray-400 mt-6">
          <a href="/autoevaluacion" className="hover:text-gray-600">← Volver a autoevaluación</a>
        </p>
      </div>
    </div>
  )

  /* ── PANTALLA OTP — comentada hasta configurar email ──────────────────────
  if (phase === 'otp') return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        ...pantalla de ingreso de código OTP...
        <p className="text-sm text-gray-600 mb-4 text-center">
          Código enviado a <strong>{loginEmail}</strong>. Revisa tu correo.
        </p>
        <input type="text" inputMode="numeric" maxLength={6} value={otpCode}
          onChange={e => { setOtpCode(e.target.value); setLoginError('') }}
          onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
          placeholder="000000"
          className="w-full border-2 border-gray-200 rounded-lg p-3 text-center text-2xl font-bold tracking-widest focus:border-blue-900 outline-none mb-3" />
        <button onClick={handleVerifyOtp} disabled={verifying}
          className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 mb-2">
          {verifying ? 'Verificando...' : 'Ingresar al portal'}
        </button>
        <button onClick={() => { setPhase('login'); setOtpCode(''); setLoginError('') }}
          className="w-full text-sm text-gray-400 hover:text-gray-600 py-2">
          ← Cambiar correo
        </button>
      </div>
    </div>
  )
  ──────────────────────────────────────────────────────────────────────────── */

  // ====================================================== DASHBOARD
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-lg font-bold">{session?.nombre}</h1>
          <p className="text-sm text-blue-300">Portal Docente — Colegio Londres</p>
        </div>
        <div className="flex items-center gap-3">
          {dashboard && (
            <select value={periodoFilter} onChange={e => setPeriodoFilter(e.target.value)}
              className="bg-blue-800 text-white border border-blue-600 rounded-lg px-3 py-1.5 text-sm">
              {['1','2','3','4'].map(p => (
                <option key={p} value={p}>{p}° Periodo {dashboard.anio}</option>
              ))}
            </select>
          )}
          {session && SUPER_ADMINS.includes(session.email) && (
            <button onClick={openCfgModal}
              className="text-sm bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-1.5 font-medium">
              ⚙️ Configuración
            </button>
          )}
          <button onClick={handleLogout}
            className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Resumen rápido */}
        {dashboard && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total grupos', value: dashboard.groups.length, color: 'bg-blue-50 text-blue-900' },
              { label: 'Completos', value: dashboard.groups.filter(g => g.pendingCount === 0 && g.totalStudents > 0).length, color: 'bg-green-50 text-green-800' },
              { label: 'Con pendientes', value: dashboard.groups.filter(g => g.pendingCount > 0).length, color: 'bg-red-50 text-red-800' }
            ].map(s => (
              <div key={s.label} className={`rounded-2xl p-4 text-center ${s.color}`}>
                <p className="text-3xl font-black">{s.value}</p>
                <p className="text-xs font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-20 text-gray-400">Cargando datos del periodo...</div>
        )}

        {/* Grid de grupos */}
        {!loading && dashboard && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboard.groups.map((group, idx) => {
              const pct = group.totalStudents > 0 ? Math.round((group.submitted / group.totalStudents) * 100) : 0
              const done = group.pendingCount === 0 && group.totalStudents > 0
              return (
                <div key={idx} className={`bg-white rounded-2xl shadow p-5 border-l-4 ${done ? 'border-green-400' : group.pendingCount > 0 ? 'border-red-400' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{group.gradeLabel}</span>
                      <h3 className="font-bold text-gray-800 mt-1 text-sm leading-tight">{group.materia}</h3>
                    </div>
                    <Ring pct={pct} size={60} />
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    <span className="text-green-600 font-semibold">{group.submitted} enviaron</span>
                    {' · '}
                    <span className="text-red-500 font-semibold">{group.pendingCount} pendientes</span>
                    {' · '}{group.totalStudents} total
                  </div>

                  {/* Ítem personalizado badge */}
                  {(group.ci?.item1 || group.ci?.item2) && (
                    <div className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-2 py-1 mb-3">
                      ✏️ {[group.ci.item1, group.ci.item2].filter(Boolean).length} criterio(s) adicional(es)
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setPendingGroup(group)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition">
                      Ver pendientes
                    </button>
                    {group.formType === 'bachillerato' && (
                      <button onClick={() => openCiModal(group)}
                        className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-medium transition">
                        ✏️ Criterios extra
                      </button>
                    )}
                    <button onClick={() => handlePrintGroup(group)}
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded-lg font-medium transition">
                      🖨️ PDF
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && dashboard && dashboard.groups.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">📋</p>
            <p>No tienes grupos asignados para este periodo.</p>
          </div>
        )}
      </div>

      {/* Modal: Estudiantes pendientes */}
      {pendingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setPendingGroup(null); setNotifyResult('') }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-bold text-blue-900 text-lg">{pendingGroup.materia}</h2>
                <p className="text-sm text-gray-500">{pendingGroup.gradeLabel} · {pendingGroup.pendingCount} pendiente(s)</p>
              </div>
              <button onClick={() => { setPendingGroup(null); setNotifyResult('') }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            {pendingGroup.pendingNames.length === 0 ? (
              <div className="text-center py-6 text-green-600 font-semibold">✅ ¡Todos completaron la autoevaluación!</div>
            ) : (
              <>
                <div className="max-h-60 overflow-y-auto mb-4">
                  {pendingGroup.pendingNames.map((n, i) => (
                    <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
                      <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></span>
                      <span className="text-sm text-gray-700">{n}</span>
                    </div>
                  ))}
                </div>

                {notifyResult && (
                  <div className={`text-sm p-3 rounded-lg mb-3 ${notifyResult.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {notifyResult}
                  </div>
                )}

                <button onClick={() => sendNotification(pendingGroup)} disabled={notifying}
                  className="w-full bg-blue-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
                  {notifying ? 'Enviando correos...' : `📧 Enviar recordatorio a ${pendingGroup.pendingCount} estudiante(s)`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Configuración (super admins) */}
      {cfgOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCfgOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="font-bold text-lg">⚙️ Configuración</h2>
                <p className="text-xs text-blue-200 mt-0.5">Sistema de Autoevaluación · Colegio Londres</p>
              </div>
              <button onClick={() => setCfgOpen(false)} className="bg-white/20 hover:bg-white/30 w-8 h-8 rounded-full flex items-center justify-center transition">✕</button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 flex flex-shrink-0">
              {(['general', 'periodos', 'estudiantes'] as const).map(t => (
                <button key={t}
                  onClick={() => { setCfgTab(t); if (t === 'estudiantes' && cfgStudents.length === 0) loadCfgStudents() }}
                  className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${cfgTab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {t === 'general' ? '📋 General' : t === 'periodos' ? '📅 Períodos' : '👥 Estudiantes'}
                </button>
              ))}
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-6">

              {/* GENERAL */}
              {cfgTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Institución</label>
                    <input type="text" value={cfgData.institucion || ''}
                      onChange={e => setCfgData((p: any) => ({...p, institucion: e.target.value}))}
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:border-blue-600 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Año</label>
                      <input type="text" value={cfgData.anio || ''}
                        onChange={e => setCfgData((p: any) => ({...p, anio: e.target.value}))}
                        className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:border-blue-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Período activo</label>
                      <select value={cfgData.periodo || ''} onChange={e => setCfgData((p: any) => ({...p, periodo: e.target.value}))}
                        className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:border-blue-600 outline-none">
                        {['1','2','3','4'].map(p => <option key={p} value={p}>{p}° Período</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Estado manual de la plataforma</label>
                    <select value={cfgData.estado || 'cerrado'} onChange={e => setCfgData((p: any) => ({...p, estado: e.target.value}))}
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:border-blue-600 outline-none">
                      <option value="abierto">🟢 Abierta</option>
                      <option value="cerrado">🔴 Cerrada</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Si configuras el horario automático en Períodos, este campo se ignora mientras las fechas estén activas.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Mensaje para estudiantes (opcional)</label>
                    <textarea value={cfgData.mensaje || ''} onChange={e => setCfgData((p: any) => ({...p, mensaje: e.target.value}))}
                      rows={3} placeholder="Mensaje informativo visible en la pantalla de inicio..."
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:border-blue-600 outline-none resize-none" />
                  </div>
                </div>
              )}

              {/* PERÍODOS */}
              {cfgTab === 'periodos' && (
                <div>
                  <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <strong>Horario automático:</strong> si configuras fechas de apertura y cierre, la plataforma se abre y cierra automáticamente para los estudiantes. Deja en blanco para usar el estado manual.
                  </p>
                  {[1,2,3,4].map(p => {
                    const ps = (cfgData.platform_schedule || {})[String(p)] || {}
                    const hrs = Array.from({length:12}, (_,i) => String(i+1))
                    const mins = ['00','05','10','15','20','25','30','35','40','45','50','55','59']
                    return (
                      <div key={p} className="border border-gray-200 rounded-xl p-4 mb-4">
                        <p className="text-sm font-bold text-blue-800 mb-3">{p}° Período</p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Inicio del período</label>
                            <input type="date" value={cfgData[`periodo_${p}_inicio`] || ''}
                              onChange={e => setCfgData((prev: any) => ({...prev, [`periodo_${p}_inicio`]: e.target.value}))}
                              className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-400" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Fin del período</label>
                            <input type="date" value={cfgData[`periodo_${p}_fin`] || ''}
                              onChange={e => setCfgData((prev: any) => ({...prev, [`periodo_${p}_fin`]: e.target.value}))}
                              className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-400" />
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Apertura / Cierre automático</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-green-700 mb-2">🟢 Apertura</p>
                            <input type="date" value={ps.openDate || ''}
                              onChange={e => setPsVal(String(p), 'openDate', e.target.value)}
                              className="w-full border border-green-200 rounded-lg p-1.5 text-xs text-gray-900 mb-1.5 outline-none" />
                            <div className="flex gap-1">
                              <select value={ps.openHour || '7'} onChange={e => setPsVal(String(p), 'openHour', e.target.value)}
                                className="flex-1 border border-green-200 rounded p-1 text-xs text-gray-900 outline-none">
                                {hrs.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                              <span className="text-gray-400 self-center text-xs">:</span>
                              <select value={ps.openMin || '00'} onChange={e => setPsVal(String(p), 'openMin', e.target.value)}
                                className="flex-1 border border-green-200 rounded p-1 text-xs text-gray-900 outline-none">
                                {mins.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                              <select value={ps.openAmPm || 'AM'} onChange={e => setPsVal(String(p), 'openAmPm', e.target.value)}
                                className="w-12 border border-green-200 rounded p-1 text-xs text-gray-900 outline-none">
                                <option value="AM">AM</option><option value="PM">PM</option>
                              </select>
                            </div>
                          </div>
                          <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-700 mb-2">🔴 Cierre</p>
                            <input type="date" value={ps.closeDate || ''}
                              onChange={e => setPsVal(String(p), 'closeDate', e.target.value)}
                              className="w-full border border-red-200 rounded-lg p-1.5 text-xs text-gray-900 mb-1.5 outline-none" />
                            <div className="flex gap-1">
                              <select value={ps.closeHour || '11'} onChange={e => setPsVal(String(p), 'closeHour', e.target.value)}
                                className="flex-1 border border-red-200 rounded p-1 text-xs text-gray-900 outline-none">
                                {hrs.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                              <span className="text-gray-400 self-center text-xs">:</span>
                              <select value={ps.closeMin || '59'} onChange={e => setPsVal(String(p), 'closeMin', e.target.value)}
                                className="flex-1 border border-red-200 rounded p-1 text-xs text-gray-900 outline-none">
                                {mins.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                              <select value={ps.closeAmPm || 'PM'} onChange={e => setPsVal(String(p), 'closeAmPm', e.target.value)}
                                className="w-12 border border-red-200 rounded p-1 text-xs text-gray-900 outline-none">
                                <option value="AM">AM</option><option value="PM">PM</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ESTUDIANTES */}
              {cfgTab === 'estudiantes' && (
                <div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs font-bold text-gray-600 mb-3">Agregar estudiante</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                      <input type="text" value={newStNombre} onChange={e => setNewStNombre(e.target.value)}
                        placeholder="Nombre completo"
                        className="border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-400" />
                      <input type="email" value={newStEmail} onChange={e => setNewStEmail(e.target.value)}
                        placeholder="Correo (opcional)"
                        className="border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-400" />
                      <input type="text" value={newStGrado} onChange={e => setNewStGrado(e.target.value)}
                        placeholder="Grado (ej: 6, 10)"
                        className="border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-400" />
                    </div>
                    <button onClick={addCfgStudent} disabled={addingCfgSt || !newStNombre.trim() || !newStGrado.trim()}
                      className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition">
                      {addingCfgSt ? 'Guardando...' : '+ Agregar'}
                    </button>
                  </div>
                  <input type="text" value={cfgStFilter} onChange={e => setCfgStFilter(e.target.value)}
                    placeholder="Buscar por nombre o grado..."
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 mb-3 outline-none focus:border-blue-400" />
                  {loadingCfgSt ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Cargando...</div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-500">
                          {cfgStudents.filter(s => !cfgStFilter || s.nombre.toLowerCase().includes(cfgStFilter.toLowerCase()) || s.grado.toLowerCase().includes(cfgStFilter.toLowerCase())).length} estudiantes
                        </span>
                        <button onClick={loadCfgStudents} className="text-xs text-gray-400 hover:text-gray-600">↻ Recargar</button>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0">
                            <tr>
                              <th className="text-left px-4 py-2">Nombre</th>
                              <th className="text-left px-4 py-2">Grado</th>
                              <th className="text-center px-4 py-2">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cfgStudents
                              .filter(s => !cfgStFilter || s.nombre.toLowerCase().includes(cfgStFilter.toLowerCase()) || s.grado.toLowerCase().includes(cfgStFilter.toLowerCase()))
                              .map(s => (
                                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                                  <td className="px-4 py-2 text-gray-800">{s.nombre}</td>
                                  <td className="px-4 py-2"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{s.grado}</span></td>
                                  <td className="px-4 py-2 text-center">
                                    <button onClick={() => deleteCfgStudent(s.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                                  </td>
                                </tr>
                              ))}
                            {cfgStudents.length === 0 && (
                              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">No hay estudiantes registrados.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {cfgTab !== 'estudiantes' && (
              <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
                <span className={`text-sm font-medium transition-opacity ${cfgSaved ? 'opacity-100 text-green-600' : 'opacity-0'}`}>
                  ✅ Configuración guardada
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setCfgOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cerrar</button>
                  <button onClick={saveCfgData} disabled={savingCfg}
                    className="px-6 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition">
                    {savingCfg ? 'Guardando...' : '💾 Guardar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Criterios personalizados */}
      {ciGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCiGroup(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-bold text-blue-900">Criterios adicionales</h2>
                <p className="text-sm text-gray-500">{ciGroup.materia} · {ciGroup.gradeLabel}</p>
              </div>
              <button onClick={() => setCiGroup(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <p className="text-xs text-gray-500 mb-4 bg-amber-50 p-3 rounded-lg">
              Define hasta 2 criterios de evaluación adicionales para este grupo. Los estudiantes verán estos ítems al final del formulario.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Criterio adicional 1 (opcional)</label>
              <input type="text" value={ciItem1} onChange={e => setCiItem1(e.target.value)} maxLength={120}
                placeholder="Ej: Participé activamente en los proyectos de aula..."
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:border-amber-400 outline-none" />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Criterio adicional 2 (opcional)</label>
              <input type="text" value={ciItem2} onChange={e => setCiItem2(e.target.value)} maxLength={120}
                placeholder="Ej: Demostré habilidades de investigación..."
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:border-amber-400 outline-none" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setCiGroup(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200">
                Cancelar
              </button>
              <button onClick={saveCi} disabled={savingCi}
                className="flex-1 bg-amber-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50">
                {savingCi ? 'Guardando...' : 'Guardar criterios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
