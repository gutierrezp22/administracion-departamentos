import { useEffect, useState } from "react";
import "./styles.css";
import BasicModal from "@/utils/modal";
import ModalConfirmacion from "@/utils/modalConfirmacion";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DashboardMenu from "../../../../dashboard";
import withAuth from "../../../../../components/withAut";
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

const EditarAsignaturaCarrera: React.FC = () => {
  const router = useRouter();
  const { idAsignatura } = router.query;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    router.push("/dashboard/asignaturas/");
  };

  type TipoAsignatura = "Electiva" | "Obligatoria";

  interface Asignatura {
    idasignatura: number;
    idarea: number;
    iddepartamento: number;
    codigo: string;
    nombre: string;
    modulo: string;
    programa: string;
    tipo: TipoAsignatura;
    estado: 0 | 1;
  }

  const [asignatura, setAsignatura] = useState<Asignatura | null>(null);
  const [iddepartamento, setIddepartamento] = useState<number>(0);
  const [idarea, setIdarea] = useState<number>(0);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [modulo, setModulo] = useState("");
  const [programa, setPrograma] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!idAsignatura) return;
      try {
        const response = await API.get(`/facet/asignatura/${idAsignatura}`);
        setAsignatura(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [idAsignatura]);

  useEffect(() => {
    if (asignatura) {
      setIdarea(asignatura.idarea);
      setIddepartamento(asignatura.iddepartamento);
      setNombre(asignatura.nombre);
      setCodigo(asignatura.codigo);
      setEstado(String(asignatura.estado));
      setTipo(String(asignatura.tipo));
      setModulo(asignatura.modulo);
      setPrograma(asignatura.programa);
    }
  }, [asignatura]);

  const edicionAsignatura = async () => {
    const asignaturaEditada = {
      idarea: idarea,
      iddepartamento: iddepartamento,
      codigo: codigo,
      nombre: nombre,
      modulo: modulo,
      programa: programa,
      tipo: tipo,
      estado: estado,
    };

    try {
      await API.put(`/facet/asignatura/${idAsignatura}/`, asignaturaEditada);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      console.error("Error al hacer la solicitud PUT:", error);
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  const eliminarAsignatura = async () => {
    try {
      await API.delete(`/facet/asignatura/${idAsignatura}/`);
      handleOpenModal("Asignatura Eliminada", "La acción se realizó con éxito.");
    } catch (error) {
      console.error("Error al hacer la solicitud DELETE:", error);
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Editar Asignatura">
        <FormSection title="Información de la Asignatura">
          <FormField
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value.toUpperCase())}
          />
          <FormField
            label="Código"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          />
          <FormField
            label="Módulo"
            value={modulo}
            onChange={(e) => setModulo(e.target.value.toUpperCase())}
          />
          <FormField
            label="Link Programa Adjunto"
            value={programa}
            onChange={(e) => setPrograma(e.target.value)}
          />
          <FormField
            label="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoAsignatura)}
            options={[
              { value: "Electiva", label: "Electiva" },
              { value: "Obligatoria", label: "Obligatoria" },
            ]}
          />
          <FormField
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            options={[
              { value: 1, label: "Activo" },
              { value: 0, label: "Inactivo" },
            ]}
          />
        </FormSection>

        <FormActions>
          <FormButton onClick={edicionAsignatura}>Guardar Cambios</FormButton>
          <button
            onClick={() => setConfirmarEliminacion(true)}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2.5 rounded-lg shadow-md transition-all duration-200 transform hover:scale-[1.02] font-semibold text-sm">
            Eliminar Asignatura
          </button>
        </FormActions>

        <BasicModal
          open={modalVisible}
          onClose={handleCloseModal}
          title={modalTitle}
          content={modalMessage}
        />
        <ModalConfirmacion
          open={confirmarEliminacion}
          onClose={() => setConfirmarEliminacion(false)}
          onConfirm={() => {
            setConfirmarEliminacion(false);
            eliminarAsignatura();
          }}
        />
      </FormContainer>
    </DashboardMenu>
  );
};

export default withAuth(EditarAsignaturaCarrera);
