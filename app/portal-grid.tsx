"use client";

import { useState, type ReactNode } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import styles from "./page.module.css";

export type Sistema = {
  nombre: string;
  descripcion: string;
  url: string;
  icono: ReactNode;
};

export type Categoria = {
  id: string;
  etiqueta: string;
  sistemas: Sistema[];
};

export default function PortalGrid({ categorias }: { categorias: Categoria[] }) {
  const [activo, setActivo] = useState<string>("todos");

  const sistemas = categorias.flatMap((categoria) =>
    categoria.sistemas.map((sistema) => ({ ...sistema, categoriaId: categoria.id, categoriaEtiqueta: categoria.etiqueta }))
  );

  const visibles = activo === "todos" ? sistemas : sistemas.filter((s) => s.categoriaId === activo);

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Filtrar por categoría">
        <button
          type="button"
          role="tab"
          aria-selected={activo === "todos"}
          className={activo === "todos" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          onClick={() => setActivo("todos")}
        >
          Todos ({sistemas.length})
        </button>
        {categorias.map((categoria) => (
          <button
            key={categoria.id}
            type="button"
            role="tab"
            aria-selected={activo === categoria.id}
            className={activo === categoria.id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setActivo(categoria.id)}
          >
            {categoria.etiqueta} ({categoria.sistemas.length})
          </button>
        ))}
      </div>

      <section className={styles.gridWrap} aria-label="Sistemas institucionales">
        <div className={styles.grid}>
          {visibles.map((sistema) => (
            <a
              key={sistema.nombre}
              href={sistema.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.card}
            >
              <div className={styles.cardTop}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {sistema.icono}
                </span>
                <span className={styles.cardTag}>{sistema.categoriaEtiqueta}</span>
              </div>
              <h3 className={styles.cardName}>{sistema.nombre}</h3>
              <p className={styles.cardDesc}>{sistema.descripcion}</p>
              <span className={styles.cardFoot}>
                Abrir
                <ArrowUpRight size={16} weight="bold" className={styles.cardFootIcon} aria-hidden="true" />
                <span className={styles.visuallyHidden}> (se abre en una pestaña nueva)</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
