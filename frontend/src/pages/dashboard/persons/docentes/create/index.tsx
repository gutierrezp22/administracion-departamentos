import { useState } from "react";
import "./styles.css";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import DashboardMenu from "../../../../dashboard";
import withAuth from "../../../../../components/withAut";
import API from "@/api/axiosConfig";
import SearchModal from "@/components/SearchModal";
import {
  FormContainer,
  FormSection,
  FormField,
  FormActions,
  FormButton,
  SelectorButton,
} from "@/components/Form";

interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  dni: string;
  estado: 0 | 1;
  email: string;
  interno: string;
  legajo: string;
}

const CrearDocente = () => {
  const router = useRouter();

  const [persona, setPersona] = useState<Persona | null>(null);
  const [openPersona, setOpenPersona] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState<number>(1);
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

  const handleSelectPersona = (p: Persona) => {
    setPersona(p);
    setOpenPersona(false);
  };

  const crearNuevoDocenteDepartamento = async () => {
    const nuevoDocente = {
      persona: persona?.id,
      observaciones,
      estado,
    };

    try {
      const response = await API.get(`/facet/docente/`, {
        params: {
          persona: persona?.id,
          show_all: true,
        },
      });

      if (response.data.results.length > 0) {
        handleOpenModal("Error", "Ya existe un docente para esta persona", () => {});
        return;
      }

      await API.post(`/facet/docente/`, nuevoDocente);
      handleOpenModal("Bien", "Se creó el docente con éxito", () => {
        router.push("/dashboard/persons/docentes/");
      });
    } catch (error) {
      console.error("Error:", error);
      handleOpenModal("Error", "No se pudo realizar la acción.", () => {});
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Agregar Docente">
        <FormSection title="Selección de Persona">
          <SelectorButton required
            label="Seleccionar Persona"
            onClick={() => setOpenPersona(true)}
            selectedLabel="Persona"
            selectedValue={
              persona ? `${persona.apellido}, ${persona.nombre} (DNI ${persona.dni})` : undefined
            }
          />
        </FormSection>

        <FormSection title="Información del Docente">
          <FormField label="DNI" value={persona?.dni || ""} disabled />
          <FormField
            label="Nombre Completo"
            value={persona ? `${persona.apellido} ${persona.nombre}` : ""}
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
          <FormButton onClick={crearNuevoDocenteDepartamento}>
            Crear Docente
          </FormButton>
        </FormActions>

        <SearchModal<Persona>
          open={openPersona}
          onClose={() => setOpenPersona(false)}
          onSelect={handleSelectPersona}
          title="Seleccionar Persona"
          apiEndpoint="/facet/persona/"
          columns={[
            { key: "dni", label: "DNI" },
            { key: "apellido", label: "Apellido" },
            { key: "nombre", label: "Nombre" },
            { key: "legajo", label: "Legajo" },
          ]}
          filterFields={[
            { key: "nombre", label: "Nombre", placeholder: "Buscar por nombre", filterParam: "nombre__icontains" },
            { key: "apellido", label: "Apellido", placeholder: "Buscar por apellido", filterParam: "apellido__icontains" },
            { key: "dni", label: "DNI", placeholder: "Buscar por DNI", filterParam: "dni__icontains" },
            { key: "legajo", label: "Legajo", placeholder: "Buscar por legajo", filterParam: "legajo__icontains" },
          ]}
          getItemId={(item) => item.id}
        />

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

export default withAuth(CrearDocente);
