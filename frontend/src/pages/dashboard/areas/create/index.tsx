import { useEffect, useState } from "react";
import "./styles.css";
import API from "@/api/axiosConfig";
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
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
  MenuItem,
} from "@mui/material";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import DashboardMenu from "../../../dashboard";
import withAuth from "../../../../components/withAut"; // Importa el HOC
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

const CrearArea = () => {
  const router = useRouter();

  interface Departamento {
    id: number;
    nombre: string;
    telefono: string;
    estado: 0 | 1;
    interno: string;
  }

  const [departamentoSeleccionado, setDepartamentoSeleccionado] =
    useState<Departamento | null>(null);
  const [openDepartamentoModal, setOpenDepartamentoModal] = useState(false);
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState("1"); // Valor por defecto: Activo
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [filtroDepartamentos, setFiltroDepartamentos] = useState("");

  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(`/facet/departamento/`);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10; // Número de elementos por página

  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  // Función helper para normalizar URLs
  const normalizeUrl = (url: string) => {
    return url.replace(window.location.origin, "").replace(/^\/+/, "/");
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
    router.push("/dashboard/areas/");
  };

  const handleOpenDepartamentoModal = () => {
    setOpenDepartamentoModal(true);
  };

  const handleCloseDepartamentoModal = () => {
    setOpenDepartamentoModal(false);
  };

  useEffect(() => {
    if (openDepartamentoModal) {
      fetchDepartamentos(currentUrl);
    }
  }, [openDepartamentoModal, currentUrl]);

  const fetchDepartamentos = async (url: string) => {
    try {
      console.log("Fetching departamentos from URL:", url);
      const response = await API.get(url);

      setDepartamentos(response.data.results); // Lista de departamentos paginados
      setNextUrl(response.data.next); // URL para la página siguiente
      setPrevUrl(response.data.previous); // URL para la página anterior
      setTotalItems(response.data.count); // Total de elementos en la base de datos

      // Calcular la página actual usando offset
      // Construir URL completa solo si es necesario
      const fullUrl = url.startsWith("http")
        ? url
        : `${window.location.origin}${url}`;
      const offset = new URL(fullUrl).searchParams.get("offset") || "0";
      setCurrentPage(Math.floor(Number(offset) / pageSize) + 1);
    } catch (error) {
      console.error("Error al obtener departamentos:", error);
      setDepartamentos([]);
      setNextUrl(null);
      setPrevUrl(null);
      setTotalItems(0);
      // No mostrar modal de error aquí, solo loguear
    }
  };

  const filtrarDepartamentos = () => {
    let url = `/facet/departamento/?`;
    const params = new URLSearchParams();

    if (filtroDepartamentos)
      params.append("nombre__icontains", filtroDepartamentos);

    url += params.toString();
    setCurrentUrl(normalizeUrl(url)); // Actualiza la URL, lo que dispara el useEffect
  };

  const crearNuevaArea = async () => {
    // Validar campos requeridos
    if (!departamentoSeleccionado) {
      handleOpenModal("Error", "Debe seleccionar un departamento.", () => {});
      return;
    }

    if (!nombre.trim()) {
      handleOpenModal("Error", "El nombre del área es obligatorio.", () => {});
      return;
    }

    const nuevaArea = {
      departamento: departamentoSeleccionado.id,
      nombre: nombre.trim(),
      estado: estado,
    };

    try {
      const response = await API.post(`/facet/area/`, nuevaArea);
      handleOpenModal(
        "Éxito",
        "Se creó el área con éxito.",
        handleConfirmModal
      );
    } catch (error: any) {
      console.error("Error al crear área:", error);
      const errorMessage =
        error.response?.data?.message || "NO se pudo realizar la acción.";
      handleOpenModal("Error", errorMessage, () => {});
    }
  };


  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Crear Área</h1>
          </div>

          <div className="p-4">
            <Grid container spacing={2}>
              {/* Sección de Selección */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Selección Requerida
                </Typography>
                <button
                  onClick={handleOpenDepartamentoModal}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                  Seleccionar Departamento
                </button>
                {departamentoSeleccionado && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2 shadow-sm">
                    <p className="text-sm font-medium text-gray-800">
                      <span className="font-bold text-blue-700">
                        Departamento:
                      </span>{" "}
                      <span className="text-gray-900">
                        {departamentoSeleccionado.nombre}
                      </span>
                    </p>
                  </div>
                )}
              </Grid>

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Sección de Información del Área */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Información del Área
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Nombre del Área"
                      value={nombre}
                      onChange={(e) =>
                        setNombre(capitalizeFirstLetter(e.target.value))
                      }
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
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.5)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.5)",
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
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.5)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3b82f6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 0 3px rgba(59, 130, 246, 0.5)",
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
                    onClick={crearNuevaArea}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 font-semibold">
                    Crear Área
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>
        </div>

        <Dialog
          open={openDepartamentoModal}
          onClose={handleCloseDepartamentoModal}
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
            {/* Filtros Compactos - Departamento */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 mb-5 mt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <FunnelIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">Filtros de Búsqueda</span>
                </div>
                <button
                  onClick={() => {
                    setFiltroDepartamentos("");
                    setCurrentUrl("/facet/departamento/");
                  }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  <span>Limpiar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="relative sm:col-span-2">
                  <input
                    type="text"
                    value={filtroDepartamentos}
                    onChange={(e) => setFiltroDepartamentos(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && filtrarDepartamentos()}
                    placeholder="Buscar por Nombre"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
                      focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                      hover:border-blue-400 hover:bg-white
                      transition-all duration-200
                      text-sm text-gray-700 placeholder-gray-400
                      shadow-sm pr-9"
                  />
                  <MagnifyingGlassIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={filtrarDepartamentos}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 
                    hover:from-blue-600 hover:to-blue-700 
                    text-white px-4 py-2 rounded-lg shadow-md shadow-blue-500/20
                    transition-all duration-200 text-sm font-semibold
                    hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  <span>Buscar</span>
                </button>
              </div>
            </div>

            {/* Tabla de Departamentos */}
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
                      Teléfono
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
                  {departamentos.map((departamento) => (
                    <TableRow
                      key={departamento.id}
                      className="hover:bg-blue-50 transition-colors duration-200">
                      <TableCell className="font-medium py-2">
                        {departamento.nombre}
                      </TableCell>
                      <TableCell className="font-medium py-2">
                        {departamento.telefono}
                      </TableCell>
                      <TableCell className="font-medium py-2">
                        {departamento.estado == 1 ? "Activo" : "Inactivo"}
                      </TableCell>
                      <TableCell className="py-2">
                        <button
                          onClick={() => {
                            setDepartamentoSeleccionado(departamento);
                            handleCloseDepartamentoModal();
                          }}
                          className={`px-3 py-1 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium text-sm ${
                            departamentoSeleccionado?.id === departamento.id
                              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                          }`}>
                          {departamentoSeleccionado?.id === departamento.id ? "Seleccionado" : "Seleccionar"}
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
              onClick={handleCloseDepartamentoModal}
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

export default withAuth(CrearArea);
