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
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Grid,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useRouter } from "next/router";
import DashboardMenu from "../../..";
import dayjs from "dayjs";
import EditIcon from "@mui/icons-material/Edit";
import Link from "next/link";
import withAuth from "../../../../../components/withAut"; // Importa el HOC
import { API_BASE_URL } from "../../../../../utils/config";
import Swal from "sweetalert2";
import Tooltip from "@mui/material/Tooltip";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import EmailIcon from "@mui/icons-material/Email";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

const ListaDocenteAsignatura: React.FC = () => {
  const router = useRouter();
  const { idAsignatura } = router.query;
  const pageSize = 10; // Definir el tamaño de página explícitamente

  type Condicion = "Regular" | "Interino" | "Transitorio";
  type Cargo =
    | "Titular"
    | "Asociado"
    | "Adjunto"
    | "Jtp"
    | "Adg"
    | "Ayudante_estudiantil";
  type Dedicacion = "Media" | "Simple" | "Exclusiva";

  interface Persona {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    estado: 0 | 1;
    email?: string;
  }

  interface Docente {
    id: number;
    persona: Persona;
    observaciones: string;
    estado: 0 | 1;
  }

  interface AsignaturaDocente {
    id: number;
    docente: Docente;
    condicion: Condicion;
    cargo: Cargo;
    dedicacion: Dedicacion;
    estado: 0 | 1;
    fecha_de_inicio: string;
    fecha_de_vencimiento: string | null;
    notificado?: boolean;
  }

  const [asignaturaDocentes, setAsignaturaDocentes] = useState<
    AsignaturaDocente[]
  >([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroCondicion, setFiltroCondicion] = useState<Condicion | "">("");
  const [filtroCargo, setFiltroCargo] = useState<Cargo | "">("");
  const [filtroDedicacion, setFiltroDedicacion] = useState<Dedicacion | "">("");
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroApellido, setFiltroApellido] = useState("");
  const [filtroDni, setFiltroDni] = useState("");
  const [totalItems, setTotalItems] = useState(0);

  const [mostrarVencimientos, setMostrarVencimientos] = useState(false);

  // Solo un useEffect para idAsignatura
  useEffect(() => {
    if (idAsignatura) {
      const initialUrl = `${API_BASE_URL}/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`;
      setCurrentUrl(initialUrl);
    }
  }, [idAsignatura]);

  // useEffect para currentUrl
  useEffect(() => {
    if (currentUrl) {
      fetchData(currentUrl);
    }
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      const response = await axios.get(url);
      const data = response.data;

      // Log para debug
      console.log("Respuesta API:", data);

      setAsignaturaDocentes(data.results || data);
      setPrevUrl(data.previous || null);
      setNextUrl(data.next || null);
      setTotalItems(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / pageSize));

      // Calcular la página actual desde la URL
      if (url.includes("offset=")) {
        const offsetMatch = url.match(/offset=(\d+)/);
        if (offsetMatch && offsetMatch[1]) {
          const offset = parseInt(offsetMatch[1]);
          setCurrentPage(Math.floor(offset / pageSize) + 1);
        } else {
          setCurrentPage(1);
        }
      } else {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Mostrar mensaje de error al usuario
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los datos. Por favor, intenta de nuevo.",
      });
    }
  };

  // Alternar entre vista normal y próximos vencimientos
  const toggleVencimientos = () => {
    setMostrarVencimientos(!mostrarVencimientos);
    const baseUrl = mostrarVencimientos
      ? `${API_BASE_URL}/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`
      : `${API_BASE_URL}/facet/asignatura-docente/proximos_a_vencer/?asignatura=${idAsignatura}`;
    setCurrentUrl(baseUrl);
  };

  // Filtrar datos con logging mejorado
  const filtrarAsignaturaDocentes = () => {
    let baseUrl = mostrarVencimientos
      ? `${API_BASE_URL}/facet/asignatura-docente/proximos_a_vencer/?asignatura=${idAsignatura}`
      : `${API_BASE_URL}/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`;

    const params = new URLSearchParams();

    // Añadir parámetros de filtro solo si tienen valor
    if (filtroNombre)
      params.append("docente__persona__nombre__icontains", filtroNombre);
    if (filtroApellido)
      params.append("docente__persona__apellido__icontains", filtroApellido);
    if (filtroDni) params.append("docente__persona__dni__icontains", filtroDni);
    if (filtroCargo) params.append("cargo", filtroCargo);
    if (filtroDedicacion) params.append("dedicacion", filtroDedicacion);
    if (filtroCondicion) params.append("condicion", filtroCondicion);

    const finalUrl = params.toString()
      ? `${baseUrl}&${params.toString()}`
      : baseUrl;

    console.log("URL de filtro aplicada:", finalUrl);
    setCurrentUrl(finalUrl);
  };

  // Función para ir a la siguiente página
  const goToNextPage = () => {
    if (nextUrl) {
      setCurrentUrl(nextUrl);
    }
  };

  // Función para ir a la página anterior
  const goToPrevPage = () => {
    if (prevUrl) {
      setCurrentUrl(prevUrl);
    }
  };

  // ✅ Función para enviar notificación manualmente
  const enviarNotificacion = async (id: number, email: string) => {
    try {
      const confirmacion = await Swal.fire({
        title: "¿Estás seguro?",
        text: `Se enviará una notificación a ${email}.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, enviar",
        cancelButtonText: "Cancelar",
      });

      if (!confirmacion.isConfirmed) return;

      Swal.fire({
        title: "Enviando notificación...",
        text: "Por favor, espera mientras se envía la notificación.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await axios.post(
        `${API_BASE_URL}/facet/notificacion/crear_notificacion_asig/`,
        {
          persona_id: id,
          mensaje: `Atención: Su cargo en la asignatura está próximo a vencer. Debe acercarse al área de Personal con la documentación necesaria para su renovación.`,
        }
      );

      Swal.fire({
        icon: "success",
        title: "Notificación enviada",
        text: `Se envió un correo a ${email}`,
      });
    } catch (error) {
      console.error("Error enviando notificación:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo enviar la notificación.",
      });
    }
  };

  const confirmarReenvio = async (id: number, email: string) => {
    try {
      const confirmacion = await Swal.fire({
        title: "¿Reenviar notificación?",
        text: `Esta persona ya fue notificada. ¿Quieres enviarla de nuevo?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, reenviar",
        cancelButtonText: "Cancelar",
      });

      if (!confirmacion.isConfirmed) return;

      await enviarNotificacion(id, email);
    } catch (error) {
      console.error("Error reenviando notificación:", error);
    }
  };

  const descargarExcel = async () => {
    try {
      let allAsignaturaDocentes: AsignaturaDocente[] = [];
      let url = `${API_BASE_URL}/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`;

      while (url) {
        const response = await axios.get(url);
        const data = response.data;
        const results: AsignaturaDocente[] = data.results || data; // 🔹 Define el tipo explícitamente
        const next = data.next || null;

        allAsignaturaDocentes = [...allAsignaturaDocentes, ...results];

        url = next;
      }

      // 🔹 Crear un nuevo array formateado para la exportación a Excel
      const excelData = allAsignaturaDocentes.map((docente) => ({
        Nombre: `${docente.docente.persona.nombre} ${docente.docente.persona.apellido}`,
        DNI: docente.docente.persona.dni,
        Condicion: docente.condicion,
        Cargo: docente.cargo,
        Dedicacion: docente.dedicacion,
        Estado: docente.estado == 1 ? "Activo" : "Inactivo",
        "Fecha de Inicio": dayjs(docente.fecha_de_inicio).format("DD-MM-YYYY"),
        "Fecha de Vencimiento": docente.fecha_de_vencimiento
          ? dayjs(docente.fecha_de_vencimiento).format("DD-MM-YYYY")
          : "N/A",
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "AsignaturaDocentes");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(excelBlob, "asignatura_docentes.xlsx");
    } catch (error) {
      console.error("Error descargando Excel:", error);
    }
  };

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() =>
              router.push(
                `/dashboard/asignatura/docenteAsignatura/${idAsignatura}/create`
              )
            }
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <AddIcon /> Agregar Docente Asignatura
          </button>
          <button
            onClick={descargarExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <FileDownloadIcon /> Descargar Excel
          </button>
        </div>

        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Docentes Asignatura
          </Typography>

          <Grid container spacing={2} marginBottom={2}>
            <Grid item xs={4}>
              <TextField
                label="Apellido"
                value={filtroApellido}
                onChange={(e) => setFiltroApellido(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="DNI"
                value={filtroDni}
                onChange={(e) => setFiltroDni(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Nombre"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                select
                label="Condición"
                value={filtroCondicion}
                onChange={(e) =>
                  setFiltroCondicion(e.target.value as Condicion)
                }
                fullWidth
                variant="outlined">
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                <MenuItem value="Regular">Regular</MenuItem>
                <MenuItem value="Interino">Interino</MenuItem>
                <MenuItem value="Transitorio">Transitorio</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField
                select
                label="Cargo"
                value={filtroCargo}
                onChange={(e) => setFiltroCargo(e.target.value as Cargo)}
                fullWidth
                variant="outlined">
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                <MenuItem value="Titular">Titular</MenuItem>
                <MenuItem value="Asociado">Asociado</MenuItem>
                <MenuItem value="Adjunto">Adjunto</MenuItem>
                <MenuItem value="Jtp">JTP</MenuItem>
                <MenuItem value="Adg">ADG</MenuItem>
                <MenuItem value="Ayudante_estudiantil">
                  Ayudante estudiantil
                </MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField
                select
                label="Dedicación"
                value={filtroDedicacion}
                onChange={(e) =>
                  setFiltroDedicacion(e.target.value as Dedicacion)
                }
                fullWidth
                variant="outlined">
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                <MenuItem value="Media">Media</MenuItem>
                <MenuItem value="Simple">Simple</MenuItem>
                <MenuItem value="Exclusiva">Exclusiva</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={4} marginBottom={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={mostrarVencimientos}
                    onChange={toggleVencimientos}
                  />
                }
                label="Próximos Vencimientos"
              />
            </Grid>
            <Grid item xs={4}>
              <button
                onClick={filtrarAsignaturaDocentes}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                Filtrar
              </button>
            </Grid>
          </Grid>

          <TableContainer component={Paper} className="mb-4">
            <Table>
              <TableHead>
                <TableRow className="bg-blue-500 text-white">
                  <TableCell className="text-white font-medium">
                    Nombre
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Condición
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Cargo
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Dedicación
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Fecha de Inicio
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Fecha de Vencimiento
                  </TableCell>
                  <TableCell className="text-white font-medium" align="center">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {asignaturaDocentes.length > 0 ? (
                  asignaturaDocentes.map((docente) => (
                    <TableRow key={docente.id} className="hover:bg-gray-50">
                      <TableCell>
                        {docente.docente.persona.nombre}{" "}
                        {docente.docente.persona.apellido}
                      </TableCell>
                      <TableCell>{docente.condicion}</TableCell>
                      <TableCell>{docente.cargo}</TableCell>
                      <TableCell>{docente.dedicacion}</TableCell>
                      <TableCell>
                        {docente.fecha_de_inicio
                          ? dayjs(docente.fecha_de_inicio).format("DD-MM-YYYY")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {docente.fecha_de_vencimiento
                          ? dayjs(docente.fecha_de_vencimiento).format(
                              "DD-MM-YYYY"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-4">
                          <Tooltip title="Editar">
                            <Link
                              href={`/dashboard/asignatura/docenteAsignatura/${idAsignatura}/edit/${docente.id}`}
                              passHref>
                              <EditIcon className="text-blue-500 hover:text-blue-700 cursor-pointer" />
                            </Link>
                          </Tooltip>

                          {docente.docente.persona.email ? (
                            <Tooltip
                              title={
                                docente.notificado
                                  ? "Notificación ya enviada. ¿Enviar de nuevo?"
                                  : "Enviar Notificación"
                              }>
                              {docente.notificado ? (
                                <MarkEmailReadIcon
                                  className="text-green-500 hover:text-green-700 cursor-pointer"
                                  onClick={() =>
                                    confirmarReenvio(
                                      docente.docente.persona.id,
                                      docente.docente.persona.email!
                                    )
                                  }
                                />
                              ) : (
                                <EmailIcon
                                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                                  onClick={() =>
                                    enviarNotificacion(
                                      docente.docente.persona.id,
                                      docente.docente.persona.email!
                                    )
                                  }
                                />
                              )}
                            </Tooltip>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" className="py-4">
                      No se encontraron registros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={goToPrevPage}
              disabled={!prevUrl}
              className={`px-4 py-2 rounded-md ${
                prevUrl
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors duration-200`}>
              Anterior
            </button>
            <Typography variant="body1">
              Página {currentPage} de {totalPages}
            </Typography>
            <button
              onClick={goToNextPage}
              disabled={!nextUrl}
              className={`px-4 py-2 rounded-md ${
                nextUrl
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors duration-200`}>
              Siguiente
            </button>
          </div>
        </Paper>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaDocenteAsignatura);
