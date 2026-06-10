'use client'

import { useEffect, useState } from 'react'
import { MATERIAS_BACHILLERATO, GRADE_NAMES, normalizeGrade, getFormType, TEACHER_DATA } from '@/lib/teacher-data'

// =====================================================================
// TIPOS
// =====================================================================
interface Config {
  periodo: string
  anio: string
  estado: string
  mensaje: string
  institucion: string
}

interface CriterioForm {
  id: string
  label: string
}

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

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function AutoevaluacionPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [screen, setScreen] = useState<'login' | 'form' | 'success'>('login')

  // Login
  const [grade, setGrade] = useState('')
  const [email, setEmail] = useState('')
  const [studentName, setStudentName] = useState('')
  const [students, setStudents] = useState<string[]>([])
  const [loginError, setLoginError] = useState('')
  const [verifying, setVerifying] = useState(false)

  // Estudiante actual
  const [currentName, setCurrentName] = useState('')
  const [currentGrade, setCurrentGrade] = useState('')
  const [currentEmail, setCurrentEmail] = useState('')

  // Formulario global (2° y 3°)
  const [globalValues, setGlobalValues] = useState<Record<string, number | null>>({
    participacion: null, puntualidad: null,
    cumplimiento: null, autonomia: null, atencion: null
  })
  const [globalReflexion, setGlobalReflexion] = useState('')
  const [globalCompromiso, setGlobalCompromiso] = useState('')

  // Formulario bachillerato
  const [materias, setMaterias] = useState<string[]>([])
  const [currentMateriaIdx, setCurrentMateriaIdx] = useState(0)
  const [bachValues, setBachValues] = useState<Record<string, Record<string, number | null>>>({})
  const [bachReflexion, setBachReflexion] = useState<Record<string, string>>({})
  const [bachSubmitted, setBachSubmitted] = useState<Record<string, boolean>>({})

  const [submitting, setSubmitting] = useState(false)

  // ——— Cargar configuración ———
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => setConfig({
        periodo:     data.periodo,
        anio:        data.anio,
        estado:      data.estado,
        mensaje:     data.mensaje,
        institucion: data.institucion
      }))
  }, [])

  // ——— Cargar estudiantes para grados bajos ———
  useEffect(() => {
    const gradeNorm = normalizeGrade(grade)
    if (grade && (gradeNorm === 'transicion' || gradeNorm === '1' || gradeNorm === '2' || gradeNorm === '3')) {
      fetch(`/api/students?grade=${grade}`)
        .then(r => r.json())
        .then(data => setStudents(data.students || []))
    } else {
      setStudents([])
    }
  }, [grade])

  // ——— Verificar email ———
  async function handleVerify() {
    setLoginError('')
    setVerifying(true)
    const res = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, selectedGradeKey: grade })
    })
    const data = await res.json()
    setVerifying(false)
    if (data.valid) {
      startForm(data.nombre, grade, email)
    } else if (data.error === 'wrong_grade') {
      setLoginError(`${data.message}`)
    } else {
      setLoginError(data.message)
    }
  }

  // ——— Confirmar nombre (grados bajos) ———
  function handleConfirmName() {
    if (!studentName) { setLoginError('Por favor selecciona tu nombre'); return }
    startForm(studentName, grade, '')
  }

  // ——— Iniciar formulario ———
  function startForm(nombre: string, gradeKey: string, emailStr: string) {
    setCurrentName(nombre)
    setCurrentGrade(gradeKey)
    setCurrentEmail(emailStr)
    const gradeNorm = normalizeGrade(gradeKey)
    const type = getFormType(gradeNorm)
    if (type === 'bachillerato') {
      const mats = MATERIAS_BACHILLERATO[gradeNorm] || []
      setMaterias(mats)
      const initial: Record<string, Record<string, number | null>> = {}
      mats.forEach(m => {
        initial[m] = {}
        CRITERIOS.forEach(c => { initial[m][c.id] = null })
      })
      setBachValues(initial)
      setBachReflexion({})
      setBachSubmitted({})
      setCurrentMateriaIdx(0)
    }
    setScreen('form')
    window.scrollTo(0, 0)
  }

  // ——— Calcular promedio ———
  function calcAvg(values: (number | null)[]): string {
    const valid = values.filter(v => v !== null) as number[]
    if (valid.length === 0) return '—'
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length
    return avg.toFixed(1)
  }

  // ——— Enviar materia bachillerato ———
  async function submitMateria(idx: number) {
    const materia = materias[idx]
    const values  = bachValues[materia] || {}
    setSubmitting(true)
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'bachillerato', email: currentEmail,
        nombre: currentName, grado: GRADE_NAMES[normalizeGrade(currentGrade)] || currentGrade,
        periodo: config?.periodo, anio: config?.anio,
        materias: [{
          nombre: materia, ...values,
          notaFinal: parseFloat(calcAvg(CRITERIOS.map(c => values[c.id] ?? null))),
          reflexion: bachReflexion[materia] || ''
        }]
      })
    })
    setBachSubmitted(prev => ({ ...prev, [materia]: true }))
    setSubmitting(false)
  }

  // ——— Enviar formulario global ———
  async function submitGlobal() {
    const vals   = Object.values(globalValues).filter(v => v !== null) as number[]
    const notaFinal = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    setSubmitting(true)
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'global', email: currentEmail,
        nombre: currentName, grado: GRADE_NAMES[normalizeGrade(currentGrade)] || currentGrade,
        periodo: config?.periodo, anio: config?.anio,
        ...globalValues, notaFinal, reflexion: globalReflexion, compromiso: globalCompromiso
      })
    })
    setSubmitting(false)
    setScreen('success')
  }

  const gradeNorm  = normalizeGrade(currentGrade)
  const formType   = getFormType(gradeNorm)
  const isLowGrade = gradeNorm === 'transicion' || ['1','2','3'].includes(gradeNorm)
  const loginGradeNorm = normalizeGrade(grade)
  const isLowLogin = grade && (loginGradeNorm === 'transicion' || ['1','2','3'].includes(loginGradeNorm))

  // =====================================================================
  // PANTALLA: LOGIN
  // =====================================================================
  if (screen === 'login') return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
          {config && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800 text-center">
              📅 {config.anio} · {config.periodo}° Periodo
            </div>
          )}
          {config?.mensaje && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4 text-sm text-yellow-800">
              💬 {config.mensaje}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4">Bienvenido/a</h2>
            <p className="text-sm text-gray-500 mb-6">
              Responde de manera <strong>reflexiva y honesta</strong> según tu proceso en este periodo.
            </p>

            {/* Selector de grado */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-blue-900 mb-2">Selecciona tu grado</label>
              <select
                value={grade}
                onChange={e => { setGrade(e.target.value); setLoginError(''); setEmail(''); setStudentName('') }}
                className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-blue-900 outline-none"
              >
                <option value="">— Selecciona tu grado —</option>
                <optgroup label="Preescolar y Primaria">
                  {['transicion','1','2','3','4','5'].map(g => (
                    <option key={g} value={g}>{GRADE_NAMES[g]}</option>
                  ))}
                </optgroup>
                <optgroup label="Bachillerato">
                  {['6','7','8','9','10','11'].map(g => (
                    <option key={g} value={g}>{GRADE_NAMES[g]}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Grados bajos: selector de nombre */}
            {isLowLogin && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-blue-900 mb-2">Selecciona tu nombre</label>
                <select
                  value={studentName}
                  onChange={e => { setStudentName(e.target.value); setLoginError('') }}
                  className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-blue-900 outline-none"
                >
                  <option value="">— Elige tu nombre —</option>
                  {students.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {loginError && <p className="text-red-500 text-sm mt-2">{loginError}</p>}
                <button
                  onClick={handleConfirmName}
                  className="mt-4 w-full bg-blue-900 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-800"
                >
                  Continuar
                </button>
              </div>
            )}

            {/* Grados altos: email */}
            {grade && !isLowLogin && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-blue-900 mb-2">Correo institucional</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setLoginError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  placeholder="tunombre@colegiolondres.edu.co"
                  className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-blue-900 outline-none"
                />
                {loginError && <p className="text-red-500 text-sm mt-2">{loginError}</p>}
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="mt-4 w-full bg-blue-900 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50"
                >
                  {verifying ? 'Verificando...' : 'Verificar acceso'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // =====================================================================
  // PANTALLA: ÉXITO
  // =====================================================================
  if (screen === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-blue-900 mb-2">¡Autoevaluación enviada!</h2>
        <p className="text-gray-500 text-sm">
          Gracias, <strong>{currentName}</strong>. Tu autoevaluación de {GRADE_NAMES[gradeNorm] || currentGrade} — {config?.periodo}° Periodo {config?.anio} ha sido registrada.
        </p>
        <button
          onClick={() => { setScreen('login'); setGrade(''); setEmail(''); setStudentName('') }}
          className="mt-6 bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )

  // =====================================================================
  // PANTALLA: FORMULARIO
  // =====================================================================
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold">Colegio Londres</h1>
          <p className="text-sm text-blue-200">Autoevaluación — {currentName} · {GRADE_NAMES[gradeNorm] || currentGrade}</p>
        </div>
        <button
          onClick={() => setScreen('login')}
          className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
        >
          Salir
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Sin formulario (Transición y 1°) */}
        {formType === 'none' && (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <div className="text-4xl mb-4">👩‍🏫</div>
            <h3 className="font-bold text-blue-900 mb-2">Tu autoevaluación la realiza tu docente</h3>
            <p className="text-gray-500 text-sm">Para Transición y 1°, el proceso se realiza de manera presencial.</p>
          </div>
        )}

        {/* Formulario Global (2° y 3°) */}
        {formType === 'global' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-bold text-blue-900 text-lg mb-4">Autoevaluación — {GRADE_NAMES[gradeNorm]}</h2>
            <p className="text-sm text-gray-500 mb-6 bg-blue-50 p-3 rounded-lg">
              Responde de acuerdo a tu proceso y compromiso durante este periodo. Las notas deben estar entre 1 y 5.
            </p>

            {[
              { id: 'participacion', label: 'Mi participación en las clases puede ser valorada en:' },
              { id: 'puntualidad',   label: 'La puntualidad para asistir y permanecer en las clases puede ser valorada en:' },
              { id: 'cumplimiento',  label: 'Mi cumplimiento con las actividades, tareas y trabajos puede ser valorado en:' },
              { id: 'autonomia',     label: 'Mi autonomía para realizar las actividades propuestas puede ser valorada en:' },
              { id: 'atencion',      label: 'Mi atención, esfuerzo y respeto al docente puede ser valorado en:' }
            ].map(crit => (
              <div key={crit.id} className="mb-5">
                <label className="block text-sm font-semibold text-blue-900 mb-2">{crit.label}</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setGlobalValues(prev => ({ ...prev, [crit.id]: n }))}
                      className={`w-11 h-11 rounded-full border-2 font-bold text-sm transition-all ${
                        globalValues[crit.id] === n
                          ? 'bg-blue-900 border-blue-900 text-white'
                          : 'border-blue-900 text-blue-900 hover:bg-blue-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="mb-4">
              <p className="text-sm font-semibold text-blue-900 mb-1">Nota final (promedio automático):</p>
              <div className="text-3xl font-black text-blue-900">
                {calcAvg(['participacion','puntualidad','cumplimiento','autonomia'].map(k => globalValues[k]))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-blue-900 mb-2">Reflexión y justificación de la nota:</label>
              <textarea
                value={globalReflexion}
                onChange={e => setGlobalReflexion(e.target.value)}
                rows={3}
                className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-blue-900 outline-none"
                placeholder="Escribe aquí..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-blue-900 mb-2">Mi compromiso para el próximo período es:</label>
              <textarea
                value={globalCompromiso}
                onChange={e => setGlobalCompromiso(e.target.value)}
                rows={3}
                className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-blue-900 outline-none"
                placeholder="Escribe aquí..."
              />
            </div>

            <button
              onClick={submitGlobal}
              disabled={submitting || Object.values(globalValues).some(v => v === null) || !globalReflexion || !globalCompromiso}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-green-700"
            >
              {submitting ? 'Enviando...' : '✅ Enviar autoevaluación'}
            </button>
          </div>
        )}

        {/* Formulario Bachillerato (4° a 11°) */}
        {formType === 'bachillerato' && materias.length > 0 && (
          <div>
            {/* Sidebar de progreso */}
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                {Object.values(bachSubmitted).filter(Boolean).length} / {materias.length} materias enviadas
              </p>
              <div className="flex flex-wrap gap-2">
                {materias.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setCurrentMateriaIdx(i)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                      bachSubmitted[m]
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : i === currentMateriaIdx
                        ? 'bg-blue-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {bachSubmitted[m] ? '✓ ' : ''}{m}
                  </button>
                ))}
              </div>
            </div>

            {/* Materia actual */}
            {(() => {
              const materia = materias[currentMateriaIdx]
              const values  = bachValues[materia] || {}
              const avg     = calcAvg(CRITERIOS.map(c => values[c.id] ?? null))
              const allFilled = CRITERIOS.every(c => values[c.id] !== null)
              const hasReflexion = !!(bachReflexion[materia] || '').trim()

              return (
                <div className="bg-white rounded-2xl shadow p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="bg-blue-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {currentMateriaIdx + 1} / {materias.length}
                    </span>
                    <h2 className="font-bold text-blue-900 text-lg">{materia}</h2>
                  </div>

                  <p className="text-sm text-gray-500 mb-6 bg-blue-50 p-3 rounded-lg">
                    Valora cada criterio del <strong>1 al 5</strong>. El promedio se calcula automáticamente.
                  </p>

                  {CRITERIOS.map((crit, ci) => (
                    <div key={crit.id} className="mb-5">
                      <label className="block text-sm font-semibold text-blue-900 mb-2">
                        {ci + 1}. {crit.label}
                      </label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(n => (
                          <button
                            key={n}
                            disabled={bachSubmitted[materia]}
                            onClick={() => setBachValues(prev => ({
                              ...prev,
                              [materia]: { ...prev[materia], [crit.id]: n }
                            }))}
                            className={`w-11 h-11 rounded-full border-2 font-bold text-sm transition-all ${
                              values[crit.id] === n
                                ? 'bg-blue-900 border-blue-900 text-white'
                                : 'border-blue-900 text-blue-900 hover:bg-blue-50 disabled:opacity-40'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm font-semibold text-blue-900">Nota final automática:</p>
                    <p className="text-4xl font-black text-blue-900">{avg}</p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Justifica la nota y escribe tu compromiso de mejoramiento:
                    </label>
                    <textarea
                      value={bachReflexion[materia] || ''}
                      onChange={e => setBachReflexion(prev => ({ ...prev, [materia]: e.target.value }))}
                      disabled={bachSubmitted[materia]}
                      rows={3}
                      className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-blue-900 outline-none disabled:bg-gray-50"
                      placeholder="Escribe aquí..."
                    />
                  </div>

                  {bachSubmitted[materia] ? (
                    <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-center text-green-700 font-semibold text-sm">
                      ✅ {materia} — guardada correctamente
                    </div>
                  ) : (
                    <button
                      onClick={() => submitMateria(currentMateriaIdx)}
                      disabled={submitting || !allFilled || !hasReflexion}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-green-700"
                    >
                      {submitting ? 'Enviando...' : `✅ Enviar ${materia}`}
                    </button>
                  )}

                  {/* Navegación */}
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => setCurrentMateriaIdx(i => Math.max(0, i - 1))}
                      disabled={currentMateriaIdx === 0}
                      className="text-sm bg-gray-100 px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-gray-200"
                    >
                      ← Anterior
                    </button>
                    {currentMateriaIdx < materias.length - 1 ? (
                      <button
                        onClick={() => setCurrentMateriaIdx(i => i + 1)}
                        className="text-sm bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
                      >
                        Siguiente →
                      </button>
                    ) : (
                      <button
                        onClick={() => setScreen('success')}
                        disabled={Object.values(bachSubmitted).filter(Boolean).length === 0}
                        className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-green-700"
                      >
                        Finalizar ✓
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}