'use client'

import { useState, useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ConfigModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<'general' | 'periodos' | 'estudiantes' | 'docentes'>('general')
  const [cfg, setCfg]     = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  // ── Estudiantes ────────────────────────────────────────────────────────────
  const [students,  setStudents]  = useState<any[]>([])
  const [loadingSt, setLoadingSt] = useState(false)
  const [stNombre,  setStNombre]  = useState('')
  const [stEmail,   setStEmail]   = useState('')
  const [stGrado,   setStGrado]   = useState('')
  const [addingSt,  setAddingSt]  = useState(false)
  const [stFilter,  setStFilter]  = useState('')

  // ── Docentes — lista ───────────────────────────────────────────────────────
  const [docentes,    setDocentes]    = useState<any[]>([])
  const [loadingDoc,  setLoadingDoc]  = useState(false)
  const [docFilter,   setDocFilter]   = useState('')
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  // ── Docentes — editar datos del docente ────────────────────────────────────
  const [editNombre,  setEditNombre]  = useState('')
  const [editEmail,   setEditEmail]   = useState('')
  const [editSaving,  setEditSaving]  = useState(false)
  const [editError,   setEditError]   = useState('')
  const [editSaved,   setEditSaved]   = useState(false)

  // ── Docentes — agregar asignación a docente existente ──────────────────────
  const [addAssGrado,   setAddAssGrado]   = useState('')
  const [addAssMateria, setAddAssMateria] = useState('')
  const [addingAss,     setAddingAss]     = useState(false)
  const [addAssError,   setAddAssError]   = useState('')

  // ── Docentes — crear docente nuevo ────────────────────────────────────────
  const [showNewDoc,     setShowNewDoc]     = useState(false)
  const [newDocNombre,   setNewDocNombre]   = useState('')
  const [newDocEmail,    setNewDocEmail]    = useState('')
  const [newDocGrado,    setNewDocGrado]    = useState('')
  const [newDocMateria,  setNewDocMateria]  = useState('')
  const [creatingDoc,    setCreatingDoc]    = useState(false)
  const [createDocError, setCreateDocError] = useState('')

  useEffect(() => {
    if (open) { loadCfg(); setTab('general'); setExpandedDoc(null); setShowNewDoc(false) }
  }, [open])

  if (!open) return null

  // ── Config ─────────────────────────────────────────────────────────────────
  async function loadCfg() {
    const r = await fetch('/api/config')
    setCfg(await r.json())
  }

  async function save() {
    setSaving(true)
    const periodoDates = [1,2,3,4].map(p => ({
      inicio: cfg[`periodo_${p}_inicio`] || null,
      fin:    cfg[`periodo_${p}_fin`]    || null
    }))
    await fetch('/api/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        periodo: cfg.periodo, anio: cfg.anio, estado: cfg.estado,
        mensaje: cfg.mensaje, institucion: cfg.institucion,
        platformSchedule: cfg.platform_schedule || {}, periodoDates
      })
    })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  function setPsVal(p: string, key: string, val: string) {
    setCfg((prev: any) => ({
      ...prev,
      platform_schedule: {
        ...(prev.platform_schedule || {}),
        [p]: { ...((prev.platform_schedule || {})[p] || {}), [key]: val }
      }
    }))
  }

  // ── Estudiantes ─────────────────────────────────────────────────────────────
  async function loadStudents() {
    setLoadingSt(true)
    const r = await fetch('/api/admin/students')
    const d = await r.json()
    setLoadingSt(false)
    if (d.success) setStudents(d.students)
  }

  async function addStudent() {
    if (!stNombre.trim() || !stGrado.trim()) return
    setAddingSt(true)
    await fetch('/api/admin/students', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: stNombre, email: stEmail, grado: stGrado })
    })
    setAddingSt(false); setStNombre(''); setStEmail(''); setStGrado('')
    loadStudents()
  }

  async function deleteStudent(id: string) {
    if (!confirm('¿Eliminar este estudiante?')) return
    await fetch('/api/admin/students', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    loadStudents()
  }

  // ── Docentes ────────────────────────────────────────────────────────────────
  async function loadDocentes() {
    setLoadingDoc(true)
    const r = await fetch('/api/admin/docentes')
    const d = await r.json()
    setLoadingDoc(false)
    if (d.success) setDocentes(d.docentes)
  }

  function openTeacher(email: string, nombre: string) {
    if (expandedDoc === email) {
      setExpandedDoc(null)
    } else {
      setExpandedDoc(email)
      setEditNombre(nombre)
      setEditEmail(email)
      setEditError('')
      setEditSaved(false)
      setAddAssGrado('')
      setAddAssMateria('')
      setAddAssError('')
    }
  }

  async function saveDocEdit(originalEmail: string) {
    setEditSaving(true); setEditError(''); setEditSaved(false)
    const r = await fetch('/api/admin/docentes', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: originalEmail,
        nombre: editNombre,
        newEmail: editEmail.toLowerCase().trim() !== originalEmail ? editEmail : undefined
      })
    })
    const d = await r.json()
    setEditSaving(false)
    if (d.success) {
      setEditSaved(true)
      setTimeout(() => setEditSaved(false), 3000)
      await loadDocentes()
      // Si cambió el correo, mantener el card abierto con el nuevo email
      const finalEmail = editEmail.toLowerCase().trim()
      setExpandedDoc(finalEmail !== originalEmail ? finalEmail : originalEmail)
    } else {
      setEditError(d.error || 'Error al guardar')
    }
  }

  async function addAssignment(email: string, nombre: string) {
    if (!addAssGrado.trim() || !addAssMateria.trim()) { setAddAssError('Grado y materia son requeridos'); return }
    setAddingAss(true); setAddAssError('')
    const r = await fetch('/api/admin/docentes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nombre, grado: addAssGrado.trim(), materia: addAssMateria.trim() })
    })
    const d = await r.json()
    setAddingAss(false)
    if (d.success) { setAddAssGrado(''); setAddAssMateria(''); loadDocentes() }
    else setAddAssError(d.error || 'Error al agregar')
  }

  async function deleteDocente(id: string) {
    if (!confirm('¿Eliminar esta asignación?')) return
    await fetch('/api/admin/docentes', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    loadDocentes()
  }

  async function createNewDoc() {
    if (!newDocNombre.trim() || !newDocEmail.trim() || !newDocGrado.trim() || !newDocMateria.trim()) {
      setCreateDocError('Todos los campos son requeridos'); return
    }
    setCreatingDoc(true); setCreateDocError('')
    const r = await fetch('/api/admin/docentes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newDocEmail.trim(), nombre: newDocNombre.trim(), grado: newDocGrado.trim(), materia: newDocMateria.trim() })
    })
    const d = await r.json()
    setCreatingDoc(false)
    if (d.success) {
      const created = newDocEmail.toLowerCase().trim()
      setNewDocNombre(''); setNewDocEmail(''); setNewDocGrado(''); setNewDocMateria('')
      setShowNewDoc(false)
      await loadDocentes()
      setExpandedDoc(created)
      setEditNombre(newDocNombre.trim())
      setEditEmail(created)
      setEditError(''); setEditSaved(false)
      setAddAssGrado(''); setAddAssMateria(''); setAddAssError('')
    } else {
      setCreateDocError(d.error || 'Error al crear')
    }
  }

  // ── Agrupación y filtros ─────────────────────────────────────────────────────
  const grouped: Record<string, { nombre: string; email: string; rows: any[] }> = {}
  for (const d of docentes) {
    if (!grouped[d.email]) grouped[d.email] = { nombre: d.nombre, email: d.email, rows: [] }
    grouped[d.email].rows.push(d)
  }

  const filteredGroups = Object.values(grouped).filter(g =>
    !docFilter ||
    g.nombre.toLowerCase().includes(docFilter.toLowerCase()) ||
    g.email.toLowerCase().includes(docFilter.toLowerCase()) ||
    g.rows.some(r => r.materia.toLowerCase().includes(docFilter.toLowerCase()) || String(r.grado).toLowerCase().includes(docFilter.toLowerCase()))
  )

  const filteredStudents = students.filter(s =>
    !stFilter ||
    s.nombre.toLowerCase().includes(stFilter.toLowerCase()) ||
    s.grado.toLowerCase().includes(stFilter.toLowerCase())
  )

  const TABS = [
    { id: 'general',     label: '📋 General' },
    { id: 'periodos',    label: '📅 Períodos' },
    { id: 'estudiantes', label: '👥 Estudiantes' },
    { id: 'docentes',    label: '🎓 Docentes' },
  ] as const

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">⚙️ Configuración</h2>
            <p className="text-xs text-blue-200 mt-0.5">Sistema de Autoevaluación · Colegio Londres</p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 w-8 h-8 rounded-full flex items-center justify-center text-white transition">✕</button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex flex-shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => {
                setTab(t.id)
                if (t.id === 'estudiantes' && students.length === 0) loadStudents()
                if (t.id === 'docentes'    && docentes.length === 0) loadDocentes()
              }}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition ${tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* GENERAL */}
          {tab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Institución</label>
                <input type="text" value={cfg.institucion || ''}
                  onChange={e => setCfg((p: any) => ({...p, institucion: e.target.value}))}
                  className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:border-blue-600 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Año</label>
                  <input type="text" value={cfg.anio || ''}
                    onChange={e => setCfg((p: any) => ({...p, anio: e.target.value}))}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:border-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Período activo</label>
                  <select value={cfg.periodo || ''} onChange={e => setCfg((p: any) => ({...p, periodo: e.target.value}))}
                    className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:border-blue-600 outline-none">
                    {['1','2','3','4'].map(p => <option key={p} value={p}>{p}° Período</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Estado manual de la plataforma</label>
                <select value={cfg.estado || 'cerrado'} onChange={e => setCfg((p: any) => ({...p, estado: e.target.value}))}
                  className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:border-blue-600 outline-none">
                  <option value="abierto">🟢 Abierta</option>
                  <option value="cerrado">🔴 Cerrada</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Si configuras el horario automático en Períodos, este campo se ignora mientras las fechas estén activas.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mensaje para estudiantes (opcional)</label>
                <textarea value={cfg.mensaje || ''} onChange={e => setCfg((p: any) => ({...p, mensaje: e.target.value}))}
                  rows={3} placeholder="Mensaje informativo visible en la pantalla de inicio..."
                  className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 focus:border-blue-600 outline-none resize-none" />
              </div>
            </div>
          )}

          {/* PERÍODOS */}
          {tab === 'periodos' && (
            <div>
              <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <strong>Horario automático:</strong> si configuras fechas de apertura y cierre, la plataforma se abre/cierra sola. Deja en blanco para usar el estado manual.
              </p>
              {[1,2,3,4].map(p => {
                const ps  = (cfg.platform_schedule || {})[String(p)] || {}
                const hrs = Array.from({length:12}, (_,i) => String(i+1))
                const min = ['00','05','10','15','20','25','30','35','40','45','50','55','59']
                return (
                  <div key={p} className="border border-gray-200 rounded-xl p-4 mb-4">
                    <p className="text-sm font-bold text-blue-800 mb-3">{p}° Período</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Inicio del período</label>
                        <input type="date" value={cfg[`periodo_${p}_inicio`] || ''}
                          onChange={e => setCfg((pv: any) => ({...pv, [`periodo_${p}_inicio`]: e.target.value}))}
                          className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Fin del período</label>
                        <input type="date" value={cfg[`periodo_${p}_fin`] || ''}
                          onChange={e => setCfg((pv: any) => ({...pv, [`periodo_${p}_fin`]: e.target.value}))}
                          className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none" />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Apertura / Cierre automático</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-700 mb-2">🟢 Apertura</p>
                        <input type="date" value={ps.openDate || ''} onChange={e => setPsVal(String(p), 'openDate', e.target.value)}
                          className="w-full border border-green-200 rounded-lg p-1.5 text-xs text-gray-900 mb-1.5 outline-none" />
                        <div className="flex gap-1">
                          <select value={ps.openHour || '7'} onChange={e => setPsVal(String(p), 'openHour', e.target.value)}
                            className="flex-1 border border-green-200 rounded p-1 text-xs text-gray-900 outline-none">
                            {hrs.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                          <span className="text-gray-400 self-center text-xs">:</span>
                          <select value={ps.openMin || '00'} onChange={e => setPsVal(String(p), 'openMin', e.target.value)}
                            className="flex-1 border border-green-200 rounded p-1 text-xs text-gray-900 outline-none">
                            {min.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <select value={ps.openAmPm || 'AM'} onChange={e => setPsVal(String(p), 'openAmPm', e.target.value)}
                            className="w-12 border border-green-200 rounded p-1 text-xs text-gray-900 outline-none">
                            <option value="AM">AM</option><option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-red-700 mb-2">🔴 Cierre</p>
                        <input type="date" value={ps.closeDate || ''} onChange={e => setPsVal(String(p), 'closeDate', e.target.value)}
                          className="w-full border border-red-200 rounded-lg p-1.5 text-xs text-gray-900 mb-1.5 outline-none" />
                        <div className="flex gap-1">
                          <select value={ps.closeHour || '11'} onChange={e => setPsVal(String(p), 'closeHour', e.target.value)}
                            className="flex-1 border border-red-200 rounded p-1 text-xs text-gray-900 outline-none">
                            {hrs.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                          <span className="text-gray-400 self-center text-xs">:</span>
                          <select value={ps.closeMin || '59'} onChange={e => setPsVal(String(p), 'closeMin', e.target.value)}
                            className="flex-1 border border-red-200 rounded p-1 text-xs text-gray-900 outline-none">
                            {min.map(m => <option key={m} value={m}>{m}</option>)}
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
          {tab === 'estudiantes' && (
            <div>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs font-bold text-gray-600 mb-3">Agregar estudiante</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <input type="text" value={stNombre} onChange={e => setStNombre(e.target.value)}
                    placeholder="Nombre completo"
                    className="border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-400" />
                  <input type="email" value={stEmail} onChange={e => setStEmail(e.target.value)}
                    placeholder="Correo (opcional)"
                    className="border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-400" />
                  <input type="text" value={stGrado} onChange={e => setStGrado(e.target.value)}
                    placeholder="Grado (ej: 6, transicion)"
                    className="border border-gray-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-400" />
                </div>
                <button onClick={addStudent} disabled={addingSt || !stNombre.trim() || !stGrado.trim()}
                  className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition">
                  {addingSt ? 'Guardando...' : '+ Agregar'}
                </button>
              </div>
              <input type="text" value={stFilter} onChange={e => setStFilter(e.target.value)}
                placeholder="Buscar por nombre o grado..."
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 mb-3 outline-none" />
              {loadingSt ? (
                <div className="text-center py-8 text-gray-400 text-sm">Cargando...</div>
              ) : (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500">{filteredStudents.length} estudiantes</span>
                    <button onClick={loadStudents} className="text-xs text-gray-400 hover:text-gray-600">↻ Recargar</button>
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
                        {filteredStudents.map(s => (
                          <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-800">{s.nombre}</td>
                            <td className="px-4 py-2"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{s.grado}</span></td>
                            <td className="px-4 py-2 text-center">
                              <button onClick={() => deleteStudent(s.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                            </td>
                          </tr>
                        ))}
                        {students.length === 0 && (
                          <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">Sin estudiantes. Agrega uno arriba.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DOCENTES */}
          {tab === 'docentes' && (
            <div>

              {/* Botón / formulario nuevo docente */}
              {!showNewDoc ? (
                <button
                  onClick={() => { setShowNewDoc(true); setCreateDocError('') }}
                  className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold mb-4 transition">
                  + Nuevo docente
                </button>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-bold text-blue-900">Nuevo docente</p>
                    <button onClick={() => setShowNewDoc(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input type="text" value={newDocNombre} onChange={e => setNewDocNombre(e.target.value)}
                      placeholder="Nombre completo"
                      className="col-span-2 border border-blue-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-600" />
                    <input type="email" value={newDocEmail} onChange={e => setNewDocEmail(e.target.value)}
                      placeholder="correo@colegiolondres.edu.co"
                      className="col-span-2 border border-blue-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-600" />
                    <input type="text" value={newDocGrado} onChange={e => setNewDocGrado(e.target.value)}
                      placeholder="Grado inicial (ej: 7, transicion)"
                      className="border border-blue-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-600" />
                    <input type="text" value={newDocMateria} onChange={e => setNewDocMateria(e.target.value)}
                      placeholder="Materia inicial"
                      className="border border-blue-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Puedes agregar más asignaciones después de crear el docente.</p>
                  {createDocError && <p className="text-red-500 text-xs mb-2">{createDocError}</p>}
                  <div className="flex gap-2">
                    <button onClick={createNewDoc} disabled={creatingDoc}
                      className="bg-blue-800 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition">
                      {creatingDoc ? 'Creando...' : 'Crear docente'}
                    </button>
                    <button onClick={() => setShowNewDoc(false)}
                      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Buscador */}
              <input type="text" value={docFilter} onChange={e => setDocFilter(e.target.value)}
                placeholder="Buscar por nombre, correo o materia..."
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm text-gray-900 mb-3 outline-none" />

              {/* Lista */}
              {loadingDoc ? (
                <div className="text-center py-8 text-gray-400 text-sm">Cargando docentes...</div>
              ) : (
                <div className="space-y-2">
                  {filteredGroups.length === 0 && docentes.length === 0 && (
                    <p className="text-center py-6 text-gray-400 text-sm">No hay docentes. Agrega uno con el botón de arriba.</p>
                  )}

                  {filteredGroups.map(g => (
                    <div key={g.email} className="border border-gray-200 rounded-xl overflow-hidden">

                      {/* Cabecera del docente */}
                      <div
                        onClick={() => openTeacher(g.email, g.nombre)}
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer select-none">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{g.nombre}</p>
                          <p className="text-xs text-gray-400">{g.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {g.rows.length} asignación{g.rows.length !== 1 ? 'es' : ''}
                          </span>
                          <span className="text-gray-400 text-xs">{expandedDoc === g.email ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {/* Panel expandido */}
                      {expandedDoc === g.email && (
                        <div className="p-4 space-y-4 border-t border-gray-100">

                          {/* Editar nombre y correo */}
                          <div className="bg-blue-50 rounded-xl p-3">
                            <p className="text-xs font-bold text-blue-800 mb-2">Datos del docente</p>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                                <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)}
                                  className="w-full border border-blue-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">Correo (para iniciar sesión)</label>
                                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                                  className="w-full border border-blue-200 rounded-lg p-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
                              </div>
                            </div>
                            {editEmail !== g.email && (
                              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mb-2">
                                ⚠️ El correo cambiará en todas las asignaciones. El docente deberá usar el nuevo correo para entrar.
                              </p>
                            )}
                            {editError && <p className="text-red-500 text-xs mb-2">{editError}</p>}
                            <div className="flex items-center gap-3">
                              <button onClick={() => saveDocEdit(g.email)} disabled={editSaving}
                                className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition">
                                {editSaving ? 'Guardando...' : '✓ Guardar cambios'}
                              </button>
                              {editSaved && <span className="text-green-600 text-xs font-medium">✅ Guardado</span>}
                            </div>
                          </div>

                          {/* Carga académica */}
                          <div>
                            <p className="text-xs font-bold text-gray-600 mb-2">Carga académica</p>
                            <div className="space-y-1 mb-3">
                              {g.rows.sort((a: any, b: any) => String(a.grado).localeCompare(String(b.grado))).map((row: any) => (
                                <div key={row.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold min-w-[2.5rem] text-center">{row.grado}</span>
                                    <span className="text-sm text-gray-700">{row.materia}</span>
                                  </div>
                                  <button onClick={() => deleteDocente(row.id)}
                                    className="text-red-400 hover:text-red-600 text-lg font-bold leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 transition">
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Agregar asignación */}
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                              <p className="text-xs font-bold text-green-800 mb-2">+ Agregar asignación</p>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <input type="text" value={addAssGrado} onChange={e => setAddAssGrado(e.target.value)}
                                  placeholder="Grado (ej: 7, transicion)"
                                  className="border border-green-200 rounded-lg p-2 text-xs text-gray-900 outline-none focus:border-green-500" />
                                <input type="text" value={addAssMateria} onChange={e => setAddAssMateria(e.target.value)}
                                  placeholder="Materia (ej: Matemáticas)"
                                  className="border border-green-200 rounded-lg p-2 text-xs text-gray-900 outline-none focus:border-green-500" />
                              </div>
                              {addAssError && <p className="text-red-500 text-xs mb-2">{addAssError}</p>}
                              <button onClick={() => addAssignment(g.email, g.nombre)} disabled={addingAss}
                                className="bg-green-700 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition">
                                {addingAss ? 'Guardando...' : '+ Agregar'}
                              </button>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  ))}

                  <button onClick={loadDocentes} className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 text-center transition">
                    ↻ Recargar lista
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(tab === 'general' || tab === 'periodos') && (
          <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
            <span className={`text-sm font-medium transition-opacity duration-300 ${saved ? 'opacity-100 text-green-600' : 'opacity-0'}`}>
              ✅ Configuración guardada
            </span>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cerrar</button>
              <button onClick={save} disabled={saving}
                className="px-6 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition">
                {saving ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
