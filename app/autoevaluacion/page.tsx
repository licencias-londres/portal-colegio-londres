'use client'

import { useEffect, useRef, useState } from 'react'
import { MATERIAS_BACHILLERATO, GRADE_NAMES, normalizeGrade, getFormType } from '@/lib/teacher-data'

interface Config { periodo: string; anio: string; estado: string; mensaje: string; institucion: string }
interface CriterioForm { id: string; label: string }
interface CustomItemMap { [materia: string]: { item1: string; item2: string } }

const CRITERIOS: CriterioForm[] = [
  { id: 'c1',  label: 'Durante este periodo demostré comprensión de los conceptos trabajados en la asignatura y desarrollé las competencias propuestas.' },
  { id: 'c2',  label: 'Durante el periodo académico participé activamente y asumí con responsabilidad las actividades propuestas en clase.' },
  { id: 'c3',  label: 'Ingresé puntualmente a clase, inicié las actividades a tiempo y entregué mis asignaciones dentro de las fechas establecidas.' },
  { id: 'c4',  label: 'Mostré interés y disposición para aprender y trabajar en esta asignatura.' },
  { id: 'c5',  label: 'Presenté mis cuadernos, asignaciones y trabajos de forma organizada, completa y con buena presentación.' },
  { id: 'c6',  label: 'Mantengo una actitud respetuosa y adecuada para favorecer el normal desarrollo de las clases.' },
  { id: 'c7',  label: 'Respeté el tiempo, las opiniones y el trabajo de mis compañeros y docentes.' },
  { id: 'c8',  label: 'Cumplí con los acuerdos establecidos y atendí las recomendaciones dadas por docentes.' },
  { id: 'c9',  label: 'Demostré esfuerzo personal y compromiso constante en la búsqueda de un mejor desempeño académico.' },
  { id: 'c10', label: 'Durante las clases desarrollé de manera autónoma las actividades propuestas, gestionando adecuadamente mi tiempo.' },
  { id: 'c11', label: 'Cuando tuve dudas frente a los contenidos o trabajos asignados, pregunté al docente en los momentos adecuados para aclararlas.' },
  { id: 'c12', label: 'Trabajé de manera respetuosa y colaborativa en equipo, aceptando con disposición trabajar con cualquier compañero(a).' }
]

const DRAFT_KEY = 'autoev_draft_v2'

