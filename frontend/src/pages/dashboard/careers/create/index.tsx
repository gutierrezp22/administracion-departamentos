import { useState } from "react";
import "./styles.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import DashboardMenu from "../../../dashboard";
import withAuth from "../../../../components/withAut";
import API from "../../../../api/axiosConfig";
import {
  FormContainer,
  FormSection,
  FormField,
  FormActions,
  FormButton,
} from "@/components/Form";

dayjs.extend(utc);
dayjs.extend(timezone);

const CrearCarrera = () => {
  const router = useRouter();

  type TipoCarrera = "Pregrado" | "Grado" | "Posgrado";

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [planEstudio, setPlanEstudio] = useState("");
  const [sitio, setsitio] = useState("");
  const [estado, setEstado] = useState("1");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});

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

  const handleConfirmModal = () => {
    router.push("/dashboard/careers/");
  };

  const crearNuevaCarrera = async () => {
    if (!nombre.trim()) {
      handleOpenModal("Error", "El nombre de la carrera es obligatorio.", () => {});
      return;
    }
    if (!tipo) {
      handleOpenModal("Error", "Debe seleccionar un tipo de carrera.", () => {});
      return;
    }

    const nuevaCarrera = {
      nombre: nombre.trim(),
      tipo: tipo,
      planestudio: planEstudio.trim() || null,
      sitio: sitio.trim() || null,
      estado: estado,
    };

    try {
      await API.post(`/facet/carrera/`, nuevaCarrera);
      handleOpenModal("Éxito", "Se creó la carrera con éxito.", handleConfirmModal);
    } catch (error: any) {
      console.error("Error al crear carrera:", error);
      let errorMessage = "No se pudo crear la carrera.";

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors || (typeof errorData === "object" && !errorData.message)) {
          const fieldErrors = errorData.errors || errorData;
          const errorMessages: string[] = [];
          const fieldNames = {
            nombre: "Nombre",
            tipo: "Tipo",
            planestudio: "Plan de Estudio",
            sitio: "Sitio",
            estado: "Estado",
          };
          for (const [field, messages] of Object.entries(fieldErrors)) {
            const fieldName = fieldNames[field as keyof typeof fieldNames] || field;
            const fieldMessages = Array.isArray(messages) ? messages : [messages];
            for (const msg of fieldMessages) {
              errorMessages.push(`${fieldName}: ${msg}`);
            }
          }
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join("\n");
          }
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.non_field_errors) {
          const nonFieldErrors = Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors
            : [errorData.non_field_errors];
          errorMessage = nonFieldErrors.join("\n");
        }
      }

      handleOpenModal("Error de Validación", errorMessage, () => {});
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Crear Carrera">
        <FormSection title="Información de la Carrera">
          <FormField
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <FormField
            label="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCarrera)}
            options={[
              { value: "Pregrado", label: "Pregrado" },
              { value: "Grado", label: "Grado" },
              { value: "Posgrado", label: "Posgrado" },
            ]}
          />
          <FormField
            label="Plan de Estudio"
            value={planEstudio}
            onChange={(e) => setPlanEstudio(e.target.value)}
          />
          <FormField
            label="Sitio"
            value={sitio}
            onChange={(e) => setsitio(e.target.value)}
          />
          <FormField
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            options={[
              { value: 1, label: "Activo" },
              { value: 0, label: "Inactivo" },
            ]}
          />
        </FormSection>

        <FormActions>
          <FormButton onClick={crearNuevaCarrera}>Crear Carrera</FormButton>
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

export default withAuth(CrearCarrera);
