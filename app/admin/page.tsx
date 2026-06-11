'use client'

import { useEffect, useState } from 'react'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'colegio2025'

interface TeacherStat {
  email: string; nombre: string; pct: number
  total: number; submitted: number; pending: number
  groups: { grade: string; gradeLabel: string; materia: string; formType: string; total: number; submitted: number }[]
}
interface DashboardData {
  teachers: TeacherStat[]
  stats: { totalStudents: number; totalSubmitted: number; totalPending: number; pct: number }
  periodo: string; anio: string
}
interface Student { id: string; nombre: string; email: string; grado: string }

function Ring({ pct, size = 56 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2; const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct === 100 ? '#16a34a' : pct >= 60 ? '#2563eb' : '#dc2626'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#374151" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#f9fafb" fontSize={size*0.22} fontWeight="bold">{pct}%</text>
    </svg>
  )
}

export default function AdminPage() {
  const [authed, setAuthed]     = useState(false)
  const [pw, setPw]             = useState('')
  const [pwError, setPwError]   = useState('')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'settings'>('dashboard')
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading]   = useState(false)
  const [periodo, setPeriodo]   = useState('')
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null)

  // Estudiantes
  const [students, setStudents]     = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [newNombre, setNewNombre]   = useState('')
  const [newEmail, setNewEmail]     = useState('')
  const [newGrado, setNewGrado]     = useState('')
  const [addingStudent, setAddingStudent] = useState(false)
  const [studentFilter, setStudentFilter] = useState('')

  // Configuración
  const [config, setConfig]         = useState<any>({})
  const [savingConfig, setSavingConfig] = useState(false)

  // Notificaciones
  const [notifying, setNotifying]   = useState(false)
  const [notifyResult, setNotifyResult] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_auth')
    if (saved === 'ok') setAuthed(true)
  }, [])

  useEffect(() => {
    if (authed) { loadDashboard(); loadConfig() }
  }, [authed])

  useEffect(() => {
    if (authed && activeTab === 'students') loadStudents()
  }, [authed, activeTab])

  useEffect(() => {
    if (authed && periodo) loadDashboard()
  }, [periodo])

  async function loadDashboard() {
    setLoading(true)
    const params = new URLSearchParams()
    if (periodo) params.set('periodo', periodo)
    const r = await fetch(`/api/admin/dashboard?${params}`)
    const d = await r.json()
    setLoading(false)
    if (d.success) {
      setDashboard(d)
      if (!periodo && d.periodo) setPeriodo(d.periodo)
    }
  }

  async function loadConfig() {
    const r = await fetch('/api/config')
    const d = await r.json()
    setConfig(d)
    if (!periodo) setPeriodo(d.periodo || '1')
  }

  async function loadStudents() {
    setLoadingStudents(true)
    const r = await fetch('/api/admin/students')
    const d = await r.json()
    setLoadingStudents(false)
    if (d.success) setStudents(d.students)
  }

  async function saveConfig() {
    setSavingConfig(true)
    const periodoDates = [1,2,3,4].map(p => ({
      inicio: config[`periodo_${p}_inicio`] || null,
      fin:    config[`periodo_${p}_fin`]    || null
    }))
    await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        periodo: config.periodo, anio: config.anio, estado: config.estado,
        mensaje: config.mensaje, institucion: config.institucion,
        platformSchedule: config.platformSchedule || {},
        periodoDates
      }) })
    setSavingConfig(false)
    await loadDashboard()
  }

  async function addStudent() {
    if (!newNombre.trim() || !newGrado.trim()) return
    setAddingStudent(true)
    const r = await fetch('/api/admin/students', { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: newNombre, email: newEmail, grado: newGrado }) })
    const d = await r.json()
    setAddingStudent(false)
    if (d.success) { setNewNombre(''); setNewEmail(''); setNewGrado(''); loadStudents() }
  }

  async function deleteStudent(id: string) {
    if (!confirm('¿Eliminar este estudiante?')) return
    await fetch('/api/admin/students', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadStudents()
  }

  async function sendPlatformNotif(action: 'open' | 'close') {
    const label = action === 'open' ? 'apertura' : 'cierre'
    if (!confirm(`¿Enviar notificación de ${label} a todos los docentes?`)) return
    setNotifying(true); setNotifyResult('')
    const r = await fetch('/api/admin/notify', { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notifyPlatform', platformAction: action, periodo, anio: config.anio }) })
    const d = await r.json()
    setNotifying(false)
    setNotifyResult(d.success ? `✅ Notificación enviada a ${d.sent} docente(s).` : `❌ ${d.error}`)
  }

  async function sendPendingNotif() {
    if (!confirm('¿Enviar recordatorios a TODOS los estudiantes pendientes?')) return
    setNotifying(true); setNotifyResult('')
    const r = await fetch('/api/admin/notify', { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notifyPending', periodo, anio: config.anio }) })
    const d = await r.json()
    setNotifying(false)
    setNotifyResult(d.success ? `✅ Se enviaron ${d.sent} recordatorio(s).` : `❌ ${d.error}`)
  }

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) { sessionStorage.setItem('admin_auth', 'ok'); setAuthed(true) }
    else setPwError('Contraseña incorrecta')
  }

  const filteredStudents = students.filter(s =>
    !studentFilter || s.nombre.toLowerCase().includes(studentFilter.toLowerCase()) ||
    s.grado.toLowerCase().includes(studentFilter.toLowerCase())
  )

  // ====================================================== LOGIN
  if (!authed) return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-900 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-3">⚙️</div>
          <h1 className="text-xl font-bold text-blue-900">Panel Administrador</h1>
          <p className="text-sm text-gray-500">Colegio Londres</p>
        </div>
        <label className="block text-sm font-semibold text-blue-900 mb-1">Contraseña de administrador</label>
        <input type="password" value={pw} onChange={e => { setPw(e.target.value); setPwError('') }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-blue-900 outline-none mb-3" />
        {pwError && <p className="text-red-500 text-sm mb-3">{pwError}</p>}
        <button onClick={handleLogin} className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-800">
          Ingresar
        </button>
        <p className="text-center text-xs text-gray-400 mt-4">
          <a href="/autoevaluacion" className="hover:text-gray-600">← Volver</a>
        </p>
      </div>
    </div>
  )

  // ====================================================== PANEL ADMIN
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-white">Panel Administrador</h1>
          <p className="text-sm text-gray-400">Colegio Londres · Sistema de Autoevaluación</p>
        </div>
        <div className="flex items-center gap-3">
          {dashboard && (
            <select value={periodo} onChange={e => setPeriodo(e.target.value)}
              className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-1.5 text-sm">
              {['1','2','3','4'].map(p => (
                <option key={p} value={p}>{p}° Periodo {config.anio}</option>
              ))}
            </select>
          )}
          <button onClick={() => { sessionStorage.removeItem('admin_auth'); setAuthed(false) }}
            className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">
            Salir
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-gray-950 border-b border-gray-800 px-6">
        <div className="flex gap-0">
          {(['dashboard', 'students', 'settings'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition ${activeTab === tab ? 'border-blue-400 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
              {tab === 'dashboard' ? '📊 Dashboard' : tab === 'students' ? '👥 Estudiantes' : '⚙️ Configuración'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ——— DASHBOARD ——— */}
        {activeTab === 'dashboard' && (
          <>
            {/* KPIs */}
            {dashboard && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Estudiantes', value: dashboard.stats.totalStudents, color: 'text-blue-400' },
                  { label: 'Autoevaluaciones', value: dashboard.stats.totalSubmitted, color: 'text-green-400' },
                  { label: 'Pendientes', value: dashboard.stats.totalPending, color: 'text-red-400' },
                  { label: 'Completado', value: `${dashboard.stats.pct}%`, color: 'text-yellow-400' }
                ].map(s => (
                  <div key={s.label} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
                    <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-1 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Botones de notificación */}
            <div className="bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-700">
              <h3 className="text-sm font-bold text-gray-300 mb-3">Notificaciones masivas</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => sendPlatformNotif('open')} disabled={notifying}
                  className="text-sm bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition">
                  📧 Notificar apertura a docentes
                </button>
                <button onClick={() => sendPlatformNotif('close')} disabled={notifying}
                  className="text-sm bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition">
                  📧 Notificar cierre a docentes
                </button>
                <button onClick={sendPendingNotif} disabled={notifying}
                  className="text-sm bg-yellow-700 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition">
                  📧 Recordatorio a estudiantes pendientes
                </button>
              </div>
              {notifyResult && (
                <p className={`text-sm mt-3 ${notifyResult.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{notifyResult}</p>
              )}
            </div>

            {loading && <div className="text-center py-20 text-gray-500">Cargando...</div>}

            {/* Tarjetas docentes */}
            {!loading && dashboard && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {dashboard.teachers.map(t => (
                  <div key={t.email} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                    <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-750"
                      onClick={() => setExpandedTeacher(expandedTeacher === t.email ? null : t.email)}>
                      <Ring pct={t.pct} size={56} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{t.nombre}</p>
                        <p className="text-xs text-gray-400 truncate">{t.email}</p>
                        <div className="flex gap-3 mt-1 text-xs">
                          <span className="text-green-400 font-semibold">{t.submitted} enviaron</span>
                          <span className="text-red-400 font-semibold">{t.pending} pendientes</span>
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm">{expandedTeacher === t.email ? '▲' : '▼'}</span>
                    </div>

                    {expandedTeacher === t.email && (
                      <div className="border-t border-gray-700 px-4 pb-4">
                        {t.groups.map((g, i) => {
                          const pct = g.total > 0 ? Math.round((g.submitted / g.total) * 100) : 0
                          return (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0 text-xs">
                              <div>
                                <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full mr-2">{g.gradeLabel}</span>
                                <span className="text-gray-300">{g.materia}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${pct===100?'text-green-400':pct>=60?'text-blue-400':'text-red-400'}`}>{pct}%</span>
                                <span className="text-gray-500">{g.submitted}/{g.total}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ——— ESTUDIANTES ——— */}
        {activeTab === 'students' && (
          <>
            {/* Agregar estudiante */}
            <div className="bg-gray-800 rounded-2xl p-5 mb-6 border border-gray-700">
              <h3 className="text-sm font-bold text-gray-300 mb-3">Agregar estudiante</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input type="text" value={newNombre} onChange={e => setNewNombre(e.target.value)}
                  placeholder="Nombre completo" className="bg-gray-900 text-white border border-gray-700 rounded-lg p-2.5 text-sm focus:border-blue-400 outline-none" />
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  placeholder="Correo (opcional para bajos)" className="bg-gray-900 text-white border border-gray-700 rounded-lg p-2.5 text-sm focus:border-blue-400 outline-none" />
                <input type="text" value={newGrado} onChange={e => setNewGrado(e.target.value)}
                  placeholder="Grado (ej: 6, 10, transicion)" className="bg-gray-900 text-white border border-gray-700 rounded-lg p-2.5 text-sm focus:border-blue-400 outline-none" />
              </div>
              <button onClick={addStudent} disabled={addingStudent || !newNombre.trim() || !newGrado.trim()}
                className="mt-3 bg-blue-700 hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition">
                {addingStudent ? 'Guardando...' : '+ Agregar estudiante'}
              </button>
            </div>

            {/* Filtro */}
            <div className="mb-4">
              <input type="text" value={studentFilter} onChange={e => setStudentFilter(e.target.value)}
                placeholder="Buscar por nombre o grado..."
                className="bg-gray-800 text-white border border-gray-700 rounded-lg p-2.5 text-sm w-full max-w-sm focus:border-blue-400 outline-none" />
            </div>

            {/* Tabla */}
            {loadingStudents ? (
              <div className="text-center py-10 text-gray-500">Cargando estudiantes...</div>
            ) : (
              <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-300">{filteredStudents.length} estudiantes</span>
                  <button onClick={loadStudents} className="text-xs text-gray-400 hover:text-white">↻ Recargar</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                      <tr>
                        <th className="text-left px-4 py-3">Nombre</th>
                        <th className="text-left px-4 py-3">Correo</th>
                        <th className="text-left px-4 py-3">Grado</th>
                        <th className="text-center px-4 py-3">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(s => (
                        <tr key={s.id} className="border-t border-gray-700 hover:bg-gray-750">
                          <td className="px-4 py-2.5 text-white">{s.nombre}</td>
                          <td className="px-4 py-2.5 text-gray-400">{s.email || '—'}</td>
                          <td className="px-4 py-2.5"><span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full text-xs">{s.grado}</span></td>
                          <td className="px-4 py-2.5 text-center">
                            <button onClick={() => deleteStudent(s.id)}
                              className="text-red-400 hover:text-red-300 text-xs font-medium">
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No hay estudiantes registrados.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ——— CONFIGURACIÓN ——— */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-base font-bold text-white mb-4">Configuración General</h3>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-400 mb-1">Institución</label>
                <input type="text" value={config.institucion || ''} onChange={e => setConfig((p: any) => ({...p, institucion: e.target.value}))}
                  className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2.5 text-sm focus:border-blue-400 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Año</label>
                  <input type="text" value={config.anio || ''} onChange={e => setConfig((p: any) => ({...p, anio: e.target.value}))}
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2.5 text-sm focus:border-blue-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Período activo</label>
                  <select value={config.periodo || ''} onChange={e => setConfig((p: any) => ({...p, periodo: e.target.value}))}
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2.5 text-sm focus:border-blue-400 outline-none">
                    {['1','2','3','4'].map(p => <option key={p} value={p}>{p}° Periodo</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-400 mb-1">Estado de la plataforma</label>
                <select value={config.estado || 'cerrado'} onChange={e => setConfig((p: any) => ({...p, estado: e.target.value}))}
                  className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2.5 text-sm focus:border-blue-400 outline-none">
                  <option value="abierto">🟢 Abierta</option>
                  <option value="cerrado">🔴 Cerrada</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-400 mb-1">Mensaje para los estudiantes (opcional)</label>
                <textarea value={config.mensaje || ''} onChange={e => setConfig((p: any) => ({...p, mensaje: e.target.value}))}
                  rows={3} className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2.5 text-sm focus:border-blue-400 outline-none"
                  placeholder="Mensaje informativo que verán los estudiantes al ingresar..." />
              </div>

              <button onClick={saveConfig} disabled={savingConfig}
                className="w-full bg-blue-700 hover:bg-blue-600 text-white py-3 rounded-lg text-sm font-bold disabled:opacity-50 transition">
                {savingConfig ? 'Guardando...' : '💾 Guardar configuración'}
              </button>
            </div>

            {/* Fechas de períodos */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-base font-bold text-white mb-4">Fechas de Períodos</h3>
              {[1,2,3,4].map(p => (
                <div key={p} className="mb-4">
                  <p className="text-xs font-bold text-gray-400 mb-2">{p}° Periodo</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Inicio</label>
                      <input type="date" value={config[`periodo_${p}_inicio`] || ''}
                        onChange={e => setConfig((prev: any) => ({...prev, [`periodo_${p}_inicio`]: e.target.value}))}
                        className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2 text-sm focus:border-blue-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fin</label>
                      <input type="date" value={config[`periodo_${p}_fin`] || ''}
                        onChange={e => setConfig((prev: any) => ({...prev, [`periodo_${p}_fin`]: e.target.value}))}
                        className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-2 text-sm focus:border-blue-400 outline-none" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={saveConfig} disabled={savingConfig}
                className="w-full bg-blue-700 hover:bg-blue-600 text-white py-3 rounded-lg text-sm font-bold disabled:opacity-50 transition">
                {savingConfig ? 'Guardando...' : '💾 Guardar fechas'}
              </button>
            </div>
          </div>

          {/* Horario automático */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-base font-bold text-white mb-1">Horario Automático de Plataforma</h3>
            <p className="text-xs text-gray-400 mb-5">Si configuras fechas de apertura y cierre, la plataforma se abre y cierra automáticamente para los estudiantes, sin necesidad de cambiar el estado manualmente.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1,2,3,4].map(p => {
                const ps = ((config.platform_schedule || {})[String(p)]) || {}
                const hrs = Array.from({length:12}, (_,i) => String(i+1))
                const mins = ['00','05','10','15','20','25','30','35','40','45','50','55','59']
                const updPs = (key: string, val: string) =>
                  setConfig((prev: any) => ({
                    ...prev,
                    platform_schedule: {
                      ...(prev.platform_schedule || {}),
                      [String(p)]: { ...((prev.platform_schedule || {})[String(p)] || {}), [key]: val }
                    }
                  }))
                return (
                  <div key={p} className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                    <p className="text-xs font-bold text-blue-400 mb-3">{p}° Período</p>
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-green-400 mb-1.5">🟢 Apertura</p>
                      <input type="date" value={ps.openDate || ''} onChange={e => updPs('openDate', e.target.value)}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-1.5 text-xs mb-1.5 outline-none focus:border-green-500" />
                      <div className="flex gap-1">
                        <select value={ps.openHour || '7'} onChange={e => updPs('openHour', e.target.value)}
                          className="flex-1 bg-gray-800 text-white border border-gray-700 rounded p-1 text-xs outline-none">
                          {hrs.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="text-gray-500 self-center text-xs">:</span>
                        <select value={ps.openMin || '00'} onChange={e => updPs('openMin', e.target.value)}
                          className="flex-1 bg-gray-800 text-white border border-gray-700 rounded p-1 text-xs outline-none">
                          {mins.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={ps.openAmPm || 'AM'} onChange={e => updPs('openAmPm', e.target.value)}
                          className="w-12 bg-gray-800 text-white border border-gray-700 rounded p-1 text-xs outline-none">
                          <option value="AM">AM</option><option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-400 mb-1.5">🔴 Cierre</p>
                      <input type="date" value={ps.closeDate || ''} onChange={e => updPs('closeDate', e.target.value)}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-1.5 text-xs mb-1.5 outline-none focus:border-red-500" />
                      <div className="flex gap-1">
                        <select value={ps.closeHour || '11'} onChange={e => updPs('closeHour', e.target.value)}
                          className="flex-1 bg-gray-800 text-white border border-gray-700 rounded p-1 text-xs outline-none">
                          {hrs.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="text-gray-500 self-center text-xs">:</span>
                        <select value={ps.closeMin || '59'} onChange={e => updPs('closeMin', e.target.value)}
                          className="flex-1 bg-gray-800 text-white border border-gray-700 rounded p-1 text-xs outline-none">
                          {mins.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={ps.closeAmPm || 'PM'} onChange={e => updPs('closeAmPm', e.target.value)}
                          className="w-12 bg-gray-800 text-white border border-gray-700 rounded p-1 text-xs outline-none">
                          <option value="AM">AM</option><option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={saveConfig} disabled={savingConfig}
              className="mt-5 w-full bg-blue-700 hover:bg-blue-600 text-white py-3 rounded-lg text-sm font-bold disabled:opacity-50 transition">
              {savingConfig ? 'Guardando...' : '💾 Guardar horario automático'}
            </button>
          </div>

          </div>
        )}

      </div>
    </div>
  )
}
