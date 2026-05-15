import { useEffect, useMemo, useState } from "react";
import API from "@/api/axiosConfig";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Swal from "sweetalert2";

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

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        Combinar Cargos
      </DialogTitle>
      <DialogContent className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de cargo destino
          </label>
          <select
            value={tipoDestino}
            onChange={(e) =>
              setTipoDestino(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Seleccionar...</option>
            {tiposCoincidentes.length > 0 && (
              <optgroup label={`Coinciden con la suma (${sumaPuntajes.toFixed(2)})`}>
                {tiposCoincidentes.map((t) => (
                  <option key={t.id} value={t.id}>
                    ✓ {t.descripcion} — {t.dedicacion} ({t.puntaje} pts)
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Otros tipos con puntaje">
              {tipos
                .filter((t) => Number(t.puntaje) !== sumaPuntajes)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.descripcion} — {t.dedicacion} ({t.puntaje} pts)
                  </option>
                ))}
            </optgroup>
          </select>
          {tipoDestino && (() => {
            const t = tipos.find((x) => x.id === tipoDestino);
            if (!t) return null;
            const coincide = Number(t.puntaje) === sumaPuntajes;
            return (
              <p className={`text-xs mt-1 ${coincide ? "text-green-700" : "text-red-700"}`}>
                {coincide
                  ? `✓ Puntaje coincide (${t.puntaje} = ${sumaPuntajes.toFixed(2)})`
                  : `✗ Puntaje no coincide (${t.puntaje} ≠ ${sumaPuntajes.toFixed(2)}). El backend rechazará la operación.`}
              </p>
            );
          })()}
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones (opcional)
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
