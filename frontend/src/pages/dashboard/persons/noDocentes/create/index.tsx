import { useEffect, useState } from "react";
import "./styles.css";
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
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import DashboardMenu from "../../../../dashboard";
import withAuth from "../../../../../components/withAut";
import API from "@/api/axiosConfig";

const CrearNoDocente = () => {
  const router = useRouter();

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

  const [persona, setPersona] = useState<Persona | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroApellido, setFiltroApellido] = useState("");
  const [filtroDni, setFiltroDni] = useState("");
  const [filtroLegajo, setFiltroLegajo] = useState("");
  const [openPersona, setOpenPersona] = useState(false);
  const [nombre, setNombre] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState<number>(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  const handleOpenPersona = () => {
    setOpenPersona(true);
    fetchPersonas(`/facet/persona/`);
  };

  const handleClose = () => {
    setOpenPersona(false);
  };

  // Función para normalizar URLs de paginación
  const normalizeUrl = (url: string) => {
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    }
    return url.replace(/^\/+/, '/');
  };

  const fetchPersonas = async (url: string) => {
    try {
      // Normalizar la URL de entrada si es absoluta
      let apiUrl = url;
      if (url.startsWith("http")) {
        const urlObj = new URL(url);
        apiUrl = urlObj.pathname + urlObj.search;
      }

      console.log("Fetching URL:", apiUrl); // Debug log
      console.log("Original URL:", url); // Debug log

      const response = await API.get(apiUrl);
      setPersonas(response.data.results);

      // Normalizar las URLs de paginación que vienen del backend
      const normalizedNext = response.data.next ? normalizeUrl(response.data.next) : null;
      const normalizedPrev = response.data.previous ? normalizeUrl(response.data.previous) : null;
      
      console.log("Original next URL:", response.data.next);
      console.log("Normalized next URL:", normalizedNext);
      console.log("Original prev URL:", response.data.previous);
      console.log("Normalized prev URL:", normalizedPrev);
      
      setNextUrl(normalizedNext);
      setPrevUrl(normalizedPrev);
      setTotalItems(response.data.count);

      // Calcular la página actual basándose en los parámetros de la URL
      const urlParams = new URLSearchParams(apiUrl.split("?")[1] || "");
      const offset = parseInt(urlParams.get("offset") || "0");
      const limit = parseInt(urlParams.get("limit") || "10");
      const calculatedPage = Math.floor(offset / limit) + 1;
      setCurrentPage(calculatedPage);
    } catch (error) {
      console.error("Error fetching paginated data:", error);
    }
  };

  const filtrarPersonas = () => {
    let url = `/facet/persona/?`;
    const params = new URLSearchParams();

    if (filtroNombre.trim()) params.append("nombre__icontains", filtroNombre);
    if (filtroApellido.trim())
      params.append("apellido__icontains", filtroApellido);
    if (filtroDni.trim()) params.append("dni__icontains", filtroDni);
    if (filtroLegajo.trim()) params.append("legajo__icontains", filtroLegajo);

    url += params.toString();
    fetchPersonas(url);
  };

  const crearNuevoNoDocenteDepartamento = async () => {
    const nuevoNoDocente = {
      persona: persona?.id,
      observaciones,
      estado,
    };

    try {
      // Busca si ya existe un no docente asociado a esta persona (incluye activos e inactivos)
      const response = await API.get(`/facet/nodocente/`, {
        params: {
          persona: persona?.id, // Filtrar por ID de la persona
          show_all: true, // Incluir todos los estados para validación completa
        },
      });

      // Si hay resultados, significa que ya existe un no docente
      if (response.data.results.length > 0) {
        handleOpenModal(
          "Error",
          "Ya existe un no docente para esta persona",
          () => {}
        );
        return; // Detenemos la ejecución
      }

      await API.post(`/facet/nodocente/`, nuevoNoDocente);

      handleOpenModal("Bien", "Se creó el no docente con éxito", () => {
        router.push("/dashboard/persons/noDocentes/");
      });
    } catch (error) {
      handleOpenModal("Error", "No se pudo realizar la acción.", () => {});
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <Paper elevation={3} className="bg-white shadow-lg rounded-lg">
          {/* Título separado */}
          <div className="p-4 border-b border-gray-200">
            <Typography variant="h5" className="text-gray-800 font-semibold">
              Agregar No Docente
            </Typography>
          </div>

          {/* Contenido del formulario */}
          <div className="p-4">
            <Grid container spacing={2}>
              {/* Sección: Selección de Persona */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Selección de Persona
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <button
                  onClick={handleOpenPersona}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                  Seleccionar Persona
                </button>
                {persona && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2 shadow-sm">
                    <p className="text-sm font-medium text-gray-800">
                      <span className="font-bold text-blue-700">
                        Persona Seleccionada:
                      </span>{" "}
                      <span className="text-gray-900">{`${persona.apellido}, ${persona.nombre}`}</span>
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      <span className="font-bold text-blue-700">
                        DNI:
                      </span>{" "}
                      <span className="text-gray-900">{persona.dni}</span>
                    </p>
                  </div>
                )}
              </Grid>

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Sección: Información del No Docente */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Información del No Docente
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  disabled
                  label="DNI"
                  value={dni}
                  fullWidth
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
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  disabled
                  label="Nombre Completo"
                  value={`${apellido} ${nombre}`}
                  fullWidth
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
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2}
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
                <FormControl 
                  fullWidth 
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
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={estado}
                    label="Estado"
                    onChange={(e) => setEstado(Number(e.target.value))}>
                    <MenuItem value={1}>Activo</MenuItem>
                    <MenuItem value={0}>Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Botón de acción centrado */}
              <Grid item xs={12}>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={crearNuevoNoDocenteDepartamento}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Crear No Docente
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>

          <Dialog
            open={openPersona}
            onClose={handleClose}
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
              Seleccionar Persona
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
                    label="Apellido"
                    value={filtroApellido}
                    onChange={(e) => setFiltroApellido(e.target.value)}
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Legajo"
                    value={filtroLegajo}
                    onChange={(e) => setFiltroLegajo(e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <div className="flex gap-2">
                    <button
                      onClick={filtrarPersonas}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                      Filtrar
                    </button>
                    <button
                      onClick={() => {
                        setFiltroNombre("");
                        setFiltroApellido("");
                        setFiltroDni("");
                        setFiltroLegajo("");
                        fetchPersonas("/facet/persona/");
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
                style={{ maxHeight: "400px", overflow: "auto" }}>
                <Table size="small">
                  <TableHead className="bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0 z-10">
                    <TableRow>
                      <TableCell className="text-white font-semibold py-2">
                        DNI
                      </TableCell>
                      <TableCell className="text-white font-semibold py-2">
                        Apellido
                      </TableCell>
                      <TableCell className="text-white font-semibold py-2">
                        Nombre
                      </TableCell>
                      <TableCell className="text-white font-semibold py-2">
                        Legajo
                      </TableCell>
                      <TableCell className="text-white font-semibold py-2">
                        Seleccionar
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {personas.map((p) => (
                      <TableRow
                        key={p.id}
                        className="hover:bg-blue-50 transition-colors duration-200">
                        <TableCell className="font-medium py-2">
                          {p.dni}
                        </TableCell>
                        <TableCell className="font-medium py-2">
                          {p.apellido}
                        </TableCell>
                        <TableCell className="font-medium py-2">
                          {p.nombre}
                        </TableCell>
                        <TableCell className="font-medium py-2">
                          {p.legajo}
                        </TableCell>
                        <TableCell className="py-2">
                          <button
                            onClick={() => {
                              setPersona(p);
                              setApellido(p.apellido);
                              setDni(p.dni);
                              setNombre(p.nombre);
                              handleClose();
                            }}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium text-sm">
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
                  onClick={() => prevUrl && fetchPersonas(prevUrl)}
                  disabled={!prevUrl}
                  className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                    !prevUrl
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                  }`}>
                  Anterior
                </button>
                <Typography className="font-medium text-gray-700 text-sm">
                  Página {currentPage} de {Math.ceil(totalItems / 10)}
                </Typography>
                <button
                  onClick={() => nextUrl && fetchPersonas(nextUrl)}
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
                onClick={handleClose}
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
        </Paper>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(CrearNoDocente);
