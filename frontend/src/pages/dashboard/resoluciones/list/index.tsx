import { useEffect, useState } from "react";
import "./styles.css";
import API from "@/api/axiosConfig";
import {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ResponsiveTable from "../../../../components/ResponsiveTable";
import ActionMenu from "../../../../components/ActionMenu";
import LoadingOverlay from "@/components/LoadingOverlay";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Tooltip from "@mui/material/Tooltip";
import { exportToExcel } from "@/utils/exportToExcel";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import {
  FilterContainer,
  FilterInput,
  FilterSelect,
  FilterDatePicker,
  EstadoFilter,
} from "../../../../components/Filters";
import Pagination from "../../../../components/Pagination";
import DetailModal, { StatusBadge } from "@/components/DetailModal";
import { normalizeUrl } from "@/utils/urlHelpers";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

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
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [filtroFechaExacta, setFiltroFechaExacta] = useState("");
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
      
      // Extract current page from URL (handle both 'page' and 'offset' parameters)
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const pageParam = urlParams.get('page');
      const offsetParam = urlParams.get('offset');
      const limitParam = urlParams.get('limit');
      
      let currentPageFromUrl = 1;
      if (pageParam) {
        currentPageFromUrl = parseInt(pageParam, 10);
      } else if (offsetParam && limitParam) {
        const offset = parseInt(offsetParam, 10);
        const limit = parseInt(limitParam, 10);
        currentPageFromUrl = Math.floor(offset / limit) + 1;
      }
      
      setCurrentPage(currentPageFromUrl);
      
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
    if (filtroFechaExacta !== "") {
      params.append("fecha", filtroFechaExacta);
    }
    if (filtroFechaDesde !== "") {
      params.append("fecha__gte", filtroFechaDesde);
    }
    if (filtroFechaHasta !== "") {
      params.append("fecha__lte", filtroFechaHasta);
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
    setFiltroFechaExacta("");
    setFiltroFechaDesde("");
    setFiltroFechaHasta("");
    setFiltroEstado("1");
    setCurrentPage(1);
    setCurrentUrl(`/facet/resolucion/?page=1`);
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
      if (filtroFechaExacta !== "") params.append("fecha", filtroFechaExacta);
      if (filtroFechaDesde !== "") params.append("fecha__gte", filtroFechaDesde);
      if (filtroFechaHasta !== "") params.append("fecha__lte", filtroFechaHasta);
      url += params.toString();

      // Obtiene todos los datos para el Excel
      while (url) {
        const response = await API.get(url);
        const { results, next } = response.data;
        allResoluciones = [...allResoluciones, ...results];
        url = next ? normalizeUrl(next) : next;
      }

      // Crea el archivo Excel con las columnas de la grilla!
      await exportToExcel({
        fileName: "resoluciones.xlsx",
        sheetName: "Resoluciones",
        rows: allResoluciones.map((resolucion) => ({
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
            ? dayjs(resolucion.fecha_creacion, "DD/MM/YYYY HH:mm:ss").format(
                "DD/MM/YYYY"
              )
            : "No disponible",
          Estado: resolucion.estado == 1 ? "Activo" : "Inactivo",
          Adjunto: resolucion.adjunto,
          Observaciones: resolucion.observaciones,
        })),
      });
      
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

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Resoluciones</h1>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => router.push("/dashboard/resoluciones/create")}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-semibold text-sm">
              <AddIcon /> Agregar Resolución
            </button>
            <button
              onClick={descargarExcel}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 font-semibold text-sm">
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
                { value: "Rector", label: "Rector" },
                { value: "Decano", label: "Decano" },
                { value: "Consejo_Superior", label: "Consejo Superior" },
                { value: "Consejo_Directivo", label: "Consejo Directivo" },
              ]}
              placeholder="Seleccionar tipo"
            />
            <FilterDatePicker
              label="Fecha Exacta"
              value={filtroFechaExacta}
              onChange={setFiltroFechaExacta}
              placeholder="Buscar fecha específica"
            />
            <FilterDatePicker
              label="Fecha Desde"
              value={filtroFechaDesde}
              onChange={setFiltroFechaDesde}
              placeholder="Fecha inicial"
            />
            <FilterDatePicker
              label="Fecha Hasta"
              value={filtroFechaHasta}
              onChange={setFiltroFechaHasta}
              placeholder="Fecha final"
            />
            <EstadoFilter value={filtroEstado} onChange={setFiltroEstado} />
          </FilterContainer>

          <div className="relative">

            {isLoading && <LoadingOverlay variant="overlay" message="Cargando..." />}

            <ResponsiveTable dense>
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
                        ? dayjs(
                            resolucion.fecha_creacion,
                            "DD/MM/YYYY HH:mm:ss"
                          ).format("DD/MM/YYYY")
                        : "No disponible"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge estado={String(resolucion.estado)} />
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
                      <ActionMenu
                        items={[
                          {
                            items: [
                              {
                                label: "Ver detalles",
                                icon: <VisibilityIcon fontSize="small" />,
                                onClick: () => verResolucion(resolucion.id),
                              },
                              {
                                label: "Editar",
                                icon: <EditIcon fontSize="small" />,
                                onClick: () =>
                                  router.push(`/dashboard/resoluciones/edit/${resolucion.id}`),
                              },
                            ],
                          },
                          {
                            items: [
                              {
                                label: "Eliminar",
                                icon: <DeleteIcon fontSize="small" />,
                                onClick: () => eliminarResolucion(resolucion.id),
                                danger: true,
                              },
                            ],
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </ResponsiveTable>
            </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevious={() => prevUrl && setCurrentUrl(prevUrl)}
            onNext={() => nextUrl && setCurrentUrl(nextUrl)}
            hasPrevious={!!prevUrl}
            hasNext={!!nextUrl}
          />
        </div>
        </div>
      </div>

      {/* Modal de vista de resolución */}
      {viewResolucion && (
        <DetailModal
          open={modalViewVisible}
          onClose={() => setModalViewVisible(false)}
          onEdit={() => {
            setModalViewVisible(false);
            router.push(`/dashboard/resoluciones/edit/${viewResolucion.id}`);
          }}
          title="Detalles de la Resolución"
          sections={[
            {
              title: "Información Principal",
              fields: [
                { label: "N° Expediente", value: viewResolucion.nexpediente },
                { label: "N° Resolución", value: viewResolucion.nresolucion },
                {
                  label: "Tipo",
                  value:
                    viewResolucion.tipo === "Consejo_Superior"
                      ? "Consejo Superior"
                      : viewResolucion.tipo === "Consejo_Directivo"
                      ? "Consejo Directivo"
                      : viewResolucion.tipo || "No especificado",
                },
                {
                  label: "Estado",
                  value: (
                    <StatusBadge estado={String(viewResolucion.estado)} />
                  ),
                },
              ],
            },
            {
              title: "Fechas y Archivos",
              fields: [
                {
                  label: "Fecha",
                  value: dayjs(
                    viewResolucion.fecha,
                    "DD/MM/YYYY HH:mm:ss"
                  ).isValid()
                    ? dayjs(viewResolucion.fecha, "DD/MM/YYYY HH:mm:ss").format(
                        "DD/MM/YYYY"
                      )
                    : "No disponible",
                },
                {
                  label: "Fecha de Carga",
                  value: dayjs(
                    viewResolucion.fecha_creacion,
                    "DD/MM/YYYY HH:mm:ss"
                  ).isValid()
                    ? dayjs(
                        viewResolucion.fecha_creacion,
                        "DD/MM/YYYY HH:mm:ss"
                      ).format("DD/MM/YYYY")
                    : "No disponible",
                },
                {
                  label: "Adjunto",
                  value: viewResolucion.adjunto ? (
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
                  ),
                },
              ],
            },
            {
              title: "Observaciones",
              fields: [
                {
                  label: "Observaciones",
                  value: viewResolucion.observaciones ? (
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {viewResolucion.observaciones}
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">Sin observaciones</p>
                  ),
                },
              ],
            },
          ]}
        />
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


