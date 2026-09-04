import styles from "./page.module.css";

type Sistema = {
  nombre: string;
  descripcion: string;
  url: string;
};

type Categoria = {
  id: string;
  etiqueta: string;
  abreviatura: string;
  descripcion: string;
  sistemas: Sistema[];
};

const categorias: Categoria[] = [
  {
    id: "academico",
    etiqueta: "Académico",
    abreviatura: "AC",
    descripcion: "Autoevaluación, asistencia y formación estudiantil.",
    sistemas: [
      {
        nombre: "Autoevaluación Institucional",
        descripcion: "Autoevaluación estudiantil por periodo académico, grados Transición a 11°.",
        url: "https://autoevaluacion-web.vercel.app",
      },
      {
        nombre: "Asistencia Escolar",
        descripcion: "Registro y seguimiento diario de asistencia por curso.",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbzzdbP75kHTYGJllwNIxvmVyyxtB8XCtVj5gC2CPqLci4um5G3ykj7Pvw9MOr5_jAcOlA/exec",
      },
      {
        nombre: "¿Quién Sabe Más?",
        descripcion: "Olimpiadas matemáticas — competencia interna de conocimiento.",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbxxpGk0fpVAfo-nI4gDPOjixKkcsNamGkuGDJiDbzErkJbo0GyP3F5on_W849ZxMA0q/exec",
      },
      {
        nombre: "UniversiLondres",
        descripcion: "Proceso de matrícula universitaria simulada.",
        url: "https://universilondres-matricula.vercel.app",
      },
    ],
  },
  {
    id: "gestion",
    etiqueta: "Gestión Institucional",
    abreviatura: "GI",
    descripcion: "Herramientas administrativas y operativas del colegio.",
    sistemas: [
      {
        nombre: "PIGA",
        descripcion: "Plan Institucional de Gestión Ambiental — materiales, espacios e inventarios.",
        url: "https://piga-colegio-londres.vercel.app",
      },
      {
        nombre: "Reserva de Reuniones",
        descripcion: "Agendamiento de espacios y horarios para reuniones.",
        url: "https://horarios-reunion.vercel.app",
      },
      {
        nombre: "Dictador Automático",
        descripcion: "Selector aleatorio para decisiones y turnos institucionales.",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbxbDQNVItJU8C9Z1sMf1FmehLS3JV6v9CnU71GYPwwxeoZIpqWi-KWj7vG8Or8aEWsG/exec",
      },
    ],
  },
  {
    id: "bienestar",
    etiqueta: "Bienestar y Comunidad",
    abreviatura: "BC",
    descripcion: "Participación, ahorro y actividades de la comunidad educativa.",
    sistemas: [
      {
        nombre: "Sistema de Votación",
        descripcion: "Elecciones institucionales — personero, contralor y representantes.",
        url: "https://elecciones-web.vercel.app",
      },
      {
        nombre: "Ahorro & Bienestar",
        descripcion: "Programa de ahorro estudiantil y bienestar institucional.",
        url: "https://script.google.com/macros/s/AKfycbxqjtY3Ai36w-li_8AUrInRIUEpL1GsuTVrzlFp_U11-H2Tsd4E1JhQdv5NgHNP9eJV/exec",
      },
      {
        nombre: "Ahorros Décimo",
        descripcion: "Control de ahorro para el grado décimo.",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbwdx_fm4YYdjafjX39YSr5ia8jwzhDYBRlL5M1XuhNJgdx03ey7zT41ilo3IQR9XSX6MQ/exec",
      },
      {
        nombre: "Polla Mundialista",
        descripcion: "Pronósticos y competencia deportiva de la comunidad.",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbz81Q8w77cZp5lERlqcB3ncogAp3b-QU0UpzhpIKEe8Qz0fD8uRGIpE2eDaDCR-3woKhw/exec",
      },
      {
        nombre: "¿Quién Quiere Ser Millonario?",
        descripcion: "Trivia institucional por rondas de conocimiento.",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycby5mHK0bxckjKB7REPLeeefEgUEIoyX5U5G_bbcB2w7jTYx4D9PGxH7FG0PG4JTvsOg/exec",
      },
    ],
  },
];

let contador = 0;
const numerosPorCategoria = new Map(
  categorias.map((categoria) => [
    categoria.id,
    categoria.sistemas.map(() => String(++contador).padStart(2, "0")),
  ])
);

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink}>
        Saltar al contenido
      </a>

      <nav className={styles.rail} aria-label="Categorías">
        <a href="#main" className={styles.railMark}>
          CL
        </a>
        <ul className={styles.railDots}>
          {categorias.map((categoria) => (
            <li key={categoria.id}>
              <a href={`#${categoria.id}`} className={styles.railDot}>
                {categoria.abreviatura}
              </a>
            </li>
          ))}
        </ul>
        <span aria-hidden="true" />
      </nav>

      <main id="main" className={styles.main}>
        <details className={styles.mobileNav}>
          <summary className={styles.mobileNavSummary}>Ir a una categoría</summary>
          <ul className={styles.mobileNavList}>
            {categorias.map((categoria) => (
              <li key={categoria.id}>
                <a href={`#${categoria.id}`}>{categoria.etiqueta}</a>
              </li>
            ))}
          </ul>
        </details>

        <header className={styles.intro}>
          <p className={styles.wordmark}>Colegio Londres</p>
          <p className={styles.dateline}>Portal de sistemas · Año {year}</p>
          <p className={styles.introText}>
            Doce sistemas en uso diario, agrupados por función. Encuentra el tuyo y ábrelo.
          </p>
        </header>

        {categorias.map((categoria) => (
          <section key={categoria.id} id={categoria.id} className={styles.section}>
            <h2 className={styles.sectionLabel}>{categoria.etiqueta}</h2>
            <p className={styles.sectionDesc}>{categoria.descripcion}</p>

            <ul className={styles.list}>
              {categoria.sistemas.map((sistema, i) => (
                <li key={sistema.nombre}>
                  <a
                    href={sistema.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.row}
                  >
                    <span className={styles.rowIndex} aria-hidden="true">
                      {numerosPorCategoria.get(categoria.id)?.[i]}
                    </span>
                    <span className={styles.rowBody}>
                      <span className={styles.rowName}>{sistema.nombre}</span>
                      <span className={styles.rowDesc}>{sistema.descripcion}</span>
                    </span>
                    <span className={styles.rowArrow} aria-hidden="true">
                      ↗
                    </span>
                    <span className={styles.visuallyHidden}> (se abre en una pestaña nueva)</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <footer className={styles.footer}>
          <p className={styles.footerText}>
            Portal de Sistemas — Colegio Londres. Bogotá, Colombia. Acceso institucional:{" "}
            <a href="/teacher">Portal Docentes</a> · <a href="/admin">Panel Administrador</a>.
            © {year} Colegio Londres.
          </p>
        </footer>
      </main>
    </div>
  );
}
