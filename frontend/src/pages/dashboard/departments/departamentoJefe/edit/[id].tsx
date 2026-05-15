import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import dayjs, { Dayjs } from "dayjs";
import { useRouter } from "next/router";
import DashboardMenu from "../../..";
import BasicModal from "@/utils/modal";
import withAuth from "../../../../../components/withAut";
import { API_BASE_URL } from "../../../../../utils/config";
import API from "../../../../../api/axiosConfig";
import { parseFechaDDMMYYYY, formatFechaParaBackend } from "@/utils/dateHelpers";
import {
  FormContainer,
  FormSection,
  FormField,
  FormDatePicker,
  FormActions,
  FormButton,
} from "@/components/Form";

const EditarDepartamentoJefe = () => {
  const router = useRouter();
  const { id } = router.query;

  interface Resolucion {
    id: number;
    nexpediente: string;
    nresolucion: string;
  }

  interface Persona {
    id: number;
    nombre: string;
    apellido: string;
  }

  interface Jefe {
    id: number;
    persona: Persona;
  }

  interface Departamento {
    id: number;
    nombre: string;
  }

  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState("");
  const [departamento, setDepartamento] = useState<Departamento | null>(null);
  const [jefe, setJefe] = useState<Jefe | null>(null);
  const [resolucion, setResolucion] = useState<Resolucion | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/facet/jefe-departamento/${id}/obtener_detalle/`
          );
          const data = response.data;

          setFechaInicio(parseFechaDDMMYYYY(data.fecha_de_inicio));
          setFechaFin(parseFechaDDMMYYYY(data.fecha_de_fin));
          setObservaciones(data.observaciones);
          setEstado(String(data.estado));
          setDepartamento(data.departamento);
          setJefe(data.jefe);
          setResolucion(data.resolucion);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
  }, [id]);

  const edicionDepartamentoJefe = async () => {
    const jefeDepartamentoEditado = {
      fecha_de_inicio: formatFechaParaBackend(fechaInicio),
      fecha_de_fin: formatFechaParaBackend(fechaFin),
      observaciones,
      estado: Number(estado),
      departamento: departamento?.id,
      jefe: jefe?.id,
      resolucion: resolucion?.id,
    };

    try {
      await API.put(`/facet/jefe-departamento/${id}/`, jefeDepartamentoEditado);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      console.error("Error al hacer la solicitud PUT:", error);
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
    router.push("/dashboard/departments/departamentoJefe/");
  };

  return (
    <DashboardMenu>
      <FormContainer title="Editar Jefe de Departamento">
        <FormSection title="Información de la Asignación">
          <FormField
            label="Nro Resolución"
            value={resolucion?.nresolucion || ""}
            InputProps={{ readOnly: true }}
          />
          <FormField
            label="Nombre Jefe"
            value={`${jefe?.persona.nombre || ""} ${jefe?.persona.apellido || ""}`}
            InputProps={{ readOnly: true }}
          />
          <FormField
            label="Nombre Departamento"
            value={departamento?.nombre || ""}
            InputProps={{ readOnly: true }}
          />
        </FormSection>

        <FormSection title="Período y Estado">
          <FormDatePicker
            label="Fecha de Inicio"
            value={fechaInicio}
            onChange={setFechaInicio}
          />
          <FormDatePicker
            label="Fecha de Fin"
            value={fechaFin}
            onChange={setFechaFin}
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
          <FormField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            rows={2}
          />
        </FormSection>

        <FormActions>
          <FormButton onClick={edicionDepartamentoJefe}>
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

export default withAuth(EditarDepartamentoJefe);
