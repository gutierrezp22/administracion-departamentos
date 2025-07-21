import { useEffect, useState } from "react";
import "./styles.css";
import API from "@/api/axiosConfig";
import { formatFechaParaBackend } from "@/utils/dateHelpers";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BasicModal from "@/utils/modal";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import DashboardMenu from "@/pages/dashboard";
import withAuth from "../../../../../components/withAut";

dayjs.extend(utc);
dayjs.extend(timezone);

const CrearDepartamentoJefe = () => {
  const router = useRouter();

  interface Resolucion {
    id: number;
    nexpediente: string;
    nresolucion: string;
    tipo: string;
    fecha: string;
    observaciones: string;
  }

  interface Jefe {
    id: number;
    persona: Persona;
    observaciones: string;
    estado: 0 | 1;
  }

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

  interface Departamento {
    id: number;
    nombre: string;
  }

  const [fechaInicio, setFechaInicio] = useState<dayjs.Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<dayjs.Dayjs | null>(null);
  const [resolucion, setResolucion] = useState<Resolucion | null>(null);
  const [jefe, setJefe] = useState<Jefe | null>(null);
  const [departamento, setDepartamento] = useState<Departamento | null>(null);

  const [filtroResolucion, setFiltroResolucion] = useState("");
  const [filtroJefe, setFiltroJefe] = useState("");

  const [openJefe, setOpenJefe] = useState(false);
  const [openDepartamento, setOpenDepartamento] = useState(false);

  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});

  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [filtroNroExpediente, setFiltroNroExpediente] = useState("");
  const [filtroNroResolucion, setFiltroNroResolucion] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroFecha, setFiltroFecha] = useState<dayjs.Dayjs | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(`/facet/resolucion/`);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [openResolucion, setOpenResolucion] = useState(false);
  const [selectedResolucion, setSelectedResolucion] =
    useState<Resolucion | null>(null);

  const [jefes, setJefes] = useState<Jefe[]>([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroDni, setFiltroDni] = useState("");

  const [nextUrlJefes, setNextUrlJefes] = useState<string | null>(null);
  const [prevUrlJefes, setPrevUrlJefes] = useState<string | null>(null);
  const [currentUrlJefes, setCurrentUrlJefes] = useState<string>(
    `/facet/jefe/list_jefes_persona/`
  );
  const [totalItemsJefes, setTotalItemsJefes] = useState<number>(0);
  const [currentPageJefes, setCurrentPageJefes] = useState<number>(1);
  const pageSizeJefes = 10;

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [filtroDepartamento, setFiltroDepartamento] = useState("");

  const [nextUrlDepartamentos, setNextUrlDepartamentos] = useState<
    string | null
  >(null);
  const [prevUrlDepartamentos, setPrevUrlDepartamentos] = useState<
    string | null
  >(null);
  const [currentUrlDepartamentos, setCurrentUrlDepartamentos] =
    useState<string>(`/facet/departamento/`);
  const [totalItemsDepartamentos, setTotalItemsDepartamentos] =
    useState<number>(0);
  const [currentPageDepartamentos, setCurrentPageDepartamentos] =
    useState<number>(1);
  const pageSizeDepartamentos = 10;

  // Función helper para normalizar URLs
  const normalizeUrl = (url: string) => {
    // Si la URL es absoluta (comienza con http/https), extraer solo la parte de la ruta
    if (url.startsWith("http")) {
      const urlObj = new URL(url);
      let normalizedUrl = urlObj.pathname + urlObj.search;
      // Remover /api/ si está presente en la URL normalizada
      normalizedUrl = normalizedUrl.replace(/^\/api/, "");
      console.log("Normalized URL:", normalizedUrl);
      return normalizedUrl;
    }
    // Si es relativa, asegurar que comience con / y remover /api/ si está presente
    const normalizedUrl = url.replace(/^\/+/, "/").replace(/^\/api/, "");
    console.log("Normalized URL:", normalizedUrl);
    return normalizedUrl;
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
    router.push("/dashboard/departments/departamentoJefe/");
  };

  useEffect(() => {
    if (openResolucion) fetchResoluciones(currentUrl);
  }, [openResolucion, currentUrl]);

  useEffect(() => {
    if (openJefe) fetchJefes(currentUrlJefes);
  }, [openJefe, currentUrlJefes]);

  useEffect(() => {
    if (openDepartamento) fetchDepartamentos(currentUrlDepartamentos);
  }, [openDepartamento, currentUrlDepartamentos]);

  const fetchResoluciones = async (url: string) => {
    try {
      console.log("Fetching resoluciones from URL:", url);
      const response = await API.get(url);
      setResoluciones(response.data.results);
      setNextUrl(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrl(
        response.data.previous ? normalizeUrl(response.data.previous) : null
      );
      setTotalItems(response.data.count);

      // Calcular la página actual usando offset
      const fullUrl = url.startsWith("http")
        ? url
        : `${window.location.origin}${url}`;
      const offset = new URL(fullUrl).searchParams.get("offset") || "0";
      setCurrentPage(Math.floor(Number(offset) / pageSize) + 1);
    } catch (error) {
      console.error("Error al cargar las resoluciones:", error);
      setResoluciones([]);
      setNextUrl(null);
      setPrevUrl(null);
      setTotalItems(0);
    }
  };

  const filtrarResoluciones = () => {
    let url = `/facet/resolucion/?`;
    const params = new URLSearchParams();

    if (filtroNroExpediente)
      params.append("nexpediente__icontains", filtroNroExpediente);
    if (filtroNroResolucion)
      params.append("nresolucion__icontains", filtroNroResolucion);
    if (filtroTipo) params.append("tipo", filtroTipo);
    if (filtroFecha)
      params.append("fecha__date", formatFechaParaBackend(filtroFecha) || "");

    url += params.toString();
    setCurrentUrl(normalizeUrl(url));
  };

  const fetchJefes = async (url: string) => {
    try {
      console.log("Fetching jefes from URL:", url);
      const response = await API.get(url);
      console.log("Response data:", response.data);
      console.log("Jefes encontrados:", response.data.results?.length || 0);

      setJefes(response.data.results || []);
      setNextUrlJefes(
        response.data.next ? normalizeUrl(response.data.next) : null
      );
      setPrevUrlJefes(
        response.data.previous ? normalizeUrl(response.data.previous) : null
      );
      setTotalItemsJefes(response.data.count || 0);

      // Calcular la página actual usando offset
      const fullUrl = url.startsWith("http")
        ? url
        : `${window.location.origin}${url}`;
      const offset = new URL(fullUrl).searchParams.get("offset") || "0";
      setCurrentPageJefes(Math.floor(Number(offset) / pageSizeJefes) + 1);
    } catch (error: any) {
      console.error("Error al obtener los jefes:", error);
      console.error("Error details:", error.response?.data);
      setJefes([]);
      setNextUrlJefes(null);
      setPrevUrlJefes(null);
      setTotalItemsJefes(0);
    }
  };

  const filtrarJefes = () => {
    let url = `/facet/jefe/list_jefes_persona/?`;
    const params = new URLSearchParams();

    if (filtroNombre) params.append("persona__nombre__icontains", filtroNombre);
    if (filtroDni) params.append("persona__dni__icontains", filtroDni);

    url += params.toString();
    console.log("Filtro URL generada:", url);
    setCurrentPageJefes(1); // Reiniciar a página 1
    setCurrentUrlJefes(normalizeUrl(url));
  };

  const fetchDepartamentos = async (url: string) => {
    try {
      console.log("Fetching departamentos from URL:", url);
      const response = await API.get(url);
      setDepartamentos(response.data.results);
      setNextUrlDepartamentos(
        response.data.next ? normalizeUrl(response.data.next) : null
      );
      setPrevUrlDepartamentos(
        response.data.previous ? normalizeUrl(response.data.previous) : null
      );
      setTotalItemsDepartamentos(response.data.count);

      // Calcular la página actual usando offset
      const fullUrl = url.startsWith("http")
        ? url
        : `${window.location.origin}${url}`;
      const offset = new URL(fullUrl).searchParams.get("offset") || "0";
      setCurrentPageDepartamentos(
        Math.floor(Number(offset) / pageSizeDepartamentos) + 1
      );
    } catch (error) {
      console.error("Error al obtener los departamentos:", error);
      setDepartamentos([]);
      setNextUrlDepartamentos(null);
      setPrevUrlDepartamentos(null);
      setTotalItemsDepartamentos(0);
    }
  };

  const filtrarDepartamentos = () => {
    let url = `/facet/departamento/?`;
    const params = new URLSearchParams();

    if (filtroDepartamento)
      params.append("nombre__icontains", filtroDepartamento);

    url += params.toString();
    setCurrentUrlDepartamentos(normalizeUrl(url));
  };

  const crearNuevoJefeDepartamento = async () => {
    // Validación de campos requeridos
    const camposFaltantes = [];

    if (!selectedResolucion) {
      camposFaltantes.push("Resolución");
    }
    if (!jefe) {
      camposFaltantes.push("Jefe");
    }
    if (!departamento) {
      camposFaltantes.push("Departamento");
    }
    if (!fechaInicio) {
      camposFaltantes.push("Fecha de Inicio");
    }
    if (!fechaFin) {
      camposFaltantes.push("Fecha de Fin");
    }
    if (!estado) {
      camposFaltantes.push("Estado");
    }

    // Si faltan campos, mostrar error
    if (camposFaltantes.length > 0) {
      const mensaje = `Faltan los siguientes campos obligatorios:\n\n${camposFaltantes.join(
        "\n"
      )}`;
      handleOpenModal("Error", mensaje, () => {});
      return;
    }

    // Validación de fechas
    const fechaInicioDate = fechaInicio?.toDate();
    const fechaFinDate = fechaFin?.toDate();

    if (fechaInicioDate && fechaFinDate && fechaInicioDate >= fechaFinDate) {
      handleOpenModal(
        "Error",
        "La fecha de inicio debe ser anterior a la fecha de fin.",
        () => {}
      );
      return;
    }

    // Validación de fechas futuras (solo para fecha de fin)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaFinDate && fechaFinDate < hoy) {
      handleOpenModal(
        "Error",
        "La fecha de fin no puede ser anterior a hoy.",
        () => {}
      );
      return;
    }

    const nuevoJefeDepartamento = {
      departamento: departamento?.id,
      jefe: jefe?.id,
      resolucion: selectedResolucion?.id,
      fecha_de_inicio: formatFechaParaBackend(fechaInicio),
      fecha_de_fin: formatFechaParaBackend(fechaFin),
      observaciones: observaciones,
      estado: estado === "1" ? 1 : 0,
    };

    try {
      await API.post(`/facet/jefe-departamento/`, nuevoJefeDepartamento);
      handleOpenModal(
        "Éxito",
        "Se creó el jefe de departamento con éxito",
        handleConfirmModal
      );
    } catch (error: any) {
      console.error(error);

      // Manejo específico de errores del backend
      let mensajeError = "No se pudo realizar la acción.";

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.detail) {
          mensajeError = errorData.detail;
        } else if (typeof errorData === "object") {
          // Si hay errores específicos por campo
          const erroresCampos = Object.entries(errorData)
            .map(
              ([campo, errores]) =>
                `${campo}: ${
                  Array.isArray(errores) ? errores.join(", ") : errores
                }`
            )
            .join("\n");
          mensajeError = `Errores de validación:\n\n${erroresCampos}`;
        }
      }

      handleOpenModal("Error", mensajeError, () => {});
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">
              Agregar Jefe Departamento
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
                  <Grid item xs={12} md={4}>
                    <button
                      onClick={() => setOpenResolucion(true)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                      Seleccionar Resolución
                    </button>
                    {/* Mostrar la resolución seleccionada */}
                    {selectedResolucion && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2 shadow-sm">
                        <p className="text-sm font-medium text-gray-800">
                          <span className="font-bold text-blue-700">
                            Nro Resolución:
                          </span>{" "}
                          <span className="text-gray-900">
                            {selectedResolucion.nresolucion}
                          </span>
                        </p>
                        <p className="text-sm font-medium text-gray-800">
                          <span className="font-bold text-blue-700">
                            Nro Expediente:
                          </span>{" "}
                          <span className="text-gray-900">
                            {selectedResolucion.nexpediente}
                          </span>
                        </p>
                      </div>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <button
                      onClick={() => setOpenJefe(true)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                      Seleccionar Jefe
                    </button>
                    {jefe && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2 shadow-sm">
                        <p className="text-sm font-medium text-gray-800">
                          <span className="font-bold text-blue-700">
                            Nombre Jefe:
                          </span>{" "}
                          <span className="text-gray-900">{`${jefe.persona.nombre} ${jefe.persona.apellido}`}</span>
                        </p>
                      </div>
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <button
                      onClick={() => setOpenDepartamento(true)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                      Seleccionar Departamento
                    </button>
                    {departamento && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2 shadow-sm">
                        <p className="text-sm font-medium text-gray-800">
                          <span className="font-bold text-blue-700">
                            Departamento:
                          </span>{" "}
                          <span className="text-gray-900">
                            {departamento.nombre}
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
                      multiline
                      rows={2}
                      size="small"
                      className="modern-input"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          border: "1px solid #d1d5db",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
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
                          "&.MuiFormLabel-filled": {
                            backgroundColor: "#ffffff",
                          },
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
                      fullWidth
                      label="Estado"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      variant="outlined"
                      size="small"
                      className="modern-input"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          border: "1px solid #d1d5db",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
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
                          "&.MuiFormLabel-filled": {
                            backgroundColor: "#ffffff",
                          },
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
                          color: "#3b82f6",
                        },
                      }}>
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
                  Período de Gestión
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Fecha de Inicio"
                        value={fechaInicio}
                        onChange={(date) => setFechaInicio(date)}
                        format="DD/MM/YYYY"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            size: "small",
                            className: "modern-input",
                            sx: {
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                                backgroundColor: "#ffffff",
                                border: "1px solid #d1d5db",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  borderColor: "#3b82f6",
                                  backgroundColor: "#ffffff",
                                  boxShadow:
                                    "0 0 0 3px rgba(59, 130, 246, 0.1)",
                                },
                                "&.Mui-focused": {
                                  borderColor: "#3b82f6",
                                  backgroundColor: "#ffffff",
                                  boxShadow:
                                    "0 0 0 3px rgba(59, 130, 246, 0.1)",
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
                                "&.MuiFormLabel-filled": {
                                  backgroundColor: "#ffffff",
                                },
                              },
                              "& .MuiInputBase-input": {
                                color: "#1f2937",
                                fontWeight: "500",
                                fontSize: "0.875rem",
                                padding: "8px 12px",
                              },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Fecha de Fin"
                        value={fechaFin}
                        onChange={(date) => setFechaFin(date)}
                        format="DD/MM/YYYY"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            size: "small",
                            className: "modern-input",
                            sx: {
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                                backgroundColor: "#ffffff",
                                border: "1px solid #d1d5db",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  borderColor: "#3b82f6",
                                  backgroundColor: "#ffffff",
                                  boxShadow:
                                    "0 0 0 3px rgba(59, 130, 246, 0.1)",
                                },
                                "&.Mui-focused": {
                                  borderColor: "#3b82f6",
                                  backgroundColor: "#ffffff",
                                  boxShadow:
                                    "0 0 0 3px rgba(59, 130, 246, 0.1)",
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
                                "&.MuiFormLabel-filled": {
                                  backgroundColor: "#ffffff",
                                },
                              },
                              "& .MuiInputBase-input": {
                                color: "#1f2937",
                                fontWeight: "500",
                                fontSize: "0.875rem",
                                padding: "8px 12px",
                              },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              </Grid>

              {/* Botón de acción principal */}
              <Grid item xs={12}>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={crearNuevoJefeDepartamento}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold">
                    Crear Jefe Departamento
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>
        </div>

        {/* Dialog para Seleccionar Resolución */}
        <Dialog
          open={openResolucion}
          onClose={() => setOpenResolucion(false)}
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
            <Grid container spacing={2} className="mb-4 mt-4">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Nro Expediente"
                  value={filtroNroExpediente}
                  onChange={(e) => setFiltroNroExpediente(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Nro Resolución"
                  value={filtroNroResolucion}
                  onChange={(e) => setFiltroNroResolucion(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    label="Tipo">
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="Rector">Rector</MenuItem>
                    <MenuItem value="Decano">Decano</MenuItem>
                    <MenuItem value="Consejo_Superior">
                      Consejo Superior
                    </MenuItem>
                    <MenuItem value="Consejo_Directivo">
                      Consejo Directivo
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Fecha"
                    value={filtroFecha}
                    onChange={(date) => setFiltroFecha(date)}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                        size: "small",
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <div className="flex gap-2">
                  <button
                    onClick={filtrarResoluciones}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Filtrar
                  </button>
                  <button
                    onClick={() => {
                      setFiltroNroExpediente("");
                      setFiltroNroResolucion("");
                      setFiltroTipo("");
                      setFiltroFecha(null);
                      setCurrentUrl("/facet/resolucion/");
                    }}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Limpiar
                  </button>
                </div>
              </Grid>
            </Grid>

            <TableContainer
              component={Paper}
              className="shadow-lg rounded-lg overflow-hidden"
              style={{ maxHeight: "400px" }}>
              <Table size="small">
                <TableHead className="bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0 z-10">
                  <TableRow>
                    <TableCell className="text-white font-semibold py-2">
                      Nro Expediente
                    </TableCell>
                    <TableCell className="text-white font-semibold py-2">
                      Nro Resolución
                    </TableCell>
                    <TableCell className="text-white font-semibold py-2">
                      Tipo
                    </TableCell>
                    <TableCell className="text-white font-semibold py-2">
                      Fecha
                    </TableCell>
                    <TableCell className="text-white font-semibold py-2">
                      Seleccionar
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resoluciones.map((resolucion) => (
                    <TableRow
                      key={resolucion.id}
                      className="hover:bg-blue-50 transition-colors duration-200">
                      <TableCell className="font-medium py-2">
                        {resolucion.nexpediente}
                      </TableCell>
                      <TableCell className="font-medium py-2">
                        {resolucion.nresolucion}
                      </TableCell>
                      <TableCell className="font-medium py-2">
                        {resolucion.tipo}
                      </TableCell>
                      <TableCell className="font-medium py-2">
                        {resolucion.fecha}
                      </TableCell>
                      <TableCell className="py-2">
                        <button
                          onClick={() => {
                            setSelectedResolucion(resolucion);
                            setOpenResolucion(false);
                          }}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium text-sm">
                          Seleccionar
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => prevUrl && setCurrentUrl(normalizeUrl(prevUrl))}
                disabled={!prevUrl}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !prevUrl
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}>
                Anterior
              </button>
              <Typography className="font-medium text-gray-700 text-sm">
                Página {currentPage} de {Math.ceil(totalItems / pageSize)}
              </Typography>
              <button
                onClick={() => nextUrl && setCurrentUrl(normalizeUrl(nextUrl))}
                disabled={!nextUrl}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !nextUrl
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}>
                Siguiente
              </button>
            </div>
          </DialogContent>
          <DialogActions className="p-4">
            <button
              onClick={() => setOpenResolucion(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all duration-200 font-medium">
              Cerrar
            </button>
          </DialogActions>
        </Dialog>

        {/* Dialog para Seleccionar Jefe */}
        <Dialog
          open={openJefe}
          onClose={() => setOpenJefe(false)}
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
            Seleccionar Jefe
          </DialogTitle>
          <DialogContent className="p-4">
            <Grid container spacing={2} className="mb-4 mt-4">
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre"
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="DNI"
                  value={filtroDni}
                  onChange={(e) => setFiltroDni(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <div className="flex gap-2">
                  <button
                    onClick={filtrarJefes}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Filtrar
                  </button>
                  <button
                    onClick={() => {
                      setFiltroNombre("");
                      setFiltroDni("");
                      setCurrentUrlJefes("/facet/jefe/list_jefes_persona/");
                    }}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Limpiar
                  </button>
                </div>
              </Grid>
            </Grid>

            <TableContainer
              component={Paper}
              className="shadow-lg rounded-lg overflow-hidden"
              style={{ maxHeight: "400px" }}>
              <Table size="small">
                <TableHead className="bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0 z-10">
                  <TableRow>
                    <TableCell className="text-white font-semibold py-2">
                      Nombre
                    </TableCell>
                    <TableCell className="text-white font-semibold py-2">
                      DNI
                    </TableCell>
                    <TableCell className="text-white font-semibold py-2">
                      Seleccionar
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jefes.map((jefe) => (
                    <TableRow
                      key={jefe.id}
                      className="hover:bg-blue-50 transition-colors duration-200">
                      <TableCell className="font-medium py-2">
                        {`${jefe.persona.nombre} ${jefe.persona.apellido}`}
                      </TableCell>
                      <TableCell className="font-medium py-2">
                        {jefe.persona.dni}
                      </TableCell>
                      <TableCell className="py-2">
                        <button
                          onClick={() => {
                            setJefe(jefe);
                            setOpenJefe(false);
                          }}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium text-sm">
                          Seleccionar
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() =>
                  prevUrlJefes && setCurrentUrlJefes(normalizeUrl(prevUrlJefes))
                }
                disabled={!prevUrlJefes}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !prevUrlJefes
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}>
                Anterior
              </button>
              <Typography className="font-medium text-gray-700 text-sm">
                Página {currentPageJefes} de{" "}
                {Math.ceil(totalItemsJefes / pageSizeJefes)}
              </Typography>
              <button
                onClick={() =>
                  nextUrlJefes && setCurrentUrlJefes(normalizeUrl(nextUrlJefes))
                }
                disabled={!nextUrlJefes}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !nextUrlJefes
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}>
                Siguiente
              </button>
            </div>
          </DialogContent>
          <DialogActions className="p-4">
            <button
              onClick={() => setOpenJefe(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all duration-200 font-medium">
              Cerrar
            </button>
          </DialogActions>
        </Dialog>

        {/* Dialog para Seleccionar Departamento */}
        <Dialog
          open={openDepartamento}
          onClose={() => setOpenDepartamento(false)}
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
            Seleccionar Departamento
          </DialogTitle>
          <DialogContent className="p-4">
            <Grid container spacing={2} className="mb-4 mt-4">
              <Grid item xs={12}>
                <TextField
                  label="Nombre del Departamento"
                  value={filtroDepartamento}
                  onChange={(e) => setFiltroDepartamento(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <div className="flex gap-2">
                  <button
                    onClick={filtrarDepartamentos}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Filtrar
                  </button>
                  <button
                    onClick={() => {
                      setFiltroDepartamento("");
                      setCurrentUrlDepartamentos("/facet/departamento/");
                    }}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Limpiar
                  </button>
                </div>
              </Grid>
            </Grid>

            <TableContainer
              component={Paper}
              className="shadow-lg rounded-lg overflow-hidden"
              style={{ maxHeight: "400px" }}>
              <Table size="small">
                <TableHead className="bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0 z-10">
                  <TableRow>
                    <TableCell className="text-white font-semibold py-2">
                      Nombre
                    </TableCell>
                    <TableCell className="text-white font-semibold py-2">
                      Seleccionar
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departamentos.map((departamento) => (
                    <TableRow
                      key={departamento.id}
                      className="hover:bg-blue-50 transition-colors duration-200">
                      <TableCell className="font-medium py-2">
                        {departamento.nombre}
                      </TableCell>
                      <TableCell className="py-2">
                        <button
                          onClick={() => {
                            setDepartamento(departamento);
                            setOpenDepartamento(false);
                          }}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium text-sm">
                          Seleccionar
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() =>
                  prevUrlDepartamentos &&
                  setCurrentUrlDepartamentos(normalizeUrl(prevUrlDepartamentos))
                }
                disabled={!prevUrlDepartamentos}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !prevUrlDepartamentos
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}>
                Anterior
              </button>
              <Typography className="font-medium text-gray-700 text-sm">
                Página {currentPageDepartamentos} de{" "}
                {Math.ceil(totalItemsDepartamentos / pageSizeDepartamentos)}
              </Typography>
              <button
                onClick={() =>
                  nextUrlDepartamentos &&
                  setCurrentUrlDepartamentos(normalizeUrl(nextUrlDepartamentos))
                }
                disabled={!nextUrlDepartamentos}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !nextUrlDepartamentos
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}>
                Siguiente
              </button>
            </div>
          </DialogContent>
          <DialogActions className="p-4">
            <button
              onClick={() => setOpenDepartamento(false)}
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

export default withAuth(CrearDepartamentoJefe);
