'use client'

import { useEffect, useState } from 'react'
import { GRADE_NAMES, SUPER_ADMINS } from '@/lib/teacher-data'
import ConfigModal from '@/components/ConfigModal'

const SESSION_KEY = 'teacher_session_v2'
const SESSION_TTL = 8 * 60 * 60 * 1000 // 8 horas

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
  const [phase, setPhase] = useState<'login' | 'dashboard'>('login')
  const [loginEmail, setLoginEmail]       = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError]       = useState('')
  const [logging, setLogging]             = useState(false)

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
  const [cfgOpen, setCfgOpen] = useState(false)

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

  // Login con contraseña
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

        <p className="text-center text-xs text-gray-400 mt-6">
          <a href="/autoevaluacion" className="hover:text-gray-600">← Volver a autoevaluación</a>
        </p>
      </div>
    </div>
  )

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
            <button onClick={() => setCfgOpen(true)}
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
      <ConfigModal open={cfgOpen} onClose={() => setCfgOpen(false)} />

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
