// Formulario compartido por crear y editar seguimientos.

import { useEffect, useState } from "react";
import API from "@/api/axiosConfig";
import {
  FormContainer,
  FormSection,
  FormField,
  FormActions,
  FormButton,
} from "@/components/Form";
import BasicModal from "@/utils/modal";

export interface SeguimientoPayload {
  docente: number | "";
  tipo: string;
  descripcion: string;
  fecha_novedad: string;
  fecha_resolucion: string;
  responsable: string;
  prioridad: string;
  estado_seguimiento: string;
  observaciones: string;
  estado: string;
}

export const VACIO: SeguimientoPayload = {
  docente: "",
  tipo: "otro",
  descripcion: "",
  fecha_novedad: new Date().toISOString().slice(0, 10),
  fecha_resolucion: "",
  responsable: "",
  prioridad: "media",
  estado_seguimiento: "pendiente",
  observaciones: "",
  estado: "1",
};

export const TIPOS = [
  { value: "ea_iniciar", label: "Iniciar evaluación académica" },
  { value: "regularizar_cargo", label: "Regularizar cargo" },
  { value: "cobro_sueldo", label: "Revisar cobro de sueldo" },
  { value: "di_no_genuina", label: "Designación interina no genuina" },
  { value: "renovacion", label: "Renovación pendiente" },
  { value: "concurso", label: "Llamado a concurso" },
  { value: "jubilacion", label: "Trámite jubilatorio" },
  { value: "licencia", label: "Licencia" },
  { value: "otro", label: "Otro" },
];

export const ESTADOS_SEG = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_curso", label: "En curso" },
  { value: "resuelto", label: "Resuelto" },
  { value: "descartado", label: "Descartado" },
];

const listaDe = (data: any): any[] =>
  Array.isArray(data) ? data : data?.results ?? [];

