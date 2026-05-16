import { useEffect, useState, useMemo } from "react";
import API from "@/api/axiosConfig";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Swal from "sweetalert2";
import { FilterSelect } from "@/components/Filters";

interface Departamento {
  id: number;
  nombre: string;
}

interface Asignatura {
  id: number;
  codigo: string;
  nombre: string;
  departamento?: number;
}

interface Resolucion {
  id: number;
  nresolucion: string;
  nexpediente: string;
}

interface CargoBasico {
  id: number;
  numero_de_cargo: number;
  departamento: number | null;
  departamento_detalle: { id: number; nombre: string } | null;
  asignatura: number | null;
  asignatura_detalle: { id: number; codigo: string; nombre: string } | null;
  resolucion_oficializacion: number | null;
  resolucion_oficializacion_detalle: {
    id: number;
    nresolucion: string;
    nexpediente: string;
  } | null;
  tipo_cargo_detalle: {
    descripcion: string;
    dedicacion: string;
  } | null;
}

interface Props {
  cargo: CargoBasico;
  onClose: () => void;
  onSuccess: () => void;
}

const VincularModal: React.FC<Props> = ({ cargo, onClose, onSuccess }) => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);

  const [departamentoId, setDepartamentoId] = useState<number | "">(
    cargo.departamento ?? ""
  );
  const [asignaturaId, setAsignaturaId] = useState<number | "">(
    cargo.asignatura ?? ""
  );
  const [resolucionId, setResolucionId] = useState<number | "">(
    cargo.resolucion_oficializacion ?? ""
  );
  const [filtroAsignatura, setFiltroAsignatura] = useState("");
  const [filtroResolucion, setFiltroResolucion] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [rD, rR] = await Promise.all([
          API.get(`/facet/departamento/?page_size=100&estado=1`),
          API.get(`/facet/resolucion/?page_size=50&estado=1`),
        ]);
        setDepartamentos(rD.data.results || []);
        setResoluciones(rR.data.results || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAll();
  }, []);

  // Cargar asignaturas del departamento elegido
  useEffect(() => {
    const fetchAsig = async () => {
      if (!departamentoId) {
        setAsignaturas([]);
        return;
      }
      try {
        const r = await API.get(
          `/facet/asignatura/?page_size=200&departamento=${departamentoId}&estado=1`
        );
        setAsignaturas(r.data.results || []);
      } catch (e) {
        console.error(e);
        setAsignaturas([]);
      }
    };
    fetchAsig();
  }, [departamentoId]);

  const asignaturasFiltradas = filtroAsignatura
    ? asignaturas.filter(
        (a) =>
          a.codigo?.toLowerCase().includes(filtroAsignatura.toLowerCase()) ||
          a.nombre?.toLowerCase().includes(filtroAsignatura.toLowerCase())
      )
    : asignaturas;

  const resolucionesFiltradas = filtroResolucion
    ? resoluciones.filter(
        (r) =>
          r.nresolucion?.toLowerCase().includes(filtroResolucion.toLowerCase()) ||
          r.nexpediente?.toLowerCase().includes(filtroResolucion.toLowerCase())
      )
    : resoluciones;

  const ejecutar = async () => {
    if (!departamentoId) {
      Swal.fire("Falta dato", "Elegí un departamento.", "warning");
      return;
    }
    setEnviando(true);
    try {
      await API.post(`/facet/cargo/${cargo.id}/vincular/`, {
        departamento: departamentoId,
        asignatura: asignaturaId || null,
        resolucion_oficializacion: resolucionId || null,
      });
      Swal.fire("Listo", "Cargo vinculado.", "success");
      onSuccess();
    } catch (e: any) {
      Swal.fire(
        "Error",
        e.response?.data?.detail || "No se pudo vincular.",
        "error"
      );
    } finally {
      setEnviando(false);
    }
  };

  const desvincular = async () => {
    const r = await Swal.fire({
      title: "Desvincular cargo",
      text: "Se quita el departamento y la asignatura del cargo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Desvincular",
      cancelButtonText: "Cancelar",
    });
    if (!r.isConfirmed) return;
    try {
      await API.post(`/facet/cargo/${cargo.id}/desvincular/`, {});
      Swal.fire("Listo", "Cargo desvinculado.", "success");
      onSuccess();
    } catch (e: any) {
      Swal.fire(
        "Error",
        e.response?.data?.detail || "No se pudo desvincular.",
        "error"
      );
    }
  };

  const departamentoOptions = useMemo(
    () => departamentos.map((d) => ({ value: String(d.id), label: d.nombre })),
    [departamentos]
  );
  const asignaturaOptions = useMemo(
    () =>
      asignaturasFiltradas.map((a) => ({
        value: String(a.id),
        label: `${a.codigo} — ${a.nombre}`,
      })),
    [asignaturasFiltradas]
  );
  const resolucionOptions = useMemo(
    () =>
      resolucionesFiltradas.slice(0, 100).map((r) => ({
        value: String(r.id),
        label: `Nº ${r.nresolucion} · Exp. ${r.nexpediente}`,
      })),
    [resolucionesFiltradas]
  );

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: "1rem", overflow: "hidden" } }}
    >
      <DialogTitle className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-b border-blue-700/20 shadow-sm">
        Vincular cargo #{cargo.numero_de_cargo}
      </DialogTitle>
      <DialogContent dividers className="p-6 bg-gray-50/30">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm">
          <p>
            <strong>Cargo:</strong>{" "}
            {cargo.tipo_cargo_detalle?.descripcion} (
            {cargo.tipo_cargo_detalle?.dedicacion})
          </p>
          {cargo.departamento_detalle && (
            <p className="mt-1 text-orange-700">
              Actualmente vinculado a:{" "}
              <strong>{cargo.departamento_detalle.nombre}</strong>
            </p>
          )}
        </div>

        {/* Departamento */}
        <div className="mb-4">
          <FilterSelect
            label="Departamento *"
            value={departamentoId === "" ? "" : String(departamentoId)}
            onChange={(v) => setDepartamentoId(v === "" ? "" : Number(v))}
            options={departamentoOptions}
            placeholder="Seleccionar departamento..."
          />
        </div>

        {/* Asignatura */}
        <div className="mb-4">
          {departamentoId ? (
            <>
              <input
                type="text"
                value={filtroAsignatura}
                onChange={(e) => setFiltroAsignatura(e.target.value)}
                placeholder="Buscar asignatura por código o nombre..."
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-400 hover:bg-white transition-all duration-200 text-sm text-gray-700 placeholder-gray-400 shadow-sm mb-2"
              />
              <FilterSelect
                label="Asignatura (opcional, solo para cargos docentes)"
                value={asignaturaId === "" ? "" : String(asignaturaId)}
                onChange={(v) => setAsignaturaId(v === "" ? "" : Number(v))}
                options={asignaturaOptions}
                placeholder="Sin asignatura"
              />
              {asignaturas.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Este departamento no tiene asignaturas activas.
                </p>
              )}
            </>
          ) : (
            <>
              <label className="text-sm font-semibold text-gray-700">
                Asignatura (opcional, solo para cargos docentes)
              </label>
              <p className="text-xs text-gray-500 italic mt-1">
                Elegí un departamento primero.
              </p>
            </>
          )}
        </div>

        {/* Resolución de oficialización */}
        <div className="mb-2">
          <input
            type="text"
            value={filtroResolucion}
            onChange={(e) => setFiltroResolucion(e.target.value)}
            placeholder="Buscar resolución por Nº o expediente..."
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-400 hover:bg-white transition-all duration-200 text-sm text-gray-700 placeholder-gray-400 shadow-sm mb-2"
          />
          <FilterSelect
            label="Resolución de oficialización (opcional)"
            value={resolucionId === "" ? "" : String(resolucionId)}
            onChange={(v) => setResolucionId(v === "" ? "" : Number(v))}
            options={resolucionOptions}
            placeholder="Sin resolución"
          />
        </div>
      </DialogContent>
      <DialogActions className="p-4">
        {cargo.departamento && (
          <button
            onClick={desvincular}
            className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium mr-auto">
            Desvincular
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 font-medium">
          Cancelar
        </button>
        <button
          onClick={ejecutar}
          disabled={!departamentoId || enviando}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed">
          {enviando ? "Guardando..." : "Vincular"}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default VincularModal;
