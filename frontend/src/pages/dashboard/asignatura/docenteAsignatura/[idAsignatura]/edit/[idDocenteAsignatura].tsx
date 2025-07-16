import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import DashboardMenu from "../../../..";
import { useRouter } from "next/router";
import BasicModal from "@/utils/modal";
import ModalConfirmacion from "@/utils/modalConfirmacion";
import withAuth from "../../../../../../components/withAut"; // Importa el HOC
import { API_BASE_URL } from "../../../../../../utils/config";
import API from "@/api/axiosConfig";

// Habilita los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const EditarDocenteAsignatura: React.FC = () => {
  const router = useRouter();
  const { idAsignatura, idDocenteAsignatura } = router.query;
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
    router.push(`/dashboard/asignatura/docenteAsignatura/${idAsignatura}`); // Redirige a la lista de docentes de la asignatura actual
  };

  interface Persona {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    legajo: string;
    estado: 0 | 1;
  }

  interface Resolucion {
    id: number;
    nexpediente: string;
    nresolucion: string;
    tipo: string;
    fecha_creacion: string;
    fecha: string;
    adjunto: string;
    observaciones: string;
    estado: 0 | 1;
  }

  interface PersonaDetalle {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    telefono: string;
    legajo: string;
    email: string;
  }

  interface Docente {
    id: number;
    persona: number;
    persona_detalle: PersonaDetalle | null;
    observaciones: string;
    estado: 0 | 1;
  }

  const [personas, setPersonas] = useState<Docente[]>([]);
  const [persona, setPersona] = useState<Docente | null>(null);
  const [filtroDni, setFiltroDni] = useState("");
  const [openPersona, setOpenPersona] = useState(false);
  const [asignatura, setAsignatura] = useState<string>("");
  const [resolucion, setResolucion] = useState<Resolucion | null>(null);
  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [openResolucion, setOpenResolucion] = useState(false);

  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState("");
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);
  const [dedicacion, setDedicacion] = useState("");
  const [condicion, setCondicion] = useState("");
  const [cargo, setCargo] = useState("");
  const [filtroNroResolucion, setFiltroNroResolucion] = useState("");
  const [filtroFecha, setFiltroFecha] = useState<Dayjs | null>(null);

  // Cargar datos iniciales de la asignación
  useEffect(() => {
    if (idDocenteAsignatura && typeof idDocenteAsignatura === "string") {
      fetchDocenteAsignatura(idDocenteAsignatura);
    }
  }, [idDocenteAsignatura]);

  const fetchDocenteAsignatura = async (id: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/facet/asignatura-docente/${id}/`
      );
      const data = response.data;

      setPersona(data.docente);
      setAsignatura(data.asignatura.nombre);
      setResolucion(data.resolucion);
      setObservaciones(data.observaciones);
      setEstado(data.estado);
      setDedicacion(data.dedicacion);
      setCondicion(data.condicion);
      setCargo(data.cargo);
      // Parsear las fechas
      const parsedFechaInicio = dayjs(
        data.fecha_de_inicio,
        "DD/MM/YYYY HH:mm:ss"
      );
      const parsedFechaFin = dayjs(
        data.fecha_de_vencimiento,
        "DD/MM/YYYY HH:mm:ss"
      );
      setFechaInicio(parsedFechaInicio.isValid() ? parsedFechaInicio : null);
      setFechaFin(parsedFechaFin.isValid() ? parsedFechaFin : null);
    } catch (error) {
      console.error("Error fetching asignatura docente:", error);
    }
  };

  // Actualizar la asignación docente
  const updateDocenteAsignatura = async () => {
    if (!persona || !asignatura || !resolucion) {
      alert(
        "Por favor, selecciona un docente, una asignatura y una resolución."
      );
      return;
    }

    const updatedDocenteAsignatura = {
      asignatura: idAsignatura,
      docente: persona.id, // Incluye el ID del docente
      resolucion: resolucion.id, // Incluye el ID de la resolución
      observaciones,
      estado,
      fecha_de_inicio:
        fechaInicio && fechaInicio.isValid() ? fechaInicio.toISOString() : null,
      fecha_de_vencimiento:
        fechaFin && fechaFin.isValid() ? fechaFin.toISOString() : null,
      dedicacion,
      condicion,
      cargo,
    };

    try {
      await API.put(
        `/facet/asignatura-docente/${idDocenteAsignatura}/`,
        updatedDocenteAsignatura
      );
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      console.error("Error al hacer la solicitud PUT:", error);
      handleOpenModal("Error", "No se pudo realizar la acción.");
    }
  };

  const eliminarPersona = async () => {
    try {
      await API.delete(`/facet/asignatura-docente/${idDocenteAsignatura}/`);
      handleOpenModal(
        "Docente en Asignatura Eliminado",
        "La acción se realizó con éxito."
      );
    } catch (error) {
      console.error("Error al hacer la solicitud DELETE:", error);
      handleOpenModal("Error", "No se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Editar Asignación de Docente en Asignatura</h1>
          </div>

          <div className="p-4">
            <Grid container spacing={2}>
              {/* Sección de Información de la Asignación */}
              <Grid item xs={12}>
                <Typography variant="h6" className="text-gray-700 font-semibold mb-3">
                  Información de la Asignación
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Nombre y Apellido del Docente"
                      value={
                        persona?.persona_detalle
                          ? `${persona.persona_detalle.nombre} ${persona.persona_detalle.apellido}`
                          : ""
                      }
                      fullWidth
                      disabled
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Asignatura"
                      value={asignatura}
                      fullWidth
                      disabled
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Nro Resolución Seleccionada"
                      value={resolucion ? resolucion.nresolucion : ""}
                      fullWidth
                      disabled
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Sección de Información Adicional */}
              <Grid item xs={12}>
                <Typography variant="h6" className="text-gray-700 font-semibold mb-3">
                  Información Adicional
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Observaciones"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Dedicación"
                      value={dedicacion}
                      onChange={(e) => setDedicacion(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Condición"
                      value={condicion}
                      onChange={(e) => setCondicion(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Cargo"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Estado"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small">
                      <MenuItem value="1">Activo</MenuItem>
                      <MenuItem value="0">Inactivo</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Grid>

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Sección de Fechas */}
              <Grid item xs={12}>
                <Typography variant="h6" className="text-gray-700 font-semibold mb-3">
                  Período de Asignación
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Fecha Inicio"
                        value={fechaInicio}
                        onChange={(date) => setFechaInicio(date)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            size: "small"
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Fecha Fin"
                        value={fechaFin}
                        onChange={(date) => setFechaFin(date)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            size: "small"
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              </Grid>

              {/* Botones de acción */}
              <Grid item xs={12}>
                <div className="flex justify-center gap-3 mt-6">
                  <button
                    onClick={updateDocenteAsignatura}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Guardar Cambios
                  </button>
                  <button
                    onClick={() => setConfirmarEliminacion(true)}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Eliminar Asignación
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>
        </div>

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
            eliminarPersona();
          }}
        />
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(EditarDocenteAsignatura);
