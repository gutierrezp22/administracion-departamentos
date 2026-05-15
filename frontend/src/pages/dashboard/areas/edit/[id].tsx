import { useEffect, useState } from "react";
import "./styles.css";
import API from "@/api/axiosConfig";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import DashboardMenu from "../../../dashboard";
import withAuth from "../../../../components/withAut";
import {
  FormContainer,
  FormSection,
  FormField,
  FormActions,
  FormButton,
} from "@/components/Form";

dayjs.extend(utc);
dayjs.extend(timezone);

const EditarArea = () => {
  const router = useRouter();
  const { id: idArea } = router.query;

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
    router.push("/dashboard/areas/");
  };

  const [area, setArea] = useState<any | null>(null);
  const [iddepartamento, setIddepartamento] = useState<number>(0);
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState<number | "">(0);
  const [nombreDepartamento, setNombreDepartamento] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      if (idArea) {
        try {
          const response = await API.get(`/facet/area/${idArea}/`);
          const data = response.data;
          setArea(data);
          if (
            data.departamento &&
            typeof data.departamento === "object" &&
            data.departamento.nombre
          ) {
            setNombreDepartamento(data.departamento.nombre);
            setIddepartamento(data.departamento.id);
          } else if (data.departamento) {
            setIddepartamento(data.departamento);
            try {
              const depResp = await API.get(
                `/facet/departamento/${data.departamento}/`
              );
              setNombreDepartamento(depResp.data.nombre);
            } catch (err) {
              setNombreDepartamento("");
            }
          }
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Error al obtener los datos.",
          });
        }
      }
    };

    fetchData();
  }, [idArea]);

  useEffect(() => {
    if (area) {
      setNombre(area.nombre);
      setEstado(area.estado);
    }
  }, [area]);

  const edicionArea = async () => {
    const areaEditada = {
      departamento: iddepartamento,
      nombre: nombre,
      estado: estado,
    };

    try {
      await API.put(`/facet/area/${idArea}/`, areaEditada);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Editar Área">
        <FormSection title="Departamento Asignado">
          <FormField label="Departamento" value={nombreDepartamento} disabled />
        </FormSection>

        <FormSection title="Información del Área">
          <FormField
            label="Nombre del Área"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <FormField
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(Number(e.target.value))}
            options={[
              { value: 1, label: "Activo" },
              { value: 0, label: "Inactivo" },
            ]}
          />
        </FormSection>

        <FormActions>
          <FormButton onClick={edicionArea}>Guardar Cambios</FormButton>
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

export default withAuth(EditarArea);
