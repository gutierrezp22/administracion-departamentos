import { useState } from "react";
import "./styles.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useRouter } from "next/router";
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
    const nuevaResolucion = {
      nexpediente: nroExpediente,
      nresolucion: nroResolucion,
      tipo: tipo || "",
      adjunto: adjunto,
      observaciones: "",
      fechadecarga: new Date(),
      fecha: formatFechaParaBackend(fecha),
      estado: estado,
    };

    try {
      await API.post(`/facet/resolucion/`, nuevaResolucion);
      handleOpenModal("Éxito", "Se creó la resolución con éxito.", handleConfirmModal);
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.", () => {});
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
        </FormSection>

        <FormActions>
          <FormButton onClick={crearNuevaResolucion}>Crear Resolución</FormButton>
        </FormActions>

        {modalVisible && (
          <div
            className="fixed inset-0 flex items-center justify-center z-[10000]"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}>
            <div className="fixed inset-0 bg-black opacity-50"></div>
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 z-[10001] relative">
              <h3 className="text-xl font-bold text-center mb-2 text-gray-900">
                {modalTitle}
              </h3>
              <hr className="my-3 border-gray-200" />
              <p className="text-gray-800 text-lg text-center mb-6 font-medium">
                {modalMessage}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    handleCloseModal();
                    fn();
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium">
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </FormContainer>
    </DashboardMenu>
  );
};

export default withAuth(CrearResolucion);
