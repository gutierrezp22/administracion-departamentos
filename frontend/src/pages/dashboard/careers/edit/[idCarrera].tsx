import { useEffect, useState } from "react";
import "./styles.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import API from "@/api/axiosConfig";
import {
  FormContainer,
  FormSection,
  FormField,
  FormActions,
  FormButton,
} from "@/components/Form";

dayjs.extend(utc);
dayjs.extend(timezone);

const EditarCarrera: React.FC = () => {
  const router = useRouter();
  const { idCarrera } = router.query;

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
    router.push("/dashboard/careers/");
  };

  type TipoCarrera = "Pregrado" | "Grado" | "Posgrado";

  interface Carrera {
    idCarrera: number;
    nombre: string;
    tipo: TipoCarrera;
    planestudio: string;
    sitio: string;
    estado: 0 | 1;
  }

  const [carrera, setCarrera] = useState<Carrera>();
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [planEstudio, setPlanEstudio] = useState("");
  const [sitio, setsitio] = useState("");
  const [estado, setEstado] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (idCarrera) {
        try {
          const response = await API.get(`/facet/carrera/${idCarrera}/`);
          setCarrera(response.data);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
  }, [idCarrera]);

  useEffect(() => {
    if (carrera) {
      setNombre(carrera.nombre);
      setEstado(String(carrera.estado));
      setTipo(String(carrera.tipo));
      setPlanEstudio(carrera.planestudio);
      setsitio(carrera.sitio);
    }
  }, [carrera]);

  const edicionCarrera = async () => {
    const carreraEditada = {
      nombre: nombre,
      tipo: tipo,
      planestudio: planEstudio,
      sitio: sitio,
      estado: estado,
    };

    try {
      await API.put(`/facet/carrera/${idCarrera}/`, carreraEditada);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      console.error("Error al hacer la solicitud PUT:", error);
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Editar Carrera">
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
              { value: "1", label: "Activo" },
              { value: "0", label: "Inactivo" },
            ]}
          />
        </FormSection>

        <FormActions>
          <FormButton onClick={edicionCarrera}>Guardar Cambios</FormButton>
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

export default withAuth(EditarCarrera);
