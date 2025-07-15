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
        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Asignatura
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <button
                onClick={handleOpenAreaModal}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                Seleccionar Área
              </button>

              <Dialog
                open={openAreaModal}
                onClose={handleCloseAreaModal}
                maxWidth="md"
                fullWidth>
                <DialogTitle>Seleccionar Área</DialogTitle>
                <DialogContent>
                  {/* Filtro */}
                  <TextField
                    label="Buscar por Nombre"
                    value={filtroAreas}
                    onChange={(e) => setFiltroAreas(e.target.value)}
                    fullWidth
                    margin="normal"
                    variant="outlined"
                  />
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={filtrarAreas}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                      Filtrar
                    </button>
                    <button
                      onClick={() => {
                        setFiltroAreas("");
                        setCurrentUrlAreas("/facet/area/");
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                      Limpiar
                    </button>
                  </div>

                  {/* Tabla de Áreas */}
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell>Seleccionar</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {areas.map((area) => (
                          <TableRow key={area.id}>
                            <TableCell>{area.nombre}</TableCell>
                            <TableCell>
                              {area.estado == 1 ? "Activo" : "Inactivo"}
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => setAreaSeleccionada(area)}
                                className={`px-3 py-1 rounded-md transition-colors duration-200 border ${
                                  areaSeleccionada?.id === area.id
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
                      onClick={() => prevUrlAreas && fetchAreas(prevUrlAreas)}
                      disabled={!prevUrlAreas}
                      className={`mr-2 px-3 py-1 rounded-md ${
                        !prevUrlAreas
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}>
                      Anterior
                    </button>
                    <Typography>
                      Página {currentPageAreas} de{" "}
                      {Math.ceil(totalItemsAreas / pageSizeAreas)}
                    </Typography>
                    <button
                      onClick={() => nextUrlAreas && fetchAreas(nextUrlAreas)}
                      disabled={!nextUrlAreas}
                      className={`ml-2 px-3 py-1 rounded-md ${
                        !nextUrlAreas
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}>
                      Siguiente
                    </button>
                  </div>
                </DialogContent>
                <DialogActions>
                  <button
                    onClick={handleCloseAreaModal}
                    className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100">
                    Cerrar
                  </button>
                  <button
                    onClick={confirmarSeleccionArea}
                    disabled={!areaSeleccionada}
                    className={`ml-2 px-3 py-1 rounded-md ${
                      !areaSeleccionada
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
                label="Área Seleccionada"
                value={areaSeleccionada?.nombre || ""}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value.toUpperCase())}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Código"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Módulo"
                value={modulo}
                onChange={(e) => setModulo(e.target.value.toUpperCase())}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Link Programa Adjunto"
                value={programa}
                onChange={(e) => setPrograma(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoAsignatura)}
                fullWidth
                variant="outlined">
                <MenuItem value="Electiva">Electiva</MenuItem>
                <MenuItem value="Obligatoria">Obligatoria</MenuItem>
              </TextField>
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
                onClick={crearNuevaAsignatura}
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

export default withAuth(CrearAsignatura);
