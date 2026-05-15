import { useEffect, useState } from "react";
import "./styles.css";
import { useRouter } from "next/router";
import BasicModal from "@/utils/modal";
import DashboardMenu from "../../..";
import withAuth from "../../../../../components/withAut";
import API from "@/api/axiosConfig";
import {
  FormContainer,
  FormSection,
  FormField,
  FormActions,
  FormButton,
} from "@/components/Form";

const EditarJefe: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [persona, setPersona] = useState<number>(0);

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    router.push("/dashboard/persons/jefes/");
  };

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, SetDni] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get(`/facet/jefe/${id}/obtener_jefe/`);
        setPersona(response.data.persona.id);
        setNombre(response.data.persona.nombre);
        setApellido(response.data.persona.apellido);
        SetDni(response.data.persona.dni);
        setObservaciones(response.data.observaciones);
        setEstado(response.data.estado);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const edicionDepartamentoJefe = async () => {
    const jefeEditado = {
      persona: persona,
      observaciones: observaciones,
      estado: estado,
    };

    try {
      await API.put(`/facet/jefe/${id}/`, jefeEditado);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.");
      console.error(error);
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Editar Jefe">
        <FormSection title="Información del Jefe">
          <FormField label="DNI" value={dni} disabled />
          <FormField
            label="Nombre Completo"
            value={`${apellido} ${nombre}`}
            disabled
          />
          <FormField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            rows={2}
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

export default withAuth(EditarJefe);
