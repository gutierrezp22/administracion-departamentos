// Reporte de Planta Docente.
// Sustituye el informe que se armaba a mano en `grafo_planta_docente.html`:
// los mismos tableros, pero calculados por el backend contra la base del
// sistema en vez de contra una planilla Excel.

import { useCallback, useEffect, useMemo, useState } from "react";
import API from "@/api/axiosConfig";
import DashboardMenu from "../index";
import withAuth from "@/components/withAut";
import LoadingOverlay from "@/components/LoadingOverlay";
import { Badge, fmtFecha } from "@/components/ReportePlanta/ui";
import {
  TableroAreas,
  TableroCargos,
  TableroCobertura,
  TableroCumpleanos,
  TableroDesignaciones,
  TableroDocentes,
  TableroJubilacion,
  TableroRenovacion,
  TableroResumen,
  TableroSeguimientos,
  TableroTramites,
  TableroVencimientos,
} from "@/components/ReportePlanta/tableros";
import type { ReportePlanta } from "@/components/ReportePlanta/types";

interface Departamento {
  id: number;
  nombre: string;
}

const TABLEROS = [
  { clave: "resumen", label: "Resumen", Comp: TableroResumen },
  { clave: "vencimientos", label: "Vencimientos", Comp: TableroVencimientos },
  { clave: "jubilacion", label: "Riesgo jubilatorio", Comp: TableroJubilacion },
  { clave: "renovacion", label: "Renovación", Comp: TableroRenovacion },
  { clave: "tramites", label: "Trámites", Comp: TableroTramites },
  { clave: "cobertura", label: "Cobertura", Comp: TableroCobertura },
  { clave: "areas", label: "Áreas", Comp: TableroAreas },
  { clave: "designaciones", label: "Designaciones", Comp: TableroDesignaciones },
  { clave: "seguimientos", label: "Seguimientos", Comp: TableroSeguimientos },
  { clave: "cumpleanos", label: "Cumpleaños", Comp: TableroCumpleanos },
  { clave: "docentes", label: "Tabla docentes", Comp: TableroDocentes },
  { clave: "cargos", label: "Tabla cargos", Comp: TableroCargos },
] as const;

type ClaveTablero = (typeof TABLEROS)[number]["clave"];

const NIVEL_LABEL: Record<string, string> = {
  critico: "Crítico",
  alto: "Alto",
  medio: "Medio",
  bajo: "Bajo",
};

const ReportePlantaPage = () => {
  const [data, setData] = useState<ReportePlanta | null>(null);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tablero, setTablero] = useState<ClaveTablero>("resumen");

  // Parámetros del informe
  const [departamento, setDepartamento] = useState<string>("");
  const [edadCritica, setEdadCritica] = useState(65);
  const [coberturaMinima, setCoberturaMinima] = useState(1);
  const [horizonte, setHorizonte] = useState(365);

  useEffect(() => {
    API.get("/facet/departamento/?limit=200")
      .then(({ data }) =>
        setDepartamentos(Array.isArray(data) ? data : data.results ?? [])
      )
      .catch(() => setDepartamentos([]));
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await API.get<ReportePlanta>("/facet/reporte-planta/", {
        params: {
          ...(departamento ? { departamento } : {}),
          edad_critica: edadCritica,
          cobertura_minima: coberturaMinima,
          horizonte_dias: horizonte,
        },
      });
      setData(data);
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ??
          "No se pudo generar el informe. Revisá la conexión con el servidor."
      );
    } finally {
      setCargando(false);
    }
  }, [departamento, edadCritica, coberturaMinima, horizonte]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const Actual = useMemo(
    () => TABLEROS.find((t) => t.clave === tablero)?.Comp ?? TableroResumen,
    [tablero]
  );

  const nombreDepto = departamento
    ? departamentos.find((d) => String(d.id) === departamento)?.nombre
    : "Todos los departamentos";

  return (
    <DashboardMenu>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        {/* Encabezado */}
        <header className="mb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-blue-900">
                Reporte de Planta Docente
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {nombreDepto}
                {data && (
                  <span className="text-gray-400">
                    {" "}
                    · generado el {fmtFecha(data.generado)}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cargar}
                disabled={cargando}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                ↻ Actualizar
              </button>
              <button
                onClick={() => window.print()}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                🖨 Imprimir / PDF
              </button>
            </div>
          </div>

          {/* Parámetros */}
          <div className="mt-3 bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex flex-wrap items-end gap-4 print:hidden">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                Departamento
              </span>
              <select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className="text-sm px-2 py-1.5 border border-gray-300 rounded-lg min-w-[220px] focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value="">Todos</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                Edad crítica: <b className="text-blue-800">{edadCritica}</b> años
              </span>
              <input
                type="range"
                min={55}
                max={75}
                value={edadCritica}
                onChange={(e) => setEdadCritica(Number(e.target.value))}
                className="w-40"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                Cobertura mínima
              </span>
              <input
                type="number"
                min={1}
                max={10}
                value={coberturaMinima}
                onChange={(e) => setCoberturaMinima(Number(e.target.value))}
                className="text-sm px-2 py-1.5 border border-gray-300 rounded-lg w-20 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                Horizonte (días)
              </span>
              <select
                value={horizonte}
                onChange={(e) => setHorizonte(Number(e.target.value))}
                className="text-sm px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value={90}>90</option>
                <option value={180}>180</option>
                <option value={365}>365</option>
                <option value={730}>730</option>
              </select>
            </label>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {cargando && !data && <LoadingOverlay message="Generando informe…" />}

        {data && (
          <>
            {/* Alertas */}
            {!!data.alertas.length && (
              <section className="mb-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <header className="px-4 pt-3 pb-2 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-blue-900">
                    Alertas ({data.alertas.length})
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Lo que requiere atención, ordenado por criticidad.
                  </p>
                </header>
                <ul className="divide-y divide-gray-100">
                  {data.alertas.map((a, i) => (
                    <li
                      key={i}
                      className="px-4 py-2 flex items-start gap-3 hover:bg-blue-50/40 cursor-pointer"
                      onClick={() => {
                        const destino = TABLEROS.find(
                          (t) => t.clave === a.tablero
                        );
                        if (destino) setTablero(destino.clave);
                      }}>
                      <Badge tipo={a.nivel}>{NIVEL_LABEL[a.nivel]}</Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {a.titulo}
                        </p>
                        <p className="text-xs text-gray-500">{a.detalle}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Pestañas */}
            <nav className="mb-4 flex flex-wrap gap-1 print:hidden">
              {TABLEROS.map((t) => (
                <button
                  key={t.clave}
                  onClick={() => setTablero(t.clave)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    tablero === t.clave
                      ? "bg-blue-600 text-white font-semibold shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}>
                  {t.label}
                </button>
              ))}
            </nav>

            <div className={cargando ? "opacity-50 pointer-events-none" : ""}>
              <Actual data={data} />
            </div>
          </>
        )}
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ReportePlantaPage);
