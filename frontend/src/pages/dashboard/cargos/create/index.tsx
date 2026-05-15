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

const CrearCargo = () => {
  const router = useRouter();

  const [numeroDeCargo, setNumeroDeCargo] = useState("");
  const [tipoCargoId, setTipoCargoId] = useState<number | "">("");
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState("1");
  const [tipos, setTipos] = useState<TipoCargo[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const response = await API.get(`/facet/tipo-cargo/?page_size=100`);
        setTipos(response.data.results);
      } catch (error) {
        console.error("Error al cargar tipos de cargo:", error);
      }
    };
    fetchTipos();
  }, []);

  const handleOpenModal = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
    setFn(() => onConfirm);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
  };

  const crearCargo = async () => {
    if (!numeroDeCargo.trim()) {
      handleOpenModal("Error", "El número de cargo es obligatorio.", () => {});
      return;
    }
    if (!Number.isInteger(Number(numeroDeCargo)) || Number(numeroDeCargo) <= 0) {
      handleOpenModal("Error", "El número de cargo debe ser un entero positivo.", () => {});
      return;
    }

    const payload = {
      numero_de_cargo: Number(numeroDeCargo),
      tipo_cargo: tipoCargoId || null,
      observaciones: observaciones.trim() || null,
      estado: estado,
    };

    try {
      await API.post(`/facet/cargo/`, payload);
      handleOpenModal("Éxito", "Se creó el cargo con éxito.", () => {
        router.push("/dashboard/cargos/list");
      });
    } catch (error: any) {
      console.error("Error al crear cargo:", error);
      let msg = "No se pudo realizar la acción.";
      if (error.response?.data?.numero_de_cargo) {
        msg = `Número de cargo: ${error.response.data.numero_de_cargo[0]}`;
      } else if (error.response?.data?.detail) {
        msg = error.response.data.detail;
      }
      handleOpenModal("Error", msg, () => {});
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Crear Cargo">
        <FormSection title="Información del Cargo">
          <FormField
            label="Número de Cargo"
            value={numeroDeCargo}
            onChange={(e) => setNumeroDeCargo(e.target.value)}
            type="number"
            required
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
          <FormButton onClick={crearCargo}>Crear Cargo</FormButton>
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

export default withAuth(CrearCargo);
