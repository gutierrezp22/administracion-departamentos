import { useEffect, useState } from "react";
import "./styles.css";
import dayjs from "dayjs";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import DashboardMenu from "../../../dashboard";
import withAuth from "../../../../components/withAut";
import API from "@/api/axiosConfig";
import { formatFechaParaBackend } from "@/utils/dateHelpers";
import {
  FormContainer,
  FormSection,
  FormField,
  FormDatePicker,
  FormActions,
  FormButton,
} from "@/components/Form";

interface Titulo {
  id: number;
  nombre: string;
}

const CrearPersona = () => {
  const router = useRouter();

  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [legajo, setLegajo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [interno, setInterno] = useState("");
  const [estado, setEstado] = useState("1");
  const [fechaNacimiento, setFechaNacimiento] = useState<dayjs.Dayjs | null>(null);
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [tituloId, setTituloId] = useState<number | "">("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});

  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

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

  useEffect(() => {
    const fetchTitulos = async () => {
      try {
        // Traer todos los títulos (LimitOffsetPagination por defecto)
        const response = await API.get(`/facet/tipo-titulo/?limit=1000`);
        setTitulos(
          Array.isArray(response.data)
            ? response.data
            : response.data.results || []
        );
      } catch (error) {
        console.error("Error al obtener títulos:", error);
      }
    };
    fetchTitulos();
  }, []);

  const handleConfirmModal = () => {
    router.push("/dashboard/persons/");
  };

  const crearNuevaPersona = async () => {
    if (!nombre.trim() || !apellido.trim() || !dni.trim()) {
      handleOpenModal(
        "Error",
        "Los campos Nombre, Apellido y DNI son obligatorios.",
        () => {}
      );
      return;
    }

    const nuevaPersona = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim() || null,
      dni: dni.trim(),
      estado: estado,
      email: email.trim() || null,
      interno: interno.trim() ? parseInt(interno.trim()) : null,
      legajo: legajo.trim() || null,
      titulo: tituloId || null,
      fecha_nacimiento: formatFechaParaBackend(fechaNacimiento),
    };

    try {
      await API.post(`/facet/persona/`, nuevaPersona);
      handleOpenModal("Éxito", "Se creó la persona con éxito.", handleConfirmModal);
    } catch (error) {
      console.error("Error al crear persona:", error);
      handleOpenModal("Error", "No se pudo realizar la acción.", () => {});
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Crear Persona">
        <FormSection title="Información Personal">
          <FormField
            label="DNI"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
          />
          <FormField
            label="Legajo"
            value={legajo}
            onChange={(e) => setLegajo(e.target.value)}
          />
          <FormField
            label="Nombres"
            value={nombre}
            onChange={(e) => setNombre(capitalizeFirstLetter(e.target.value))}
          />
          <FormField
            label="Apellido"
            value={apellido}
            onChange={(e) => setApellido(capitalizeFirstLetter(e.target.value))}
          />
          <FormDatePicker
            label="Fecha de Nacimiento"
            value={fechaNacimiento}
            onChange={setFechaNacimiento}
          />
        </FormSection>

        <FormSection title="Información de Contacto">
          <FormField
            label="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
          <FormField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormField
            label="Interno"
            value={interno}
            onChange={(e) => setInterno(e.target.value)}
          />
          <FormField
            label="Título"
            value={tituloId === "" ? "" : tituloId}
            onChange={(e) =>
              setTituloId(e.target.value === "" ? "" : Number(e.target.value))
            }
            options={[
              { value: "", label: "Sin título" },
              ...titulos.map((t) => ({ value: t.id, label: t.nombre })),
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
          <FormButton onClick={crearNuevaPersona}>Crear Persona</FormButton>
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

export default withAuth(CrearPersona);
