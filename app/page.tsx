const sistemas = [
  {
    id: 1,
    nombre: "Autoevaluación Institucional",
    descripcion: "Autoevaluación estudiantil por periodo académico, grados Transición a 11°",
    icono: "✍️",
    color: "from-blue-500 to-blue-700",
    url: "/autoevaluacion",
    activo: true,
  },
  {
    id: 2,
    nombre: "Control de Asistencia",
    descripcion: "Seguimiento diario de asistencia por curso y docente",
    icono: "📋",
    color: "from-green-500 to-green-700",
    url: "/sistemas/asistencia",
    activo: false,
  },
  {
    id: 3,
    nombre: "Gestión Docente",
    descripcion: "Horarios, novedades y cambios de clases",
    icono: "👩‍🏫",
    color: "from-purple-500 to-purple-700",
    url: "/sistemas/docentes",
    activo: false,
  },
  {
    id: 4,
    nombre: "Comunicados",
    descripcion: "Circulares y comunicados internos del colegio",
    icono: "📢",
    color: "from-amber-500 to-amber-700",
    url: "/sistemas/comunicados",
    activo: false,
  },
  {
    id: 5,
    nombre: "Biblioteca",
    descripcion: "Préstamo y devolución de libros y recursos",
    icono: "📚",
    color: "from-red-500 to-red-700",
    url: "/sistemas/biblioteca",
    activo: false,
  },
  {
    id: 6,
    nombre: "Soporte TI",
    descripcion: "Solicitudes y seguimiento de soporte técnico",
    icono: "💻",
    color: "from-slate-500 to-slate-700",
    url: "/sistemas/soporte",
    activo: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
            CL
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-900">Colegio Londres</h1>
            <p className="text-sm text-gray-500">Portal de Sistemas Institucionales</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-blue-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">Bienvenido al Portal</h2>
          <p className="text-blue-200 text-lg">
            Selecciona el sistema que deseas utilizar
          </p>
        </div>
      </section>

      {/* Tarjetas */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sistemas.map((sistema) => (
            <div
              key={sistema.id}
              className={`relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 ${
                sistema.activo
                  ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              }`}
            >
              {/* Banda de color superior */}
              <div className={`h-2 w-full bg-gradient-to-r ${sistema.color}`} />

              <div className="p-6">
                <div className="text-4xl mb-4">{sistema.icono}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {sistema.nombre}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{sistema.descripcion}</p>

                {sistema.activo ? (
                  <a href={sistema.url} className={`inline-block bg-gradient-to-r ${sistema.color} text-white text-sm font-medium px-4 py-2 rounded-lg`}>
                    Abrir sistema →
                  </a>
                ) : (
                  <span className="inline-block bg-gray-100 text-gray-400 text-sm px-4 py-2 rounded-lg">
                    Próximamente
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 py-8">
        © {new Date().getFullYear()} Colegio Londres — Todos los derechos reservados
      </footer>
    </main>
  );
}