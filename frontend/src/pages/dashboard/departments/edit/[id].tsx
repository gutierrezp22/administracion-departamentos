import { useEffect, useState } from "react";
import "./styles.css";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import API from "../../../../api/axiosConfig";
import {
  FormContainer,
  FormSection,
  FormField,
  FormActions,
  FormButton,
} from "@/components/Form";

dayjs.extend(utc);
dayjs.extend(timezone);

const EditarDepartamento = () => {
  const router = useRouter();
  const { id: idDepartamento } = router.query;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  const [departamento, setDepartamento] = useState({
    nombre: "",
    telefono: "",
    estado: "",
    interno: "",
    mail_departamento: "",
    mail_jefe_departamento: "",
  });

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    router.push("/dashboard/departments/");
  };

  useEffect(() => {
    if (idDepartamento) {
      const fetchData = async () => {
        try {
          const response = await API.get(`/facet/departamento/${idDepartamento}/`);
          setDepartamento({
            ...response.data,
            mail_departamento: response.data.mail_departamento || "",
            mail_jefe_departamento: response.data.mail_jefe_departamento || "",
          });
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchData();
    }
  }, [idDepartamento]);

  const edicionDepartamento = async () => {
    try {
      await API.put(`/facet/departamento/${idDepartamento}/`, departamento);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Editar Departamento">
        <FormSection title="Información del Departamento">
          <FormField
            label="Nombre"
            value={departamento.nombre}
            onChange={(e) =>
              setDepartamento({ ...departamento, nombre: e.target.value })
            }
          />
          <FormField
            label="Teléfono"
            value={departamento.telefono}
            onChange={(e) =>
              setDepartamento({ ...departamento, telefono: e.target.value })
            }
          />
          <FormField
            label="Interno"
            value={departamento.interno}
            onChange={(e) =>
              setDepartamento({ ...departamento, interno: e.target.value })
            }
          />
          <FormField
            label="Estado"
            value={departamento.estado}
            onChange={(e) =>
              setDepartamento({ ...departamento, estado: e.target.value })
            }
            options={[
              { value: 1, label: "Activo" },
              { value: 0, label: "Inactivo" },
            ]}
          />
        </FormSection>

        <FormSection title="Contacto">
          <FormField
            label="Mail del Departamento"
            type="email"
            value={departamento.mail_departamento || ""}
            onChange={(e) =>
              setDepartamento({
                ...departamento,
                mail_departamento: e.target.value,
              })
            }
          />
          <FormField
            label="Mail del Jefe del Departamento"
            type="email"
            value={departamento.mail_jefe_departamento || ""}
            onChange={(e) =>
              setDepartamento({
                ...departamento,
                mail_jefe_departamento: e.target.value,
              })
            }
          />
        </FormSection>

        <FormActions>
          <FormButton onClick={edicionDepartamento}>Guardar Cambios</FormButton>
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

export default withAuth(EditarDepartamento);
