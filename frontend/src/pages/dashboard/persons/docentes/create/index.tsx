import { useEffect, useState } from "react";
import "./styles.css";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
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
  MenuItem,
} from "@mui/material";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import DashboardMenu from "../../../../dashboard";
import withAuth from "../../../../../components/withAut";
import API from "@/api/axiosConfig";

const CrearDocente = () => {
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
  const [apellido, SetApellido] = useState("");
  const [dni, SetDni] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroApellido, setFiltroApellido] = useState("");
  const [filtroDni, setFiltroDni] = useState("");
  const [filtroLegajo, setFiltroLegajo] = useState("");
  const [openPersona, setOpenPersona] = useState(false);
  const [nombre, setNombre] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState<number>(0);
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
    return url.replace(window.location.origin, "").replace(/^\/+/, "/");
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

      const response = await API.get(apiUrl);
      setPersonas(response.data.results);
      
      // Normalizar las URLs de paginación que vienen del backend
      setNextUrl(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrl(response.data.previous ? normalizeUrl(response.data.previous) : null);
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

  const crearNuevoDocenteDepartamento = async () => {
    const nuevoDocente = {
      persona: persona?.id,
      observaciones,
      estado,
    };

    try {
      // Busca si ya existe un docente asociado a esta persona (incluye activos e inactivos)
      const response = await API.get(`/facet/docente/`, {
        params: {
          persona: persona?.id, // Filtrar por ID de la persona
          show_all: true, // Incluir todos los estados para validación completa
        },
      });

      // Si hay resultados, significa que ya existe un docente
      if (response.data.results.length > 0) {
        handleOpenModal(
          "Error",
          "Ya existe un docente para esta persona",
          () => {}
        );
        return; // Detenemos la ejecución
      }

      // Si no existe, procedemos a crearlo
      await API.post(`/facet/docente/`, nuevoDocente);

      handleOpenModal("Bien", "Se creó el docente con éxito", () => {
        router.push("/dashboard/persons/docentes/");
      });
    } catch (error) {
      console.error("Error:", error);
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
              Agregar Docente
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
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                  Seleccionar Persona
                </button>
              </Grid>

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Sección: Información del Docente */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Información del Docente
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
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Estado"
                  value={estado}
                  onChange={(e) => setEstado(Number(e.target.value))}
                  fullWidth
                  variant="outlined"
                  size="small">
                  <MenuItem value={1}>Activo</MenuItem>
                  <MenuItem value={0}>Inactivo</MenuItem>
                </TextField>
              </Grid>

              {/* Botón de acción centrado */}
              <Grid item xs={12}>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={crearNuevoDocenteDepartamento}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Crear Docente
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>

          <Dialog
            open={openPersona}
            onClose={handleClose}
            maxWidth="md"
            fullWidth>
            <DialogTitle>Seleccionar Persona</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                  <TextField
                    label="Nombre"
                    value={filtroNombre}
                    onChange={(e) => setFiltroNombre(e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Apellido"
                    value={filtroApellido}
                    onChange={(e) => setFiltroApellido(e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="DNI"
                    value={filtroDni}
                    onChange={(e) => setFiltroDni(e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Legajo"
                    value={filtroLegajo}
                    onChange={(e) => setFiltroLegajo(e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid
                  item
                  xs={4}
                  style={{ display: "flex", alignItems: "center" }}>
                  <button
                    onClick={filtrarPersonas}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                    Filtrar
                  </button>
                </Grid>
              </Grid>

              <TableContainer component={Paper} style={{ marginTop: "20px" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>DNI</TableCell>
                      <TableCell>Apellido</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Legajo</TableCell>
                      <TableCell>Seleccionar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {personas.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.dni}</TableCell>
                        <TableCell>{p.apellido}</TableCell>
                        <TableCell>{p.nombre}</TableCell>
                        <TableCell>{p.legajo}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => {
                              setPersona(p);
                              SetApellido(p.apellido);
                              SetDni(p.dni);
                              setNombre(p.nombre);
                            }}
                            className={`px-3 py-1 rounded-md transition-colors duration-200 border ${
                              persona?.id === p.id
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
            </DialogContent>
            <DialogActions>
              <button
                disabled={!prevUrl}
                onClick={() => prevUrl && fetchPersonas(prevUrl)}
                className={`mr-2 px-3 py-1 rounded-md ${
                  !prevUrl
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}>
                Anterior
              </button>
              <Typography style={{ padding: "0 10px" }}>
                Página {currentPage} de {Math.ceil(totalItems / 10)}
              </Typography>
              <button
                disabled={!nextUrl}
                onClick={() => nextUrl && fetchPersonas(nextUrl)}
                className={`mr-2 px-3 py-1 rounded-md ${
                  !nextUrl
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}>
                Siguiente
              </button>
              <button
                onClick={handleClose}
                className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100">
                Cerrar
              </button>
              <button
                onClick={() => handleClose()}
                disabled={!persona}
                className={`ml-2 px-3 py-1 rounded-md ${
                  !persona
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
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
        </Paper>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(CrearDocente);