export const SeguimientoForm: React.FC<{
  titulo: string;
  valor: SeguimientoPayload;
  onChange: (v: SeguimientoPayload) => void;
  onSubmit: () => Promise<void>;
  textoBoton: string;
}> = ({ titulo, valor, onChange, onSubmit, textoBoton }) => {
  const [docentes, setDocentes] = useState<{ id: number; label: string }[]>([]);
  const [buscar, setBuscar] = useState("");
  const [modal, setModal] = useState<{ t: string; m: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const set = <K extends keyof SeguimientoPayload>(
    k: K,
    v: SeguimientoPayload[K]
  ) => onChange({ ...valor, [k]: v });

  useEffect(() => {
    const t = setTimeout(() => {
      const q = buscar.trim();
      API.get(`/facet/docente/?page_size=50${q ? `&search=${encodeURIComponent(q)}` : ""}`)
        .then(({ data }) =>
          setDocentes(
            listaDe(data).map((d: any) => ({
              id: d.id,
              label: d.persona_detalle
                ? `${d.persona_detalle.apellido}, ${d.persona_detalle.nombre} (DNI ${d.persona_detalle.dni})`
                : `Docente #${d.id}`,
            }))
          )
        )
        .catch(() => setDocentes([]));
    }, 300);
    return () => clearTimeout(t);
  }, [buscar]);

  const guardar = async () => {
    if (!valor.docente) {
      setModal({ t: "Revisá los datos", m: "Elegí el docente." });
      return;
    }
    if (!valor.descripcion.trim()) {
      setModal({ t: "Revisá los datos", m: "Escribí qué hay que hacer." });
      return;
    }
    if (!valor.fecha_novedad) {
      setModal({ t: "Revisá los datos", m: "Indicá la fecha de la novedad." });
      return;
    }
    if (valor.estado_seguimiento === "resuelto" && !valor.fecha_resolucion) {
      setModal({
        t: "Revisá los datos",
        m: "Un seguimiento resuelto necesita fecha de resolución.",
      });
      return;
    }

    setGuardando(true);
    try {
      await onSubmit();
    } catch (e: any) {
      const d = e?.response?.data;
      let msg = "No se pudo guardar el seguimiento.";
      if (d) {
        if (typeof d === "string") msg = d;
        else if (d.detail) msg = d.detail;
        else {
          const primera = Object.entries(d)[0];
          if (primera)
            msg = `${primera[0]}: ${
              Array.isArray(primera[1]) ? primera[1][0] : primera[1]
            }`;
        }
      }
      setModal({ t: "Error", m: msg });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <FormContainer title={titulo}>
      <FormSection title="Docente">
        <FormField
          label="Buscar docente"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Apellido, DNI o legajo…"
        />
        <FormField
          label="Docente"
          required
          value={valor.docente === "" ? "" : valor.docente}
          onChange={(e) =>
            set("docente", e.target.value === "" ? "" : Number(e.target.value))
          }
          options={[
            { value: "", label: "(Elegir docente)" },
            ...docentes.map((d) => ({ value: d.id, label: d.label })),
          ]}
        />
      </FormSection>

      <FormSection title="Novedad">
        <FormField
          label="Tipo"
          value={valor.tipo}
          onChange={(e) => set("tipo", e.target.value)}
          options={TIPOS}
        />
        <FormField
          label="Qué hay que hacer"
          required
          value={valor.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          multiline
          rows={2}
          placeholder='Ej. "Revisar cobro de sueldo: problemas con DGPRES"'
        />
        <FormField
          label="Fecha de la novedad"
          type="date"
          required
          value={valor.fecha_novedad}
          onChange={(e) => set("fecha_novedad", e.target.value)}
        />
        <FormField
          label="Responsable"
          value={valor.responsable}
          onChange={(e) => set("responsable", e.target.value)}
          placeholder="Ej. Depto Personal, DEEC, Dirección…"
        />
      </FormSection>

      <FormSection title="Seguimiento">
        <FormField
          label="Prioridad"
          value={valor.prioridad}
          onChange={(e) => set("prioridad", e.target.value)}
          options={[
            { value: "alta", label: "Alta" },
            { value: "media", label: "Media" },
            { value: "baja", label: "Baja" },
          ]}
        />
        <FormField
          label="Estado del seguimiento"
          value={valor.estado_seguimiento}
          onChange={(e) => set("estado_seguimiento", e.target.value)}
          options={ESTADOS_SEG}
        />
        <FormField
          label="Fecha de resolución"
          type="date"
          value={valor.fecha_resolucion}
          onChange={(e) => set("fecha_resolucion", e.target.value)}
          required={valor.estado_seguimiento === "resuelto"}
          helperText="Obligatoria si el seguimiento está resuelto."
        />
        <FormField
          label="Observaciones"
          value={valor.observaciones}
          onChange={(e) => set("observaciones", e.target.value)}
          multiline
          rows={3}
        />
        <FormField
          label="Estado del registro"
          value={valor.estado}
          onChange={(e) => set("estado", e.target.value)}
          options={[
            { value: "1", label: "Activo" },
            { value: "0", label: "Inactivo" },
          ]}
        />
      </FormSection>

      <FormActions>
        <FormButton onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : textoBoton}
        </FormButton>
      </FormActions>

      <BasicModal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.t ?? ""}
        content={modal?.m ?? ""}
        onConfirm={() => setModal(null)}
      />
    </FormContainer>
  );
};

export const aPayload = (v: SeguimientoPayload) => ({
  docente: v.docente,
  tipo: v.tipo,
  descripcion: v.descripcion.trim(),
  fecha_novedad: v.fecha_novedad,
  fecha_resolucion: v.fecha_resolucion || null,
  responsable: v.responsable.trim() || null,
  prioridad: v.prioridad,
  estado_seguimiento: v.estado_seguimiento,
  observaciones: v.observaciones.trim() || null,
  estado: v.estado,
});

export default SeguimientoForm;
