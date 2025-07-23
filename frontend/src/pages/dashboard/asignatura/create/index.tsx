import { useEffect, useState } from "react";
import "./styles.css";
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import DashboardMenu from "../../../dashboard";
import withAuth from "../../../../components/withAut"; // Importa el HOC
import API from "@/api/axiosConfig";

dayjs.extend(utc);
dayjs.extend(timezone);

const CrearAsignatura = () => {
  const router = useRouter();

  interface Area {
    id: number;
    departamento: number;
    nombre: string;
    estado: 0 | 1;
  }

  type TipoAsignatura = "Electiva" | "Obligatoria";

  const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null);
  const [openAreaModal, setOpenAreaModal] = useState(false);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState("1"); // Valor por defecto: Activo
  const [tipo, setTipo] = useState("Obligatoria"); // Valor por defecto
  const [modulo, setModulo] = useState("");
  const [programa, setPrograma] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});

  const [areas, setAreas] = useState<Area[]>([]);
  const [filtroAreas, setFiltroAreas] = useState("");
  const [nextUrlAreas, setNextUrlAreas] = useState<string | null>(null);
  const [prevUrlAreas, setPrevUrlAreas] = useState<string | null>(null);
  const [currentUrlAreas, setCurrentUrlAreas] =
    useState<string>(`/facet/area/`);
  const [totalItemsAreas, setTotalItemsAreas] = useState<number>(0);
  const [currentPageAreas, setCurrentPageAreas] = useState<number>(1);
  const pageSizeAreas = 10; // Tamaño de página

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
    router.push("/dashboard/asignatura/");
  };

  const handleOpenAreaModal = () => {
    setOpenAreaModal(true);
  };

  const handleCloseAreaModal = () => {
    setOpenAreaModal(false);
  };

  useEffect(() => {
    if (openAreaModal) fetchAreas(currentUrlAreas);
  }, [openAreaModal, currentUrlAreas]);

  const fetchAreas = async (url: string) => {
    try {
      const response = await API.get(url);

      setAreas(response.data.results); // Datos de la página actual
      setNextUrlAreas(response.data.next); // URL de la página siguiente
      setPrevUrlAreas(response.data.previous); // URL de la página anterior
      setTotalItemsAreas(response.data.count); // Total de elementos

      // Calcula la página actual usando offset
      const fullUrl = url.startsWith("http")
        ? url
        : `${window.location.origin}${url}`;
      const offset = new URL(fullUrl).searchParams.get("offset") || "0";
      setCurrentPageAreas(Math.floor(Number(offset) / pageSizeAreas) + 1);
    } catch (error) {
      console.error("Error al obtener áreas:", error);
      setAreas([]);
      setNextUrlAreas(null);
      setPrevUrlAreas(null);
      setTotalItemsAreas(0);
    }
  };

  const filtrarAreas = () => {
    let url = `/facet/area/?`;
    const params = new URLSearchParams();

    if (filtroAreas) params.append("nombre__icontains", filtroAreas);

    url += params.toString();
    setCurrentUrlAreas(url); // Actualiza la URL, lo que dispara el useEffect
  };

  const crearNuevaAsignatura = async () => {
    // Validar campos requeridos
    if (!areaSeleccionada) {
      handleOpenModal("Error", "Debe seleccionar un área.", () => {});
      return;
    }

    if (!nombre.trim()) {
      handleOpenModal(
        "Error",
        "El nombre de la asignatura es obligatorio.",
        () => {}
      );
      return;
    }

    if (!codigo.trim()) {
      handleOpenModal(
        "Error",
        "El código de la asignatura es obligatorio.",
        () => {}
      );
      return;
    }

    if (!tipo) {
      handleOpenModal(
        "Error",
        "Debe seleccionar un tipo de asignatura.",
        () => {}
      );
      return;
    }

    const nuevaAsignatura = {
      area: areaSeleccionada.id,
      departamento: areaSeleccionada.departamento,
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      modulo: modulo.trim() || null,
      programa: programa.trim() || null,
      tipo: tipo,
      estado: estado,
    };

    try {
      await API.post(`/facet/asignatura/`, nuevaAsignatura);
      handleOpenModal(
        "Éxito",
        "Se creó la asignatura con éxito.",
        handleConfirmModal
      );
    } catch (error: any) {
      console.error("Error al crear asignatura:", error);
      const errorMessage =
        error.response?.data?.message || "No se pudo realizar la acción.";
      handleOpenModal("Error", errorMessage, () => {});
    }
  };

  const confirmarSeleccionArea = () => {
    handleCloseAreaModal();
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Crear Asignatura</h1>
          </div>

          <div className="p-4">
            <Grid container spacing={2}>
              {/* Sección de Selección */}
              <Grid item xs={12}>
                <Typography variant="h6" className="text-gray-700 font-semibold mb-3">
                  Selección Requerida
                </Typography>
                <button
                  onClick={handleOpenAreaModal}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                  Seleccionar Área
                </button>
                {areaSeleccionada && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2 shadow-sm">
                    <p className="text-sm font-medium text-gray-800">
                      <span className="font-bold text-blue-700">Área:</span>{" "}
                      <span className="text-gray-900">{areaSeleccionada.nombre}</span>
                    </p>
                  </div>
                )}
              </Grid>

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Sección de Información Básica */}
              <Grid item xs={12}>
                <Typography variant="h6" className="text-gray-700 font-semibold mb-3">
                  Información Básica
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Nombre de la Asignatura"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value.toUpperCase())}
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
                      label="Código"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.toUpperCase())}
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
                      label="Módulo"
                      value={modulo}
                      onChange={(e) => setModulo(e.target.value.toUpperCase())}
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
                      label="Link Programa Adjunto"
                      value={programa}
                      onChange={(e) => setPrograma(e.target.value)}
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
                      select
                      label="Tipo"
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as TipoAsignatura)}
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
                    >
                      <MenuItem value="Electiva">Electiva</MenuItem>
                      <MenuItem value="Obligatoria">Obligatoria</MenuItem>
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
                    >
                      <MenuItem value={1}>Activo</MenuItem>
                      <MenuItem value={0}>Inactivo</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Grid>

              {/* Botón de acción principal */}
              <Grid item xs={12}>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={crearNuevaAsignatura}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold">
                    Crear Asignatura
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>
        </div>

        <Dialog
          open={openAreaModal}
          onClose={handleCloseAreaModal}
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
            Seleccionar Área
          </DialogTitle>
          <DialogContent className="p-4">
            {/* Filtro */}
            <Grid container spacing={2} className="mb-4 mt-4">
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Buscar por Nombre"
                  value={filtroAreas}
                  onChange={(e) => setFiltroAreas(e.target.value)}
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
              <Grid item xs={12} sm={4}>
                <div className="flex gap-2">
                  <button
                    onClick={filtrarAreas}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Filtrar
                  </button>
                  <button
                    onClick={() => {
                      setFiltroAreas("");
                      setCurrentUrlAreas("/facet/area/");
                    }}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Limpiar
                  </button>
                </div>
              </Grid>
            </Grid>

            {/* Tabla de Áreas */}
            <TableContainer
              component={Paper}
              className="shadow-lg rounded-lg overflow-hidden"
              style={{ maxHeight: "400px", overflow: "auto" }}>
              <Table size="small">
                <TableHead className="bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0 z-10">
                  <TableRow>
                    <TableCell className="text-white font-semibold py-2">
                      Nombre
                    </TableCell>
                    <TableCell className="text-white font-semibold py-2">
                      Estado
                    </TableCell>
                    <TableCell className="text-white font-semibold py-2">
                      Seleccionar
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {areas.map((area) => (
                    <TableRow
                      key={area.id}
                      className="hover:bg-blue-50 transition-colors duration-200">
                      <TableCell className="font-medium py-2">
                        {area.nombre}
                      </TableCell>
                      <TableCell className="font-medium py-2">
                        {area.estado == 1 ? "Activo" : "Inactivo"}
                      </TableCell>
                      <TableCell className="py-2">
                        <button
                          onClick={() => setAreaSeleccionada(area)}
                          className={`px-3 py-1 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium text-sm ${
                            areaSeleccionada?.id === area.id
                              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                          }`}>
                          Seleccionar
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => prevUrlAreas && fetchAreas(prevUrlAreas)}
                disabled={!prevUrlAreas}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !prevUrlAreas
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}>
                Anterior
              </button>
              <Typography className="font-medium text-gray-700 text-sm">
                Página {currentPageAreas} de{" "}
                {Math.ceil(totalItemsAreas / pageSizeAreas)}
              </Typography>
              <button
                onClick={() => nextUrlAreas && fetchAreas(nextUrlAreas)}
                disabled={!nextUrlAreas}
                className={`px-3 py-1 rounded-lg font-medium transition-all duration-200 text-sm ${
                  !nextUrlAreas
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
                }`}>
                Siguiente
              </button>
            </div>
          </DialogContent>
          <DialogActions className="p-4">
            <button
              onClick={handleCloseAreaModal}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all duration-200 font-medium">
              Cerrar
            </button>
            <button
              onClick={confirmarSeleccionArea}
              disabled={!areaSeleccionada}
              className={`ml-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                !areaSeleccionada
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transform hover:scale-105"
              }`}>
              Confirmar Selección
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

export default withAuth(CrearAsignatura);
