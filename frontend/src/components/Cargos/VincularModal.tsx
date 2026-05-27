import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
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

interface Resolucion {
  id: number;
  nresolucion: string;
  nexpediente: string;
}

interface CargoDepartamentoOption {
  id: number;
  descripcion: string;
  departamento: number;
  departamento_detalle: { id: number; nombre: string } | null;
  asignatura: number | null;
  asignatura_detalle: { id: number; codigo: string; nombre: string } | null;
  tipo_cargo: number | null;
  tipo_cargo_detalle: {
    descripcion: string;
    dedicacion: string;
  } | null;
  cargo_vinculado: { id: number; numero_de_cargo: number } | null;
}

interface CargoBasico {
  id: number;
  numero_de_cargo: number;
  tipo_cargo: number | null;
  cargo_departamento: number | null;
  cargo_departamento_detalle: {
    id: number;
    descripcion: string;
    departamento: { id: number; nombre: string } | null;
    asignatura: { id: number; codigo: string; nombre: string } | null;
  } | null;
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
  const router = useRouter();
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [cargosDep, setCargosDep] = useState<CargoDepartamentoOption[]>([]);
  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);

  const [departamentoFiltro, setDepartamentoFiltro] = useState<number | "">("");
  const [cargoDepId, setCargoDepId] = useState<number | "">(cargo.cargo_departamento ?? "");
  const [resolucionId, setResolucionId] = useState<number | "">(
    cargo.resolucion_oficializacion ?? ""
  );
  const [filtroCargoDep, setFiltroCargoDep] = useState("");
  const [filtroResolucion, setFiltroResolucion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(false);

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

  // Cargar Cargos de Departamento del depto elegido (o todos los activos si no se filtra)
  useEffect(() => {
    const fetchCargosDep = async () => {
      setCargando(true);
      try {
        const params = new URLSearchParams();
        params.append("page_size", "200");
        params.append("estado", "1");
        if (departamentoFiltro) {
          params.append("departamento", String(departamentoFiltro));
        }
        const r = await API.get(`/facet/cargo-departamento/?${params.toString()}`);
        setCargosDep(r.data.results || []);
      } catch (e) {
        console.error(e);
        setCargosDep([]);
      } finally {
        setCargando(false);
      }
    };
    fetchCargosDep();
  }, [departamentoFiltro]);

  const cargosDepFiltrados = useMemo(() => {
    const f = filtroCargoDep.toLowerCase().trim();
    return cargosDep
      .filter((s) => {
        // Mostrar los libres + el actualmente vinculado a este cargo (si existe)
        const libre = !s.cargo_vinculado || s.cargo_vinculado.id === cargo.id;
        if (!libre) return false;
        // Compatibilidad de tipo: si el Cargo de Departamento tiene tipo
        // definido, debe coincidir con el del cargo de plata.
        const tipoOk = !s.tipo_cargo || s.tipo_cargo === cargo.tipo_cargo;
        if (!tipoOk) return false;
        if (!f) return true;
        return (
          (s.descripcion || "").toLowerCase().includes(f) ||
          (s.asignatura_detalle?.nombre || "").toLowerCase().includes(f) ||
          (s.asignatura_detalle?.codigo || "").toLowerCase().includes(f) ||
          (s.departamento_detalle?.nombre || "").toLowerCase().includes(f)
        );
      });
  }, [cargosDep, filtroCargoDep, cargo.id, cargo.tipo_cargo]);

  const resolucionesFiltradas = filtroResolucion
    ? resoluciones.filter(
        (r) =>
          r.nresolucion?.toLowerCase().includes(filtroResolucion.toLowerCase()) ||
          r.nexpediente?.toLowerCase().includes(filtroResolucion.toLowerCase())
      )
    : resoluciones;

  const ejecutar = async () => {
    if (!cargoDepId) {
      Swal.fire("Falta dato", "Elegí un Cargo de Departamento.", "warning");
      return;
    }
    setEnviando(true);
    try {
      await API.post(`/facet/cargo/${cargo.id}/vincular/`, {
        cargo_departamento: cargoDepId,
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
      text: "El cargo de plata vuelve a estar disponible (sin Cargo de Departamento asignado).",
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
  const cargoDepOptions = useMemo(
    () =>
      cargosDepFiltrados.map((s) => {
        const partes = [s.descripcion || `Cargo Dep. #${s.id}`];
        if (s.departamento_detalle) partes.push(`· ${s.departamento_detalle.nombre}`);
        if (s.asignatura_detalle)
          partes.push(`· ${s.asignatura_detalle.codigo} ${s.asignatura_detalle.nombre}`);
        if (s.tipo_cargo_detalle)
          partes.push(`(${s.tipo_cargo_detalle.descripcion}/${s.tipo_cargo_detalle.dedicacion})`);
        return { value: String(s.id), label: partes.join(" ") };
      }),
    [cargosDepFiltrados]
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
        Vincular cargo #{cargo.numero_de_cargo} a un Cargo de Departamento
      </DialogTitle>
      <DialogContent dividers className="p-6 bg-gray-50/30">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm">
          <p>
            <strong>Cargo:</strong>{" "}
            {cargo.tipo_cargo_detalle?.descripcion} (
            {cargo.tipo_cargo_detalle?.dedicacion})
          </p>
          {cargo.cargo_departamento_detalle && (
            <p className="mt-1 text-orange-700">
              Actualmente vinculado a:{" "}
              <strong>{cargo.cargo_departamento_detalle.descripcion || `Cargo Dep. #${cargo.cargo_departamento_detalle.id}`}</strong>
              {cargo.cargo_departamento_detalle.departamento && (
                <> · {cargo.cargo_departamento_detalle.departamento.nombre}</>
              )}
            </p>
          )}
        </div>

        {/* Filtro por departamento (opcional, para reducir la lista) */}
        <div className="mb-4">
          <FilterSelect
            label="Filtrar por departamento (opcional)"
            value={departamentoFiltro === "" ? "" : String(departamentoFiltro)}
            onChange={(v) => {
              setDepartamentoFiltro(v === "" ? "" : Number(v));
              setCargoDepId(""); // resetear elección al cambiar depto
            }}
            options={departamentoOptions}
            placeholder="Todos los departamentos"
          />
        </div>

        {/* Cargo de Departamento */}
        <div className="mb-4">
          <input
            type="text"
            value={filtroCargoDep}
            onChange={(e) => setFiltroCargoDep(e.target.value)}
            placeholder="Buscar por descripción, asignatura o depto..."
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-400 hover:bg-white transition-all duration-200 text-sm text-gray-700 placeholder-gray-400 shadow-sm mb-2"
          />
          <FilterSelect
            label="Cargo de Departamento *"
            value={cargoDepId === "" ? "" : String(cargoDepId)}
            onChange={(v) => setCargoDepId(v === "" ? "" : Number(v))}
            options={cargoDepOptions}
            placeholder={cargando ? "Cargando..." : "Seleccionar..."}
          />
          {!cargando && cargosDepFiltrados.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">
              No hay Cargos de Departamento compatibles
              {cargo.tipo_cargo_detalle ? (
                <>
                  {" "}con el tipo{" "}
                  <strong>
                    {cargo.tipo_cargo_detalle.descripcion} ({cargo.tipo_cargo_detalle.dedicacion})
                  </strong>
                </>
              ) : null}
              {departamentoFiltro ? " en este departamento" : ""}.{" "}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/dashboard/cargos-departamento/create");
                }}
                className="text-blue-600 hover:underline font-medium"
              >
                Crear uno nuevo →
              </button>
            </p>
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
        {cargo.cargo_departamento && (
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
          disabled={!cargoDepId || enviando}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed">
          {enviando ? "Guardando..." : "Vincular"}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default VincularModal;
