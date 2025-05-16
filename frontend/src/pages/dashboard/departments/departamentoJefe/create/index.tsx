import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
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
import DashboardMenu from "../../../../dashboard";
import withAuth from "../../../../../components/withAut";
import { API_BASE_URL } from "../../../../../utils/config";
import API from "../../../../../api/axiosConfig";

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
  const [currentUrl, setCurrentUrl] = useState<string>(
    `${API_BASE_URL}/facet/resolucion/`
  );
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
    `${API_BASE_URL}/facet/jefe/list_jefes_persona/`
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
    useState<string>(`${API_BASE_URL}/facet/departamento/`);
  const [totalItemsDepartamentos, setTotalItemsDepartamentos] =
    useState<number>(0);
  const [currentPageDepartamentos, setCurrentPageDepartamentos] =
    useState<number>(1);
  const pageSizeDepartamentos = 10;

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

  const fetchResoluciones = async (url: string) => {
    try {
      const response = await axios.get(url);
      setResoluciones(response.data.results);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setTotalItems(response.data.count);
      setCurrentPage(Math.ceil((response.data.offset || 0) / pageSize) + 1);
    } catch (error) {
      console.error("Error al cargar las resoluciones:", error);
    }
  };

  const filtrarResoluciones = () => {
    let url = `${API_BASE_URL}/facet/resolucion/?`;
    const params = new URLSearchParams();

    if (filtroNroExpediente)
      params.append("nexpediente__icontains", filtroNroExpediente);
    if (filtroNroResolucion)
      params.append("nresolucion__icontains", filtroNroResolucion);
    if (filtroTipo) params.append("tipo", filtroTipo);
    if (filtroFecha)
      params.append("fecha__date", filtroFecha.format("YYYY-MM-DD"));

    url += params.toString();
    setCurrentUrl(url);
  };

  const fetchJefes = async (url: string) => {
    try {
      const response = await axios.get(url);
      setJefes(response.data.results); // Datos de la página actual
      setNextUrlJefes(response.data.next); // URL de la siguiente página
      setPrevUrlJefes(response.data.previous); // URL de la página anterior
      setTotalItemsJefes(response.data.count); // Total de elementos

      // Calcular la página actual
      const offset = new URL(url).searchParams.get("offset") || "0";
      setCurrentPageJefes(Math.floor(Number(offset) / pageSizeJefes) + 1);
    } catch (error) {
      console.error("Error al obtener los jefes:", error);
    }
  };

  const filtrarJefes = () => {
    let url = `${API_BASE_URL}/facet/jefe/list_jefes_persona/?`;
    const params = new URLSearchParams();

    if (filtroNombre) params.append("persona__nombre__icontains", filtroNombre);
    if (filtroDni) params.append("persona__dni__icontains", filtroDni);

    url += params.toString();
    setCurrentUrlJefes(url); // Actualiza la URL actual
  };

  const fetchDepartamentos = async (url: string) => {
    try {
      const response = await axios.get(url);
      setDepartamentos(response.data.results); // Datos de la página actual
      setNextUrlDepartamentos(response.data.next); // URL de la página siguiente
      setPrevUrlDepartamentos(response.data.previous); // URL de la página anterior
      setTotalItemsDepartamentos(response.data.count); // Total de elementos

      // Calcular la página actual
      const offset = new URL(url).searchParams.get("offset") || "0";
      setCurrentPageDepartamentos(
        Math.floor(Number(offset) / pageSizeDepartamentos) + 1
      );
    } catch (error) {
      console.error("Error al obtener los departamentos:", error);
    }
  };

  const filtrarDepartamentos = () => {
    let url = `${API_BASE_URL}/facet/departamento/?`;
    const params = new URLSearchParams();

    if (filtroDepartamento)
      params.append("nombre__icontains", filtroDepartamento);

    url += params.toString();
    setCurrentUrlDepartamentos(url); // Actualiza la URL actual
  };

  useEffect(() => {
    if (openDepartamento) fetchDepartamentos(currentUrlDepartamentos);
  }, [openDepartamento, currentUrlDepartamentos]);

  const crearNuevoJefeDepartamento = async () => {
    const nuevoJefeDepartamento = {
      departamento: departamento?.id,
      jefe: jefe?.id,
      resolucion: selectedResolucion?.id,
      fecha_de_inicio: fechaInicio?.toISOString(),
      fecha_de_fin: fechaFin?.toISOString(),
      observaciones: observaciones,
      estado: estado === "1" ? 1 : 0,
    };
    try {
      await API.post(`/facet/jefe-departamento/`, nuevoJefeDepartamento);
      handleOpenModal(
        "Bien",
        "Se creó el jefe de departamento con éxito",
        handleConfirmModal
      );
    } catch (error) {
      console.error(error);
      handleOpenModal("Error", "No se pudo realizar la acción.", () => {});
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <div className="bg-white shadow-md rounded-md p-6 mt-5">
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Agregar Jefe Departamento
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <button
                onClick={() => setOpenResolucion(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                Seleccionar Resolución
              </button>
              {/* Mostrar la resolución seleccionada */}
              {selectedResolucion && (
                <div className="bg-gray-50 rounded-md p-3 mt-3 shadow-sm">
                  <p className="text-sm font-medium">
                    <span className="font-bold">Nro Resolución:</span>{" "}
                    {selectedResolucion.nresolucion}
                  </p>
                  <p className="text-sm font-medium">
                    <span className="font-bold">Nro Expediente:</span>{" "}
                    {selectedResolucion.nexpediente}
                  </p>
                </div>
              )}
              <Dialog
                open={openResolucion}
                onClose={() => setOpenResolucion(false)}
                maxWidth="md"
                fullWidth>
                <DialogTitle>Seleccionar Resolución</DialogTitle>
                <DialogContent>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <TextField
                        label="Nro Expediente"
                        value={filtroNroExpediente}
                        onChange={(e) => setFiltroNroExpediente(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Nro Resolución"
                        value={filtroNroResolucion}
                        onChange={(e) => setFiltroNroResolucion(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
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
                    <Grid item xs={4}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="Fecha"
                          value={filtroFecha}
                          onChange={(date) => setFiltroFecha(date)}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={4}>
                      <button
                        onClick={filtrarResoluciones}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                        Filtrar
                      </button>
                    </Grid>
                  </Grid>

                  <TableContainer
                    component={Paper}
                    style={{ marginTop: "20px" }}>
                    <Table>
                      <TableHead className="bg-blue-500">
                        <TableRow>
                          <TableCell className="text-white">
                            Nro Expediente
                          </TableCell>
                          <TableCell className="text-white">
                            Nro Resolución
                          </TableCell>
                          <TableCell className="text-white">Tipo</TableCell>
                          <TableCell className="text-white">Fecha</TableCell>
                          <TableCell className="text-white">
                            Seleccionar
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resoluciones.map((resolucion) => (
                          <TableRow
                            key={resolucion.id}
                            className="hover:bg-gray-50">
                            <TableCell>{resolucion.nexpediente}</TableCell>
                            <TableCell>{resolucion.nresolucion}</TableCell>
                            <TableCell>{resolucion.tipo}</TableCell>
                            <TableCell>
                              {dayjs(
                                resolucion.fecha,
                                "DD/MM/YYYY HH:mm:ss"
                              ).isValid()
                                ? dayjs(
                                    resolucion.fecha,
                                    "DD/MM/YYYY HH:mm:ss"
                                  ).format("DD/MM/YYYY")
                                : "Fecha no disponible"}
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => {
                                  setSelectedResolucion(resolucion);
                                  setOpenResolucion(false);
                                }}
                                className="border border-gray-300 hover:bg-gray-100 px-3 py-1 rounded-md transition-colors duration-200">
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
                      onClick={() => {
                        if (prevUrl) {
                          setCurrentUrl(prevUrl);
                          setCurrentPage((prev) => prev - 1);
                        }
                      }}
                      disabled={!prevUrl}
                      className={`px-3 py-1 rounded-md ${
                        !prevUrl
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}>
                      Anterior
                    </button>
                    <Typography variant="body1">
                      Página {currentPage} de {Math.ceil(totalItems / pageSize)}
                    </Typography>
                    <button
                      onClick={() => {
                        if (nextUrl) {
                          setCurrentUrl(nextUrl);
                          setCurrentPage((prev) => prev + 1);
                        }
                      }}
                      disabled={!nextUrl}
                      className={`px-3 py-1 rounded-md ${
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
                    onClick={() => setOpenResolucion(false)}
                    className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100">
                    Cerrar
                  </button>
                </DialogActions>
              </Dialog>
            </Grid>
            <Grid item xs={12}>
              <button
                onClick={() => setOpenJefe(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                Seleccionar Jefe
              </button>
              <Dialog
                open={openJefe}
                onClose={() => setOpenJefe(false)}
                maxWidth="md"
                fullWidth>
                <DialogTitle>Seleccionar Jefe</DialogTitle>
                <DialogContent>
                  <Grid container spacing={2} marginBottom={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Nombre"
                        value={filtroNombre}
                        onChange={(e) => setFiltroNombre(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="DNI"
                        value={filtroDni}
                        onChange={(e) => setFiltroDni(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <button
                        onClick={filtrarJefes}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                        Filtrar
                      </button>
                    </Grid>
                  </Grid>

                  {/* Tabla de Jefes */}
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead className="bg-blue-500">
                        <TableRow>
                          <TableCell className="text-white">Nombre</TableCell>
                          <TableCell className="text-white">Apellido</TableCell>
                          <TableCell className="text-white">DNI</TableCell>
                          <TableCell className="text-white">
                            Seleccionar
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {jefes.map((j) => (
                          <TableRow key={j.id} className="hover:bg-gray-50">
                            <TableCell>{j.persona.nombre}</TableCell>
                            <TableCell>{j.persona.apellido}</TableCell>
                            <TableCell>{j.persona.dni}</TableCell>
                            <TableCell>
                              <button
                                onClick={() => {
                                  setJefe(j);
                                  setOpenJefe(false);
                                }}
                                className="border border-gray-300 hover:bg-gray-100 px-3 py-1 rounded-md transition-colors duration-200">
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
                      onClick={() =>
                        prevUrlJefes && setCurrentUrlJefes(prevUrlJefes)
                      }
                      disabled={!prevUrlJefes}
                      className={`px-3 py-1 rounded-md ${
                        !prevUrlJefes
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}>
                      Anterior
                    </button>
                    <Typography>
                      Página {currentPageJefes} de{" "}
                      {Math.ceil(totalItemsJefes / pageSizeJefes)}
                    </Typography>
                    <button
                      onClick={() =>
                        nextUrlJefes && setCurrentUrlJefes(nextUrlJefes)
                      }
                      disabled={!nextUrlJefes}
                      className={`px-3 py-1 rounded-md ${
                        !nextUrlJefes
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}>
                      Siguiente
                    </button>
                  </div>
                </DialogContent>
                <DialogActions>
                  <button
                    onClick={() => setOpenJefe(false)}
                    className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100">
                    Cerrar
                  </button>
                </DialogActions>
              </Dialog>
            </Grid>
            {jefe && (
              <>
                {" "}
                <Grid item xs={12}>
                  {" "}
                  <div className="mt-2">
                    {" "}
                    <TextField
                      label="Nombre Jefe"
                      value={`${jefe.persona.nombre} ${jefe.persona.apellido}`}
                      fullWidth
                      variant="outlined"
                      InputProps={{ readOnly: true }}
                    />{" "}
                  </div>{" "}
                </Grid>{" "}
              </>
            )}
            <Grid item xs={12}>
              <button
                onClick={() => setOpenDepartamento(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                Seleccionar Departamento
              </button>
              <Dialog
                open={openDepartamento}
                onClose={() => setOpenDepartamento(false)}
                maxWidth="md"
                fullWidth>
                <DialogTitle>Seleccionar Departamento</DialogTitle>
                <DialogContent>
                  {/* Filtro */}
                  <Grid container spacing={2} marginBottom={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Nombre del Departamento"
                        value={filtroDepartamento}
                        onChange={(e) => setFiltroDepartamento(e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <button
                        onClick={filtrarDepartamentos}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                        Filtrar
                      </button>
                    </Grid>
                  </Grid>

                  {/* Tabla de Departamentos */}
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead className="bg-blue-500">
                        <TableRow>
                          <TableCell className="text-white">Nombre</TableCell>
                          <TableCell className="text-white">
                            Seleccionar
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {departamentos.map((departamento) => (
                          <TableRow
                            key={departamento.id}
                            className="hover:bg-gray-50">
                            <TableCell>{departamento.nombre}</TableCell>
                            <TableCell>
                              <button
                                onClick={() => {
                                  setDepartamento(departamento);
                                  setOpenDepartamento(false);
                                }}
                                className="border border-gray-300 hover:bg-gray-100 px-3 py-1 rounded-md transition-colors duration-200">
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
                      onClick={() =>
                        prevUrlDepartamentos &&
                        setCurrentUrlDepartamentos(prevUrlDepartamentos)
                      }
                      disabled={!prevUrlDepartamentos}
                      className={`px-3 py-1 rounded-md ${
                        !prevUrlDepartamentos
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}>
                      Anterior
                    </button>
                    <Typography>
                      Página {currentPageDepartamentos} de{" "}
                      {Math.ceil(
                        totalItemsDepartamentos / pageSizeDepartamentos
                      )}
                    </Typography>
                    <button
                      onClick={() =>
                        nextUrlDepartamentos &&
                        setCurrentUrlDepartamentos(nextUrlDepartamentos)
                      }
                      disabled={!nextUrlDepartamentos}
                      className={`px-3 py-1 rounded-md ${
                        !nextUrlDepartamentos
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}>
                      Siguiente
                    </button>
                  </div>
                </DialogContent>
                <DialogActions>
                  <button
                    onClick={() => setOpenDepartamento(false)}
                    className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100">
                    Cerrar
                  </button>
                </DialogActions>
              </Dialog>
            </Grid>
            {resolucion && (
              <>
                {" "}
                <Grid item xs={12}>
                  {" "}
                  <div className="mt-2">
                    {" "}
                    <TextField
                      label="Nro Resolución"
                      value={resolucion.nresolucion}
                      fullWidth
                      variant="outlined"
                      InputProps={{ readOnly: true }}
                    />{" "}
                  </div>{" "}
                </Grid>{" "}
                <Grid item xs={12}>
                  {" "}
                  <div className="mt-2">
                    {" "}
                    <TextField
                      label="Nro Expediente"
                      value={resolucion.nexpediente}
                      fullWidth
                      variant="outlined"
                      InputProps={{ readOnly: true }}
                    />{" "}
                  </div>{" "}
                </Grid>{" "}
              </>
            )}
            {departamento && (
              <Grid item xs={12}>
                {" "}
                <div className="mt-2">
                  {" "}
                  <TextField
                    label="Nombre Departamento"
                    value={departamento.nombre}
                    fullWidth
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />{" "}
                </div>{" "}
              </Grid>
            )}
            <Grid item xs={12}>
              {" "}
              <div className="mt-2">
                {" "}
                <TextField
                  label="Observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  fullWidth
                  variant="outlined"
                />{" "}
              </div>{" "}
            </Grid>{" "}
            <Grid item xs={12}>
              {" "}
              <div className="mt-2">
                {" "}
                <TextField
                  select
                  label="Estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  fullWidth
                  variant="outlined">
                  {" "}
                  <MenuItem value="1">Activo</MenuItem>{" "}
                  <MenuItem value="0">Inactivo</MenuItem>{" "}
                </TextField>{" "}
              </div>{" "}
            </Grid>{" "}
            <Grid item xs={12} marginBottom={2}>
              {" "}
              <div className="mt-2 mb-4">
                {" "}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  {" "}
                  <div className="flex space-x-4">
                    {" "}
                    <DatePicker
                      label="Fecha de Inicio"
                      value={fechaInicio}
                      onChange={(date) => setFechaInicio(date)}
                    />{" "}
                    <DatePicker
                      label="Fecha de Fin"
                      value={fechaFin}
                      onChange={(date) => setFechaFin(date)}
                    />{" "}
                  </div>{" "}
                </LocalizationProvider>{" "}
              </div>{" "}
            </Grid>{" "}
            <Grid item xs={12} marginBottom={2}>
              {" "}
              <div className="mt-4 mb-4">
                {" "}
                <button
                  onClick={crearNuevoJefeDepartamento}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                  {" "}
                  Crear{" "}
                </button>{" "}
              </div>{" "}
            </Grid>
          </Grid>
          <BasicModal
            open={modalVisible}
            onClose={handleCloseModal}
            title={modalTitle}
            content={modalMessage}
            onConfirm={fn}
          />
        </div>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(CrearDepartamentoJefe);
