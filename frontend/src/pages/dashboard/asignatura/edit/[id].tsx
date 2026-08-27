import { useEffect, useState } from "react";
import "./styles.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import DashboardMenu from "../../../dashboard";
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

type TipoAsignatura = "Electiva" | "Obligatoria";

const EditarAsignatura: React.FC = () => {
  const router = useRouter();
  const { id: idAsignatura } = router.query;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [redirectAfterClose, setRedirectAfterClose] = useState(false);

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    if (redirectAfterClose) {
      router.push("/dashboard/asignatura/");
      setRedirectAfterClose(false);
    }
  };

  const [asignatura, setAsignatura] = useState<any>();
  const [iddepartamento, setIddepartamento] = useState<number>(0);
  const [idarea, setIdarea] = useState<number>(0);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigoSiu, setCodigoSiu] = useState("");
  const [conciliadaSiu, setConciliadaSiu] = useState("0");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [modulo, setModulo] = useState("");
  const [programa, setPrograma] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (idAsignatura) {
        try {
          const response = await API.get(`/facet/asignatura/${idAsignatura}/`);
          setAsignatura(response.data);
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
  }, [idAsignatura]);

  useEffect(() => {
    if (asignatura) {
      setIdarea(asignatura.area);
      setIddepartamento(asignatura.departamento);
      setNombre(asignatura.nombre);
      setCodigo(asignatura.codigo);
      setCodigoSiu(asignatura.codigo_siu ?? "");
      setConciliadaSiu(asignatura.conciliada_siu ? "1" : "0");
      setEstado(String(asignatura.estado));
      setTipo(String(asignatura.tipo));
      setModulo(asignatura.modulo);
      setPrograma(asignatura.programa);
    }
  }, [asignatura]);

  const edicionAsignatura = async () => {
    const asignaturaEditada = {
      area: idarea,
      departamento: iddepartamento,
      codigo: codigo,
      codigo_siu: codigoSiu.trim() || null,
      conciliada_siu: conciliadaSiu === "1",
      nombre: nombre,
      modulo: modulo,
      programa: programa,
      tipo: tipo,
      estado: estado,
    };

    try {
      await API.put(`/facet/asignatura/${idAsignatura}/`, asignaturaEditada);
      setRedirectAfterClose(true);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Editar Asignatura">
        <FormSection title="Información Básica">
          <FormField
            label="Nombre de la Asignatura"
            value={nombre}
            onChange={(e) => setNombre(e.target.value.toUpperCase())}
          />
          <FormField
            label="Código"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          />
          <FormField
            label="Código SIU Guaraní"
            value={codigoSiu}
            onChange={(e) => setCodigoSiu(e.target.value.toUpperCase())}
            placeholder="Ej. 15_E10"
            helperText="Código en el sistema académico. Sin esto la asignatura no se puede cruzar con la matrícula."
          />
          <FormField
            label="¿Conciliada con SIU?"
            value={conciliadaSiu}
            onChange={(e) => setConciliadaSiu(e.target.value)}
            options={[
              { value: "0", label: "No — revisar" },
              { value: "1", label: "Sí — el nombre coincide" },
            ]}
          />
        </FormSection>

        <FormSection title="Información Adicional">
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

export default withAuth(EditarAsignatura);
