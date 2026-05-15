import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import BasicModal from "@/utils/modal";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import {
  FormContainer,
  FormSection,
  FormField,
  FormActions,
  FormButton,
} from "@/components/Form";

interface TipoCargo {
  id: number;
  sigla: string;
  descripcion: string;
  dedicacion: string;
  puntaje: string | null;
}

const EditarCargo = () => {
  const router = useRouter();
  const { id } = router.query;

  const [numeroDeCargo, setNumeroDeCargo] = useState("");
  const [tipoCargoId, setTipoCargoId] = useState<number | "">("");
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState("1");
  const [tipos, setTipos] = useState<TipoCargo[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [redirectAfterClose, setRedirectAfterClose] = useState(false);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const response = await API.get(`/facet/tipo-cargo/?page_size=100`);
        setTipos(response.data.results);
      } catch (error) {
        console.error("Error tipos:", error);
      }
    };
    fetchTipos();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchCargo = async () => {
      try {
        const response = await API.get(`/facet/cargo/${id}/`);
        const c = response.data;
        setNumeroDeCargo(String(c.numero_de_cargo ?? ""));
        setTipoCargoId(c.tipo_cargo ?? "");
        setObservaciones(c.observaciones || "");
        setEstado(String(c.estado ?? "1"));
      } catch (error) {
        console.error("Error fetching cargo:", error);
      }
    };
    fetchCargo();
  }, [id]);

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
      router.push("/dashboard/cargos/list");
      setRedirectAfterClose(false);
    }
  };

  const guardar = async () => {
    if (!numeroDeCargo.trim()) {
      handleOpenModal("Error", "El número de cargo es obligatorio.");
      return;
    }

    const payload = {
      numero_de_cargo: Number(numeroDeCargo),
      tipo_cargo: tipoCargoId || null,
      observaciones: observaciones.trim() || null,
      estado: estado,
    };

    try {
      await API.put(`/facet/cargo/${id}/`, payload);
      handleOpenModal("Éxito", "La acción se realizó con éxito.", true);
    } catch (error: any) {
      let msg = "No se pudo realizar la acción.";
      if (error.response?.data?.numero_de_cargo) {
        msg = `Número de cargo: ${error.response.data.numero_de_cargo[0]}`;
      } else if (error.response?.data?.detail) {
        msg = error.response.data.detail;
      }
      handleOpenModal("Error", msg);
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Editar Cargo">
        <FormSection title="Información del Cargo">
          <FormField
            label="Número de Cargo"
            value={numeroDeCargo}
            onChange={(e) => setNumeroDeCargo(e.target.value)}
            type="number"
          />
          <FormField
            label="Tipo de Cargo"
            value={tipoCargoId === "" ? "" : tipoCargoId}
            onChange={(e) =>
              setTipoCargoId(e.target.value === "" ? "" : Number(e.target.value))
            }
            options={[
              { value: "", label: "(Sin tipo asignado)" },
              ...tipos.map((t) => ({
                value: t.id,
                label: `${t.descripcion} — ${t.dedicacion}${
                  t.puntaje ? ` (${t.puntaje} pts)` : ""
                }`,
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

export default withAuth(EditarCargo);
