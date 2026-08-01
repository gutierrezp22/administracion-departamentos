import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import BasicModal from "@/utils/modal";
import DashboardMenu from "../..";
import withAuth from "@/components/withAut";
import {
  FormContainer,
  FormSection,
  FormField,
  FormActions,
  FormButton,
} from "@/components/Form";

interface Departamento {
  id: number;
  nombre: string;
}

interface Asignatura {
  id: number;
  codigo: string;
  nombre: string;
}

interface TipoCargo {
  id: number;
  sigla: string;
  descripcion: string;
  dedicacion: string;
  puntaje: string | null;
}

const CrearCargoDepartamento = () => {
  const router = useRouter();

  const [descripcion, setDescripcion] = useState("");
  const [departamentoId, setDepartamentoId] = useState<number | "">("");
  const [asignaturaId, setAsignaturaId] = useState<number | "">("");
  const [tipoCargoId, setTipoCargoId] = useState<number | "">("");
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState("1");

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [tipos, setTipos] = useState<TipoCargo[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});

  useEffect(() => {
    const fetch = async () => {
      try {
        const [rD, rT] = await Promise.all([
          API.get(`/facet/departamento/?page_size=100&estado=1`),
          API.get(`/facet/tipo-cargo/?page_size=100`),
        ]);
        setDepartamentos(rD.data.results || []);
        setTipos(rT.data.results || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
  }, []);

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
      } catch {
        setAsignaturas([]);
      }
    };
    fetchAsig();
    setAsignaturaId(""); // reset al cambiar de depto
  }, [departamentoId]);

  const handleOpenModal = (title: string, message: string, onConfirm: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
    setFn(() => onConfirm);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
  };

  const crear = async () => {
    if (!departamentoId) {
      handleOpenModal("Error", "El departamento es obligatorio.", () => {});
      return;
    }

    const payload = {
      descripcion: descripcion.trim(),
      departamento: departamentoId,
      asignatura: asignaturaId || null,
      tipo_cargo: tipoCargoId || null,
      observaciones: observaciones.trim() || null,
      estado,
    };

    try {
      await API.post(`/facet/cargo-departamento/`, payload);
      handleOpenModal("Éxito", "Cargo de Departamento creado con éxito.", () => {
        router.push("/dashboard/cargos-departamento/list");
      });
    } catch (error: any) {
      console.error("Error al crear Cargo de Departamento:", error);
      let msg = "No se pudo realizar la acción.";
      if (error.response?.data) {
        const data = error.response.data;
        if (data.asignatura) msg = `Asignatura: ${data.asignatura[0] || data.asignatura}`;
        else if (data.detail) msg = data.detail;
        else if (typeof data === "string") msg = data;
      }
      handleOpenModal("Error", msg, () => {});
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Crear Cargo de Departamento">
        <FormSection title="Departamento y asignatura">
          <FormField
            label="Departamento"
            required
            value={departamentoId === "" ? "" : departamentoId}
            onChange={(e) =>
              setDepartamentoId(e.target.value === "" ? "" : Number(e.target.value))
            }
            options={[
              { value: "", label: "(Elegir departamento)" },
              ...departamentos.map((d) => ({ value: d.id, label: d.nombre })),
            ]}
          />
          <FormField
            label="Asignatura (opcional)"
            value={asignaturaId === "" ? "" : asignaturaId}
            onChange={(e) =>
              setAsignaturaId(e.target.value === "" ? "" : Number(e.target.value))
            }
            options={[
              { value: "", label: "(Sin asignatura)" },
              ...asignaturas.map((a) => ({
                value: a.id,
                label: `${a.codigo} — ${a.nombre}`,
              })),
            ]}
            disabled={!departamentoId}
          />
        </FormSection>

        <FormSection title="Información">
          <FormField
            label="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder='Ej. "Auxiliar de Análisis II"'
          />
          <FormField
            label="Tipo de cargo"
            value={tipoCargoId === "" ? "" : tipoCargoId}
            onChange={(e) =>
              setTipoCargoId(e.target.value === "" ? "" : Number(e.target.value))
            }
            options={[
              { value: "", label: "(Sin tipo)" },
              ...tipos.map((t) => ({
                value: t.id,
                label: `${t.descripcion} — ${t.dedicacion}${t.puntaje ? ` (${t.puntaje} pts)` : ""}`,
              })),
            ]}
          />
          <FormField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            rows={3}
          />
          <FormField
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            options={[
              { value: "1", label: "Activo" },
              { value: "0", label: "Inactivo" },
            ]}
          />
        </FormSection>

        <FormActions>
          <FormButton onClick={crear}>Crear Cargo de Departamento</FormButton>
        </FormActions>

        <BasicModal
          open={modalVisible}
          onClose={handleCloseModal}
          title={modalTitle}
          content={modalMessage}
          onConfirm={fn}
        />
      </FormContainer>
    </DashboardMenu>
  );
};

export default withAuth(CrearCargoDepartamento);
