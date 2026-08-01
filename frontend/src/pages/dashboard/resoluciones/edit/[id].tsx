import { useEffect, useState } from "react";
import "./styles.css";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useRouter } from "next/router";
import BasicModal from "@/utils/modal";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import API from "@/api/axiosConfig";
import { parseFechaDDMMYYYY, formatFechaParaBackend } from "@/utils/dateHelpers";
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

const EditarResolucion = () => {
  const router = useRouter();
  const { id: idResolucion } = router.query;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [redirectAfterClose, setRedirectAfterClose] = useState(false);

  const [nroExpediente, setNroExpediente] = useState("");
  const [nroResolucion, setNroResolucion] = useState("");
  const [tipo, setTipo] = useState("");
  const [adjunto, setAdjunto] = useState("");
  const [fecha, setFecha] = useState<Dayjs | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState<string>("0");

  useEffect(() => {
    const fetchData = async () => {
      if (idResolucion) {
        try {
          const response = await API.get(`/facet/resolucion/${idResolucion}/`);
          setNroExpediente(response.data.nexpediente);
          setNroResolucion(response.data.nresolucion);
          setTipo(response.data.tipo);
          setAdjunto(response.data.adjunto);
          setFecha(parseFechaDDMMYYYY(response.data.fecha));
          setObservaciones(response.data.observaciones);
          setEstado(String(response.data.estado));
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };
    fetchData();
  }, [idResolucion]);

  const edicionResolucion = async () => {
    const resolucionEditada = {
      nexpediente: nroExpediente,
      nresolucion: nroResolucion,
      tipo: tipo || "",
      adjunto: adjunto,
      observaciones: observaciones,
      fecha: formatFechaParaBackend(fecha),
      estado: estado,
    };

    try {
      await API.put(`/facet/resolucion/${idResolucion}/`, resolucionEditada);
      setRedirectAfterClose(true);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    if (redirectAfterClose) {
      router.push("/dashboard/resoluciones/");
      setRedirectAfterClose(false);
    }
  };

  return (
    <>
      <DashboardMenu>
        <FormContainer title="Editar Resolución">
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
            <FormDatePicker label="Fecha" value={fecha} onChange={setFecha} />
          </FormSection>

          <FormSection title="Documento y Observaciones">
            <FormField
              label="Link Documento Adjunto"
              value={adjunto}
              onChange={(e) => setAdjunto(e.target.value)}
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
            <FormButton onClick={edicionResolucion}>Guardar Cambios</FormButton>
          </FormActions>
        </FormContainer>
      </DashboardMenu>

      <BasicModal
        open={modalVisible}
        onClose={handleCloseModal}
        title={modalTitle}
        content={modalMessage}
      />
    </>
  );
};

export default withAuth(EditarResolucion);
