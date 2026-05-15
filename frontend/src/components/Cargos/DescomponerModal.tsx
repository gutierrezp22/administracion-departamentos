import { useEffect, useState } from "react";
import API from "@/api/axiosConfig";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  CircularProgress,
} from "@mui/material";
import Swal from "sweetalert2";

interface Pieza {
  id: number;
  sigla: string;
  descripcion: string;
  dedicacion: string;
  puntaje: string;
}

interface Combinacion {
  puntaje_total: string;
  piezas: Pieza[];
}

interface CargoBasico {
  id: number;
  numero_de_cargo: number;
  puntaje: string | null;
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

const DescomponerModal: React.FC<Props> = ({ cargo, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [combinaciones, setCombinaciones] = useState<Combinacion[]>([]);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [maxPiezas, setMaxPiezas] = useState(4);
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  const fetchCombinaciones = async (mp = maxPiezas) => {
    setLoading(true);
    try {
      const r = await API.get(`/facet/cargo/${cargo.id}/descomposiciones/?max_piezas=${mp}`);
      // Filtrar la trivial (1 sola pieza)
      const combs = (r.data.combinaciones || []).filter(
        (c: Combinacion) => c.piezas.length >= 2
      );
      setCombinaciones(combs);
    } catch (e: any) {
      Swal.fire("Error", e.response?.data?.detail || "Error obteniendo combinaciones", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombinaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargo.id]);

  const ejecutar = async () => {
    if (seleccionada === null) return;
    const combo = combinaciones[seleccionada];
    setEnviando(true);
    try {
      await API.post(`/facet/cargo/${cargo.id}/descomponer/`, {
        tipos: combo.piezas.map((p) => p.id),
        observaciones,
      });
      Swal.fire("Listo", "Cargo descompuesto con éxito.", "success");
      onSuccess();
    } catch (e: any) {
      Swal.fire("Error", e.response?.data?.detail || "No se pudo descomponer.", "error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        Descomponer Cargo #{cargo.numero_de_cargo}
      </DialogTitle>
      <DialogContent className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
          <p>
            <strong>Cargo origen:</strong>{" "}
            {cargo.tipo_cargo_detalle?.descripcion} ({cargo.tipo_cargo_detalle?.dedicacion}){" "}
            — <strong>Puntaje:</strong> {cargo.puntaje}
          </p>
          <p className="text-gray-600 mt-1">
            Elegí una combinación de tipos cuyos puntajes sumen exactamente el del cargo
            original. El cargo se desactiva y se crean N nuevos cargos.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium text-gray-700">Máx. piezas:</label>
          <select
            value={maxPiezas}
            onChange={(e) => {
              const v = Number(e.target.value);
              setMaxPiezas(v);
              fetchCombinaciones(v);
            }}
            className="px-2 py-1 border border-gray-300 rounded text-sm">
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <CircularProgress />
          </div>
        ) : combinaciones.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay combinaciones posibles con los parámetros actuales.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            {combinaciones.map((c, idx) => (
              <label
                key={idx}
                className={`flex items-start gap-3 p-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                  seleccionada === idx ? "bg-blue-50" : ""
                }`}>
                <Radio
                  checked={seleccionada === idx}
                  onChange={() => setSeleccionada(idx)}
                  size="small"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1">
                    {c.piezas.map((p, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                        <strong>{p.sigla || p.descripcion}</strong>-{p.dedicacion}
                        <span className="text-gray-500">({p.puntaje})</span>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {c.piezas.length} pieza(s) — total {c.puntaje_total}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones (opcional)
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Motivo de la descomposición..."
          />
        </div>
      </DialogContent>
      <DialogActions className="p-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 font-medium">
          Cancelar
        </button>
        <button
          onClick={ejecutar}
          disabled={seleccionada === null || enviando}
          className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed">
          {enviando ? "Ejecutando..." : "Descomponer"}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default DescomponerModal;
