// Piezas de presentación del Reporte de Planta.
// Los gráficos son SVG/CSS puro para no sumar una dependencia de charting.

import React from "react";

type Tono = "neutro" | "bien" | "medio" | "mal";

const TONO_NUM: Record<Tono, string> = {
  neutro: "text-blue-800",
  bien: "text-emerald-700",
  medio: "text-amber-600",
  mal: "text-red-600",
};

export const Kpi: React.FC<{
  valor: React.ReactNode;
  label: string;
  tono?: Tono;
  ayuda?: string;
}> = ({ valor, label, tono = "neutro", ayuda }) => (
  <div
    className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm"
    title={ayuda}>
    <div className={`text-3xl font-bold leading-none ${TONO_NUM[tono]}`}>
      {valor}
    </div>
    <div className="mt-1.5 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
      {label}
    </div>
  </div>
);

export const Card: React.FC<{
  titulo: string;
  subtitulo?: string;
  acciones?: React.ReactNode;
  children: React.ReactNode;
}> = ({ titulo, subtitulo, acciones, children }) => (
  <section className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
    <header className="flex items-start justify-between gap-3 px-4 pt-3 pb-2 border-b border-gray-100">
      <div>
        <h3 className="text-sm font-semibold text-blue-900">{titulo}</h3>
        {subtitulo && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitulo}</p>
        )}
      </div>
      {acciones}
    </header>
    <div className="p-4 overflow-x-auto">{children}</div>
  </section>
);

/** Barras horizontales. Útil cuando las etiquetas son texto largo. */
export const BarrasH: React.FC<{
  datos: { label: string; valor: number; tono?: Tono }[];
  sufijo?: string;
  vacio?: string;
}> = ({ datos, sufijo = "", vacio = "Sin datos." }) => {
  if (!datos.length)
    return <p className="text-sm text-gray-400 italic">{vacio}</p>;
  const max = Math.max(...datos.map((d) => d.valor), 1);
  const COLOR: Record<Tono, string> = {
    neutro: "bg-blue-500",
    bien: "bg-emerald-500",
    medio: "bg-amber-500",
    mal: "bg-red-500",
  };
  return (
    <div className="space-y-1.5">
      {datos.map((d) => (
        <div key={d.label} className="flex items-center gap-2 text-xs">
          <span
            className="w-52 shrink-0 truncate text-gray-700"
            title={d.label}>
            {d.label}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-4 min-w-[40px]">
            <div
              className={`${COLOR[d.tono ?? "neutro"]} h-4 rounded-full transition-all`}
              style={{ width: `${Math.max((d.valor / max) * 100, d.valor > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right font-semibold text-gray-800 tabular-nums">
            {d.valor}
            {sufijo}
          </span>
        </div>
      ))}
    </div>
  );
};

/** Columnas verticales, para series temporales cortas. */
export const BarrasV: React.FC<{
  datos: { label: string; valor: number }[];
  vacio?: string;
}> = ({ datos, vacio = "Sin datos." }) => {
  if (!datos.length)
    return <p className="text-sm text-gray-400 italic">{vacio}</p>;
  const max = Math.max(...datos.map((d) => d.valor), 1);
  return (
    <div className="flex items-end gap-1.5 h-40 pt-4">
      {datos.map((d) => (
        <div
          key={d.label}
          className="flex-1 flex flex-col items-center justify-end h-full min-w-[24px]"
          title={`${d.label}: ${d.valor}`}>
          <span className="text-[10px] font-semibold text-gray-700 mb-0.5 tabular-nums">
            {d.valor || ""}
          </span>
          <div
            className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
            style={{ height: `${(d.valor / max) * 100}%`, minHeight: d.valor ? 2 : 0 }}
          />
          <span className="text-[9px] text-gray-500 mt-1 truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const BADGE: Record<string, string> = {
  vigente: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  licencia: "bg-sky-50 text-sky-700 ring-sky-200",
  cerrada: "bg-gray-100 text-gray-600 ring-gray-300",
  vencido: "bg-amber-50 text-amber-700 ring-amber-200",
  renuncia: "bg-red-50 text-red-700 ring-red-200",
  critico: "bg-red-50 text-red-700 ring-red-200",
  alto: "bg-orange-50 text-orange-700 ring-orange-200",
  medio: "bg-amber-50 text-amber-700 ring-amber-200",
  bajo: "bg-slate-100 text-slate-600 ring-slate-300",
  alta: "bg-red-50 text-red-700 ring-red-200",
  media: "bg-amber-50 text-amber-700 ring-amber-200",
  baja: "bg-slate-100 text-slate-600 ring-slate-300",
  tramite: "bg-violet-50 text-violet-700 ring-violet-200",
};

export const Badge: React.FC<{
  tipo: string;
  children?: React.ReactNode;
  titulo?: string;
}> = ({ tipo, children, titulo }) => (
  <span
    title={titulo}
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap ${
      BADGE[tipo] ?? BADGE.bajo
    }`}>
    {children ?? tipo}
  </span>
);

/** Tabla compacta. `cols` define encabezado y ancho; las filas las arma el caller. */
export const Tabla: React.FC<{
  cols: string[];
  children: React.ReactNode;
  vacio?: string;
  filas?: number;
}> = ({ cols, children, vacio = "Sin registros.", filas }) => {
  if (filas === 0)
    return <p className="text-sm text-gray-400 italic">{vacio}</p>;
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            {cols.map((c) => (
              <th
                key={c}
                className="text-left px-2 py-1.5 font-semibold text-gray-600 uppercase text-[10px] tracking-wide whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  );
};

export const Td: React.FC<{
  children?: React.ReactNode;
  className?: string;
  titulo?: string;
}> = ({ children, className = "", titulo }) => (
  <td className={`px-2 py-1.5 align-top ${className}`} title={titulo}>
    {children}
  </td>
);

// ---- formato -------------------------------------------------------------

/** Muestra una fecha como dd/mm/aaaa.
 *
 * Acepta las dos formas que devuelve la API: los endpoints REST usan el
 * DATE_FORMAT del proyecto (dd/mm/aaaa) y el reporte serializa objetos `date`
 * de Python, que salen en ISO. Lo que ya viene en dd/mm/aaaa se deja igual.
 */
export const fmtFecha = (f: string | null | undefined): string => {
  if (!f) return "—";
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(f);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : f;
};

export const fmtNum = (n: number | null | undefined, dec = 0): string =>
  n === null || n === undefined ? "—" : n.toFixed(dec);

/** "en 45 días" / "hace 3 días" / "hoy". */
export const fmtDias = (d: number | null): string => {
  if (d === null || d === undefined) return "—";
  if (d === 0) return "hoy";
  return d > 0 ? `en ${d} días` : `hace ${Math.abs(d)} días`;
};

/** Descarga las filas como CSV. Se usa en cada tablero. */
export function descargarCSV(
  nombre: string,
  cols: string[],
  filas: (string | number | null | undefined)[][]
) {
  const esc = (v: string | number | null | undefined) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols, ...filas].map((f) => f.map(esc).join(",")).join("\r\n");
  // BOM para que Excel abra bien los acentos.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombre}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const BotonCSV: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors whitespace-nowrap">
    ⬇ CSV
  </button>
);
