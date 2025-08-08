import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import API from "@/api/axiosConfig";
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
import ResponsiveTable from "../../../../components/ResponsiveTable";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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

// Función para normalizar URLs de paginación
const normalizeUrl = (url: string) => {
  return url.replace(window.location.origin, "").replace(/^\/+/, "/");
};

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
  const [currentUrl, setCurrentUrl] = useState<string>(`/facet/resolucion/`);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewResolucion, setViewResolucion] = useState<Resolucion | null>(null);
  const [modalViewVisible, setModalViewVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await API.get(url);
      setResoluciones(response.data.results);
      setNextUrl(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrl(
        response.data.previous ? normalizeUrl(response.data.previous) : null
      );
      setTotalItems(response.data.count);
      
      // Extract current page from URL
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const pageParam = urlParams.get('page');
      if (pageParam) {
        setCurrentPage(parseInt(pageParam, 10));
      }
      
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
    let url = `/facet/resolucion/?`;
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
    let url = `/facet/resolucion/?`;
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
      setIsDownloading(true);
      let allResoluciones: Resolucion[] = [];
      let url = `/facet/resolucion/?`;
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
        const response = await API.get(url);
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
      
      // Simular un pequeño delay para mostrar el modal antes de cerrar
      setTimeout(() => {
        setIsDownloading(false);
      }, 1500);
    } catch (error) {
      setIsDownloading(false);
      Swal.fire({
        icon: "error",
        title: "Error al descargar",
        text: "Se produjo un error al exportar los datos.",
      });
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const verResolucion = async (id: number) => {
    try {
      const response = await API.get(`/facet/resolucion/${id}/`);
      setViewResolucion(response.data);
      setModalViewVisible(true);
    } catch (error) {
      Swal.fire(
        "Error!",
        "No se pudo obtener los datos de la resolución.",
        "error"
      );
    }
  };

  const eliminarResolucion = async (id: number) => {
    try {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        await API.delete(`/facet/resolucion/${id}/`);

        Swal.fire("¡Eliminado!", "La resolución ha sido eliminada.", "success");

        // Recargar los datos
        fetchData(currentUrl);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar la resolución.",
      });
    }
  };

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

          <ResponsiveTable>
            <TableHead>
              <TableRow>
                <TableCell>
                  Nro Expediente
                </TableCell>
                <TableCell>
                  Nro Resolución
                </TableCell>
                <TableCell>
                  Tipo
                </TableCell>
                <TableCell>
                  Fecha
                </TableCell>
                <TableCell>
                  Carga
                </TableCell>
                <TableCell>
                  Estado
                </TableCell>
                <TableCell>
                  Adjunto
                </TableCell>
                <TableCell>
                  Observaciones
                </TableCell>
                <TableCell>
                  Acciones
                </TableCell>
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
                      <div className="flex items-center justify-center gap-2">
                        <Tooltip title="Ver detalles">
                          <button
                            onClick={() => verResolucion(resolucion.id)}
                            className="p-2 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-100 transition-colors duration-200">
                            <VisibilityIcon />
                          </button>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/resoluciones/edit/${resolucion.id}`
                              )
                            }
                            className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                            <EditIcon />
                          </button>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <button
                            onClick={() => eliminarResolucion(resolucion.id)}
                            className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-100 transition-colors duration-200">
                            <DeleteIcon />
                          </button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </ResponsiveTable>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => prevUrl && setCurrentUrl(prevUrl)}
              disabled={!prevUrl}
              className={`px-4 py-2 rounded-lg font-medium ${
                prevUrl
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors duration-200`}>
              Anterior
            </button>
            <span className="text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => nextUrl && setCurrentUrl(nextUrl)}
              disabled={!nextUrl}
              className={`px-4 py-2 rounded-lg font-medium ${
                nextUrl
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors duration-200`}>
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de vista de resolución */}
      {modalViewVisible && viewResolucion && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[10000]"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}>
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setModalViewVisible(false)}></div>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto z-[10001] relative">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Detalles de la Resolución
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Principal */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
                    Información Principal
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        N° Expediente
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewResolucion.nexpediente || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        N° Resolución
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewResolucion.nresolucion || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Tipo
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewResolucion.tipo === "Consejo_Superior"
                          ? "Consejo Superior"
                          : viewResolucion.tipo === "Consejo_Directivo"
                          ? "Consejo Directivo"
                          : viewResolucion.tipo || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Estado
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          viewResolucion.estado == 1
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {viewResolucion.estado == 1 ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información de Fechas y Archivos */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
                    Fechas y Archivos
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Fecha
                      </label>
                      <p className="text-gray-900 font-medium">
                        {dayjs(viewResolucion.fecha, "DD/MM/YYYY HH:mm:ss").isValid()
                          ? dayjs(viewResolucion.fecha, "DD/MM/YYYY HH:mm:ss").format(
                              "DD/MM/YYYY"
                            )
                          : "No disponible"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Fecha de Carga
                      </label>
                      <p className="text-gray-900 font-medium">
                        {dayjs(
                          viewResolucion.fecha_creacion,
                          "DD/MM/YYYY HH:mm:ss"
                        ).isValid()
                          ? dayjs(viewResolucion.fecha_creacion, "DD/MM/YYYY").format(
                              "DD/MM/YYYY"
                            )
                          : "No disponible"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Adjunto
                      </label>
                      {viewResolucion.adjunto ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={viewResolucion.adjunto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
                            <TextSnippetIcon />
                            Ver archivo
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Sin adjunto</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Observaciones - Ancho completo */}
              {viewResolucion.observaciones && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                    Observaciones
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {viewResolucion.observaciones}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setModalViewVisible(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200">
                Cerrar
              </button>
              <button
                onClick={() => {
                  setModalViewVisible(false);
                  router.push(`/dashboard/resoluciones/edit/${viewResolucion.id}`);
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200">
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de descarga de Excel */}
      {isDownloading && (
        <div className="fixed inset-0 flex items-center justify-center z-[10000]">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg shadow-xl p-8 w-96 z-[10001] relative">
            <h3 className="text-xl font-bold text-center mb-2">Descargando Excel</h3>
            <hr className="my-3 border-gray-200" />
            <div className="flex flex-col items-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 text-lg text-center">
                La descarga está en curso, por favor espere...
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardMenu>
  );
};

export default withAuth(ListaResoluciones);
