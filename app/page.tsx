import {
  NotePencil,
  ClipboardText,
  Question,
  GraduationCap,
  Leaf,
  CalendarCheck,
  Shuffle,
  CheckSquare,
  PiggyBank,
  Wallet,
  SoccerBall,
  Crown,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import styles from "./page.module.css";
import PortalGrid, { type Categoria } from "./portal-grid";

const categorias: Categoria[] = [
  {
    id: "academico",
    etiqueta: "Académico",
    sistemas: [
      {
        nombre: "Autoevaluación Institucional",
        descripcion: "Autoevaluación estudiantil por periodo académico, grados Transición a 11°.",
        url: "https://autoevaluacion-web.vercel.app",
        icono: <NotePencil size={22} weight="regular" />,
      },
      {
        nombre: "Asistencia Escolar",
        descripcion: "Registro y seguimiento diario de asistencia por curso.",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbzzdbP75kHTYGJllwNIxvmVyyxtB8XCtVj5gC2CPqLci4um5G3ykj7Pvw9MOr5_jAcOlA/exec",
        icono: <ClipboardText size={22} weight="regular" />,
      },
      {
        nombre: "¿Quién Sabe Más?",
        descripcion: "Olimpiadas matemáticas — competencia interna de conocimiento.",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbxxpGk0fpVAfo-nI4gDPOjixKkcsNamGkuGDJiDbzErkJbo0GyP3F5on_W849ZxMA0q/exec",
        icono: <Question size={22} weight="regular" />,
      },
      {
        nombre: "UniversiLondres",
        descripcion: "Proceso de matrícula universitaria simulada.",
        url: "https://universilondres-matricula.vercel.app",
        icono: <GraduationCap size={22} weight="regular" />,
      },
    ],
  },
  {
    id: "gestion",
    etiqueta: "Gestión Institucional",
    sistemas: [
      {
        nombre: "PIGA",
        descripcion: "Plan Institucional de Gestión Ambiental — materiales, espacios e inventarios.",
        url: "https://piga-colegio-londres.vercel.app",
        icono: <Leaf size={22} weight="regular" />,
      },
      {
        nombre: "Reserva de Reuniones",
        descripcion: "Agendamiento de espacios y horarios para reuniones.",
        url: "https://horarios-reunion.vercel.app",
        icono: <CalendarCheck size={22} weight="regular" />,
      },
      {
        nombre: "Dictador Automático",
        descripcion: "Selector aleatorio para decisiones y turnos institucionales.",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbxbDQNVItJU8C9Z1sMf1FmehLS3JV6v9CnU71GYPwwxeoZIpqWi-KWj7vG8Or8aEWsG/exec",
        icono: <Shuffle size={22} weight="regular" />,
      },
    ],
  },
  {
    id: "bienestar",
    etiqueta: "Bienestar y Comunidad",
    sistemas: [
      {
        nombre: "Sistema de Votación",
        descripcion: "Elecciones institucionales — personero, contralor y representantes.",
        url: "https://elecciones-web.vercel.app",
        icono: <CheckSquare size={22} weight="regular" />,
      },
      {
        nombre: "Ahorro & Bienestar",
        descripcion: "Programa de ahorro estudiantil y bienestar institucional.",
        url: "https://script.google.com/macros/s/AKfycbxqjtY3Ai36w-li_8AUrInRIUEpL1GsuTVrzlFp_U11-H2Tsd4E1JhQdv5NgHNP9eJV/exec",
        icono: <PiggyBank size={22} weight="regular" />,
      },
      {
        nombre: "Ahorros Décimo",
        descripcion: "Control de ahorro para el grado décimo.",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbwdx_fm4YYdjafjX39YSr5ia8jwzhDYBRlL5M1XuhNJgdx03ey7zT41ilo3IQR9XSX6MQ/exec",
        icono: <Wallet size={22} weight="regular" />,
      },
      {
        nombre: "Polla Mundialista",
        descripcion: "Pronósticos y competencia deportiva de la comunidad.",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycbz81Q8w77cZp5lERlqcB3ncogAp3b-QU0UpzhpIKEe8Qz0fD8uRGIpE2eDaDCR-3woKhw/exec",
        icono: <SoccerBall size={22} weight="regular" />,
      },
      {
        nombre: "¿Quién Quiere Ser Millonario?",
        descripcion: "Trivia institucional por rondas de conocimiento.",
        url: "https://script.google.com/a/macros/colegiolondres.edu.co/s/AKfycby5mHK0bxckjKB7REPLeeefEgUEIoyX5U5G_bbcB2w7jTYx4D9PGxH7FG0PG4JTvsOg/exec",
        icono: <Crown size={22} weight="regular" />,
      },
    ],
  },
];

const total = categorias.reduce((n, c) => n + c.sistemas.length, 0);

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink}>
        Saltar al contenido
      </a>

      <header className={styles.header}>
        <div className={styles.wordmarkGroup}>
          <Image
            src="/logo-colegio-londres.png"
            alt="Colegio Londres"
            width={826}
            height={392}
            priority
            className={styles.logo}
          />
          <div className={styles.wordmarkText}>
            <p className={styles.wordmark}>Portal de Sistemas</p>
            <p className={styles.subhead}>{total} herramientas institucionales en un solo lugar.</p>
          </div>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.headerCount}>{total} sistemas activos</span>
          <span className={styles.headerYear}>Año {year}</span>
        </div>
      </header>

      <main id="main">
        <PortalGrid categorias={categorias} />
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          © {year} Colegio Londres. Bogotá, Colombia.
        </p>
        <nav className={styles.footerLinks} aria-label="Acceso institucional">
          <a href="/teacher">Portal Docentes</a>
          <a href="/admin">Panel Administrador</a>
        </nav>
      </footer>
    </div>
  );
}
