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
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Tooltip from "@mui/material/Tooltip";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut"; 
import { API_BASE_URL } from "../../../../utils/config";

dayjs.extend(utc);
dayjs.extend(timezone);

const ListaResoluciones = () => {
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

  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [filtroNroExpediente, setFiltroNroExpediente] = useState("");
  const [filtroNroResolucion, setFiltroNroResolucion] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroFecha, setFiltroFecha] = useState<dayjs.Dayjs | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string | number>("");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `${API_BASE_URL}/facet/resolucion/`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const router = useRouter();

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      const response = await axios.get(url);
      setResoluciones(response.data.results);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setTotalItems(response.data.count);
      setCurrentPage(1);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al obtener los datos.",
      });
    }
  };

  const filtrarResoluciones = () => {
    let url = `${API_BASE_URL}/facet/resolucion/?`;
    const params = new URLSearchParams();

    if (filtroNroExpediente !== "") {
      params.append("nexpediente__icontains", filtroNroExpediente);
    }
    if (filtroEstado !== "") {
      params.append("estado", filtroEstado.toString());
    }
    if (filtroTipo !== "") {
      params.append("tipo", filtroTipo);
    }
    if (filtroNroResolucion !== "") {
      params.append("nresolucion__icontains", filtroNroResolucion);
    }
    if (filtroFecha) {
      const fechaStr = filtroFecha.format("YYYY-MM-DD");
      if (fechaStr !== "Invalid Date") {
        params.append("fecha__date", fechaStr);
      }
    }

    url += params.toString();
    setCurrentUrl(url);
  };

  const descargarExcel = async () => {
    try {
      let allResoluciones: Resolucion[] = [];
      let url = `${API_BASE_URL}/facet/resolucion/?`;
      const params = new URLSearchParams();
  
      // Agrega los filtros actuales al URL de exportación
      if (filtroNroExpediente !== "")
        params.append("nexpediente__icontains", filtroNroExpediente);
      if (filtroEstado !== "") params.append("estado", filtroEstado.toString());
      if (filtroTipo !== "") params.append("tipo", filtroTipo);
      if (filtroNroResolucion !== "")
        params.append("nresolucion__icontains", filtroNroResolucion);
      if (filtroFecha)
        params.append("fecha__date", filtroFecha.format("YYYY-MM-DD"));
      url += params.toString();
  
      // Obtiene todos los datos para el Excel
      while (url) {
        const response = await axios.get(url);
        const { results, next } = response.data;
        allResoluciones = [...allResoluciones, ...results];
        url = next;
      }
  
      // Crea el archivo Excel con las columnas de la grilla!
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        allResoluciones.map((resolucion) => ({
          "Nro Expediente": resolucion.nexpediente,
          "Nro Resolución": resolucion.nresolucion,
          Tipo:
            resolucion.tipo === "Consejo_Superior"
              ? "Consejo Superior"
              : resolucion.tipo === "Consejo_Directivo"
              ? "Consejo Directivo"
              : resolucion.tipo,
          Fecha: dayjs(resolucion.fecha, "DD/MM/YYYY HH:mm:ss").isValid()
            ? dayjs(resolucion.fecha, "DD/MM/YYYY HH:mm:ss").format(
                "DD/MM/YYYY"
              )
            : "No disponible",
          Carga: dayjs(
            resolucion.fecha_creacion,
            "DD/MM/YYYY HH:mm:ss"
          ).isValid()
            ? dayjs(resolucion.fecha_creacion, "DD/MM/YYYY").format(
                "DD/MM/YYYY"
              )
            : "No disponible",
          Estado: resolucion.estado,
          Adjunto: resolucion.adjunto,
          Observaciones: resolucion.observaciones,
        }))
      );
  
      XLSX.utils.book_append_sheet(workbook, worksheet, "Resoluciones");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(excelBlob, "resoluciones.xlsx");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al descargar",
        text: "Se produjo un error al exportar los datos.",
      });
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => router.push("/dashboard/resoluciones/create")}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <AddIcon /> Agregar Resolución
          </button>
          <button
            onClick={descargarExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <FileDownloadIcon /> Descargar Excel
          </button>
      </div>

        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
          Resoluciones
        </Typography>

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
            <FormControl fullWidth margin="none">
              <InputLabel id="demo-simple-select-label">Tipo</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={filtroTipo}
                label="Tipo"
                  onChange={(e) => setFiltroTipo(e.target.value)}>
                <MenuItem value={""}>Todos</MenuItem>
                <MenuItem value={"Rector"}>Rector</MenuItem>
                <MenuItem value={"Decano"}>Decano</MenuItem>
                  <MenuItem value={"Consejo_Superior"}>
                    Consejo Superior
                  </MenuItem>
                  <MenuItem value={"Consejo_Directivo"}>
                    Consejo Directivo
                  </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4} marginBottom={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Fecha"
                value={filtroFecha}
                onChange={(date) => {
                  if (date) {
                    const fechaSeleccionada = dayjs(date).utc();
                    setFiltroFecha(fechaSeleccionada);
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={4} marginBottom={2}>
              <button
                onClick={filtrarResoluciones}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200">
              Filtrar
              </button>
          </Grid>
        </Grid>

          <TableContainer component={Paper} className="mt-4">
          <Table>
            <TableHead>
                <TableRow className="bg-blue-500 text-white">
                  <TableCell className="text-white font-medium">
                    Nro Expediente
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Nro Resolución
                  </TableCell>
                  <TableCell className="text-white font-medium">Tipo</TableCell>
                  <TableCell className="text-white font-medium">
                    Fecha
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Carga
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Estado
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Adjunto
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Observaciones
                  </TableCell>
                  <TableCell className="text-white font-medium"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resoluciones.map((resolucion) => (
                  <TableRow key={resolucion.id} className="hover:bg-gray-50">
                    <TableCell>{resolucion.nexpediente}</TableCell>
                    <TableCell>{resolucion.nresolucion}</TableCell>
                  <TableCell>
                      {resolucion.tipo === "Consejo_Superior"
                        ? "Consejo Superior"
                        : resolucion.tipo === "Consejo_Directivo"
                        ? "Consejo Directivo"
                        : resolucion.tipo}
                  </TableCell>
                  <TableCell>
                      {dayjs(resolucion.fecha, "DD/MM/YYYY HH:mm:ss").isValid()
                        ? dayjs(resolucion.fecha, "DD/MM/YYYY HH:mm:ss").format(
                            "DD/MM/YYYY"
                          )
                        : "No disponible"}
                    </TableCell>
                    <TableCell>
                      {dayjs(
                        resolucion.fecha_creacion,
                        "DD/MM/YYYY HH:mm:ss"
                      ).isValid()
                        ? dayjs(resolucion.fecha_creacion, "DD/MM/YYYY").format(
                            "DD/MM/YYYY"
                          )
                        : "No disponible"}
                  </TableCell>
                  <TableCell>
                      {resolucion.estado == 1 ? "Activo" : "Inactivo"}
                  </TableCell>
                    <TableCell className="text-center">
                      <a
                        href={resolucion.adjunto}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800">
                      <TextSnippetIcon />
                    </a>
                  </TableCell>
                    <TableCell className="text-center">
                    <Tooltip title={resolucion.observaciones}>
                        <VisibilityIcon className="text-gray-600 hover:text-gray-800" />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/resoluciones/edit/${resolucion.id}`
                          )
                        }
                        className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors duration-200">
                      <EditIcon />
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
              prevUrl && setCurrentUrl(prevUrl);
              setCurrentPage(currentPage - 1);
            }}
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
            onClick={() => {
              nextUrl && setCurrentUrl(nextUrl);
              setCurrentPage(currentPage + 1);
            }}
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

export default withAuth(ListaResoluciones);