export default function AutoevaluacionPage() {
  const [config, setConfig]   = useState<Config | null>(null)
  const [screen, setScreen]   = useState<'login' | 'form' | 'success'>('login')
  const [grade, setGrade]               = useState('')
  const [email, setEmail]               = useState('')
  const [studentName, setStudentName]   = useState('')
  const [students, setStudents]         = useState<string[]>([])
  const [loginError, setLoginError]     = useState('')
  const [verifying, setVerifying]       = useState(false)
  const [currentName,  setCurrentName]  = useState('')
  const [currentGrade, setCurrentGrade] = useState('')
  const [currentEmail, setCurrentEmail] = useState('')
  const [globalValues, setGlobalValues] = useState<Record<string, number | null>>({
    participacion: null, puntualidad: null, cumplimiento: null, autonomia: null, atencion: null
  })
  const [globalReflexion,  setGlobalReflexion]  = useState('')
  const [globalCompromiso, setGlobalCompromiso] = useState('')
  const [materias,          setMaterias]          = useState<string[]>([])
  const [currentMateriaIdx, setCurrentMateriaIdx] = useState(0)
  const [bachValues,  setBachValues]  = useState<Record<string, Record<string, number | null>>>({})
  const [bachReflexion, setBachReflexion] = useState<Record<string, string>>({})
  const [bachSubmitted, setBachSubmitted] = useState<Record<string, boolean>>({})
  const [customItems, setCustomItems] = useState<CustomItemMap>({})
  const [bachCi1, setBachCi1] = useState<Record<string, number | null>>({})
  const [bachCi2, setBachCi2] = useState<Record<string, number | null>>({})
  const [bachCi1j, setBachCi1j] = useState<Record<string, string>>({})
  const [bachCi2j, setBachCi2j] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [draftBanner, setDraftBanner] = useState(false)
  const [globalSubmitted, setGlobalSubmitted] = useState(false)
  const _draftRef = useRef(false)

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(d => setConfig({
      periodo: d.periodo, anio: d.anio, estado: d.estado, mensaje: d.mensaje, institucion: d.institucion
    }))
  }, [])

  useEffect(() => {
    const gn = normalizeGrade(grade)
    if (grade && ['transicion','1','2','3'].includes(gn)) {
      fetch(`/api/students?grade=${grade}`).then(r => r.json()).then(d => setStudents(d.students || []))
    } else setStudents([])
  }, [grade])

  useEffect(() => {
    if (screen !== 'form' || !currentGrade) return
    const draft = { currentName, currentGrade, currentEmail, bachValues, bachReflexion, bachSubmitted,
      bachCi1, bachCi2, bachCi1j, bachCi2j, globalValues, globalReflexion, globalCompromiso, currentMateriaIdx }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    _draftRef.current = true
  }, [bachValues, bachReflexion, bachCi1, bachCi2, bachCi1j, bachCi2j,
      globalValues, globalReflexion, globalCompromiso, currentMateriaIdx, screen])

  function calcAvg(vals: (number | null)[]): string {
    const v = vals.filter(x => x !== null) as number[]
    if (!v.length) return '—'
    return (v.reduce((a,b) => a+b, 0) / v.length).toFixed(1)
  }

  function calcAvgMat(mat: string, vals: Record<string, number | null>): string {
    const ci = customItems[mat]
    return calcAvg([
      ...CRITERIOS.map(c => vals[c.id] ?? null),
      ...(ci?.item1 ? [bachCi1[mat] ?? null] : []),
      ...(ci?.item2 ? [bachCi2[mat] ?? null] : [])
    ])
  }

  async function handleVerify() {
    setLoginError(''); setVerifying(true)
    const res = await fetch('/api/validate', { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, selectedGradeKey: grade }) })
    const data = await res.json()
    setVerifying(false)
    if (data.valid) await startForm(data.nombre, grade, email)
    else setLoginError(data.message)
  }

  async function handleConfirmName() {
    if (!studentName) { setLoginError('Por favor selecciona tu nombre'); return }
    await startForm(studentName, grade, '')
  }

  async function startForm(nombre: string, gradeKey: string, emailStr: string) {
    setCurrentName(nombre); setCurrentGrade(gradeKey); setCurrentEmail(emailStr)
    const gn   = normalizeGrade(gradeKey)
    const type = getFormType(gn)

    // 1. Recuperar borrador local
    let draft: any = null
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        if (d.currentName === nombre && normalizeGrade(d.currentGrade) === gn) draft = d
      }
    } catch { /**/ }

    if (type === 'bachillerato') {
      const mats = MATERIAS_BACHILLERATO[gn] || []
      setMaterias(mats)

      // Estado base vacío
      const init: Record<string, Record<string, number | null>> = {}
      const c1: Record<string, number|null> = {}; const c2: Record<string, number|null> = {}
      const c1j: Record<string, string> = {}; const c2j: Record<string, string> = {}
      mats.forEach(m => {
        init[m] = {}; CRITERIOS.forEach(c => { init[m][c.id] = null })
        c1[m] = null; c2[m] = null; c1j[m] = ''; c2j[m] = ''
      })
      let newBachValues   = draft?.bachValues   || init
      let newBachReflexion = draft?.bachReflexion || {}
      let newBachSubmitted = draft?.bachSubmitted || {}
      let newBachCi1  = draft?.bachCi1  || c1
      let newBachCi2  = draft?.bachCi2  || c2
      let newBachCi1j = draft?.bachCi1j || c1j
      let newBachCi2j = draft?.bachCi2j || c2j
      let newMateriaIdx = draft?.currentMateriaIdx || 0

      // 2. Consultar BD — sobreescribe el borrador con datos confirmados
      if (config) {
        try {
          const params = new URLSearchParams({ tipo: 'bachillerato', correo: emailStr.toLowerCase(), grado: gn, periodo: config.periodo, anio: config.anio })
          const r = await fetch(`/api/student/responses?${params}`)
          const d = await r.json()
          if (d.success && d.submitted) {
            for (const [mat, row] of Object.entries(d.submitted as Record<string, any>)) {
              newBachValues[mat] = { c1: row.c1, c2: row.c2, c3: row.c3, c4: row.c4,
                c5: row.c5, c6: row.c6, c7: row.c7, c8: row.c8,
                c9: row.c9, c10: row.c10, c11: row.c11, c12: row.c12 }
              newBachReflexion[mat] = row.reflexion || ''
              newBachSubmitted[mat] = true
              if (row.ci1  != null) newBachCi1[mat]  = row.ci1
              if (row.ci1j != null) newBachCi1j[mat] = row.ci1j
              if (row.ci2  != null) newBachCi2[mat]  = row.ci2
              if (row.ci2j != null) newBachCi2j[mat] = row.ci2j
            }
            // Navegar a la primera materia pendiente
            const firstPending = mats.findIndex(m => !newBachSubmitted[m])
            if (firstPending >= 0) newMateriaIdx = firstPending
          }
        } catch { /**/ }
      }

      setBachValues(newBachValues); setBachReflexion(newBachReflexion)
      setBachSubmitted(newBachSubmitted)
      setBachCi1(newBachCi1); setBachCi2(newBachCi2)
      setBachCi1j(newBachCi1j); setBachCi2j(newBachCi2j)
      setCurrentMateriaIdx(newMateriaIdx)

      const anySubmitted = Object.values(newBachSubmitted).some(Boolean)
      if (anySubmitted || draft) { setDraftBanner(true); setTimeout(() => setDraftBanner(false), 5000) }

      if (config) {
        try {
          const r = await fetch(`/api/custom-items?grade=${gn}&periodo=${config.periodo}&anio=${config.anio}`)
          const d = await r.json()
          if (d.success) setCustomItems(d.items || {})
        } catch { /**/ }
      }
    }

    if (type === 'global') {
      // Estado base desde borrador
      let newGlobalValues = draft?.globalValues || { participacion: null, puntualidad: null, cumplimiento: null, autonomia: null, atencion: null }
      let newReflexion    = draft?.globalReflexion  || ''
      let newCompromiso   = draft?.globalCompromiso  || ''
      let alreadySubmitted = false

      // 2. Consultar BD
      if (config) {
        try {
          const params = new URLSearchParams({ tipo: 'global', nombre, grado: gn, periodo: config.periodo, anio: config.anio })
          const r = await fetch(`/api/student/responses?${params}`)
          const d = await r.json()
          if (d.success && d.submitted) {
            const s = d.submitted
            newGlobalValues = { participacion: s.participacion, puntualidad: s.puntualidad,
              cumplimiento: s.cumplimiento, autonomia: s.autonomia, atencion: s.atencion }
            newReflexion   = s.reflexion  || ''
            newCompromiso  = s.compromiso || ''
            alreadySubmitted = true
          }
        } catch { /**/ }
      }

      setGlobalValues(newGlobalValues)
      setGlobalReflexion(newReflexion)
      setGlobalCompromiso(newCompromiso)
      setGlobalSubmitted(alreadySubmitted)
      if (alreadySubmitted || draft) { setDraftBanner(true); setTimeout(() => setDraftBanner(false), 5000) }
    }

    setScreen('form'); window.scrollTo(0, 0)
  }

  async function submitMateria(idx: number) {
    const mat  = materias[idx]
    const vals = bachValues[mat] || {}
    const ci   = customItems[mat]
    setSubmitting(true)
    await fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'bachillerato', email: currentEmail, nombre: currentName,
        grado: GRADE_NAMES[normalizeGrade(currentGrade)] || currentGrade,
        periodo: config?.periodo, anio: config?.anio,
        materias: [{ nombre: mat, ...vals,
          ci1:  ci?.item1 ? (bachCi1[mat] ?? null) : null,
          ci1j: ci?.item1 ? (bachCi1j[mat] || '') : '',
          ci2:  ci?.item2 ? (bachCi2[mat] ?? null) : null,
          ci2j: ci?.item2 ? (bachCi2j[mat] || '') : '',
          notaFinal: parseFloat(calcAvgMat(mat, vals)),
          reflexion: bachReflexion[mat] || '' }] }) })
    setBachSubmitted(p => ({ ...p, [mat]: true }))
    setSubmitting(false)
  }

  async function submitGlobal() {
    const vals = Object.values(globalValues).filter(v => v !== null) as number[]
    const nf   = vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : 0
    setSubmitting(true)
    await fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'global', email: currentEmail, nombre: currentName,
        grado: GRADE_NAMES[normalizeGrade(currentGrade)] || currentGrade,
        periodo: config?.periodo, anio: config?.anio,
        ...globalValues, notaFinal: nf, reflexion: globalReflexion, compromiso: globalCompromiso }) })
    localStorage.removeItem(DRAFT_KEY); setSubmitting(false); setScreen('success')
  }

  function handleFinish() { localStorage.removeItem(DRAFT_KEY); setScreen('success') }

  const gn    = normalizeGrade(currentGrade)
  const ft    = getFormType(gn)
  const lgn   = normalizeGrade(grade)
  const isLow = grade && ['transicion','1','2','3'].includes(lgn)

  // ====================================================== LOGIN
  if (screen === 'login') return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4">
        <h1 className="text-lg font-bold">Colegio Londres</h1>
        <p className="text-sm text-blue-200">Autoevaluación Estudiantil</p>
      </header>

      {config?.estado === 'cerrado' ? (
        <div className="max-w-md mx-auto mt-16 text-center p-6">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-blue-900 mb-2">Plataforma cerrada</h2>
          <p className="text-gray-500">El período de autoevaluación no está activo. Consulta con tu docente.</p>
        </div>
      ) : (
        <div className="max-w-lg mx-auto mt-8 px-4">
          {config && <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800 text-center">📅 {config.anio} · {config.periodo}° Periodo</div>}
          {config?.mensaje && <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4 text-sm text-yellow-800">💬 {config.mensaje}</div>}

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4">Bienvenido/a</h2>
            <p className="text-sm text-gray-500 mb-6">Responde de manera <strong>reflexiva y honesta</strong> según tu proceso en este periodo.</p>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-blue-900 mb-2">Selecciona tu grado</label>
              <select value={grade} onChange={e => { setGrade(e.target.value); setLoginError(''); setEmail(''); setStudentName('') }}
                className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:border-blue-900 outline-none">
                <option value="">— Selecciona tu grado —</option>
                <optgroup label="Preescolar y Primaria">
                  {['transicion','1','2','3','4','5'].map(g => <option key={g} value={g}>{GRADE_NAMES[g]}</option>)}
                </optgroup>
                <optgroup label="Bachillerato">
                  {['6','7','8','9','10','11'].map(g => <option key={g} value={g}>{GRADE_NAMES[g]}</option>)}
                </optgroup>
              </select>
            </div>

            {isLow && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-blue-900 mb-2">Selecciona tu nombre</label>
                <select value={studentName} onChange={e => { setStudentName(e.target.value); setLoginError('') }}
                  className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:border-blue-900 outline-none">
                  <option value="">— Elige tu nombre —</option>
                  {students.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {loginError && <p className="text-red-500 text-sm mt-2">{loginError}</p>}
                <button onClick={handleConfirmName}
                  className="mt-4 w-full bg-blue-900 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-800">
                  Continuar
                </button>
              </div>
            )}

            {grade && !isLow && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-blue-900 mb-2">Correo institucional</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setLoginError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  placeholder="tunombre@colegiolondres.edu.co"
                  className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:border-blue-900 outline-none" />
                {loginError && <p className="text-red-500 text-sm mt-2">{loginError}</p>}
                <button onClick={handleVerify} disabled={verifying}
                  className="mt-4 w-full bg-blue-900 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50">
                  {verifying ? 'Verificando...' : 'Verificar acceso'}
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            ¿Eres docente?{' '}
            <a href="/teacher" className="text-blue-600 hover:underline">Accede al Portal Docente</a>
          </p>
        </div>
      )}
    </div>
  )

  // ====================================================== ÉXITO
  if (screen === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-blue-900 mb-2">¡Autoevaluación enviada!</h2>
        <p className="text-gray-500 text-sm">Gracias, <strong>{currentName}</strong>. Tu autoevaluación de {GRADE_NAMES[gn] || currentGrade} — {config?.periodo}° Periodo {config?.anio} ha sido registrada.</p>
        <button onClick={() => { setScreen('login'); setGrade(''); setEmail(''); setStudentName('') }}
          className="mt-6 bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800">
          Volver al inicio
        </button>
      </div>
    </div>
  )

  // ====================================================== FORMULARIO
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold">Colegio Londres</h1>
          <p className="text-sm text-blue-200">Autoevaluación — {currentName} · {GRADE_NAMES[gn] || currentGrade}</p>
        </div>
        <button onClick={() => setScreen('login')} className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg">Salir</button>
      </header>

      {/* Banner: borrador o respuestas previas recuperadas */}
      {draftBanner && (
        <div className={`text-white text-sm font-semibold px-4 py-3 flex items-center justify-between ${globalSubmitted ? 'bg-blue-700' : 'bg-green-600'}`}>
          <span>
            {globalSubmitted
              ? '🔒 Ya enviaste esta autoevaluación. Puedes consultarla pero no modificarla.'
              : '✅ Progreso recuperado — continuando desde donde lo dejaste.'}
          </span>
          <button onClick={() => setDraftBanner(false)} className="ml-4 text-white/70 hover:text-white font-bold text-lg leading-none">✕</button>
        </div>
      )}

      <div className={`mx-auto px-4 py-6 ${ft === 'bachillerato' ? 'max-w-6xl' : 'max-w-2xl'}`}>

        {ft === 'none' && (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <div className="text-4xl mb-4">👩‍🏫</div>
            <h3 className="font-bold text-blue-900 mb-2">Tu autoevaluación la realiza tu docente</h3>
            <p className="text-gray-500 text-sm">Para Transición y 1°, el proceso se realiza de manera presencial.</p>
          </div>
        )}

        {ft === 'global' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-blue-900 text-lg mb-4">Autoevaluación — {GRADE_NAMES[gn]}</h2>
            {globalSubmitted
              ? <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg p-3 mb-6">🔒 Ya enviaste tu autoevaluación este periodo. Aquí puedes consultar tus respuestas.</div>
              : <p className="text-sm text-gray-500 mb-6 bg-blue-50 p-3 rounded-lg">Responde de acuerdo a tu proceso y compromiso durante este periodo. Las notas deben estar entre 1 y 5.</p>
            }
            {[
              { id: 'participacion', label: 'Mi participación en las clases puede ser valorada en:' },
              { id: 'puntualidad',   label: 'La puntualidad para asistir y permanecer en las clases puede ser valorada en:' },
              { id: 'cumplimiento',  label: 'Mi cumplimiento con las actividades, tareas y trabajos puede ser valorado en:' },
              { id: 'autonomia',     label: 'Mi autonomía para realizar las actividades propuestas puede ser valorada en:' },
              { id: 'atencion',      label: 'Mi atención, esfuerzo y respeto al docente puede ser valorado en:' }
            ].map(c => (
              <div key={c.id} className="mb-5">
                <label className="block text-sm font-semibold text-blue-900 mb-2">{c.label}</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n}
                      onClick={() => !globalSubmitted && setGlobalValues(p => ({ ...p, [c.id]: n }))}
                      disabled={globalSubmitted}
                      className={`w-11 h-11 rounded-full border-2 font-bold text-sm transition-all
                        ${globalValues[c.id]===n
                          ? globalSubmitted ? 'bg-blue-700 border-blue-700 text-white' : 'bg-blue-900 border-blue-900 text-white'
                          : globalSubmitted ? 'border-gray-300 text-gray-300 cursor-default' : 'border-blue-900 text-blue-900 hover:bg-blue-50'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="mb-4 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-semibold text-blue-900">Nota final (promedio automático):</p>
              <p className="text-4xl font-black text-blue-900">{calcAvg(['participacion','puntualidad','cumplimiento','autonomia'].map(k => globalValues[k]))}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-blue-900 mb-2">Reflexión y justificación de la nota:</label>
              <textarea value={globalReflexion} onChange={e => !globalSubmitted && setGlobalReflexion(e.target.value)}
                readOnly={globalSubmitted} rows={3}
                className={`w-full border-2 rounded-lg p-3 text-sm text-gray-900 outline-none ${globalSubmitted ? 'border-gray-100 bg-gray-50 cursor-default' : 'border-gray-200 focus:border-blue-900'}`}
                placeholder="Escribe aquí..." />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-blue-900 mb-2">Mi compromiso para el próximo período es:</label>
              <textarea value={globalCompromiso} onChange={e => !globalSubmitted && setGlobalCompromiso(e.target.value)}
                readOnly={globalSubmitted} rows={3}
                className={`w-full border-2 rounded-lg p-3 text-sm text-gray-900 outline-none ${globalSubmitted ? 'border-gray-100 bg-gray-50 cursor-default' : 'border-gray-200 focus:border-blue-900'}`}
                placeholder="Escribe aquí..." />
            </div>
            {globalSubmitted ? (
              <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-center text-green-700 font-semibold text-sm">
                ✅ Autoevaluación enviada correctamente este periodo
              </div>
            ) : (
              <button onClick={submitGlobal} disabled={submitting||Object.values(globalValues).some(v=>v===null)||!globalReflexion||!globalCompromiso}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-green-700">
                {submitting ? 'Enviando...' : '✅ Enviar autoevaluación'}
              </button>
            )}
          </div>
        )}

        {ft === 'bachillerato' && materias.length > 0 && (() => {
          const mat  = materias[currentMateriaIdx]
          const vals = bachValues[mat] || {}
          const ci   = customItems[mat]
          const avg  = calcAvgMat(mat, vals)
          const completadas = Object.values(bachSubmitted).filter(Boolean).length
          const allFilled = CRITERIOS.every(c => vals[c.id]!==null)
            && (!ci?.item1 || bachCi1[mat]!==null) && (!ci?.item2 || bachCi2[mat]!==null)
            && (!ci?.item1 || !!(bachCi1j[mat]||'').trim()) && (!ci?.item2 || !!(bachCi2j[mat]||'').trim())
          const hasRef = !!(bachReflexion[mat]||'').trim()
          const pctBar = Math.round((completadas / materias.length) * 100)
          return (
            <div>
              {/* Barra de info del estudiante */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 mb-4 flex flex-wrap gap-6 items-center">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Estudiante</p>
                  <p className="font-bold text-blue-900 text-base">{currentName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Grado</p>
                  <p className="font-bold text-blue-900 text-base">{GRADE_NAMES[gn] || currentGrade}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Periodo</p>
                  <p className="font-bold text-blue-900 text-base">{config?.periodo}° Periodo · {config?.anio}</p>
                </div>
              </div>

              {/* Layout dos columnas */}
              <div className="flex gap-4 items-start">

                {/* ── Sidebar izquierdo: lista de materias ── */}
                <div className="w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-blue-900 px-4 py-3">
                    <p className="text-white font-bold text-sm">Mis materias</p>
                    <p className="text-blue-300 text-xs mt-0.5">{completadas} / {materias.length} completadas</p>
                  </div>
                  {/* Barra de progreso */}
                  <div className="h-1.5 bg-gray-100">
                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${pctBar}%` }} />
                  </div>
                  <ul className="py-2">
                    {materias.map((m, i) => {
                      const done    = !!bachSubmitted[m]
                      const active  = i === currentMateriaIdx
                      return (
                        <li key={m}>
                          <button onClick={() => setCurrentMateriaIdx(i)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-all
                              ${active  ? 'bg-blue-50 border-l-4 border-blue-900 font-bold text-blue-900'
                              : done    ? 'text-green-700 hover:bg-green-50'
                              : 'text-gray-600 hover:bg-gray-50'}`}>
                            {/* Indicador */}
                            <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2
                              ${done   ? 'bg-green-500 border-green-500 text-white'
                              : active ? 'bg-blue-900 border-blue-900 text-white'
                              :          'border-gray-300 text-gray-300'}`}>
                              {done ? '✓' : ''}
                            </span>
                            <span className="leading-tight">{m}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* ── Panel derecho: formulario ── */}
                <div className="flex-1 min-w-0">
                  {/* Texto introductorio */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 text-sm text-gray-600 leading-relaxed">
                    La autoevaluación es un proceso <strong>individual, consciente y responsable</strong> del proceso académico y actitudinal del estudiante.
                    Responde de manera <strong>reflexiva y honesta</strong>, de acuerdo a tu proceso y compromiso durante este período.
                    <strong> Las notas deben estar entre 1 y 5.</strong> El promedio es calculado automáticamente por el sistema.
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    {/* Encabezado de la materia */}
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                      <span className="bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        {completadas === materias.length ? `${materias.length}/${materias.length}` : `${currentMateriaIdx+1}/${materias.length}`}
                      </span>
                      <h2 className="font-bold text-blue-900 text-xl">{mat}</h2>
                      {bachSubmitted[mat] && (
                        <span className="ml-auto text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2 py-1 rounded-full">✓ Enviada</span>
                      )}
                    </div>

                    {CRITERIOS.map((cr, idx) => (
                      <div key={cr.id} className="mb-6">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">{idx+1}. {cr.label}</label>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(n => (
                            <button key={n} disabled={bachSubmitted[mat]}
                              onClick={() => setBachValues(p => ({...p,[mat]:{...p[mat],[cr.id]:n}}))}
                              className={`w-11 h-11 rounded-full border-2 font-bold text-sm transition-all
                                ${vals[cr.id]===n ? 'bg-blue-900 border-blue-900 text-white shadow-md'
                                : bachSubmitted[mat] ? 'border-gray-200 text-gray-300 cursor-default'
                                : 'border-blue-900 text-blue-900 hover:bg-blue-50'}`}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {ci?.item1 && (
                      <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                        <span className="inline-block bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">✏️ Criterio adicional</span>
                        <label className="block text-sm font-semibold text-amber-900 mb-2">{CRITERIOS.length+1}. {ci.item1}</label>
                        <div className="flex gap-2 mb-3">
                          {[1,2,3,4,5].map(n => (
                            <button key={n} disabled={bachSubmitted[mat]} onClick={() => setBachCi1(p => ({...p,[mat]:n}))}
                              className={`w-11 h-11 rounded-full border-2 font-bold text-sm transition-all ${bachCi1[mat]===n?'bg-amber-500 border-amber-500 text-white':'border-amber-500 text-amber-800 hover:bg-amber-100 disabled:opacity-40'}`}>
                              {n}
                            </button>
                          ))}
                        </div>
                        <textarea value={bachCi1j[mat]||''} onChange={e => setBachCi1j(p => ({...p,[mat]:e.target.value}))}
                          disabled={bachSubmitted[mat]} rows={2}
                          className="w-full border-2 border-amber-200 rounded-lg p-3 text-sm text-gray-900 focus:border-amber-500 outline-none disabled:bg-gray-50"
                          placeholder="Justifica tu valoración en este criterio..." />
                      </div>
                    )}

                    {ci?.item2 && (
                      <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                        <span className="inline-block bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">✏️ Criterio adicional</span>
                        <label className="block text-sm font-semibold text-amber-900 mb-2">{CRITERIOS.length+(ci.item1?2:1)}. {ci.item2}</label>
                        <div className="flex gap-2 mb-3">
                          {[1,2,3,4,5].map(n => (
                            <button key={n} disabled={bachSubmitted[mat]} onClick={() => setBachCi2(p => ({...p,[mat]:n}))}
                              className={`w-11 h-11 rounded-full border-2 font-bold text-sm transition-all ${bachCi2[mat]===n?'bg-amber-500 border-amber-500 text-white':'border-amber-500 text-amber-800 hover:bg-amber-100 disabled:opacity-40'}`}>
                              {n}
                            </button>
                          ))}
                        </div>
                        <textarea value={bachCi2j[mat]||''} onChange={e => setBachCi2j(p => ({...p,[mat]:e.target.value}))}
                          disabled={bachSubmitted[mat]} rows={2}
                          className="w-full border-2 border-amber-200 rounded-lg p-3 text-sm text-gray-900 focus:border-amber-500 outline-none disabled:bg-gray-50"
                          placeholder="Justifica tu valoración en este criterio..." />
                      </div>
                    )}

                    <div className="mb-5 p-4 bg-blue-50 rounded-xl flex items-center gap-4">
                      <div>
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Nota final automática</p>
                        <p className="text-4xl font-black text-blue-900">{avg}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Justifica la nota y escribe tu compromiso de mejoramiento:</label>
                      <textarea value={bachReflexion[mat]||''} onChange={e => setBachReflexion(p => ({...p,[mat]:e.target.value}))}
                        disabled={bachSubmitted[mat]} rows={3}
                        className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:border-blue-900 outline-none disabled:bg-gray-50"
                        placeholder="Escribe aquí tu reflexión y compromiso..." />
                    </div>

                    {bachSubmitted[mat] ? (
                      <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-center text-green-700 font-semibold text-sm">
                        ✅ {mat} — guardada correctamente
                      </div>
                    ) : (
                      <button onClick={() => submitMateria(currentMateriaIdx)} disabled={submitting||!allFilled||!hasRef}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-green-700 text-base">
                        {submitting ? 'Enviando...' : `✅ Enviar ${mat}`}
                      </button>
                    )}

                    <div className="flex justify-between mt-4">
                      <button onClick={() => setCurrentMateriaIdx(i => Math.max(0,i-1))} disabled={currentMateriaIdx===0}
                        className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-gray-200">
                        ← Anterior
                      </button>
                      {currentMateriaIdx < materias.length-1 ? (
                        <button onClick={() => setCurrentMateriaIdx(i => i+1)}
                          className="text-sm bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800">
                          Siguiente →
                        </button>
                      ) : (
                        <button onClick={handleFinish} disabled={completadas === 0}
                          className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-green-700">
                          Finalizar ✓
                        </button>
                      )}
                    </div>
                  </div>
                </div>{/* fin panel derecho */}
              </div>{/* fin grid */}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
