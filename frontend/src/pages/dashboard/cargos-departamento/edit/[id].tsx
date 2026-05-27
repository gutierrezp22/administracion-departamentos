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

const EditarCargoDepartamento = () => {
  const router = useRouter();
  const { id } = router.query;

  const [descripcion, setDescripcion] = useState("");
  const [departamentoId, setDepartamentoId] = useState<number | "">("");
  const [asignaturaId, setAsignaturaId] = useState<number | "">("");
  const [tipoCargoId, setTipoCargoId] = useState<number | "">("");
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState("1");

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [tipos, setTipos] = useState<TipoCargo[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [redirectAfterClose, setRedirectAfterClose] = useState(false);

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
    if (!id) return;
    const fetchCargoDep = async () => {
      try {
        const r = await API.get(`/facet/cargo-departamento/${id}/`);
        const s = r.data;
        setDescripcion(s.descripcion || "");
        setDepartamentoId(s.departamento ?? "");
        setAsignaturaId(s.asignatura ?? "");
        setTipoCargoId(s.tipo_cargo ?? "");
        setObservaciones(s.observaciones || "");
        setEstado(String(s.estado ?? "1"));
        setInitialLoaded(true);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCargoDep();
  }, [id]);

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
    // Si el usuario cambia el departamento manualmente, limpiamos la asignatura.
    // En la carga inicial NO reseteamos.
    if (initialLoaded) setAsignaturaId("");
  }, [departamentoId]);

  const handleOpenModal = (title: string, message: string, redirect = false) => {
    setModalTitle(title);
    setModalMessage(message);
    setRedirectAfterClose(redirect);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    if (redirectAfterClose) {
      router.push("/dashboard/cargos-departamento/list");
      setRedirectAfterClose(false);
    }
  };

  const guardar = async () => {
    if (!departamentoId) {
      handleOpenModal("Error", "El departamento es obligatorio.");
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
      await API.put(`/facet/cargo-departamento/${id}/`, payload);
      handleOpenModal("Éxito", "Cargo de Departamento actualizado.", true);
    } catch (error: any) {
      let msg = "No se pudo realizar la acción.";
      if (error.response?.data) {
        const data = error.response.data;
        if (data.asignatura) msg = `Asignatura: ${data.asignatura[0] || data.asignatura}`;
        else if (data.detail) msg = data.detail;
        else if (typeof data === "string") msg = data;
      }
      handleOpenModal("Error", msg);
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Editar Cargo de Departamento">
        <FormSection title="Departamento y asignatura">
          <FormField
            label="Departamento *"
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
          <FormButton onClick={guardar}>Guardar Cambios</FormButton>
        </FormActions>

        <BasicModal
          open={modalVisible}
          onClose={handleCloseModal}
          title={modalTitle}
          content={modalMessage}
        />
      </FormContainer>
    </DashboardMenu>
  );
};

export default withAuth(EditarCargoDepartamento);
