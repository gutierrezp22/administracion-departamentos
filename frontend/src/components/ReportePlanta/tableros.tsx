// Un componente por tablero del Reporte de Planta.
// Todos reciben el payload completo y se quedan con lo que necesitan.

import React, { useMemo, useState } from "react";
import {
  Badge,
  BarrasH,
  BarrasV,
  BotonCSV,
  Card,
  Kpi,
  Tabla,
  Td,
  descargarCSV,
  fmtDias,
  fmtFecha,
  fmtNum,
} from "./ui";
import type { Ocupacion, ReportePlanta } from "./types";

type Props = { data: ReportePlanta };

// ---------------------------------------------------------------------------
// Resumen
// ---------------------------------------------------------------------------

export const TableroResumen: React.FC<Props> = ({ data }) => {
  const r = data.resumen;
  const d = data.distribucion;

  const celda = (rango: string, ded: string) => {
    const c = d.celdas[rango]?.[ded];
    const total = c ? c.vigente + c.vencido + c.renuncia : 0;
    if (!total)
      return (
        <Td className="text-center text-gray-300 bg-gray-50/50">—</Td>
      );
    return (
      <Td className="text-center">
        <div className="flex flex-col items-center gap-0.5">
          {!!c.vigente && (
            <span className="text-emerald-700 font-semibold">{c.vigente}</span>
          )}
          {!!c.vencido && (
            <span className="text-amber-600 font-semibold" title="Vencidos">
              {c.vencido} ⚠
            </span>
          )}
          {!!c.renuncia && (
            <span className="text-red-600 font-semibold" title="Renuncia definitiva">
              {c.renuncia} ●
            </span>
          )}
        </div>
      </Td>
    );
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <Kpi valor={r.docentes_activos} label="Docentes activos" tono="bien" />
        <Kpi valor={r.cargos_vigentes} label="Cargos vigentes" />
        <Kpi
          valor={r.cargos_vencidos}
          label="Cargos vencidos"
          tono={r.cargos_vencidos ? "mal" : "bien"}
        />
        <Kpi valor={r.horas_semanales} label="Horas semanales" />
        <Kpi
          valor={r.horas_promedio_por_docente}
          label="Horas prom. por docente"
        />
        <Kpi valor={r.puntaje_total} label="Puntaje total en planta" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <Kpi
          valor={r.docentes_en_riesgo_edad}
          label={`Docentes ≥ ${data.parametros.edad_critica} años`}
          tono={r.docentes_en_riesgo_edad ? "medio" : "bien"}
        />
        <Kpi valor={r.docentes_jubilados} label="Jubilados" tono="medio" />
        <Kpi
          valor={r.renuncias_definitivas}
          label="Renuncias definitivas"
          tono={r.renuncias_definitivas ? "mal" : "bien"}
        />
        <Kpi valor={r.cargos_en_licencia} label="Cargos en licencia" />
        <Kpi
          valor={r.designaciones_en_tramite}
          label="Designaciones en trámite"
          tono={r.designaciones_en_tramite ? "medio" : "bien"}
        />
        <Kpi
          valor={r.seguimientos_abiertos}
          label="Seguimientos abiertos"
          tono={r.seguimientos_abiertos ? "medio" : "bien"}
        />
      </div>

      <Card
        titulo="Distribución por rango × dedicación"
        subtitulo="Sólo cargos vigentes de docentes activos. Verde = en orden · Ámbar = vencido · Rojo = renuncia definitiva.">
        <Tabla
          cols={["Rango", ...d.dedicaciones.map((x) => x.label), "Total"]}>
          {d.rangos.map((rango, i) => (
            <tr key={rango.clave} className={i % 2 ? "" : "bg-blue-50/30"}>
              <Td className="font-semibold text-gray-800 border-r border-gray-200">
                {rango.label}
              </Td>
              {d.dedicaciones.map((ded) => (
                <React.Fragment key={ded.clave}>
                  {celda(rango.clave, ded.clave)}
                </React.Fragment>
              ))}
              <Td className="text-center font-bold border-l border-gray-200">
                {d.total_por_rango[rango.clave] || "—"}
              </Td>
            </tr>
          ))}
          <tr className="bg-blue-100/60 font-bold">
            <Td className="border-r border-gray-200">Total</Td>
            {d.dedicaciones.map((ded) => (
              <Td key={ded.clave} className="text-center">
                {d.total_por_dedicacion[ded.clave] || "—"}
              </Td>
            ))}
            <Td className="text-center border-l border-gray-200">{d.total}</Td>
          </tr>
        </Tabla>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card titulo="Cargos vigentes por rango">
          <BarrasH
            datos={d.rangos.map((x) => ({
              label: x.label,
              valor: d.total_por_rango[x.clave] || 0,
            }))}
          />
        </Card>
        <Card titulo="Cargos vigentes por dedicación">
          <BarrasH
            datos={d.dedicaciones.map((x) => ({
              label: x.label,
              valor: d.total_por_dedicacion[x.clave] || 0,
            }))}
          />
        </Card>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Vencimientos
// ---------------------------------------------------------------------------

const ETIQUETA_BUCKET: Record<string, string> = {
  vencidos: "Ya vencidos",
  vence_30: "Vencen en 30 días",
  vence_90: "Vencen en 90 días",
  vence_180: "Vencen en 180 días",
  vence_horizonte: "Vencen dentro del horizonte",
  sin_fecha: "Sin fecha de vencimiento",
};

const filaOcupacion = (o: Ocupacion) => (
  <tr key={o.id} className="hover:bg-blue-50/40">
    <Td className="font-medium text-gray-800">{o.docente}</Td>
    <Td className="tabular-nums text-gray-500">{o.codigo_cargo}</Td>
    <Td>{o.denominacion}</Td>
    <Td className="text-center tabular-nums">{o.horas_semanales}</Td>
    <Td className="whitespace-nowrap">
      {fmtFecha(o.fecha_vencimiento)}
      {o.vencimiento_estimado && (
        <span
          className="ml-1 text-amber-500"
          title="Fecha estimada a partir de la duración del tipo de trámite, no explícita">
          ≈
        </span>
      )}
    </Td>
    <Td className="whitespace-nowrap text-gray-500">
      {fmtDias(o.dias_para_vencer)}
    </Td>
    <Td className="text-gray-500" titulo={o.fuente_vencimiento ?? undefined}>
      {o.fuente_vencimiento ?? "—"}
    </Td>
    <Td>
      <div className="flex gap-1 flex-wrap">
        <Badge tipo={o.vencido ? "vencido" : o.estado}>
          {o.vencido ? "vencido" : o.estado}
        </Badge>
        {o.renovacion_en_tramite && (
          <Badge
            tipo="tramite"
            titulo={`${o.renovacion_en_tramite.tipo} desde ${fmtFecha(
              o.renovacion_en_tramite.fecha_desde
            )}`}>
            renovación en trámite
          </Badge>
        )}
      </div>
    </Td>
  </tr>
);

const COLS_OCUP = [
  "Docente",
  "Cód.",
  "Cargo",
  "Hs",
  "Vence",
  "Plazo",
  "Origen de la fecha",
  "Estado",
];

export const TableroVencimientos: React.FC<Props> = ({ data }) => {
  const v = data.vencimientos;
  const orden = [
    "vencidos",
    "vence_30",
    "vence_90",
    "vence_180",
    "vence_horizonte",
    "sin_fecha",
  ];

  const exportar = () => {
    const filas = orden.flatMap((k) =>
      (v.buckets[k] ?? []).map((o) => [
        ETIQUETA_BUCKET[k],
        o.docente,
        o.codigo_cargo,
        o.denominacion,
        o.horas_semanales,
        o.fecha_vencimiento,
        o.dias_para_vencer,
        o.fuente_vencimiento,
        o.vencimiento_estimado ? "estimada" : "explícita",
      ])
    );
    descargarCSV(
      "vencimientos",
      ["Grupo", "Docente", "Código", "Cargo", "Horas", "Vence", "Días", "Origen", "Fecha"],
      filas
    );
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <Kpi
          valor={v.conteos.vencidos}
          label="Ya vencidos"
          tono={v.conteos.vencidos ? "mal" : "bien"}
        />
        <Kpi
          valor={v.conteos.vence_30}
          label="Vencen en 30 días"
          tono={v.conteos.vence_30 ? "mal" : "bien"}
        />
        <Kpi
          valor={v.conteos.vence_90}
          label="Vencen en 90 días"
          tono={v.conteos.vence_90 ? "medio" : "bien"}
        />
        <Kpi valor={v.conteos.vence_180} label="Vencen en 180 días" />
        <Kpi valor={v.conteos.sin_fecha} label="Sin fecha" tono="medio" />
        <Kpi
          valor={v.estimados}
          label="Con fecha estimada (≈)"
          tono="medio"
          ayuda="Cargos cuyo vencimiento se dedujo de la duración del tipo de trámite porque la designación no trae fecha explícita."
        />
      </div>

      <Card
        titulo="Vencimientos por mes"
        subtitulo={`Ventana de ${data.parametros.horizonte_dias} días desde hoy.`}>
        <BarrasV
          datos={v.por_mes.map((m) => ({ label: m.mes, valor: m.cantidad }))}
          vacio="No hay vencimientos en la ventana elegida."
        />
      </Card>

      {orden.map((k) => {
        const filas = v.buckets[k] ?? [];
        if (!filas.length) return null;
        return (
          <Card
            key={k}
            titulo={`${ETIQUETA_BUCKET[k]} (${filas.length})`}
            acciones={k === "vencidos" ? <BotonCSV onClick={exportar} /> : undefined}>
            <Tabla cols={COLS_OCUP} filas={filas.length}>
              {filas.map(filaOcupacion)}
            </Tabla>
          </Card>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Riesgo jubilatorio
// ---------------------------------------------------------------------------

const ETIQUETA_JUB: Record<string, { label: string; tono: "mal" | "medio" | "neutro" | "bien" }> = {
  supera_70: { label: "Superan los 70 años", tono: "mal" },
  critico: { label: "En el umbral crítico", tono: "medio" },
  proximo: { label: "Próximos al umbral (5 años)", tono: "neutro" },
  sin_riesgo: { label: "Sin riesgo cercano", tono: "bien" },
};

export const TableroJubilacion: React.FC<Props> = ({ data }) => {
  const j = data.jubilacion;
  const orden = ["supera_70", "critico", "proximo", "sin_riesgo"];

  const exportar = () =>
    descargarCSV(
      "riesgo-jubilatorio",
      ["Grupo", "Docente", "DNI", "Edad", "Antigüedad", "Cumple 70", "Horas", "Cargos"],
      orden.flatMap((k) =>
        (j.grupos[k] ?? []).map((f) => [
          ETIQUETA_JUB[k].label,
          f.docente,
          f.dni,
          f.edad,
          f.antiguedad,
          f.cumple_70,
          f.horas_semanales,
          f.cargos.join(" / "),
        ])
      )
    );

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <Kpi
          valor={j.conteos.supera_70 ?? 0}
          label="Superan los 70"
          tono={j.conteos.supera_70 ? "mal" : "bien"}
        />
        <Kpi
          valor={j.conteos.critico ?? 0}
          label={`Entre ${data.parametros.edad_critica} y 69`}
          tono={j.conteos.critico ? "medio" : "bien"}
        />
        <Kpi valor={j.conteos.proximo ?? 0} label="A 5 años del umbral" />
        <Kpi
          valor={j.horas_en_riesgo}
          label="Horas semanales en riesgo"
          tono={j.horas_en_riesgo ? "mal" : "bien"}
          ayuda="Suma de horas de los cargos vigentes de quienes superan el umbral de edad."
        />
        <Kpi valor={fmtNum(j.edad_promedio, 1)} label="Edad promedio" />
        <Kpi valor={j.conteos.sin_riesgo ?? 0} label="Sin riesgo cercano" tono="bien" />
      </div>

      <Card titulo="Pirámide etaria" subtitulo="Docentes activos por quinquenio.">
        <BarrasV
          datos={j.piramide.map((p) => ({ label: p.rango, valor: p.cantidad }))}
        />
      </Card>

      {orden.map((k) => {
        const filas = j.grupos[k] ?? [];
        if (!filas.length) return null;
        return (
          <Card
            key={k}
            titulo={`${ETIQUETA_JUB[k].label} (${filas.length})`}
            acciones={k === "supera_70" ? <BotonCSV onClick={exportar} /> : undefined}>
            <Tabla
              cols={["Docente", "DNI", "Edad", "Antig.", "Cumple 70", "Plazo", "Hs", "Cargos"]}
              filas={filas.length}>
              {filas.map((f) => (
                <tr key={f.docente_id} className="hover:bg-blue-50/40">
                  <Td className="font-medium text-gray-800">{f.docente}</Td>
                  <Td className="tabular-nums text-gray-500">{f.dni}</Td>
                  <Td className="text-center tabular-nums font-semibold">{f.edad}</Td>
                  <Td className="text-center tabular-nums text-gray-500">
                    {f.antiguedad ?? "—"}
                  </Td>
                  <Td className="whitespace-nowrap">{fmtFecha(f.cumple_70)}</Td>
                  <Td className="whitespace-nowrap text-gray-500">
                    {fmtDias(f.dias_para_70)}
                  </Td>
                  <Td className="text-center tabular-nums">{f.horas_semanales}</Td>
                  <Td className="text-gray-600">{f.cargos.join(" · ") || "—"}</Td>
                </tr>
              ))}
            </Tabla>
          </Card>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Antigüedad desde la última renovación
// ---------------------------------------------------------------------------

const ETIQUETA_REN: Record<string, string> = {
  mas_5: "Más de 5 años sin renovar",
  de_3_a_5: "Entre 3 y 5 años",
  de_1_a_3: "Entre 1 y 3 años",
  menos_1: "Menos de 1 año",
  sin_fecha: "Sin fecha de designación",
};

export const TableroRenovacion: React.FC<Props> = ({ data }) => {
  const r = data.renovacion;
  const orden = ["mas_5", "de_3_a_5", "de_1_a_3", "menos_1", "sin_fecha"];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <Kpi
          valor={r.conteos.mas_5 ?? 0}
          label="Más de 5 años"
          tono={r.conteos.mas_5 ? "mal" : "bien"}
        />
        <Kpi valor={r.conteos.de_3_a_5 ?? 0} label="3 a 5 años" tono="medio" />
        <Kpi valor={r.conteos.de_1_a_3 ?? 0} label="1 a 3 años" />
        <Kpi valor={r.conteos.menos_1 ?? 0} label="Menos de 1 año" tono="bien" />
        <Kpi
          valor={fmtNum(r.promedio_anios, 1)}
          label="Promedio de años"
          ayuda="Años transcurridos desde la última designación de cada cargo vigente."
        />
      </div>

      {orden.map((k) => {
        const filas = r.buckets[k] ?? [];
        if (!filas.length) return null;
        return (
          <Card key={k} titulo={`${ETIQUETA_REN[k]} (${filas.length})`}>
            <Tabla
              cols={["Docente", "Cód.", "Cargo", "Última designación", "Tipo", "Años", "N.º desig."]}
              filas={filas.length}>
              {filas.map((o) => (
                <tr key={o.id} className="hover:bg-blue-50/40">
                  <Td className="font-medium text-gray-800">{o.docente}</Td>
                  <Td className="tabular-nums text-gray-500">{o.codigo_cargo}</Td>
                  <Td>{o.denominacion}</Td>
                  <Td className="whitespace-nowrap">
                    {fmtFecha(o.fecha_ultima_renovacion)}
                  </Td>
                  <Td className="text-gray-600">
                    {o.tipo_ultima_designacion_display ?? "—"}
                  </Td>
                  <Td className="text-center tabular-nums font-semibold">
                    {fmtNum(o.anios_desde_ultima_renovacion, 1)}
                  </Td>
                  <Td className="text-center tabular-nums text-gray-500">
                    {o.cantidad_designaciones}
                  </Td>
                </tr>
              ))}
            </Tabla>
          </Card>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Trámites
// ---------------------------------------------------------------------------

export const TableroTramites: React.FC<Props> = ({ data }) => {
  const t = data.tramites;

  const bloque = (
    titulo: string,
    subtitulo: string,
    filas: typeof t.en_tramite,
    mostrarDias: boolean
  ) => (
    <Card
      titulo={`${titulo} (${filas.length})`}
      subtitulo={subtitulo}
      acciones={
        filas.length ? (
          <BotonCSV
            onClick={() =>
              descargarCSV(
                titulo.toLowerCase().replace(/\s+/g, "-"),
                ["Docente", "Tipo", "Código", "Cargo", "Expediente", "Resolución", "DGPRES", "Desde"],
                filas.map((f) => [
                  f.docente,
                  f.tipo_display,
                  f.codigo_cargo,
                  f.denominacion,
                  f.expediente,
                  f.nro_resolucion,
                  f.dgpres,
                  f.fecha_desde,
                ])
              )
            }
          />
        ) : undefined
      }>
      <Tabla
        cols={[
          "Docente",
          "Trámite",
          "Cód.",
          "Cargo",
          "Expediente",
          "Resolución",
          "DGPRES",
          "Desde",
          ...(mostrarDias ? ["Antigüedad"] : []),
        ]}
        filas={filas.length}
        vacio="Nada pendiente en esta categoría.">
        {filas.map((f) => (
          <tr key={`${titulo}-${f.id}`} className="hover:bg-blue-50/40">
            <Td className="font-medium text-gray-800">{f.docente}</Td>
            <Td>
              <Badge tipo="tramite">{f.tipo_display}</Badge>
            </Td>
            <Td className="tabular-nums text-gray-500">{f.codigo_cargo ?? "—"}</Td>
            <Td>{f.denominacion ?? "—"}</Td>
            <Td className={f.expediente ? "" : "text-red-500"}>
              {f.expediente ?? "falta"}
            </Td>
            <Td className={f.nro_resolucion ? "" : "text-red-500"}>
              {f.nro_resolucion ?? "falta"}
            </Td>
            <Td className={f.dgpres ? "" : "text-amber-600"}>
              {f.dgpres ?? "falta"}
            </Td>
            <Td className="whitespace-nowrap">{fmtFecha(f.fecha_desde)}</Td>
            {mostrarDias && (
              <Td className="text-center tabular-nums text-gray-500">
                {f.dias_en_tramite !== null ? `${f.dias_en_tramite} d` : "—"}
              </Td>
            )}
          </tr>
        ))}
      </Tabla>
    </Card>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Kpi
          valor={t.conteos.en_tramite}
          label="Designaciones en trámite"
          tono={t.conteos.en_tramite ? "medio" : "bien"}
        />
        <Kpi
          valor={t.conteos.sin_instrumento}
          label="Sin expediente ni resolución"
          tono={t.conteos.sin_instrumento ? "mal" : "bien"}
        />
        <Kpi
          valor={t.conteos.sin_dgpres}
          label="Sin DGPRES"
          tono={t.conteos.sin_dgpres ? "medio" : "bien"}
          ayuda="Designaciones y concursos sin disposición presupuestaria cargada: el cargo puede no estar habilitado para cobrar."
        />
      </div>

      {bloque(
        "En trámite",
        "Designaciones iniciadas sin instrumento firme. No extienden el vencimiento del cargo.",
        t.en_tramite,
        true
      )}
      {bloque(
        "Sin respaldo documental",
        "No tienen expediente, ni número de resolución, ni resolución vinculada.",
        t.sin_instrumento,
        false
      )}
      {bloque(
        "Sin DGPRES",
        "Concursos y designaciones interinas sin disposición presupuestaria.",
        t.sin_dgpres,
        false
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Cobertura por asignatura
// ---------------------------------------------------------------------------

export const TableroCobertura: React.FC<Props> = ({ data }) => {
  const c = data.cobertura;
  const [soloCriticas, setSoloCriticas] = useState(false);

  const filas = useMemo(
    () => (soloCriticas ? c.asignaturas.filter((a) => a.critica) : c.asignaturas),
    [c.asignaturas, soloCriticas]
  );

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi valor={c.conteos.total} label="Asignaturas" />
        <Kpi
          valor={c.conteos.sin_cobertura}
          label="Sin ningún docente"
          tono={c.conteos.sin_cobertura ? "mal" : "bien"}
        />
        <Kpi
          valor={c.conteos.criticas}
          label={`Con ≤ ${data.parametros.cobertura_minima} docente`}
          tono={c.conteos.criticas ? "medio" : "bien"}
        />
        <Kpi
          valor={c.conteos.sin_codigo_siu}
          label="Sin código SIU"
          tono={c.conteos.sin_codigo_siu ? "medio" : "bien"}
        />
      </div>

      <Card
        titulo="Cobertura por asignatura"
        subtitulo="Ordenadas de menor a mayor cobertura. La matrícula es la del último año cargado."
        acciones={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={soloCriticas}
                onChange={(e) => setSoloCriticas(e.target.checked)}
                className="rounded border-gray-300"
              />
              Sólo críticas
            </label>
            <BotonCSV
              onClick={() =>
                descargarCSV(
                  "cobertura-asignaturas",
                  ["Asignatura", "Código", "SIU", "Área", "Docentes", "Inscriptos", "Año", "Insc./doc."],
                  filas.map((a) => [
                    a.asignatura,
                    a.codigo,
                    a.codigo_siu,
                    a.area,
                    a.docentes,
                    a.inscriptos,
                    a.anio_matricula,
                    a.inscriptos_por_docente,
                  ])
                )
              }
            />
          </div>
        }>
        <Tabla
          cols={["Asignatura", "Código", "SIU", "Área", "Docentes", "Inscriptos", "Insc./doc.", "Estado"]}
          filas={filas.length}
          vacio="No hay asignaturas que cumplan el filtro.">
          {filas.map((a) => (
            <tr key={a.asignatura_id} className="hover:bg-blue-50/40">
              <Td className="font-medium text-gray-800">{a.asignatura}</Td>
              <Td className="text-gray-500">{a.codigo}</Td>
              <Td className={a.codigo_siu ? "text-gray-500" : "text-amber-600"}>
                {a.codigo_siu ?? "falta"}
              </Td>
              <Td className="text-gray-600">{a.area ?? "—"}</Td>
              <Td className="text-center tabular-nums font-semibold">
                {a.docentes}
              </Td>
              <Td className="text-center tabular-nums text-gray-600">
                {a.inscriptos || "—"}
                {a.anio_matricula ? (
                  <span className="text-[10px] text-gray-400 ml-1">
                    ({a.anio_matricula})
                  </span>
                ) : null}
              </Td>
              <Td className="text-center tabular-nums">
                {a.inscriptos_por_docente ?? "—"}
              </Td>
              <Td>
                {a.sin_cobertura ? (
                  <Badge tipo="critico">sin cobertura</Badge>
                ) : a.critica ? (
                  <Badge tipo="medio">crítica</Badge>
                ) : (
                  <Badge tipo="vigente">ok</Badge>
                )}
              </Td>
            </tr>
          ))}
        </Tabla>
      </Card>
    </>
  );
};

// ---------------------------------------------------------------------------
// Dedicación por área
// ---------------------------------------------------------------------------

export const TableroAreas: React.FC<Props> = ({ data }) => {
  const a = data.dedicacion_por_area;

  return (
    <>
      <Card titulo="Horas semanales por área" subtitulo="Sólo cargos vigentes.">
        <BarrasH
          datos={a.areas.map((x) => ({ label: x.area, valor: x.horas }))}
          sufijo=" h"
        />
      </Card>

      <Card
        titulo="Detalle por área"
        acciones={
          <BotonCSV
            onClick={() =>
              descargarCSV(
                "dedicacion-por-area",
                ["Área", "Docentes", "Cargos", "Horas", "Puntaje"],
                a.areas.map((x) => [x.area, x.docentes, x.cargos, x.horas, x.puntaje])
              )
            }
          />
        }>
        <Tabla
          cols={["Área", "Docentes", "Cargos", "Horas", "Puntaje", "Composición"]}
          filas={a.areas.length}>
          {a.areas.map((x) => (
            <tr key={x.area} className="hover:bg-blue-50/40">
              <Td className="font-medium text-gray-800">{x.area}</Td>
              <Td className="text-center tabular-nums">{x.docentes}</Td>
              <Td className="text-center tabular-nums">{x.cargos}</Td>
              <Td className="text-center tabular-nums font-semibold">{x.horas}</Td>
              <Td className="text-center tabular-nums">{x.puntaje}</Td>
              <Td>
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(x.por_rango).map(([r, n]) => (
                    <Badge key={r} tipo="bajo">
                      {r} {n}
                    </Badge>
                  ))}
                </div>
              </Td>
            </tr>
          ))}
        </Tabla>
      </Card>

      {!!a.posibles_duplicados.length && (
        <Card
          titulo={`Posibles áreas duplicadas (${a.posibles_duplicados.length})`}
          subtitulo="Nombres donde uno es prefijo del otro. Suelen ser la misma área cargada dos veces.">
          <ul className="text-xs space-y-1">
            {a.posibles_duplicados.map((d, i) => (
              <li key={i} className="text-gray-700">
                <span className="font-medium">{d.a}</span>
                <span className="text-gray-400 mx-2">↔</span>
                <span className="font-medium">{d.b}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!!a.areas_sin_cargos.length && (
        <Card
          titulo={`Áreas sin cargos vigentes (${a.areas_sin_cargos.length})`}
          subtitulo="Existen en el sistema pero ninguna designación vigente las referencia.">
          <div className="flex flex-wrap gap-1.5">
            {a.areas_sin_cargos.map((n) => (
              <Badge key={n} tipo="bajo">
                {n}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Designaciones
// ---------------------------------------------------------------------------

export const TableroDesignaciones: React.FC<Props> = ({ data }) => {
  const d = data.designaciones_resumen;
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi valor={d.total} label="Designaciones registradas" />
        <Kpi valor={d.por_tipo.length} label="Tipos de trámite distintos" />
        <Kpi
          valor={
            d.por_instrumento.find((i) => i.instrumento === "Sin instrumento")
              ?.cantidad ?? 0
          }
          label="Sin instrumento"
          tono="medio"
        />
        <Kpi
          valor={d.por_anio.length ? d.por_anio[d.por_anio.length - 1].anio : "—"}
          label="Último año con movimientos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card titulo="Por tipo de trámite">
          <BarrasH
            datos={d.por_tipo.map((x) => ({ label: x.tipo, valor: x.cantidad }))}
          />
        </Card>
        <Card titulo="Por instrumento legal">
          <BarrasH
            datos={d.por_instrumento.map((x) => ({
              label: x.instrumento,
              valor: x.cantidad,
              tono: x.instrumento === "Sin instrumento" ? ("mal" as const) : undefined,
            }))}
          />
        </Card>
      </div>

      <Card titulo="Designaciones por año">
        <BarrasV
          datos={d.por_anio.map((x) => ({
            label: String(x.anio),
            valor: x.cantidad,
          }))}
        />
      </Card>
    </>
  );
};

// ---------------------------------------------------------------------------
// Seguimientos
// ---------------------------------------------------------------------------

export const TableroSeguimientos: React.FC<Props> = ({ data }) => {
  const s = data.seguimientos;
  const [soloAbiertos, setSoloAbiertos] = useState(true);
  const filas = useMemo(
    () => (soloAbiertos ? s.items.filter((i) => i.abierto) : s.items),
    [s.items, soloAbiertos]
  );

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <Kpi valor={s.conteos.total} label="Seguimientos registrados" />
        <Kpi
          valor={s.conteos.abiertos}
          label="Abiertos"
          tono={s.conteos.abiertos ? "medio" : "bien"}
        />
        <Kpi
          valor={s.conteos.alta_prioridad}
          label="Prioridad alta sin resolver"
          tono={s.conteos.alta_prioridad ? "mal" : "bien"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card titulo="Abiertos por tipo">
          <BarrasH
            datos={s.por_tipo.map((x) => ({ label: x.tipo, valor: x.cantidad }))}
            vacio="No hay seguimientos abiertos."
          />
        </Card>
        <Card titulo="Abiertos por responsable">
          <BarrasH
            datos={s.por_responsable.map((x) => ({
              label: x.responsable,
              valor: x.cantidad,
            }))}
            vacio="No hay seguimientos abiertos."
          />
        </Card>
      </div>

      <Card
        titulo="Detalle"
        acciones={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={soloAbiertos}
                onChange={(e) => setSoloAbiertos(e.target.checked)}
                className="rounded border-gray-300"
              />
              Sólo abiertos
            </label>
            <BotonCSV
              onClick={() =>
                descargarCSV(
                  "seguimientos",
                  ["Docente", "Tipo", "Descripción", "Fecha", "Responsable", "Prioridad", "Estado"],
                  filas.map((f) => [
                    f.docente,
                    f.tipo_display,
                    f.descripcion,
                    f.fecha_novedad,
                    f.responsable,
                    f.prioridad,
                    f.estado_seguimiento,
                  ])
                )
              }
            />
          </div>
        }>
        <Tabla
          cols={["Docente", "Tipo", "Novedad", "Fecha", "Responsable", "Prioridad", "Estado"]}
          filas={filas.length}
          vacio="No hay seguimientos que cumplan el filtro.">
          {filas.map((f) => (
            <tr key={f.id} className="hover:bg-blue-50/40">
              <Td className="font-medium text-gray-800">{f.docente}</Td>
              <Td className="text-gray-600">{f.tipo_display}</Td>
              <Td className="max-w-md">{f.descripcion}</Td>
              <Td className="whitespace-nowrap">{fmtFecha(f.fecha_novedad)}</Td>
              <Td className="text-gray-600">{f.responsable ?? "—"}</Td>
              <Td>
                <Badge tipo={f.prioridad}>{f.prioridad}</Badge>
              </Td>
              <Td>
                <Badge tipo={f.abierto ? "medio" : "vigente"}>
                  {f.estado_seguimiento}
                </Badge>
              </Td>
            </tr>
          ))}
        </Tabla>
      </Card>
    </>
  );
};

// ---------------------------------------------------------------------------
// Cumpleaños
// ---------------------------------------------------------------------------

export const TableroCumpleanos: React.FC<Props> = ({ data }) => {
  const mesActual = new Date().getMonth() + 1;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.cumpleanos.map((m) => (
        <div
          key={m.mes}
          className={`bg-white rounded-xl border shadow-sm ${
            m.mes === mesActual ? "border-blue-400 ring-1 ring-blue-200" : "border-gray-200"
          }`}>
          <header className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-blue-900">{m.nombre}</h3>
            <span className="text-xs text-gray-400">{m.docentes.length}</span>
          </header>
          <ul className="px-4 py-2 text-xs space-y-1">
            {m.docentes.length ? (
              m.docentes.map((d, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="text-gray-700 truncate" title={d.email ?? ""}>
                    {d.docente}
                  </span>
                  <span className="text-gray-400 tabular-nums shrink-0">
                    {d.dia} · {d.edad}a
                  </span>
                </li>
              ))
            ) : (
              <li className="text-gray-300 italic">—</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tabla de docentes
// ---------------------------------------------------------------------------

export const TableroDocentes: React.FC<Props> = ({ data }) => {
  const [busqueda, setBusqueda] = useState("");
  const [soloActivos, setSoloActivos] = useState(true);

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return data.docentes.filter((d) => {
      if (soloActivos && d.estado_agente !== "activo") return false;
      if (!q) return true;
      return (
        d.nombre_completo.toLowerCase().includes(q) ||
        d.dni.includes(q) ||
        (d.legajo ?? "").includes(q) ||
        d.areas.some((a) => a.toLowerCase().includes(q)) ||
        d.asignaturas.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [data.docentes, busqueda, soloActivos]);

  return (
    <Card
      titulo={`Docentes (${filas.length})`}
      subtitulo="Una fila por docente, con sus cargos vigentes consolidados."
      acciones={
        <div className="flex items-center gap-2">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar…"
            className="text-xs px-2 py-1 border border-gray-300 rounded-lg w-40 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={soloActivos}
              onChange={(e) => setSoloActivos(e.target.checked)}
              className="rounded border-gray-300"
            />
            Sólo activos
          </label>
          <BotonCSV
            onClick={() =>
              descargarCSV(
                "docentes",
                ["Apellido", "Nombre", "DNI", "CUIL", "Legajo", "Título", "Edad", "Antigüedad", "Estado", "Cargos", "Horas", "Puntaje", "Áreas", "Asignaturas", "Email"],
                filas.map((d) => [
                  d.apellido,
                  d.nombre,
                  d.dni,
                  d.cuil,
                  d.legajo,
                  d.titulo,
                  d.edad,
                  d.antiguedad,
                  d.estado_agente,
                  d.cargos_vigentes,
                  d.horas_semanales,
                  d.puntaje,
                  d.areas.join(" / "),
                  d.asignaturas.join(" / "),
                  d.email,
                ])
              )
            }
          />
        </div>
      }>
      <Tabla
        cols={["Docente", "DNI", "Legajo", "Título", "Edad", "Estado", "Cargos", "Hs", "Áreas", "Alertas"]}
        filas={filas.length}
        vacio="Ningún docente coincide con el filtro.">
        {filas.map((d) => (
          <tr key={d.id} className="hover:bg-blue-50/40">
            <Td className="font-medium text-gray-800">{d.nombre_completo}</Td>
            <Td className="tabular-nums text-gray-500">{d.dni}</Td>
            <Td className="tabular-nums text-gray-500">{d.legajo ?? "—"}</Td>
            <Td className="text-gray-600">{d.titulo ?? "—"}</Td>
            <Td
              className={`text-center tabular-nums ${
                d.en_riesgo_edad ? "text-amber-600 font-semibold" : ""
              }`}>
              {d.edad ?? "—"}
            </Td>
            <Td>
              <Badge tipo={d.estado_agente === "activo" ? "vigente" : "cerrada"}>
                {d.estado_agente}
              </Badge>
            </Td>
            <Td className="text-center tabular-nums">{d.cargos_vigentes}</Td>
            <Td className="text-center tabular-nums font-semibold">
              {d.horas_semanales}
            </Td>
            <Td className="text-gray-600 max-w-xs truncate" titulo={d.areas.join(", ")}>
              {d.areas.join(", ") || "—"}
            </Td>
            <Td>
              <div className="flex gap-1 flex-wrap">
                {d.tiene_cargo_vencido && <Badge tipo="vencido">vencido</Badge>}
                {d.en_tramite && <Badge tipo="tramite">trámite</Badge>}
                {d.sin_cargo && <Badge tipo="bajo">sin cargo</Badge>}
                {!d.cuil && <Badge tipo="bajo">sin CUIL</Badge>}
              </div>
            </Td>
          </tr>
        ))}
      </Tabla>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Tabla de cargos (ocupaciones derivadas)
// ---------------------------------------------------------------------------

export const TableroCargos: React.FC<Props> = ({ data }) => {
  const [estado, setEstado] = useState<string>("vigente");
  const filas = useMemo(
    () =>
      estado
        ? data.ocupaciones.filter((o) => o.estado === estado)
        : data.ocupaciones,
    [data.ocupaciones, estado]
  );

  return (
    <Card
      titulo={`Cargos (${filas.length})`}
      subtitulo="Ocupaciones derivadas de la secuencia de designaciones de cada docente sobre un mismo código de cargo."
      acciones={
        <div className="flex items-center gap-2">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="">Todos los estados</option>
            <option value="vigente">Vigentes</option>
            <option value="licencia">En licencia</option>
            <option value="cerrada">Cerrados</option>
          </select>
          <BotonCSV
            onClick={() =>
              descargarCSV(
                "cargos",
                ["Docente", "DNI", "Código", "Cargo", "Rango", "Dedicación", "Horas", "Puntaje", "Estado", "Alta", "Última designación", "Vence", "Origen fecha", "Áreas", "Asignaturas"],
                filas.map((o) => [
                  o.docente,
                  o.dni,
                  o.codigo_cargo,
                  o.denominacion,
                  o.rango,
                  o.dedicacion,
                  o.horas_semanales,
                  o.puntaje,
                  o.estado,
                  o.fecha_alta,
                  o.fecha_ultima_renovacion,
                  o.fecha_vencimiento,
                  o.fuente_vencimiento,
                  o.areas.join(" / "),
                  o.asignaturas.join(" / "),
                ])
              )
            }
          />
        </div>
      }>
      <Tabla cols={COLS_OCUP} filas={filas.length}>
        {filas.map(filaOcupacion)}
      </Tabla>
    </Card>
  );
};
