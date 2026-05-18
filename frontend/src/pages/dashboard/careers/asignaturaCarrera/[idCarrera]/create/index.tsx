import { useState } from "react";
import "./styles.css";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DashboardMenu from "../../../..";
import withAuth from "../../../../../../components/withAut";
import API from "@/api/axiosConfig";
import {
  FormContainer,
  FormSection,
  FormField,
  FormActions,
  FormButton,
  SelectorButton,
} from "@/components/Form";
import SearchModal from "@/components/SearchModal";

dayjs.extend(utc);
dayjs.extend(timezone);

type TipoAsignatura = "Electiva" | "Obligatoria";

interface Asignatura {
  id: number;
  area: number;
  departamento: number;
  codigo: string;
  nombre: string;
  modulo: string;
  programa: string;
  tipo: TipoAsignatura;
  estado: 0 | 1;
}

const CrearAsignaturaCarrera = () => {
  const router = useRouter();
  const { idCarrera } = router.query;

  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState<Asignatura | null>(null);
  const [estado, setEstado] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});
  const [openAsignatura, setOpenAsignatura] = useState(false);

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
    router.push(`/dashboard/careers/asignaturaCarrera/${idCarrera}`);
  };

  const crearNuevaAsignaturaEnCarrera = async () => {
    const nuevaAsignaturaEnCarrera = {
      carrera: idCarrera,
      asignatura: asignaturaSeleccionada?.id,
      estado: estado,
    };

    try {
      await API.post(`/facet/asignatura-carrera/`, nuevaAsignaturaEnCarrera);
      handleOpenModal(
        "Éxito",
        "Se creó la asignatura en carrera con éxito.",
        handleConfirmModal
      );
    } catch (error) {
      handleOpenModal("Error", "No se pudo realizar la acción.", () => {});
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Agregar Asignatura en Carrera">
        <FormSection title="Selección de Asignatura">
          <SelectorButton
            required
            label="Seleccionar Asignatura"
            onClick={() => setOpenAsignatura(true)}
            selectedLabel="Asignatura"
            selectedValue={
              asignaturaSeleccionada
                ? `${asignaturaSeleccionada.codigo} - ${asignaturaSeleccionada.nombre}`
                : undefined
            }
          />
        </FormSection>

        <FormSection title="Estado">
          <FormField
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            required
            options={[
              { value: 1, label: "Activo" },
              { value: 0, label: "Inactivo" },
            ]}
          />
        </FormSection>

        <FormActions>
          <FormButton
            variant="success"
            onClick={crearNuevaAsignaturaEnCarrera}
            disabled={!asignaturaSeleccionada || !estado}
          >
            Crear Asignatura en Carrera
          </FormButton>
        </FormActions>

        <SearchModal<Asignatura>
          open={openAsignatura}
          onClose={() => setOpenAsignatura(false)}
          onSelect={(a) => setAsignaturaSeleccionada(a)}
          title="Seleccionar Asignatura"
          apiEndpoint="/facet/asignatura/"
          columns={[
            { key: "codigo", label: "Código" },
            { key: "nombre", label: "Nombre" },
            { key: "tipo", label: "Tipo" },
          ]}
          filterFields={[
            { key: "codigo", label: "Código", placeholder: "Buscar por código", filterParam: "codigo__icontains" },
            { key: "nombre", label: "Nombre", placeholder: "Buscar por nombre", filterParam: "nombre__icontains" },
          ]}
          getItemId={(a) => a.id}
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

export default withAuth(CrearAsignaturaCarrera);
