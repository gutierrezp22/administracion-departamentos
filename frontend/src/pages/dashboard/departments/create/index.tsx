import { useState } from "react";
import "./styles.css";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DashboardMenu from "../../../dashboard";
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

const CrearDepartamento = () => {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState("");
  const [interno, setInterno] = useState("");
  const [mailDepartamento, setMailDepartamento] = useState("");
  const [mailJefeDepartamento, setMailJefeDepartamento] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

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
    router.push("/dashboard/departments/");
  };

  const validarEmail = (email: string) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const crearNuevoDepartamento = async () => {
    if (mailDepartamento && !validarEmail(mailDepartamento)) {
      handleOpenModal("Error", "El Email del Departamento no tiene un formato válido.", () => {});
      return;
    }
    if (mailJefeDepartamento && !validarEmail(mailJefeDepartamento)) {
      handleOpenModal("Error", "El Email del Jefe del Departamento no tiene un formato válido.", () => {});
      return;
    }

    const nuevoDepartamento = {
      nombre: nombre,
      telefono: telefono,
      estado: Number(estado),
      interno: interno,
      mail_departamento: mailDepartamento || null,
      mail_jefe_departamento: mailJefeDepartamento || null,
    };

    try {
      await API.post("/facet/departamento/", nuevoDepartamento);
      handleOpenModal("Éxito", "Se creó el departamento con éxito.", handleConfirmModal);
    } catch (error: any) {
      console.error("Error completo:", error);
      let errorMessage = "NO se pudo realizar la acción.";
      if (error.response?.data) {
        if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          const errors: string[] = [];
          for (const field in error.response.data) {
            const fieldErrors = error.response.data[field];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach((err) => {
                let fieldName = field;
                if (field === "mail_departamento") fieldName = "Email del Departamento";
                else if (field === "mail_jefe_departamento") fieldName = "Email del Jefe";
                else if (field === "nombre") fieldName = "Nombre";
                else if (field === "telefono") fieldName = "Teléfono";
                errors.push(`${fieldName}: ${err}`);
              });
            }
          }
          errorMessage =
            errors.length > 0 ? errors.join("\n") : JSON.stringify(error.response.data);
        }
      }
      handleOpenModal("Error", errorMessage, () => {});
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Crear Departamento">
        <FormSection title="Información del Departamento">
          <FormField
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(capitalizeFirstLetter(e.target.value))}
          />
          <FormField
            label="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
          <FormField
            label="Interno"
            value={interno}
            onChange={(e) => setInterno(e.target.value)}
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

        <FormSection title="Contacto">
          <FormField
            label="Mail del Departamento"
            type="email"
            value={mailDepartamento}
            onChange={(e) => setMailDepartamento(e.target.value)}
          />
          <FormField
            label="Mail del Jefe del Departamento"
            type="email"
            value={mailJefeDepartamento}
            onChange={(e) => setMailJefeDepartamento(e.target.value)}
          />
        </FormSection>

        <FormActions>
          <FormButton onClick={crearNuevoDepartamento}>Crear Departamento</FormButton>
        </FormActions>

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

export default withAuth(CrearDepartamento);
