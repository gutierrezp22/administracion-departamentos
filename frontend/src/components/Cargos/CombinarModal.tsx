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

interface TipoCargo {
  id: number;
  sigla: string;
  descripcion: string;
  dedicacion: string;
  puntaje: string | null;
}

interface Cargo {
  id: number;
  numero_de_cargo: number;
  puntaje: string | null;
  tipo_cargo_detalle: {
    descripcion: string;
    dedicacion: string;
  } | null;
}

interface Props {
  cargos: Cargo[];
  onClose: () => void;
  onSuccess: () => void;
}

const CombinarModal: React.FC<Props> = ({ cargos, onClose, onSuccess }) => {
  const [tipos, setTipos] = useState<TipoCargo[]>([]);
  const [tipoDestino, setTipoDestino] = useState<number | "">("");
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  const sumaPuntajes = useMemo(
    () => cargos.reduce((acc, c) => acc + Number(c.puntaje || 0), 0),
    [cargos]
  );

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await API.get(`/facet/tipo-cargo/?puntaje__isnull=false&page_size=100`);
        setTipos(r.data.results || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
  }, []);

  // Sugerencias: tipos cuyo puntaje coincide con la suma
  const tiposCoincidentes = useMemo(
    () => tipos.filter((t) => Number(t.puntaje) === sumaPuntajes),
    [tipos, sumaPuntajes]
  );

  const ejecutar = async () => {
    if (!tipoDestino) {
      Swal.fire("Falta tipo", "Elegí un tipo de cargo destino.", "warning");
      return;
    }
    setEnviando(true);
    try {
      await API.post(`/facet/cargo/combinar/`, {
        cargos: cargos.map((c) => c.id),
        tipo_cargo_destino: tipoDestino,
        observaciones,
      });
      Swal.fire("Listo", "Cargos combinados con éxito.", "success");
      onSuccess();
    } catch (e: any) {
      Swal.fire("Error", e.response?.data?.detail || "No se pudo combinar.", "error");
    } finally {
      setEnviando(false);
    }
  };

  // Opciones unificadas, con prefijo ✓ para las coincidentes (ordenadas primero)
  const tipoDestinoOptions = useMemo(
    () => [
      ...tiposCoincidentes.map((t) => ({
        value: String(t.id),
        label: `✓ ${t.descripcion} — ${t.dedicacion} (${t.puntaje} pts)`,
      })),
      ...tipos
        .filter((t) => Number(t.puntaje) !== sumaPuntajes)
        .map((t) => ({
          value: String(t.id),
          label: `${t.descripcion} — ${t.dedicacion} (${t.puntaje} pts)`,
        })),
    ],
    [tipos, tiposCoincidentes, sumaPuntajes]
  );

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: "1rem", overflow: "hidden" } }}
    >
      <DialogTitle className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-b border-purple-700/20 shadow-sm">
        Combinar Cargos
      </DialogTitle>
      <DialogContent dividers className="p-6 bg-gray-50/30">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm">
          <p className="font-semibold mb-2">Cargos a combinar:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {cargos.map((c) => (
              <li key={c.id}>
                #{c.numero_de_cargo} — {c.tipo_cargo_detalle?.descripcion}{" "}
                ({c.tipo_cargo_detalle?.dedicacion}) =&gt; <strong>{c.puntaje}</strong>
              </li>
            ))}
          </ul>
          <p className="mt-2">
            <strong>Suma de puntajes:</strong> {sumaPuntajes.toFixed(2)}
          </p>
        </div>

        <div className="mb-4">
          <FilterSelect
            label={`Tipo de cargo destino (los que empiezan con ✓ coinciden con ${sumaPuntajes.toFixed(2)})`}
            value={tipoDestino === "" ? "" : String(tipoDestino)}
            onChange={(v) => setTipoDestino(v === "" ? "" : Number(v))}
            options={tipoDestinoOptions}
            placeholder="Seleccionar..."
          />
          {tipoDestino && (() => {
            const t = tipos.find((x) => x.id === tipoDestino);
            if (!t) return null;
            const coincide = Number(t.puntaje) === sumaPuntajes;
            return (
              <p className={`text-xs mt-2 ${coincide ? "text-green-700" : "text-red-700"}`}>
                {coincide
                  ? `✓ Puntaje coincide (${t.puntaje} = ${sumaPuntajes.toFixed(2)})`
                  : `✗ Puntaje no coincide (${t.puntaje} ≠ ${sumaPuntajes.toFixed(2)}). El backend rechazará la operación.`}
              </p>
            );
          })()}
        </div>

        <div className="mb-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Observaciones (opcional)
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-400 hover:bg-white transition-all duration-200 text-sm text-gray-700 placeholder-gray-400 shadow-sm"
            placeholder="Motivo de la combinación..."
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
          disabled={!tipoDestino || enviando}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed">
          {enviando ? "Ejecutando..." : "Combinar"}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default CombinarModal;
