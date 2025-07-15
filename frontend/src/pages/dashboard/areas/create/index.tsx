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
  const [currentUrl, setCurrentUrl] = useState<string>(
    `/facet/departamento/`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10; // Número de elementos por página

  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  // Función helper para normalizar URLs
  const normalizeUrl = (url: string) => {
    return url.replace(window.location.origin, '').replace(/^\/+/, '/');
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
      const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
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
      const errorMessage = error.response?.data?.message || "NO se pudo realizar la acción.";
      handleOpenModal("Error", errorMessage, () => {});
    }
  };

  const confirmarSeleccionDepartamento = () => {
    handleCloseDepartamentoModal();
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Área
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <button
                onClick={handleOpenDepartamentoModal}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                Seleccionar Departamento
              </button>

              <Dialog
                open={openDepartamentoModal}
                onClose={handleCloseDepartamentoModal}
                maxWidth="md"
                fullWidth>
                <DialogTitle>Seleccionar Departamento</DialogTitle>
                <DialogContent>
                  {/* Filtro */}
                  <TextField
                    label="Buscar por Nombre"
                    value={filtroDepartamentos}
                    onChange={(e) => setFiltroDepartamentos(e.target.value)}
                    fullWidth
                    margin="normal"
                    variant="outlined"
                  />
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={filtrarDepartamentos}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                      Filtrar
                    </button>
                    <button
                      onClick={() => {
                        setFiltroDepartamentos("");
                        setCurrentUrl("/facet/departamento/");
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                      Limpiar
                    </button>
                  </div>

                  {/* Tabla de Departamentos */}
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Teléfono</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell>Seleccionar</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {departamentos.map((departamento) => (
                          <TableRow key={departamento.id}>
                            <TableCell>{departamento.nombre}</TableCell>
                            <TableCell>{departamento.telefono}</TableCell>
                            <TableCell>
                              {departamento.estado == 1 ? "Activo" : "Inactivo"}
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() =>
                                  setDepartamentoSeleccionado(departamento)
                                }
                                className={`px-3 py-1 rounded-md transition-colors duration-200 border ${
                                  departamentoSeleccionado?.id ===
                                  departamento.id
                                    ? "bg-green-500 text-white border-green-500 hover:bg-green-600"
                                    : "border-gray-300 hover:bg-gray-100"
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
                      onClick={() => prevUrl && setCurrentUrl(normalizeUrl(prevUrl))}
                      disabled={!prevUrl}
                      className={`mr-2 px-3 py-1 rounded-md ${
                        !prevUrl
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}>
                      Anterior
                    </button>
                    <Typography>
                      Página {currentPage} de {Math.ceil(totalItems / pageSize)}
                    </Typography>
                    <button
                      onClick={() => nextUrl && setCurrentUrl(normalizeUrl(nextUrl))}
                      disabled={!nextUrl}
                      className={`ml-2 px-3 py-1 rounded-md ${
                        !nextUrl
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}>
                      Siguiente
                    </button>
                  </div>
                </DialogContent>
                <DialogActions>
                  <button
                    onClick={handleCloseDepartamentoModal}
                    className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100">
                    Cerrar
                  </button>
                  <button
                    onClick={confirmarSeleccionDepartamento}
                    disabled={!departamentoSeleccionado}
                    className={`ml-2 px-3 py-1 rounded-md ${
                      !departamentoSeleccionado
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}>
                    Confirmar Selección
                  </button>
                </DialogActions>
              </Dialog>
            </Grid>

            <Grid item xs={12}>
              <TextField
                disabled
                label="Departamento"
                value={departamentoSeleccionado?.nombre || ""}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Nombre"
                value={nombre}
                onChange={(e) =>
                  setNombre(capitalizeFirstLetter(e.target.value))
                }
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                fullWidth
                variant="outlined">
                <MenuItem value={1}>Activo</MenuItem>
                <MenuItem value={0}>Inactivo</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} marginBottom={2}>
              <button
                onClick={crearNuevaArea}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                Crear
              </button>
            </Grid>
          </Grid>
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

export default withAuth(CrearArea);
