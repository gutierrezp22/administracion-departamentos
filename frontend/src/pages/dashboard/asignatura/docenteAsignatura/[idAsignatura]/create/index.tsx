import { useEffect, useState } from "react";
import "./styles.css";
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import ResponsiveTable from "@/components/ResponsiveTable";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import DashboardMenu from "../../../../../dashboard";
import { useRouter } from "next/router";
import BasicModal from "@/utils/modal";
import withAuth from "../../../../../../components/withAut"; // Importa el HOC
import API from "@/api/axiosConfig";
import { formatFechaParaBackend } from "@/utils/dateHelpers";

// Habilita los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Helper para traducir nombres de campos a nombres amigables
const getFieldDisplayName = (fieldName: string): string => {
  const fieldNames: { [key: string]: string } = {
    'cargo': 'Cargo',
    'condicion': 'Condición',
    'dedicacion': 'Dedicación',
    'observaciones': 'Observaciones',
    'fecha_de_inicio': 'Fecha de Inicio',
    'fecha_de_vencimiento': 'Fecha de Fin',
    'docente': 'Docente',
    'asignatura': 'Asignatura',
    'resolucion': 'Resolución',
    'estado': 'Estado'
  };
  
  return fieldNames[fieldName] || fieldName;
};

// Función para normalizar URLs de paginación
const normalizeUrl = (url: string) => {
  return url.replace(window.location.origin, "").replace(/^\/+/, "/");
};

