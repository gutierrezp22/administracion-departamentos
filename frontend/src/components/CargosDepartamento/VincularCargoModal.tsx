import { useEffect, useMemo, useState } from "react";
import API from "@/api/axiosConfig";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Swal from "sweetalert2";
import { FilterSelect } from "@/components/Filters";

interface CargoDisponible {
  id: number;
  numero_de_cargo: number;
  tipo_cargo_detalle: {
    sigla: string;
    descripcion: string;
    dedicacion: string;
    puntaje: string | null;
  } | null;
}

interface CargoDepResumen {
  id: number;
  descripcion: string;
  departamento_detalle: { id: number; nombre: string } | null;
  tipo_cargo: number | null;
  tipo_cargo_detalle: {
    descripcion: string;
    dedicacion: string;
  } | null;
  cargo_vinculado: { id: number; numero_de_cargo: number } | null;
}

interface Props {
  cargoDep: CargoDepResumen;
  onClose: () => void;
  onSuccess: () => void;
}

const VincularCargoModal: React.FC<Props> = ({ cargoDep, onClose, onSuccess }) => {
  const [cargos, setCargos] = useState<CargoDisponible[]>([]);
  const [cargoId, setCargoId] = useState<number | "">("");
  const [filtro, setFiltro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const fetchDisponibles = async () => {
      setCargando(true);
      try {
        const params = new URLSearchParams();
        // El backend limita page_size a 100 (max_page_size)
        params.append("page_size", "100");
        // Si el Cargo de Departamento tiene tipo definido, solo traer cargos
        // de plata del mismo tipo. Los tipos deben coincidir para vincular.
        if (cargoDep.tipo_cargo) {
          params.append("tipo_cargo", String(cargoDep.tipo_cargo));
        }
        const r = await API.get(
          `/facet/cargo-departamento/cargos-disponibles/?${params.toString()}`
        );
        const data = r.data.results || r.data;
        setCargos(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setCargos([]);
      } finally {
        setCargando(false);
      }
    };
    fetchDisponibles();
  }, [cargoDep.tipo_cargo]);

  const cargosFiltrados = useMemo(() => {
    if (!filtro.trim()) return cargos;
    const f = filtro.toLowerCase();
    return cargos.filter((c) => {
      return (
        String(c.numero_de_cargo).includes(f) ||
        (c.tipo_cargo_detalle?.descripcion || "").toLowerCase().includes(f) ||
        (c.tipo_cargo_detalle?.sigla || "").toLowerCase().includes(f)
      );
    });
  }, [cargos, filtro]);

  const cargoOptions = useMemo(
    () =>
      cargosFiltrados.slice(0, 200).map((c) => {
        const t = c.tipo_cargo_detalle;
        const tipoStr = t
          ? `${t.sigla ? t.sigla + " " : ""}${t.descripcion}/${t.dedicacion}${
              t.puntaje ? ` (${t.puntaje} pts)` : ""
            }`
          : "(sin tipo)";
        return {
          value: String(c.id),
          label: `#${c.numero_de_cargo} · ${tipoStr}`,
        };
      }),
    [cargosFiltrados]
  );

  const ejecutar = async () => {
    if (!cargoId) {
      Swal.fire("Falta dato", "Elegí un cargo de plata.", "warning");
      return;
    }
    setEnviando(true);
    try {
      await API.post(`/facet/cargo-departamento/${cargoDep.id}/vincular-cargo/`, {
        cargo: cargoId,
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

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: "1rem", overflow: "hidden" } }}
    >
      <DialogTitle className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        Vincular un Cargo (plata) a este Cargo de Departamento
      </DialogTitle>
      <DialogContent dividers className="p-6 bg-gray-50/30">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm">
          <p>
            <strong>Cargo de Departamento:</strong>{" "}
            {cargoDep.descripcion || `#${cargoDep.id}`}
            {cargoDep.departamento_detalle && ` · ${cargoDep.departamento_detalle.nombre}`}
          </p>
          {cargoDep.tipo_cargo_detalle && (
            <p className="text-gray-600 mt-1">
              Tipo: <strong>{cargoDep.tipo_cargo_detalle.descripcion}</strong> ({cargoDep.tipo_cargo_detalle.dedicacion})
            </p>
          )}
        </div>

        <input
          type="text"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar cargo por número o tipo..."
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-400 hover:bg-white transition-all duration-200 text-sm text-gray-700 placeholder-gray-400 shadow-sm mb-2"
        />
        <FilterSelect
          label="Cargo de plata disponible *"
          value={cargoId === "" ? "" : String(cargoId)}
          onChange={(v) => setCargoId(v === "" ? "" : Number(v))}
          options={cargoOptions}
          placeholder={cargando ? "Cargando..." : "Seleccionar cargo..."}
        />
        {!cargando && cargos.length > 0 && cargosFiltrados.length === 0 && (
          <p className="text-xs text-gray-500 mt-2">
            No hay cargos que coincidan con la búsqueda. Probá con otro número o
            tipo.
          </p>
        )}
        {!cargando && cargos.length === 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {cargoDep.tipo_cargo_detalle ? (
              <>
                No hay cargos (plata) disponibles del tipo{" "}
                <strong>
                  {cargoDep.tipo_cargo_detalle.descripcion} ({cargoDep.tipo_cargo_detalle.dedicacion})
                </strong>
                . Importá desde Excel, desvinculá uno existente o creá un Cargo de Departamento de otro tipo.
              </>
            ) : (
              <>No hay cargos (plata) disponibles. Importá desde Excel o desvinculá uno existente.</>
            )}
          </p>
        )}
      </DialogContent>
      <DialogActions className="p-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 font-medium">
          Cancelar
        </button>
        <button
          onClick={ejecutar}
          disabled={!cargoId || enviando}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed">
          {enviando ? "Vinculando..." : "Vincular"}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default VincularCargoModal;
