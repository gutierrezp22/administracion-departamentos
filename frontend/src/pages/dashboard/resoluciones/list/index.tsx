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
import {
  FilterContainer,
  FilterInput,
  FilterSelect,
  EstadoFilter,
} from "../../../../components/Filters";

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
  const [filtroNExpediente, setFiltroNExpediente] = useState("");
  const [filtroNResolucion, setFiltroNResolucion] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `${API_BASE_URL}/facet/resolucion/`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const router = useRouter();

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(url);
      setResoluciones(response.data.results);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setTotalItems(response.data.count);
      // Pequeño delay para asegurar que los estilos se cargan
      setTimeout(() => setIsLoading(false), 500);
    } catch (error) {
      setIsLoading(false);
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

    if (filtroNExpediente !== "") {
      params.append("nexpediente__icontains", filtroNExpediente);
    }
    if (filtroNResolucion !== "") {
      params.append("nresolucion__icontains", filtroNResolucion);
    }
    if (filtroTipo !== "") {
      params.append("tipo", filtroTipo);
    }
    if (filtroFecha !== "") {
      params.append("fecha__date", filtroFecha);
    }
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado !== "" && filtroEstado !== "todos") {
      params.append("estado", filtroEstado.toString());
    }

    params.append("page", "1");
    url += params.toString();
    setCurrentPage(1);
    setCurrentUrl(url);
  };

  const limpiarFiltros = () => {
    setFiltroNExpediente("");
    setFiltroNResolucion("");
    setFiltroTipo("");
    setFiltroFecha("");
    setFiltroEstado("1");
  };

  const handlePageChange = (newPage: number) => {
    let url = `${API_BASE_URL}/facet/resolucion/?`;
    const params = new URLSearchParams();

    if (filtroNExpediente !== "") {
      params.append("nexpediente__icontains", filtroNExpediente);
    }
    if (filtroNResolucion !== "") {
      params.append("nresolucion__icontains", filtroNResolucion);
    }
    if (filtroTipo !== "") {
      params.append("tipo", filtroTipo);
    }
    if (filtroFecha !== "") {
      params.append("fecha__date", filtroFecha);
    }
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado !== "" && filtroEstado !== "todos") {
      params.append("estado", filtroEstado.toString());
    }

    params.append("page", newPage.toString());
    url += params.toString();

    setCurrentPage(newPage);
    setCurrentUrl(url);
  };

  const descargarExcel = async () => {
    try {
      let allResoluciones: Resolucion[] = [];
      let url = `${API_BASE_URL}/facet/resolucion/?`;
      const params = new URLSearchParams();

      // Agrega los filtros actuales al URL de exportación
      if (filtroNExpediente !== "")
        params.append("nexpediente__icontains", filtroNExpediente);
      if (filtroEstado === "todos") {
        params.append("show_all", "true");
      } else if (filtroEstado !== "" && filtroEstado !== "todos") {
        params.append("estado", filtroEstado.toString());
      }
      if (filtroTipo !== "") params.append("tipo", filtroTipo);
      if (filtroNResolucion !== "")
        params.append("nresolucion__icontains", filtroNResolucion);
      if (filtroFecha !== "") params.append("fecha__date", filtroFecha);
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

  // Modal de loading
  if (isLoading) {
    return (
      <DashboardMenu>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700 text-lg font-medium">
              Cargando resoluciones...
            </p>
          </div>
        </div>
      </DashboardMenu>
    );
  }

  return (
    <DashboardMenu>
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Resoluciones</h1>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => router.push("/dashboard/resoluciones/create")}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <AddIcon /> Agregar Resolución
            </button>
            <button
              onClick={descargarExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <FileDownloadIcon /> Descargar Excel
            </button>
          </div>

          <FilterContainer
            onApply={filtrarResoluciones}
            onClear={limpiarFiltros}>
            <FilterInput
              label="N° Expediente"
              value={filtroNExpediente}
              onChange={setFiltroNExpediente}
              placeholder="Buscar por N° expediente"
            />
            <FilterInput
              label="N° Resolución"
              value={filtroNResolucion}
              onChange={setFiltroNResolucion}
              placeholder="Buscar por N° resolución"
            />
            <FilterSelect
              label="Tipo"
              value={filtroTipo}
              onChange={setFiltroTipo}
              options={[
                { value: "Rectoral", label: "Rectoral" },
                { value: "Consejo Superior", label: "Consejo Superior" },
                { value: "Consejo Directivo", label: "Consejo Directivo" },
              ]}
              placeholder="Seleccionar tipo"
            />
            <FilterInput
              label="Fecha"
              value={filtroFecha}
              onChange={setFiltroFecha}
              type="date"
            />
            <EstadoFilter value={filtroEstado} onChange={setFiltroEstado} />
          </FilterContainer>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHead>
                <TableRow className="bg-blue-500">
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Nro Expediente</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Nro Resolución</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Tipo</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Fecha</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Carga</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Estado</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Adjunto</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Observaciones</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resoluciones.map((resolucion) => (
                  <TableRow key={resolucion.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-800">
                      {resolucion.nexpediente}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {resolucion.nresolucion}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {resolucion.tipo === "Consejo_Superior"
                        ? "Consejo Superior"
                        : resolucion.tipo === "Consejo_Directivo"
                        ? "Consejo Directivo"
                        : resolucion.tipo}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {dayjs(resolucion.fecha, "DD/MM/YYYY HH:mm:ss").isValid()
                        ? dayjs(resolucion.fecha, "DD/MM/YYYY HH:mm:ss").format(
                            "DD/MM/YYYY"
                          )
                        : "No disponible"}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {dayjs(
                        resolucion.fecha_creacion,
                        "DD/MM/YYYY HH:mm:ss"
                      ).isValid()
                        ? dayjs(resolucion.fecha_creacion, "DD/MM/YYYY").format(
                            "DD/MM/YYYY"
                          )
                        : "No disponible"}
                    </TableCell>
                    <TableCell className="text-gray-800">
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
                        className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                        <EditIcon />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentPage > 1
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors duration-200`}>
              Anterior
            </button>
            <span className="text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentPage < totalPages
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors duration-200`}>
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaResoluciones);