const CrearDocenteAsignatura: React.FC = () => {
  const router = useRouter();
  const { idAsignatura } = router.query;

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
    persona: number; // Esto representa solo el ID de la persona
    persona_detalle: PersonaDetalle | null; // Nuevo campo que contiene los detalles de la persona
    observaciones: string;
    estado: 0 | 1;
  }

  const [personas, setPersonas] = useState<Docente[]>([]);
  const [persona, setPersona] = useState<Docente | null>(null);
  const [filtroDni, setFiltroDni] = useState("");
  const [openPersona, setOpenPersona] = useState(false);
  const [asignatura, setAsignatura] = useState<string>("");

  const handleOpenPersona = () => setOpenPersona(true);
  const handleClosePersona = () => setOpenPersona(false);
  // Funciones para abrir y cerrar el diálogo de Resolución
  const handleOpenResolucion = () => setOpenResolucion(true);
  const handleCloseResolucion = () => setOpenResolucion(false);

  const [nextUrlPersonas, setNextUrlPersonas] = useState<string | null>(null);
  const [prevUrlPersonas, setPrevUrlPersonas] = useState<string | null>(null);
  const [currentUrlPersonas, setCurrentUrlPersonas] = useState<string>(
    `/facet/docente/`
  );
  const [currentPagePersonas, setCurrentPagePersonas] = useState<number>(1);
  const [totalItemsPersonas, setTotalItemsPersonas] = useState<number>(0);
  const pageSizePersonas = 10;

  const [nextUrlResoluciones, setNextUrlResoluciones] = useState<string | null>(
    null
  );
  const [prevUrlResoluciones, setPrevUrlResoluciones] = useState<string | null>(
    null
  );
  const [currentUrlResoluciones, setCurrentUrlResoluciones] = useState<string>(
    `/facet/resolucion/`
  );
  const [currentPageResoluciones, setCurrentPageResoluciones] =
    useState<number>(1);
  const [totalItemsResoluciones, setTotalItemsResoluciones] =
    useState<number>(0);
  const pageSizeResoluciones = 10;

  useEffect(() => {
    if (idAsignatura && typeof idAsignatura === "string") {
      fetchAsignatura(idAsignatura);
    }
  }, [idAsignatura]);

  const fetchAsignatura = async (id: string) => {
    try {
      const response = await API.get(
        `/facet/asignatura/${id}/`
      );
      setAsignatura(response.data.nombre); // Asume que `nombre` es el campo de la asignatura
    } catch (error) {
      console.error("Error fetching asignatura:", error);
    }
  };

  useEffect(() => {
    fetchDataPersonas(currentUrlPersonas); // Proveer la URL inicial
  }, [currentUrlPersonas]); // Ejecutar cuando cambie la URL

  const fetchDataPersonas = async (url: string) => {
    try {
      const response = await API.get(url);
      setPersonas(response.data.results);
      setNextUrlPersonas(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrlPersonas(response.data.previous ? normalizeUrl(response.data.previous) : null);
      setTotalItemsPersonas(response.data.count);

      // Calcular página actual
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const offset = urlParams.get("offset") || "0";
      setCurrentPagePersonas(Math.floor(Number(offset) / pageSizePersonas) + 1);
    } catch (error) {
      console.error("Error fetching data for personas:", error);
    }
  };

  const handleFilterPersonas = (filtro: string) => {
    return personas.filter((docente) => {
      const dniMatch = docente.persona_detalle?.dni?.includes(filtro) ?? false;
      const legajoMatch =
        docente.persona_detalle?.legajo?.includes(filtro) ?? false;
      const nombreMatch =
        docente.persona_detalle?.nombre
          ?.toLowerCase()
          .includes(filtro.toLowerCase()) ?? false;
      const apellidoMatch =
        docente.persona_detalle?.apellido
          ?.toLowerCase()
          .includes(filtro.toLowerCase()) ?? false;
      return dniMatch || legajoMatch || nombreMatch || apellidoMatch;
    });
  };

  // Función para filtrar docentes desde el servidor
  const filtrarDocentes = () => {
    let url = `/facet/docente/?`;
    const params = new URLSearchParams();

    if (filtroDni.trim()) {
      // Usar el campo 'search' global que busca en múltiples campos
      params.append("search", filtroDni);
    }

    url += params.toString();
    fetchDataPersonas(url);
  };

  // Función para cargar las resoluciones
  const fetchDataResoluciones = async (url: string) => {
    try {
      const response = await API.get(url);
      setResoluciones(response.data.results);
      setNextUrlResoluciones(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrlResoluciones(response.data.previous ? normalizeUrl(response.data.previous) : null);
      setTotalItemsResoluciones(response.data.count);

      // Calcular página actual
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const offset = urlParams.get("offset") || "0";
      setCurrentPageResoluciones(
        Math.floor(Number(offset) / pageSizeResoluciones) + 1
      );
    } catch (error) {
      console.error("Error fetching data for resoluciones:", error);
    }
  };

  // Llamada para cargar resoluciones
  useEffect(() => {
    fetchDataResoluciones(currentUrlResoluciones); // Proveer la URL inicial
  }, [currentUrlResoluciones]); // Ejecutar cuando cambie la URL

  // Filtrar resoluciones
  const handleFilterResoluciones = (filtro: string) => {
    return resoluciones.filter((res) => {
      const expedienteMatch = res.nexpediente?.includes(filtro) ?? false;
      const nroResolucionMatch = res.nresolucion?.includes(filtro) ?? false;
      const tipoMatch =
        res.tipo?.toLowerCase().includes(filtro.toLowerCase()) ?? false;
      return expedienteMatch || nroResolucionMatch || tipoMatch;
    });
  };

  // Función para filtrar resoluciones desde el servidor
  const filtrarResoluciones = async () => {
    if (!filtroNroResolucion.trim()) {
      // Si no hay filtro, cargar todas las resoluciones
      fetchDataResoluciones(`/facet/resolucion/`);
      return;
    }

    try {
      // Primero buscar por número de expediente
      let url = `/facet/resolucion/?nexpediente__icontains=${encodeURIComponent(filtroNroResolucion)}`;
      let response = await API.get(url);
      
      // Si no encuentra resultados, buscar por número de resolución
      if (response.data.results.length === 0) {
        url = `/facet/resolucion/?nresolucion__icontains=${encodeURIComponent(filtroNroResolucion)}`;
        response = await API.get(url);
      }
      
      // Actualizar el estado con los resultados
      setResoluciones(response.data.results);
      setNextUrlResoluciones(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrlResoluciones(response.data.previous ? normalizeUrl(response.data.previous) : null);
      setTotalItemsResoluciones(response.data.count);
      
      // Calcular página actual
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const offset = urlParams.get("offset") || "0";
      setCurrentPageResoluciones(Math.floor(Number(offset) / pageSizeResoluciones) + 1);
    } catch (error) {
      console.error("Error filtering resoluciones:", error);
      // En caso de error, cargar todas las resoluciones
      fetchDataResoluciones(`/facet/resolucion/`);
    }
  };

  const [filtroNroResolucion, setFiltroNroResolucion] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroFecha, setFiltroFecha] = useState<dayjs.Dayjs | null>(null);
  const [nombreDepto, setNombreDepto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState("");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [dedicacion, setDedicacion] = useState("");
  const [condicion, setCondicion] = useState("");
  const [cargo, setCargo] = useState("");

  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [resolucion, setResolucion] = useState<Resolucion | null>(null);
  const [openResolucion, setOpenResolucion] = useState(false);
  const [filtroNroExpediente, setFiltroNroExpediente] = useState("");

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
    setModalTitle(title); // Establecer el título del modal
    setModalMessage(message);
    setModalVisible(true);
    setFn(() => onConfirm);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
  };

  const handleConfirmModal = () => {
    router.push(`/dashboard/asignatura/docenteAsignatura/${idAsignatura}`);
  };

  const crearDocenteAsignatura = async () => {
    if (!persona || !asignatura || !resolucion || !dedicacion || !condicion || !cargo) {
      alert(
        "Por favor, selecciona un docente, una asignatura, una resolución, dedicación, condición y cargo."
      );
      return;
    }

    const nuevoDocenteAsignatura = {
      asignatura: idAsignatura,
      docente: persona.id,
      resolucion: resolucion.id,
      observaciones: observaciones,
      estado: estado,
      fecha_de_inicio: formatFechaParaBackend(fechaInicio),
      fecha_de_vencimiento: formatFechaParaBackend(fechaFin),
      dedicacion: dedicacion,
      condicion: condicion,
      cargo: cargo,
    };

    try {
      const response = await API.post(
        `/facet/asignatura-docente/`,
        nuevoDocenteAsignatura
      );
      handleOpenModal(
        "Éxito",
        "Se creó el docente en Asignatura con Exito.",
        handleConfirmModal
      );
    } catch (error: any) {
      console.error("Error al crear docente asignatura:", error);
      
      let errorMessage = "NO se pudo realizar la acción.";
      
      // Si hay errores específicos del backend, mostrarlos
      if (error.response && error.response.data) {
        const errors = error.response.data;
        const errorMessages: string[] = [];
        
        // Procesar cada campo con error
        Object.keys(errors).forEach(field => {
          if (Array.isArray(errors[field]) && errors[field].length > 0) {
            const fieldName = getFieldDisplayName(field);
            errorMessages.push(`${fieldName}: ${errors[field][0]}`);
          }
        });
        
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('\n');
        }
      }
      
      handleOpenModal("Error", errorMessage, () => {});
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">
              Agregar Docente en Asignatura
            </h1>
          </div>

          <div className="p-4">
            <Grid container spacing={2}>
              {/* Sección de Selecciones */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Selecciones Requeridas
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <button
                      onClick={handleOpenPersona}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                      Seleccionar Docente
                    </button>
                    {persona && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2 shadow-sm">
                        <p className="text-sm font-medium text-gray-800">
                          <span className="font-bold text-blue-700">
                            Docente:
                          </span>{" "}
                          <span className="text-gray-900">
                            {persona.persona_detalle
                              ? `${persona.persona_detalle.nombre} ${persona.persona_detalle.apellido}`
                              : "N/A"}
                          </span>
                        </p>
                      </div>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <button
                      onClick={handleOpenResolucion}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                      Seleccionar Resolución
                    </button>
                    {resolucion && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2 shadow-sm">
                        <p className="text-sm font-medium text-gray-800">
                          <span className="font-bold text-blue-700">
                            Resolución:
                          </span>{" "}
                          <span className="text-gray-900">
                            {resolucion.nresolucion}
                          </span>
                        </p>
                      </div>
                    )}
                  </Grid>
                </Grid>
              </Grid>

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Sección de Información de la Asignatura */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Información de la Asignatura
                </Typography>
                <TextField
                  label="Asignatura"
                  value={asignatura}
                  fullWidth
                  disabled
                  variant="outlined"
                  size="small"
                  className="modern-input"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: 1,
                      borderColor: "#d1d5db",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#3b82f6",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#3b82f6",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: "500",
                      backgroundColor: "#ffffff",
                      padding: "0 4px",
                      "&.Mui-focused": {
                        color: "#3b82f6",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                      },
                    },
                    "& .MuiFormLabel-filled": {
                      backgroundColor: "#ffffff",
                    },
                    "& .MuiInputBase-input": {
                      color: "#1f2937",
                      fontWeight: "500",
                      fontSize: "0.875rem",
                      padding: "8px 12px",
                    },
                  }}
                />
              </Grid>

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Sección de Información Adicional */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
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
                      className="modern-input"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          border: 1,
                          borderColor: "#d1d5db",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#6b7280",
                          fontWeight: "500",
                          backgroundColor: "#ffffff",
                          padding: "0 4px",
                          "&.Mui-focused": {
                            color: "#3b82f6",
                            fontWeight: "600",
                            backgroundColor: "#ffffff",
                          },
                        },
                        "& .MuiFormLabel-filled": {
                          backgroundColor: "#ffffff",
                        },
                        "& .MuiInputBase-input": {
                          color: "#1f2937",
                          fontWeight: "500",
                          fontSize: "0.875rem",
                          padding: "8px 12px",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Dedicación"
                      value={dedicacion}
                      onChange={(e) => setDedicacion(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="modern-input"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          border: 1,
                          borderColor: "#d1d5db",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#6b7280",
                          fontWeight: "500",
                          backgroundColor: "#ffffff",
                          padding: "0 4px",
                          "&.Mui-focused": {
                            color: "#3b82f6",
                            fontWeight: "600",
                            backgroundColor: "#ffffff",
                          },
                        },
                        "& .MuiFormLabel-filled": {
                          backgroundColor: "#ffffff",
                        },
                        "& .MuiInputBase-input": {
                          color: "#1f2937",
                          fontWeight: "500",
                          fontSize: "0.875rem",
                          padding: "8px 12px",
                        },
                        "& .MuiSelect-icon": {
                          color: "#6b7280",
                        },
                      }}
                    >
                      <MenuItem value="EXCL">EXCL</MenuItem>
                      <MenuItem value="SIMP">SIMP</MenuItem>
                      <MenuItem value="SEMI">SEMI</MenuItem>
                      <MenuItem value="35HS">35HS</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Condición"
                      value={condicion}
                      onChange={(e) => setCondicion(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="modern-input"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          border: 1,
                          borderColor: "#d1d5db",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#6b7280",
                          fontWeight: "500",
                          backgroundColor: "#ffffff",
                          padding: "0 4px",
                          "&.Mui-focused": {
                            color: "#3b82f6",
                            fontWeight: "600",
                            backgroundColor: "#ffffff",
                          },
                        },
                        "& .MuiFormLabel-filled": {
                          backgroundColor: "#ffffff",
                        },
                        "& .MuiInputBase-input": {
                          color: "#1f2937",
                          fontWeight: "500",
                          fontSize: "0.875rem",
                          padding: "8px 12px",
                        },
                        "& .MuiSelect-icon": {
                          color: "#6b7280",
                        },
                      }}
                    >
                      <MenuItem value="Regular">Regular</MenuItem>
                      <MenuItem value="Interino">Interino</MenuItem>
                      <MenuItem value="Transitorio">Transitorio</MenuItem>
                      <MenuItem value="Licencia sin goce de sueldo">Licencia sin goce de sueldo</MenuItem>
                      <MenuItem value="Renuncia">Renuncia</MenuItem>
                      <MenuItem value="Licencia con goce de sueldo">Licencia con goce de sueldo</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Cargo"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="modern-input"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          border: 1,
                          borderColor: "#d1d5db",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#6b7280",
                          fontWeight: "500",
                          backgroundColor: "#ffffff",
                          padding: "0 4px",
                          "&.Mui-focused": {
                            color: "#3b82f6",
                            fontWeight: "600",
                            backgroundColor: "#ffffff",
                          },
                        },
                        "& .MuiFormLabel-filled": {
                          backgroundColor: "#ffffff",
                        },
                        "& .MuiInputBase-input": {
                          color: "#1f2937",
                          fontWeight: "500",
                          fontSize: "0.875rem",
                          padding: "8px 12px",
                        },
                        "& .MuiSelect-icon": {
                          color: "#6b7280",
                        },
                      }}
                    >
                      <MenuItem value="AUX DOC DE PRIMERA">AUX DOC DE PRIMERA</MenuItem>
                      <MenuItem value="AUX DOCENTE SEGUNDA">AUX DOCENTE SEGUNDA</MenuItem>
                      <MenuItem value="Categoria 01 Dto.366">Categoria 01 Dto.366</MenuItem>
                      <MenuItem value="Categoria 02 Dto.366">Categoria 02 Dto.366</MenuItem>
                      <MenuItem value="Categoria 03 Dto.366">Categoria 03 Dto.366</MenuItem>
                      <MenuItem value="Categoria 04 Dto.366">Categoria 04 Dto.366</MenuItem>
                      <MenuItem value="Categoria 05 Dto.366">Categoria 05 Dto.366</MenuItem>
                      <MenuItem value="Categoria 06 Dto.366">Categoria 06 Dto.366</MenuItem>
                      <MenuItem value="Categoria 07 Dto.366">Categoria 07 Dto.366</MenuItem>
                      <MenuItem value="DECANO FACULTAD">DECANO FACULTAD</MenuItem>
                      <MenuItem value="JEFE TRABAJOS PRACT.">JEFE TRABAJOS PRACT.</MenuItem>
                      <MenuItem value="PROFESOR ADJUNTO">PROFESOR ADJUNTO</MenuItem>
                      <MenuItem value="PROFESOR ASOCIADO">PROFESOR ASOCIADO</MenuItem>
                      <MenuItem value="PROFESOR TITULAR">PROFESOR TITULAR</MenuItem>
                      <MenuItem value="SECRETARIO FACULTAD">SECRETARIO FACULTAD</MenuItem>
                      <MenuItem value="VICE DECANO">VICE DECANO</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Estado"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="modern-input"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          border: 1,
                          borderColor: "#d1d5db",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#6b7280",
                          fontWeight: "500",
                          backgroundColor: "#ffffff",
                          padding: "0 4px",
                          "&.Mui-focused": {
                            color: "#3b82f6",
                            fontWeight: "600",
                            backgroundColor: "#ffffff",
                          },
                        },
                        "& .MuiFormLabel-filled": {
                          backgroundColor: "#ffffff",
                        },
                        "& .MuiInputBase-input": {
                          color: "#1f2937",
                          fontWeight: "500",
                          fontSize: "0.875rem",
                          padding: "8px 12px",
                        },
                        "& .MuiSelect-icon": {
                          color: "#6b7280",
                          transition: "color 0.2s ease",
                        },
                        "&:hover .MuiSelect-icon": {
                          color: "#32",
                        },
                      }}
                    >
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
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Período de Asignación
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Fecha Inicio"
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="modern-input"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          border: 1,
                          borderColor: "#d1d5db",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#6b7280",
                          fontWeight: "500",
                          backgroundColor: "#ffffff",
                          padding: "0 4px",
                          "&.Mui-focused": {
                            color: "#3b82f6",
                            fontWeight: "600",
                            backgroundColor: "#ffffff",
                          },
                        },
                        "& .MuiFormLabel-filled": {
                          backgroundColor: "#ffffff",
                        },
                        "& .MuiInputBase-input": {
                          color: "#1f2937",
                          fontWeight: "500",
                          fontSize: "0.875rem",
                          padding: "8px 12px",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Fecha Fin"
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="modern-input"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          border: 1,
                          borderColor: "#d1d5db",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          color: "#6b7280",
                          fontWeight: "500",
                          backgroundColor: "#ffffff",
                          padding: "0 4px",
                          "&.Mui-focused": {
                            color: "#3b82f6",
                            fontWeight: "600",
                            backgroundColor: "#ffffff",
                          },
                        },
                        "& .MuiFormLabel-filled": {
                          backgroundColor: "#ffffff",
                        },
                        "& .MuiInputBase-input": {
                          color: "#1f2937",
                          fontWeight: "500",
                          fontSize: "0.875rem",
                          padding: "8px 12px",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Botón de acción principal */}
              <Grid item xs={12}>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={crearDocenteAsignatura}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold">
                    Crear Asignación
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>
        </div>

        {/* Dialog para Seleccionar Docente */}
        <Dialog
          open={openPersona}
          onClose={handleClosePersona}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            style: {
              borderRadius: "12px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            },
          }}>
          <DialogTitle className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
            Seleccionar Docente
          </DialogTitle>
          <DialogContent className="p-4">
            <Grid container spacing={2} className="mb-6 mt-6">
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Buscar por DNI o Nombre"
                  value={filtroDni}
                  onChange={(e) => setFiltroDni(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <div className="flex gap-2">
                  <button
                    onClick={filtrarDocentes}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Filtrar
                  </button>
                  <button
                    onClick={() => {
                      setFiltroDni("");
                      fetchDataPersonas(`/facet/docente/`);
                    }}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Limpiar
                  </button>
                </div>
              </Grid>
            </Grid>

            <ResponsiveTable>
              <TableHead>
                <TableRow>
                  <TableCell>DNI</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Apellido</TableCell>
                  <TableCell>Legajo</TableCell>
                  <TableCell>Seleccionar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {personas.map((docente) => (
                  <TableRow
                    key={docente.id}
                    className="hover:bg-blue-50 transition-colors duration-200">
                    <TableCell className="font-medium py-2">
                      {docente.persona_detalle?.dni || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium py-2">
                      {docente.persona_detalle?.nombre || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium py-2">
                      {docente.persona_detalle?.apellido || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium py-2">
                      {docente.persona_detalle?.legajo || "N/A"}
                    </TableCell>
                    <TableCell className="py-2">
                      <button
                        onClick={() => {
                          setPersona(docente);
                          handleClosePersona();
                        }}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium text-sm">
                        Seleccionar
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ResponsiveTable>

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() =>
                  prevUrlPersonas && fetchDataPersonas(prevUrlPersonas)
                }
                disabled={!prevUrlPersonas}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !prevUrlPersonas
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}>
                Anterior
              </button>
              <Typography className="font-medium text-gray-700 text-sm">
                Página {currentPagePersonas} de{" "}
                {Math.ceil(totalItemsPersonas / pageSizePersonas)}
              </Typography>
              <button
                onClick={() =>
                  nextUrlPersonas && fetchDataPersonas(nextUrlPersonas)
                }
                disabled={!nextUrlPersonas}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !nextUrlPersonas
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}>
                Siguiente
              </button>
            </div>
          </DialogContent>
          <DialogActions className="p-4">
            <button
              onClick={handleClosePersona}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all duration-200 font-medium">
              Cerrar
            </button>
          </DialogActions>
        </Dialog>

        {/* Dialog para Seleccionar Resolución */}
        <Dialog
          open={openResolucion}
          onClose={handleCloseResolucion}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            style: {
              borderRadius: "12px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            },
          }}>
          <DialogTitle className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
            Seleccionar Resolución
          </DialogTitle>
          <DialogContent className="p-4">
            <Grid container spacing={2} className="mb-6 mt-6">
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Buscar por Nro Expediente o Resolución"
                  value={filtroNroResolucion}
                  onChange={(e) => setFiltroNroResolucion(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <div className="flex gap-2">
                  <button
                    onClick={filtrarResoluciones}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Filtrar
                  </button>
                  <button
                    onClick={() => {
                      setFiltroNroResolucion("");
                      fetchDataResoluciones(`/facet/resolucion/`);
                    }}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Limpiar
                  </button>
                </div>
              </Grid>
            </Grid>

            <ResponsiveTable>
              <TableHead>
                <TableRow>
                  <TableCell>Nro Expediente</TableCell>
                  <TableCell>Nro Resolución</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Seleccionar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resoluciones.map((resol) => (
                  <TableRow
                    key={resol.id}
                    className="hover:bg-blue-50 transition-colors duration-200">
                    <TableCell className="font-medium py-2">
                      {resol.nexpediente || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium py-2">
                      {resol.nresolucion || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium py-2">
                      {resol.tipo || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium py-2">
                      {resol.fecha 
                        ? (dayjs(resol.fecha).isValid() 
                            ? dayjs(resol.fecha).format("DD/MM/YYYY") 
                            : "Fecha inválida")
                        : (resol.fecha_creacion 
                            ? (dayjs(resol.fecha_creacion).isValid() 
                                ? dayjs(resol.fecha_creacion).format("DD/MM/YYYY") 
                                : "Fecha inválida")
                            : "N/A")}
                    </TableCell>
                    <TableCell className="py-2">
                      <button
                        onClick={() => {
                          setResolucion(resol);
                          handleCloseResolucion();
                        }}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium text-sm">
                        Seleccionar
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ResponsiveTable>

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() =>
                  prevUrlResoluciones &&
                  fetchDataResoluciones(prevUrlResoluciones)
                }
                disabled={!prevUrlResoluciones}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !prevUrlResoluciones
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}>
                Anterior
              </button>
              <Typography className="font-medium text-gray-700 text-sm">
                Página {currentPageResoluciones} de{" "}
                {Math.ceil(totalItemsResoluciones / pageSizeResoluciones)}
              </Typography>
              <button
                onClick={() =>
                  nextUrlResoluciones &&
                  fetchDataResoluciones(nextUrlResoluciones)
                }
                disabled={!nextUrlResoluciones}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !nextUrlResoluciones
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}>
                Siguiente
              </button>
            </div>
          </DialogContent>
          <DialogActions className="p-4">
            <button
              onClick={handleCloseResolucion}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all duration-200 font-medium">
              Cerrar
            </button>
          </DialogActions>
        </Dialog>

        <BasicModal
          open={modalVisible}
          onClose={handleCloseModal}
          title={modalTitle}
          content={modalMessage}
          onConfirm={fn}
        />
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(CrearDocenteAsignatura);
