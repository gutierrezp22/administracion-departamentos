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
import { API_BASE_URL } from "../../../../../../utils/config";
import API from "@/api/axiosConfig";

// Habilita los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

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
    `${API_BASE_URL}/facet/docente/`
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
    `${API_BASE_URL}/facet/resolucion/`
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
      const response = await axios.get(
        `${API_BASE_URL}/facet/asignatura/${id}/`
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
      const response = await axios.get(url);
      setPersonas(response.data.results);
      setNextUrlPersonas(response.data.next);
      setPrevUrlPersonas(response.data.previous);
      setTotalItemsPersonas(response.data.count);

      // Calcular página actual
      const offset = new URL(url).searchParams.get("offset") || "0";
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

  // Función para cargar las resoluciones
  const fetchDataResoluciones = async (url: string) => {
    try {
      const response = await axios.get(url);
      setResoluciones(response.data.results);
      setNextUrlResoluciones(response.data.next);
      setPrevUrlResoluciones(response.data.previous);
      setTotalItemsResoluciones(response.data.count);

      // Calcular página actual
      const offset = new URL(url).searchParams.get("offset") || "0";
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
      const fechaMatch = filtroFecha
        ? dayjs(res.fecha).isSame(filtroFecha, "day")
        : true;
      return expedienteMatch || nroResolucionMatch || tipoMatch || fechaMatch;
    });
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
    if (!persona || !asignatura || !resolucion) {
      alert(
        "Por favor, selecciona un docente, una asignatura y una resolución."
      );
      return;
    }

    const nuevoDocenteAsignatura = {
      asignatura: idAsignatura,
      docente: persona.id,
      resolucion: resolucion.id,
      observaciones: observaciones,
      estado: estado,
      fecha_de_inicio: fechaInicio ? new Date(fechaInicio).toISOString() : null,
      fecha_de_vencimiento: fechaFin ? new Date(fechaFin).toISOString() : null,
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
    } catch (error) {
      console.error("Error al crear docente asignatura:", error);
      handleOpenModal("Error", "NO se pudo realizar la acción.", () => {});
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
                      InputLabelProps={{
                        shrink: true,
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
                      InputLabelProps={{
                        shrink: true,
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
            <Grid container spacing={2} className="mb-4 mt-4">
              <Grid item xs={12}>
                <TextField
                  label="Buscar por DNI o Nombre"
                  value={filtroDni}
                  onChange={(e) => setFiltroDni(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
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
                      DNI
                    </TableCell>
                    <TableCell className="text-white font-semibold py-2">
                      Nombre
                    </TableCell>
                    <TableCell className="text-white font-semibold py-2">
                      Apellido
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
                          className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 font-medium text-sm">
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
            <Grid container spacing={2} className="mb-4 mt-4">
              <Grid item xs={12}>
                <TextField
                  label="Buscar por Nro Expediente o Resolución"
                  value={filtroNroResolucion}
                  onChange={(e) => setFiltroNroResolucion(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
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
                        {dayjs(resol.fecha).format("DD/MM/YYYY") || "N/A"}
                      </TableCell>
                      <TableCell className="py-2">
                        <button
                          onClick={() => {
                            setResolucion(resol);
                            handleCloseResolucion();
                          }}
                          className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 font-medium text-sm">
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
