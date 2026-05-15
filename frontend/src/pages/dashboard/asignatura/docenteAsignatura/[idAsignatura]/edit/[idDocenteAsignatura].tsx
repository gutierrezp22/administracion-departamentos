import { useEffect, useState } from "react";
import "./styles.css";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DashboardMenu from "../../../..";
import { useRouter } from "next/router";
import BasicModal from "@/utils/modal";
import withAuth from "../../../../../../components/withAut";
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

const EditarDocenteAsignatura: React.FC = () => {
  const router = useRouter();
  const { idAsignatura, idDocenteAsignatura } = router.query;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    router.push(`/dashboard/asignatura/docenteAsignatura/${idAsignatura}`);
  };

  interface Resolucion {
    id: number;
    nexpediente: string;
    nresolucion: string;
    tipo: string;
    fecha_creacion: string;
    fecha: string;
    adjunto: string;
    observaciones: string;
    estado: 0 | 1;
  }

  interface PersonaDetalle {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    telefono: string;
    legajo: string;
    email: string;
  }

  interface Docente {
    id: number;
    persona: number;
    persona_detalle: PersonaDetalle | null;
    observaciones: string;
    estado: 0 | 1;
  }

  const [persona, setPersona] = useState<Docente | null>(null);
  const [asignatura, setAsignatura] = useState<string>("");
  const [resolucion, setResolucion] = useState<Resolucion | null>(null);

  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);
  const [dedicacion, setDedicacion] = useState("");
  const [condicion, setCondicion] = useState("");
  const [tipoCargo, setTipoCargo] = useState("");

  useEffect(() => {
    if (idDocenteAsignatura && typeof idDocenteAsignatura === "string") {
      fetchDocenteAsignatura(idDocenteAsignatura);
    }
  }, [idDocenteAsignatura]);

  const fetchDocenteAsignatura = async (id: string) => {
    try {
      const response = await API.get(`/facet/asignatura-docente/${id}/`);
      const data = response.data;

      setPersona(data.docente);
      setAsignatura(data.asignatura.nombre);
      setResolucion(data.resolucion);
      setObservaciones(data.observaciones);
      setEstado(data.estado);
      setDedicacion(data.dedicacion);
      setCondicion(data.condicion);
      setTipoCargo(data.tipo_cargo);
      setFechaInicio(parseFechaDDMMYYYY(data.fecha_de_inicio));
      setFechaFin(parseFechaDDMMYYYY(data.fecha_de_vencimiento));
    } catch (error) {
      console.error("Error fetching asignatura docente:", error);
    }
  };

  const updateDocenteAsignatura = async () => {
    if (!persona || !asignatura || !resolucion) {
      alert("Por favor, selecciona un docente, una asignatura y una resolución.");
      return;
    }

    const updatedDocenteAsignatura = {
      asignatura: idAsignatura,
      docente: persona.id,
      resolucion: resolucion.id,
      observaciones,
      estado,
      fecha_de_inicio: formatFechaParaBackend(fechaInicio),
      fecha_de_vencimiento: formatFechaParaBackend(fechaFin),
      dedicacion,
      condicion,
      tipo_cargo: tipoCargo,
    };

    try {
      await API.put(
        `/facet/asignatura-docente/${idDocenteAsignatura}/`,
        updatedDocenteAsignatura
      );
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      console.error("Error al hacer la solicitud PUT:", error);
      handleOpenModal("Error", "No se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Editar Asignación de Docente en Asignatura">
        <FormSection title="Información de la Asignación">
          <FormField
            label="Nombre y Apellido del Docente"
            value={
              persona?.persona_detalle
                ? `${persona.persona_detalle.nombre} ${persona.persona_detalle.apellido}`
                : ""
            }
            disabled
          />
          <FormField label="Asignatura" value={asignatura} disabled />
          <FormField
            label="Nro Resolución Seleccionada"
            value={resolucion ? resolucion.nresolucion : ""}
            disabled
          />
        </FormSection>

        <FormSection title="Información Adicional">
          <FormField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
          <FormField
            label="Dedicación"
            value={dedicacion}
            onChange={(e) => setDedicacion(e.target.value)}
            options={[
              { value: "EXCL", label: "EXCL" },
              { value: "SIMP", label: "SIMP" },
              { value: "SEMI", label: "SEMI" },
              { value: "35HS", label: "35HS" },
            ]}
          />
          <FormField
            label="Condición"
            value={condicion}
            onChange={(e) => setCondicion(e.target.value)}
            options={[
              { value: "Regular", label: "Regular" },
              { value: "Interino", label: "Interino" },
              { value: "Transitorio", label: "Transitorio" },
              { value: "Licencia sin goce de sueldo", label: "Licencia sin goce de sueldo" },
              { value: "Renuncia", label: "Renuncia" },
              { value: "Licencia con goce de sueldo", label: "Licencia con goce de sueldo" },
            ]}
          />
          <FormField
            label="Cargo"
            value={tipoCargo}
            onChange={(e) => setTipoCargo(e.target.value)}
            options={[
              { value: "AUX DOC DE PRIMERA", label: "AUX DOC DE PRIMERA" },
              { value: "AUX DOCENTE SEGUNDA", label: "AUX DOCENTE SEGUNDA" },
              { value: "Categoria 01 Dto.366", label: "Categoria 01 Dto.366" },
              { value: "Categoria 02 Dto.366", label: "Categoria 02 Dto.366" },
              { value: "Categoria 03 Dto.366", label: "Categoria 03 Dto.366" },
              { value: "Categoria 04 Dto.366", label: "Categoria 04 Dto.366" },
              { value: "Categoria 05 Dto.366", label: "Categoria 05 Dto.366" },
              { value: "Categoria 06 Dto.366", label: "Categoria 06 Dto.366" },
              { value: "Categoria 07 Dto.366", label: "Categoria 07 Dto.366" },
              { value: "DECANO FACULTAD", label: "DECANO FACULTAD" },
              { value: "JEFE TRABAJOS PRACT.", label: "JEFE TRABAJOS PRACT." },
              { value: "PROFESOR ADJUNTO", label: "PROFESOR ADJUNTO" },
              { value: "PROFESOR ASOCIADO", label: "PROFESOR ASOCIADO" },
              { value: "PROFESOR TITULAR", label: "PROFESOR TITULAR" },
              { value: "SECRETARIO FACULTAD", label: "SECRETARIO FACULTAD" },
              { value: "VICE DECANO", label: "VICE DECANO" },
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

        <FormSection title="Período de Asignación">
          <FormDatePicker
            label="Fecha Inicio"
            value={fechaInicio}
            onChange={setFechaInicio}
          />
          <FormDatePicker
            label="Fecha Fin"
            value={fechaFin}
            onChange={setFechaFin}
          />
        </FormSection>

        <FormActions>
          <FormButton onClick={updateDocenteAsignatura}>
            Guardar Cambios
          </FormButton>
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

export default withAuth(EditarDocenteAsignatura);
