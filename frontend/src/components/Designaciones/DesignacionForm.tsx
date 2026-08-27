// Formulario compartido por crear y editar designaciones.
// Concentra acá la lógica de dependencias entre campos (tipo de trámite →
// campos obligatorios, tipo de cargo → código) para no duplicarla.

import { useEffect, useMemo, useState } from "react";
import API from "@/api/axiosConfig";
import {
  FormContainer,
  FormSection,
  FormField,
  FormActions,
  FormButton,
} from "@/components/Form";
import BasicModal from "@/utils/modal";

export interface DesignacionPayload {
  docente: number | "";
  tipo: string;
  tipo_cargo: number | "";
  codigo_cargo: number | "";
  cargo_departamento: number | "";
  area: number | "";
  asignatura: number | "";
  resolucion: number | "";
  tipo_instrumento: string;
  expediente: string;
  nro_resolucion: string;
  dgpres: string;
  fecha_desde: string;
  fecha_hasta: string;
  en_tramite: boolean;
  renuncia_definitiva: boolean;
  rol_gestion: string;
  observaciones: string;
  estado: string;
}

export const VACIO: DesignacionPayload = {
  docente: "",
  tipo: "DI_GENUINO",
  tipo_cargo: "",
  codigo_cargo: "",
  cargo_departamento: "",
  area: "",
  asignatura: "",
  resolucion: "",
  tipo_instrumento: "",
  expediente: "",
  nro_resolucion: "",
  dgpres: "",
  fecha_desde: "",
  fecha_hasta: "",
  en_tramite: false,
  renuncia_definitiva: false,
  rol_gestion: "",
  observaciones: "",
  estado: "1",
};

// Duración que otorga cada trámite. Espeja Designacion.DURACIONES del backend;
// acá sólo se usa para mostrarle al usuario cuándo va a vencer.
const DURACIONES: Record<string, number | null> = {
  CON: 5,
  CON_INTERINO: 1,
  DI_GENUINO: 1,
  DI_NO_GENUINO: 1,
  EA_POSITIVA: 5,
  EA_NEGATIVA: 3,
  PRORROGA_DI_GENUINO: 1,
  PRORROGA_DI_NO_GENUINO: 1,
  PROR_70_ANIOS: null,
  PROR_CARGO_GESTION: null,
  RENUNCIA: 0,
  REINTEGRO: 0,
  ALTA: null,
  BAJA: 0,
};

const TIPOS = [
  { value: "CON", label: "Concurso" },
  { value: "CON_INTERINO", label: "Concurso interino" },
  { value: "DI_GENUINO", label: "Designación interina genuina" },
  { value: "DI_NO_GENUINO", label: "Designación interina no genuina" },
  { value: "EA_POSITIVA", label: "Evaluación académica positiva" },
  { value: "EA_NEGATIVA", label: "Evaluación académica negativa" },
  { value: "PRORROGA_DI_GENUINO", label: "Prórroga de DI genuina" },
  { value: "PRORROGA_DI_NO_GENUINO", label: "Prórroga de DI no genuina" },
  { value: "PROR_70_ANIOS", label: "Prórroga 70 años" },
  { value: "PROR_CARGO_GESTION", label: "Prórroga por cargo de gestión" },
  { value: "RENUNCIA", label: "Renuncia" },
  { value: "REINTEGRO", label: "Reintegro" },
  { value: "ALTA", label: "Alta de cargo" },
  { value: "BAJA", label: "Baja de cargo" },
];

const INSTRUMENTOS = [
  { value: "", label: "(Sin especificar)" },
  { value: "Res_Rec", label: "Resolución Rectoral" },
  { value: "Res_Dec", label: "Resolución Decanal" },
  { value: "Res_CD", label: "Resolución de Consejo Directivo" },
  { value: "DGPRES", label: "Disposición DGPRES" },
  { value: "Expte", label: "Sólo expediente" },
  { value: "Sin_instrumento", label: "Sin instrumento" },
];

interface Opcion {
  id: number;
  label: string;
}

const listaDe = (data: any): any[] =>
  Array.isArray(data) ? data : data?.results ?? [];

