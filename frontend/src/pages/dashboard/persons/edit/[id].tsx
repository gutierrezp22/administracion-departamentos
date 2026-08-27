import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import BasicModal from "@/utils/modal";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import API from "@/api/axiosConfig";
import {
  parseFechaDDMMYYYY,
  formatFechaParaBackend,
} from "@/utils/dateHelpers";
import {
  FormContainer,
  FormSection,
  FormField,
  FormDatePicker,
  FormActions,
  FormButton,
} from "@/components/Form";

const EditarPersona: React.FC = () => {
  const router = useRouter();
  const { id: idPersona } = router.query;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  interface Persona {
    id: number;
    nombre: string;
    apellido: string;
    telefono: string;
    dni: string;
    estado: 0 | 1;
    email: string;
    interno: number | null;
    legajo: string;
    titulo: number | null;
    fecha_nacimiento: string | null;
    fecha_ingreso: string | null;
    cuil: string | null;
    sexo: string | null;
    estado_agente: string | null;
    acoop: boolean | null;
    observaciones: string | null;
  }

  interface Titulo {
    id: number;
    nombre: string;
  }

  const [persona, setPersona] = useState<Persona | null>(null);
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [legajo, setLegajo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [interno, setInterno] = useState<number | null>(null);
  const [estado, setEstado] = useState("1");
  const [fechaNacimiento, setFechaNacimiento] = useState<dayjs.Dayjs | null>(null);
  const [fechaIngreso, setFechaIngreso] = useState<dayjs.Dayjs | null>(null);
  const [cuil, setCuil] = useState("");
  const [sexo, setSexo] = useState("");
  const [estadoAgente, setEstadoAgente] = useState("activo");
  const [acoop, setAcoop] = useState("0");
  const [observaciones, setObservaciones] = useState("");
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [tituloId, setTituloId] = useState<number | "">("");

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

  useEffect(() => {
    if (idPersona) {
      const fetchData = async () => {
        try {
          const response = await API.get(`/facet/persona/${idPersona}/`);
          setPersona(response.data);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchData();
    }
  }, [idPersona]);

  useEffect(() => {
    if (persona) {
      setDni(persona.dni ?? "");
      setNombre(persona.nombre ?? "");
      setApellido(persona.apellido ?? "");
      setLegajo(persona.legajo ?? "");
      setTelefono(persona.telefono ?? "");
      setEmail(persona.email ?? "");
      setInterno(persona.interno);
      setEstado(String(persona.estado ?? "1"));
      setTituloId(persona.titulo ?? "");
      setFechaNacimiento(parseFechaDDMMYYYY(persona.fecha_nacimiento));
      setFechaIngreso(parseFechaDDMMYYYY(persona.fecha_ingreso));
      setCuil(persona.cuil ?? "");
      setSexo(persona.sexo ?? "");
      setEstadoAgente(persona.estado_agente ?? "activo");
      setAcoop(persona.acoop ? "1" : "0");
      setObservaciones(persona.observaciones ?? "");
    }
  }, [persona]);

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    router.push("/dashboard/persons/");
  };

  const edicionPersona = async () => {
    const cuilLimpio = cuil.replace(/\D/g, "");
    if (cuilLimpio && cuilLimpio.length !== 11) {
      handleOpenModal("Error", "El CUIL debe tener 11 dígitos.");
      return;
    }

    const personaEditada = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim() || null,
      dni: dni.trim(),
      estado: estado,
      email: email.trim() || null,
      interno: interno,
      legajo: legajo.trim() || null,
      titulo: tituloId || null,
      fecha_nacimiento: formatFechaParaBackend(fechaNacimiento),
      fecha_ingreso: formatFechaParaBackend(fechaIngreso),
      cuil: cuil.replace(/\D/g, "") || null,
      sexo: sexo || null,
      estado_agente: estadoAgente,
      acoop: acoop === "1",
      observaciones: observaciones.trim() || null,
    };

    try {
      await API.put(`/facet/persona/${idPersona}/`, personaEditada);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      console.error("Error al hacer la solicitud PUT:", error);
      handleOpenModal("Error", "No se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <FormContainer title="Editar Persona">
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
            onChange={(e) => setNombre(e.target.value)}
          />
          <FormField
            label="Apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
          />
          <FormField
            label="CUIL"
            value={cuil}
            onChange={(e) => setCuil(e.target.value)}
            placeholder="11 dígitos, sin guiones"
            helperText="Clave de cruce con liquidación de haberes y SIU."
          />
          <FormField
            label="Sexo"
            value={sexo}
            onChange={(e) => setSexo(e.target.value)}
            options={[
              { value: "", label: "(Sin informar)" },
              { value: "M", label: "Masculino" },
              { value: "F", label: "Femenino" },
              { value: "X", label: "Otro / No informa" },
            ]}
          />
          <FormDatePicker
            label="Fecha de Nacimiento"
            value={fechaNacimiento}
            onChange={setFechaNacimiento}
          />
          <FormDatePicker
            label="Fecha de Ingreso a la Universidad"
            value={fechaIngreso}
            onChange={setFechaIngreso}
          />
        </FormSection>

        <FormSection title="Situación de revista">
          <FormField
            label="Situación del agente"
            value={estadoAgente}
            onChange={(e) => setEstadoAgente(e.target.value)}
            options={[
              { value: "activo", label: "Activo" },
              { value: "licencia", label: "En licencia" },
              { value: "jubilado", label: "Jubilado" },
              { value: "renuncia", label: "Renunció" },
              { value: "inactivo", label: "Inactivo" },
            ]}
            helperText="Distinto del Estado del registro: esto es la situación real del agente en la planta."
          />
          <FormField
            label="Aporta a ACOOP"
            value={acoop}
            onChange={(e) => setAcoop(e.target.value)}
            options={[
              { value: "0", label: "No" },
              { value: "1", label: "Sí" },
            ]}
          />
          <FormField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            rows={3}
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
            type="number"
            value={interno ?? ""}
            onChange={(e) =>
              setInterno(e.target.value === "" ? null : Number(e.target.value))
            }
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
              { value: "1", label: "Activo" },
              { value: "0", label: "Inactivo" },
            ]}
          />
        </FormSection>

        <FormActions>
          <FormButton onClick={edicionPersona}>Guardar Cambios</FormButton>
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

export default withAuth(EditarPersona);
