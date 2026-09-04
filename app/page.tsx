type Sistema = {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  url: string;
  activo: boolean;
  externo?: boolean;
};

type Categoria = {
  titulo: string;
  descripcion: string;
  sistemas: Sistema[];
};

const categorias: Categoria[] = [
  {
    titulo: "Académico",
    descripcion: "Autoevaluación, asistencia y formación estudiantil",
    sistemas: [
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
        nombre: "Asistencia Escolar",
        descripcion: "Registro y seguimiento diario de asistencia por curso",
        icono: "📋",
        color: "from-green-500 to-green-700",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbzzdbP75kHTYGJllwNIxvmVyyxtB8XCtVj5gC2CPqLci4um5G3ykj7Pvw9MOr5_jAcOlA/exec",
        activo: true,
        externo: true,
      },
      {
        id: 3,
        nombre: "¿Quién Sabe Más?",
        descripcion: "Olimpiadas matemáticas — competencia interna de conocimiento",
        icono: "🧮",
        color: "from-indigo-500 to-indigo-700",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbxxpGk0fpVAfo-nI4gDPOjixKkcsNamGkuGDJiDbzErkJbo0GyP3F5on_W849ZxMA0q/exec",
        activo: true,
        externo: true,
      },
      {
        id: 4,
        nombre: "UniversiLondres",
        descripcion: "Proceso de matrícula universitaria simulada",
        icono: "🏫",
        color: "from-cyan-500 to-cyan-700",
        url: "https://universilondres-matricula.vercel.app",
        activo: true,
        externo: true,
      },
    ],
  },
  {
    titulo: "Gestión Institucional",
    descripcion: "Herramientas administrativas y operativas del colegio",
    sistemas: [
      {
        id: 5,
        nombre: "PIGA",
        descripcion: "Plan Institucional de Gestión Ambiental — materiales, espacios e inventarios",
        icono: "🌱",
        color: "from-emerald-500 to-emerald-700",
        url: "https://piga-colegio-londres.vercel.app",
        activo: true,
        externo: true,
      },
      {
        id: 6,
        nombre: "Reserva de Reuniones",
        descripcion: "Agendamiento de espacios y horarios para reuniones",
        icono: "📅",
        color: "from-orange-500 to-orange-700",
        url: "https://horarios-reunion.vercel.app",
        activo: true,
        externo: true,
      },
      {
        id: 7,
        nombre: "Dictador Automático",
        descripcion: "Selector aleatorio para decisiones y turnos institucionales",
        icono: "🎲",
        color: "from-slate-500 to-slate-700",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbxbDQNVItJU8C9Z1sMf1FmehLS3JV6v9CnU71GYPwwxeoZIpqWi-KWj7vG8Or8aEWsG/exec",
        activo: true,
        externo: true,
      },
    ],
  },
  {
    titulo: "Bienestar y Comunidad",
    descripcion: "Participación, ahorro y actividades de la comunidad educativa",
    sistemas: [
      {
        id: 8,
        nombre: "Sistema de Votación",
        descripcion: "Elecciones institucionales — personero, contralor y representantes",
        icono: "🗳️",
        color: "from-purple-500 to-purple-700",
        url: "https://elecciones-web.vercel.app",
        activo: true,
        externo: true,
      },
      {
        id: 9,
        nombre: "Ahorro & Bienestar",
        descripcion: "Programa de ahorro estudiantil y bienestar institucional",
        icono: "💰",
        color: "from-amber-500 to-amber-700",
        url: "https://script.google.com/macros/s/AKfycbxqjtY3Ai36w-li_8AUrInRIUEpL1GsuTVrzlFp_U11-H2Tsd4E1JhQdv5NgHNP9eJV/exec",
        activo: true,
        externo: true,
      },
      {
        id: 10,
        nombre: "Ahorros Décimo",
        descripcion: "Control de ahorro para el grado décimo",
        icono: "🎓",
        color: "from-yellow-500 to-yellow-700",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbwdx_fm4YYdjafjX39YSr5ia8jwzhDYBRlL5M1XuhNJgdx03ey7zT41ilo3IQR9XSX6MQ/exec",
        activo: true,
        externo: true,
      },
      {
        id: 11,
        nombre: "Polla Mundialista",
        descripcion: "Pronósticos y competencia deportiva de la comunidad",
        icono: "⚽",
        color: "from-lime-500 to-lime-700",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbz81Q8w77cZp5lERlqcB3ncogAp3b-QU0UpzhpIKEe8Qz0fD8uRGIpE2eDaDCR-3woKhw/exec",
        activo: true,
        externo: true,
      },
      {
        id: 12,
        nombre: "¿Quién Quiere Ser Millonario?",
        descripcion: "Trivia institucional por rondas de conocimiento",
        icono: "💵",
        color: "from-red-500 to-red-700",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycby5mHK0bxckjKB7REPLeeefEgUEIoyX5U5G_bbcB2w7jTYx4D9PGxH7FG0PG4JTvsOg/exec",
        activo: true,
        externo: true,
      },
    ],
  },
];

function SistemaCard({ sistema }: { sistema: Sistema }) {
  return (
    <div
      className={`relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 ${
        sistema.activo
          ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer"
          : "opacity-60 cursor-not-allowed"
      }`}
    >
      <div className={`h-2 w-full bg-gradient-to-r ${sistema.color}`} />

      <div className="p-6">
        <div className="text-4xl mb-4">{sistema.icono}</div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{sistema.nombre}</h3>
        <p className="text-sm text-gray-500 mb-4">{sistema.descripcion}</p>

        {sistema.activo ? (
          <a
            href={sistema.url}
            target={sistema.externo ? "_blank" : undefined}
            rel={sistema.externo ? "noopener noreferrer" : undefined}
            className={`inline-block bg-gradient-to-r ${sistema.color} text-white text-sm font-medium px-4 py-2 rounded-lg`}
          >
            Abrir sistema →
          </a>
        ) : (
          <span className="inline-block bg-gray-100 text-gray-400 text-sm px-4 py-2 rounded-lg">
            Próximamente
          </span>
        )}
      </div>
    </div>
  );
}

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

      {/* Categorías de sistemas */}
      <section className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {categorias.map((categoria) => (
          <div key={categoria.titulo}>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-blue-900">{categoria.titulo}</h2>
              <p className="text-sm text-gray-500">{categoria.descripcion}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoria.sistemas.map((sistema) => (
                <SistemaCard key={sistema.id} sistema={sistema} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Acceso Institucional */}
      <section className="max-w-6xl mx-auto px-6 pb-6">
        <div className="border-t border-gray-200 pt-6 flex flex-wrap justify-center gap-6">
          <a href="/teacher"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 transition font-medium">
            <span className="text-lg">👩‍🏫</span> Portal Docentes
          </a>
          <a href="/admin"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 transition font-medium">
            <span className="text-lg">⚙️</span> Panel Administrador
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 py-8">
        © {new Date().getFullYear()} Colegio Londres — Todos los derechos reservados
      </footer>
    </main>
  );
}