export const DesignacionForm: React.FC<{
  titulo: string;
  valor: DesignacionPayload;
  onChange: (v: DesignacionPayload) => void;
  onSubmit: () => Promise<void>;
  textoBoton: string;
}> = ({ titulo, valor, onChange, onSubmit, textoBoton }) => {
  const [docentes, setDocentes] = useState<Opcion[]>([]);
  const [buscarDocente, setBuscarDocente] = useState("");
  const [tiposCargo, setTiposCargo] = useState<any[]>([]);
  const [areas, setAreas] = useState<Opcion[]>([]);
  const [asignaturas, setAsignaturas] = useState<Opcion[]>([]);
  const [resoluciones, setResoluciones] = useState<Opcion[]>([]);

  const [modal, setModal] = useState<{ t: string; m: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const set = <K extends keyof DesignacionPayload>(
    k: K,
    v: DesignacionPayload[K]
  ) => onChange({ ...valor, [k]: v });

  // Catálogos fijos
  useEffect(() => {
    Promise.all([
      API.get("/facet/tipo-cargo/?page_size=100"),
      API.get("/facet/area/?page_size=200&estado=1"),
      API.get("/facet/asignatura/?page_size=300&estado=1"),
      API.get("/facet/resolucion/?page_size=200&estado=1"),
    ])
      .then(([tc, ar, asg, res]) => {
        setTiposCargo(listaDe(tc.data));
        setAreas(
          listaDe(ar.data).map((a: any) => ({ id: a.id, label: a.nombre }))
        );
        setAsignaturas(
          listaDe(asg.data).map((a: any) => ({
            id: a.id,
            label: `${a.codigo} — ${a.nombre}`,
          }))
        );
        setResoluciones(
          listaDe(res.data).map((r: any) => ({
            id: r.id,
            label: `${r.nresolucion} · Expte ${r.nexpediente}`,
          }))
        );
      })
      .catch(() => undefined);
  }, []);

  // Docentes: se busca por texto para no traer la planta entera.
  useEffect(() => {
    const t = setTimeout(() => {
      const q = buscarDocente.trim();
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
  }, [buscarDocente]);

  // El código de cargo se deriva del tipo de cargo elegido.
  useEffect(() => {
    if (!valor.tipo_cargo) return;
    const tc = tiposCargo.find((t) => t.id === valor.tipo_cargo);
    if (tc?.codigo && tc.codigo !== valor.codigo_cargo) {
      onChange({ ...valor, codigo_cargo: tc.codigo });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor.tipo_cargo, tiposCargo]);

  const duracion = DURACIONES[valor.tipo];
  const vencimientoPrevisto = useMemo(() => {
    if (valor.fecha_hasta) return `${valor.fecha_hasta} (explícita)`;
    if (duracion === null || duracion === undefined || !valor.fecha_desde)
      return "no se puede estimar";
    const d = new Date(valor.fecha_desde + "T00:00:00");
    d.setFullYear(d.getFullYear() + duracion);
    return `${d.toISOString().slice(0, 10)} (estimada: +${duracion} año/s)`;
  }, [valor.fecha_desde, valor.fecha_hasta, duracion]);

  const esGestion = valor.tipo === "PROR_CARGO_GESTION";
  const esRenuncia = valor.tipo === "RENUNCIA";

  const validar = (): string | null => {
    if (!valor.docente) return "Elegí el docente.";
    if (!valor.tipo) return "Elegí el tipo de trámite.";
    if (!esGestion && !valor.tipo_cargo && !valor.codigo_cargo)
      return "Indicá el tipo de cargo o el código de cargo: sin eso la designación no se puede agrupar en una ocupación.";
    if (esGestion && !valor.rol_gestion.trim())
      return "Indicá el cargo de gestión que motiva la prórroga.";
    if (
      valor.fecha_desde &&
      valor.fecha_hasta &&
      valor.fecha_hasta < valor.fecha_desde
    )
      return "La fecha de vencimiento no puede ser anterior al inicio.";
    return null;
  };

  const guardar = async () => {
    const err = validar();
    if (err) {
      setModal({ t: "Revisá los datos", m: err });
      return;
    }
    setGuardando(true);
    try {
      await onSubmit();
    } catch (e: any) {
      const d = e?.response?.data;
      let msg = "No se pudo guardar la designación.";
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
      <FormSection title="Docente y trámite">
        <FormField
          label="Buscar docente"
          value={buscarDocente}
          onChange={(e) => setBuscarDocente(e.target.value)}
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
          helperText={
            docentes.length >= 50
              ? "Se muestran los primeros 50: afiná la búsqueda."
              : undefined
          }
        />
        <FormField
          label="Tipo de trámite"
          required
          value={valor.tipo}
          onChange={(e) => set("tipo", e.target.value)}
          options={TIPOS}
          helperText={
            duracion === null
              ? "Este trámite no otorga una duración fija: el vencimiento sale de la fecha explícita o de la edad."
              : `Otorga ${duracion} año/s de vigencia si no se carga una fecha de vencimiento.`
          }
        />
      </FormSection>

      <FormSection title="Cargo">
        <FormField
          label="Tipo de cargo"
          value={valor.tipo_cargo === "" ? "" : valor.tipo_cargo}
          onChange={(e) =>
            set("tipo_cargo", e.target.value === "" ? "" : Number(e.target.value))
          }
          options={[
            { value: "", label: "(Sin tipo de cargo)" },
            ...tiposCargo.map((t) => ({
              value: t.id,
              label: `${t.codigo ? `${t.codigo} · ` : ""}${t.descripcion} — ${t.dedicacion}${
                t.horas_semanales ? ` (${t.horas_semanales}h)` : ""
              }`,
            })),
          ]}
        />
        <FormField
          label="Código de cargo"
          type="number"
          value={valor.codigo_cargo === "" ? "" : valor.codigo_cargo}
          onChange={(e) =>
            set("codigo_cargo", e.target.value === "" ? "" : Number(e.target.value))
          }
          helperText="Se completa solo desde el tipo de cargo. Es la clave por la que se agrupan las designaciones de un mismo cargo."
        />
        <FormField
          label="Área"
          value={valor.area === "" ? "" : valor.area}
          onChange={(e) =>
            set("area", e.target.value === "" ? "" : Number(e.target.value))
          }
          options={[
            { value: "", label: "(Sin área)" },
            ...areas.map((a) => ({ value: a.id, label: a.label })),
          ]}
        />
        <FormField
          label="Asignatura"
          value={valor.asignatura === "" ? "" : valor.asignatura}
          onChange={(e) =>
            set("asignatura", e.target.value === "" ? "" : Number(e.target.value))
          }
          options={[
            { value: "", label: "(Sin asignatura)" },
            ...asignaturas.map((a) => ({ value: a.id, label: a.label })),
          ]}
        />
        {esGestion && (
          <FormField
            label="Cargo de gestión"
            required
            value={valor.rol_gestion}
            onChange={(e) => set("rol_gestion", e.target.value)}
            placeholder="Decano, Vicedecano, Secretario…"
          />
        )}
      </FormSection>

      <FormSection title="Vigencia">
        <FormField
          label="Fecha de inicio"
          type="date"
          value={valor.fecha_desde}
          onChange={(e) => set("fecha_desde", e.target.value)}
        />
        <FormField
          label="Fecha de vencimiento (si es explícita)"
          type="date"
          value={valor.fecha_hasta}
          onChange={(e) => set("fecha_hasta", e.target.value)}
          helperText={`Vencimiento que va a mostrar el reporte: ${vencimientoPrevisto}`}
        />
        <FormField
          label="¿En trámite?"
          value={valor.en_tramite ? "1" : "0"}
          onChange={(e) => set("en_tramite", e.target.value === "1")}
          options={[
            { value: "0", label: "No — tiene instrumento firme" },
            { value: "1", label: "Sí — iniciada, sin instrumento firme" },
          ]}
          helperText="Una designación en trámite no extiende el vencimiento del cargo: se reporta aparte como renovación en curso."
        />
        {esRenuncia && (
          <FormField
            label="¿Renuncia definitiva?"
            value={valor.renuncia_definitiva ? "1" : "0"}
            onChange={(e) => set("renuncia_definitiva", e.target.value === "1")}
            options={[
              { value: "0", label: "No — condicionada" },
              { value: "1", label: "Sí — definitiva" },
            ]}
          />
        )}
      </FormSection>

      <FormSection title="Instrumento legal">
        <FormField
          label="Tipo de instrumento"
          value={valor.tipo_instrumento}
          onChange={(e) => set("tipo_instrumento", e.target.value)}
          options={INSTRUMENTOS}
        />
        <FormField
          label="Expediente"
          value={valor.expediente}
          onChange={(e) => set("expediente", e.target.value)}
          placeholder="Ej. 3229/2024"
        />
        <FormField
          label="Resolución cargada"
          value={valor.resolucion === "" ? "" : valor.resolucion}
          onChange={(e) =>
            set("resolucion", e.target.value === "" ? "" : Number(e.target.value))
          }
          options={[
            { value: "", label: "(No vinculada)" },
            ...resoluciones.map((r) => ({ value: r.id, label: r.label })),
          ]}
        />
        <FormField
          label="Nº de resolución (si aún no se cargó la resolución)"
          value={valor.nro_resolucion}
          onChange={(e) => set("nro_resolucion", e.target.value)}
          placeholder="Ej. 1234/2024"
        />
        <FormField
          label="DGPRES"
          value={valor.dgpres}
          onChange={(e) => set("dgpres", e.target.value)}
          placeholder="Ej. DGPRES 1374/2024"
          helperText="Disposición presupuestaria que habilita el gasto. Sin esto el cargo puede no estar habilitado para cobrar."
        />
      </FormSection>

      <FormSection title="Otros">
        <FormField
          label="Observaciones"
          value={valor.observaciones}
          onChange={(e) => set("observaciones", e.target.value)}
          multiline
          rows={3}
        />
        <FormField
          label="Estado"
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

/** Convierte el estado del formulario en el body que espera la API. */
export const aPayload = (v: DesignacionPayload) => ({
  docente: v.docente,
  tipo: v.tipo,
  tipo_cargo: v.tipo_cargo || null,
  codigo_cargo: v.codigo_cargo || null,
  cargo_departamento: v.cargo_departamento || null,
  area: v.area || null,
  asignatura: v.asignatura || null,
  resolucion: v.resolucion || null,
  tipo_instrumento: v.tipo_instrumento || null,
  expediente: v.expediente.trim() || null,
  nro_resolucion: v.nro_resolucion.trim() || null,
  dgpres: v.dgpres.trim() || null,
  fecha_desde: v.fecha_desde || null,
  fecha_hasta: v.fecha_hasta || null,
  en_tramite: v.en_tramite,
  renuncia_definitiva: v.renuncia_definitiva,
  rol_gestion: v.rol_gestion.trim() || null,
  observaciones: v.observaciones.trim() || null,
  estado: v.estado,
});

export default DesignacionForm;
