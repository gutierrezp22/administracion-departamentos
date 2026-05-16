import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import DashboardMenu from "../..";
import withAuth from "@/components/withAut";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import LoadingOverlay from "@/components/LoadingOverlay";

interface CargoMini {
  id: number;
  numero_de_cargo: number;
  tipo_cargo_descripcion?: string;
  tipo_cargo_dedicacion?: string;
  puntaje: string | null;
}

interface Operacion {
  id: number;
  tipo: string;
  tipo_display: string;
  fecha: string;
  observaciones: string | null;
  cargos_origen: CargoMini[];
  cargos_destino: CargoMini[];
}

interface Ocupacion {
  id: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  motivo_fin: string | null;
  docente?: { nombre: string; apellido: string; dni: string } | null;
  vacante: boolean;
  duracion_dias?: number;
}

interface HistorialResponse {
  cargo: {
    id: number;
    numero_de_cargo: number;
    puntaje: string | null;
    tipo_cargo_detalle: {
      sigla: string;
      descripcion: string;
      dedicacion: string;
    } | null;
    estado: string;
  };
  ocupaciones: Ocupacion[];
  nacio_de: Operacion[];
  finalizo_en: Operacion[];
}

const iconoPorTipo: Record<string, JSX.Element> = {
  descomposicion: <CallSplitIcon fontSize="small" />,
  combinacion: <MergeTypeIcon fontSize="small" />,
  renovacion: <AutorenewIcon fontSize="small" />,
};

const HistorialCargo = () => {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<HistorialResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const r = await API.get(`/facet/cargo/${id}/historial/`);
        setData(r.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <DashboardMenu>
        <LoadingOverlay message="Cargando historial..." />
      </DashboardMenu>
    );
  }

  if (!data) {
    return (
      <DashboardMenu>
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
            No se encontró el cargo.
          </div>
        </div>
      </DashboardMenu>
    );
  }

  const { cargo, ocupaciones, nacio_de, finalizo_en } = data;

  return (
    <DashboardMenu>
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/dashboard/cargos/list")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm">
          <ArrowBackIcon fontSize="small" /> Volver al listado
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <h1 className="text-2xl font-bold">Cargo #{cargo.numero_de_cargo}</h1>
            {cargo.tipo_cargo_detalle && (
              <p className="mt-1 text-blue-100">
                {cargo.tipo_cargo_detalle.descripcion} — {cargo.tipo_cargo_detalle.dedicacion}
                {cargo.puntaje && ` · ${cargo.puntaje} puntos`}
              </p>
            )}
            <p className="mt-1 text-sm">
              Estado: <strong>{cargo.estado === "1" ? "Activo" : "Inactivo"}</strong>
            </p>
          </div>

          {/* Origen */}
          <section className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Origen</h2>
            {nacio_de.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Este cargo fue creado directamente (no proviene de una operación).
              </p>
            ) : (
              nacio_de.map((op) => (
                <div
                  key={op.id}
                  className="border border-gray-200 rounded-lg p-4 mb-2 bg-gray-50">
                  <div className="flex items-center gap-2 font-medium text-gray-800">
                    {iconoPorTipo[op.tipo]} {op.tipo_display} · {op.fecha}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Provino de:{" "}
                    {op.cargos_origen.map((c) => (
                      <span
                        key={c.id}
                        className="inline-block bg-white border border-gray-300 rounded px-2 py-0.5 text-xs mx-0.5">
                        #{c.numero_de_cargo} {c.tipo_cargo_descripcion}-{c.tipo_cargo_dedicacion}
                      </span>
                    ))}
                  </p>
                  {op.observaciones && (
                    <p className="text-xs text-gray-500 italic mt-1">{op.observaciones}</p>
                  )}
                </div>
              ))
            )}
          </section>

          {/* Ocupaciones */}
          <section className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Ocupaciones ({ocupaciones.length})
            </h2>
            {ocupaciones.length === 0 ? (
              <p className="text-gray-500 text-sm">Sin períodos registrados.</p>
            ) : (
              <ul className="space-y-2">
                {ocupaciones.map((o) => (
                  <li
                    key={o.id}
                    className={`border rounded-lg p-3 text-sm ${
                      o.vacante
                        ? "border-gray-200 bg-gray-50 text-gray-600"
                        : "border-blue-200 bg-blue-50"
                    }`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <strong>
                          {o.vacante
                            ? "Vacante"
                            : `${o.docente?.apellido}, ${o.docente?.nombre} (DNI ${o.docente?.dni})`}
                        </strong>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {o.fecha_inicio} → {o.fecha_fin || "vigente"}
                          {o.duracion_dias != null && ` · ${o.duracion_dias} días`}
                        </div>
                      </div>
                      {o.motivo_fin && (
                        <span className="text-xs bg-white border border-gray-300 rounded px-2 py-0.5">
                          {o.motivo_fin}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Destino */}
          <section className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Destino</h2>
            {finalizo_en.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Este cargo no formó parte de ninguna operación de cierre.
              </p>
            ) : (
              finalizo_en.map((op) => (
                <div
                  key={op.id}
                  className="border border-gray-200 rounded-lg p-4 mb-2 bg-gray-50">
                  <div className="flex items-center gap-2 font-medium text-gray-800">
                    {iconoPorTipo[op.tipo]} {op.tipo_display} · {op.fecha}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Se transformó en:{" "}
                    {op.cargos_destino.map((c) => (
                      <span
                        key={c.id}
                        className="inline-block bg-white border border-gray-300 rounded px-2 py-0.5 text-xs mx-0.5">
                        #{c.numero_de_cargo} {c.tipo_cargo_descripcion}-{c.tipo_cargo_dedicacion}
                      </span>
                    ))}
                  </p>
                  {op.observaciones && (
                    <p className="text-xs text-gray-500 italic mt-1">{op.observaciones}</p>
                  )}
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(HistorialCargo);
