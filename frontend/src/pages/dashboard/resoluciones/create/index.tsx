import { useState } from "react";
import "./styles.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useRouter } from "next/router";
import BasicModal from "@/utils/modal";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import API from "@/api/axiosConfig";
import { formatFechaParaBackend } from "@/utils/dateHelpers";
import {
  FormContainer,
  FormSection,
  FormField,
  FormDatePicker,
  FormActions,
  FormButton,
} from "@/components/Form";

dayjs.extend(utc);
dayjs.extend(timezone);

const CrearResolucion = () => {
  const router = useRouter();

  const [nroExpediente, setNroExpediente] = useState("");
  const [nroResolucion, setNroResolucion] = useState("");
  const [tipo, setTipo] = useState("");
  const [adjunto, setAdjunto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [fecha, setFecha] = useState<dayjs.Dayjs | null>(null);
  const [estado, setEstado] = useState("");
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
    router.push("/dashboard/resoluciones/");
  };

  const crearNuevaResolucion = async () => {
    if (!nroResolucion.trim()) {
      handleOpenModal("Error", "El número de resolución es obligatorio.", () => {});
      return;
    }
    if (!tipo) {
      handleOpenModal("Error", "Debe seleccionar un tipo de resolución.", () => {});
      return;
    }
    if (!fecha) {
      handleOpenModal("Error", "Debe seleccionar una fecha.", () => {});
      return;
    }

    const nuevaResolucion = {
      nexpediente: nroExpediente,
      nresolucion: nroResolucion.trim(),
      tipo: tipo,
      adjunto: adjunto,
      observaciones: observaciones,
      fecha: formatFechaParaBackend(fecha),
      estado: estado,
    };

    try {
      await API.post(`/facet/resolucion/`, nuevaResolucion);
      handleOpenModal("Éxito", "Se creó la resolución con éxito.", handleConfirmModal);
    } catch (error: any) {
      console.error("Error al crear resolución:", error);
      let errorMessage = "No se pudo crear la resolución.";

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === "object") {
          const fieldErrors = errorData.errors || errorData;
          const errorMessages: string[] = [];
          const fieldNames = {
            nexpediente: "Nro Expediente",
            nresolucion: "Nro Resolución",
            tipo: "Tipo",
            adjunto: "Adjunto",
            observaciones: "Observaciones",
            fecha: "Fecha",
            estado: "Estado",
          };
          for (const [field, messages] of Object.entries(fieldErrors)) {
            const fieldName =
              fieldNames[field as keyof typeof fieldNames] || field;
            const fieldMessages = Array.isArray(messages)
              ? messages
              : [messages];
            for (const msg of fieldMessages) {
              errorMessages.push(`${fieldName}: ${msg}`);
            }
          }
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join("\n");
          }
        }
      }

      handleOpenModal("Error de Validación", errorMessage, () => {});
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Crear Resolución">
        <FormSection title="Información Principal">
          <FormField
            label="Nro Expediente"
            value={nroExpediente}
            onChange={(e) => setNroExpediente(e.target.value)}
          />
          <FormField
            label="Nro Resolución"
            value={nroResolucion}
            onChange={(e) => setNroResolucion(e.target.value)}
          />
          <FormField
            label="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            options={[
              { value: "Rector", label: "Rector" },
              { value: "Decano", label: "Decano" },
              { value: "Consejo_Superior", label: "Consejo Superior" },
              { value: "Consejo_Directivo", label: "Consejo Directivo" },
            ]}
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

        <FormSection title="Documento y Fecha">
          <FormField
            label="Link Documento Adjunto"
            value={adjunto}
            onChange={(e) => setAdjunto(e.target.value)}
          />
          <FormDatePicker
            label="Fecha"
            value={fecha}
            onChange={(date) => {
              if (date) {
                setFecha(dayjs(date).utc());
              } else {
                setFecha(null);
              }
            }}
          />
          <FormField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            rows={2}
          />
        </FormSection>

        <FormActions>
          <FormButton onClick={crearNuevaResolucion}>Crear Resolución</FormButton>
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

export default withAuth(CrearResolucion);
