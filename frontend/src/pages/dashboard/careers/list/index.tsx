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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ResponsiveTable from "../../../../components/ResponsiveTable";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SubjectIcon from "@mui/icons-material/Subject";
import RemoveIcon from "@mui/icons-material/Remove";
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

// Agregar estilos CSS para forzar el z-index de SweetAlert
const sweetAlertStyles = `
  .swal-high-z-index {
    z-index: 20000 !important;
  }
  .swal2-container.swal-high-z-index {
    z-index: 20000 !important;
  }
  .swal2-backdrop-show {
    z-index: 19999 !important;
  }
`;

// Inyectar estilos en el head si no existen
if (
  typeof document !== "undefined" &&
  !document.getElementById("sweetalert-z-index-fix")
) {
  const style = document.createElement("style");
  style.id = "sweetalert-z-index-fix";
  style.textContent = sweetAlertStyles;
  document.head.appendChild(style);
}

const ListaCarreras = () => {
  interface Carrera {
    id: number;
    nombre: string;
    tipo: string;
    planestudio: string;
    estado: string;
  }

  interface Asignatura {
    id: number;
    codigo: string;
    nombre: string;
    modulo: string;
    programa?: string;
    tipo: string;
    estado: string;
  }

  interface AsignaturaCarrera {
    id: number;
    asignatura: Asignatura;
    estado: string;
  }

  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroPlanEstudio, setFiltroPlanEstudio] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Estados para el modal de asignaturas
  const [modalAsignaturasVisible, setModalAsignaturasVisible] = useState(false);
  const [modalAgregarAsignaturaVisible, setModalAgregarAsignaturaVisible] =
    useState(false);
  const [carreraSeleccionada, setCarreraSeleccionada] =
    useState<Carrera | null>(null);
  const [asignaturasCarrera, setAsignaturasCarrera] = useState<
    AsignaturaCarrera[]
  >([]);
  const [todasAsignaturas, setTodasAsignaturas] = useState<Asignatura[]>([]);
  const [asignaturaParaAgregar, setAsignaturaParaAgregar] =
    useState<Asignatura | null>(null);
  const [filtroAsignaturas, setFiltroAsignaturas] = useState("");
  const [filtroNombreAsignatura, setFiltroNombreAsignatura] = useState("");
  const [filtroCodigoAsignatura, setFiltroCodigoAsignatura] = useState("");
  const [filtroModuloAsignatura, setFiltroModuloAsignatura] = useState("");
  const [filtroTipoAsignatura, setFiltroTipoAsignatura] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetchData("/facet/carrera/");
  }, []);

  // Función para normalizar URLs de paginación
  const normalizeUrl = (url: string) => {
    if (url.startsWith("http")) {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    }
    return url.replace(/^\/+/, "/");
  };

  const fetchData = async (url: string) => {
    try {
      // Normalizar la URL de entrada si es absoluta
      let apiUrl = url;
      if (url.startsWith("http")) {
        const urlObj = new URL(url);
        apiUrl = urlObj.pathname + urlObj.search;
      }

      const response = await API.get(apiUrl);
      setCarreras(response.data.results);

      // Normalizar las URLs de paginación que vienen del backend
      const normalizedNext = response.data.next
        ? normalizeUrl(response.data.next)
        : null;
      const normalizedPrev = response.data.previous
        ? normalizeUrl(response.data.previous)
        : null;

      setNextUrl(normalizedNext);
      setPrevUrl(normalizedPrev);
      setTotalItems(response.data.count);

      // Calcular la página actual basándose en los parámetros de la URL
      const urlParams = new URLSearchParams(apiUrl.split("?")[1] || "");
      const offset = parseInt(urlParams.get("offset") || "0");
      const limit = parseInt(urlParams.get("limit") || "10");
      const calculatedPage = Math.floor(offset / limit) + 1;
      setCurrentPage(calculatedPage);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al obtener los datos.",
      });
    }
  };

  const filtrarCarreras = () => {
    let url = `/facet/carrera/?`;
    const params = new URLSearchParams();
    if (filtroNombre !== "") {
      params.append("nombre__icontains", filtroNombre);
    }
    if (filtroTipo !== "") {
      params.append("tipo", filtroTipo);
    }
    if (filtroPlanEstudio !== "") {
      params.append("planestudio__icontains", filtroPlanEstudio);
    }
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado !== "" && filtroEstado !== "todos") {
      params.append("estado", filtroEstado);
    }
    url += params.toString();
    fetchData(url);
  };

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroTipo("");
    setFiltroPlanEstudio("");
    setFiltroEstado("1");
    fetchData("/facet/carrera/");
  };

  const descargarExcel = async () => {
    try {
      let allCarreras: Carrera[] = [];
      let url = `/facet/carrera/?`;
      const params = new URLSearchParams();

      if (filtroNombre !== "") {
        params.append("nombre__icontains", filtroNombre);
      }
      if (filtroTipo !== "") {
        params.append("tipo", filtroTipo);
      }
      if (filtroPlanEstudio !== "") {
        params.append("planestudio__icontains", filtroPlanEstudio);
      }
      if (filtroEstado === "todos") {
        params.append("show_all", "true");
      } else if (filtroEstado !== "" && filtroEstado !== "todos") {
        params.append("estado", filtroEstado);
      }
      url += params.toString();

      while (url) {
        const response = await API.get(url);
        const { results, next } = response.data;
        allCarreras = [...allCarreras, ...results];
        url = next;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        allCarreras.map((carrera) => ({
          Nombre: carrera.nombre,
          Tipo: carrera.tipo,
          "Plan de Estudio": carrera.planestudio,
          Estado: carrera.estado === "1" ? "Activo" : "Inactivo",
        }))
      );

      XLSX.utils.book_append_sheet(workbook, worksheet, "Carreras");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(excelBlob, "carreras.xlsx");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al descargar",
        text: "Se produjo un error al exportar los datos.",
      });
    }
  };

  const eliminarCarrera = async (id: number) => {
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
        await API.delete(`/facet/carrera/${id}/`);
        Swal.fire("Eliminado!", "La carrera ha sido eliminada.", "success");
        // Recargar la página actual manteniendo los filtros
        filtrarCarreras();
      }
    } catch (error) {
      Swal.fire("Error!", "No se pudo eliminar la carrera.", "error");
    }
  };

  // Función para cargar todas las asignaturas de una carrera (con paginación)
  const cargarTodasAsignaturasCarrera = async (
    carreraId: number
  ): Promise<AsignaturaCarrera[]> => {
    try {
      let todasAsignaturasCarrera: AsignaturaCarrera[] = [];
      let url:
        | string
        | null = `/facet/asignatura-carrera/?carrera=${carreraId}`;

      // Cargar todas las páginas
      while (url) {
        const response: any = await API.get(url);
        const { results, next }: { results?: any[]; next?: string } =
          response.data;
        if (results) {
          todasAsignaturasCarrera = [...todasAsignaturasCarrera, ...results];
        }

        // Normalizar la URL del siguiente enlace
        url = next ? normalizeUrl(next) : null;
      }

      console.log(
        `Total asignaturas cargadas para carrera ${carreraId}:`,
        todasAsignaturasCarrera.length
      );
      return await cargarAsignaturasCompletas(todasAsignaturasCarrera);
    } catch (error) {
      console.error(
        "Error al cargar todas las asignaturas de la carrera:",
        error
      );
      return [];
    }
  };

  // Función para cargar todas las asignaturas disponibles (con paginación)
  const cargarTodasAsignaturasDisponibles = async (): Promise<Asignatura[]> => {
    try {
      let todasAsignaturas: Asignatura[] = [];
      let url: string | null = `/facet/asignatura/?estado=1`;

      // Cargar todas las páginas
      while (url) {
        const response: any = await API.get(url);
        const { results, next }: { results?: any[]; next?: string } =
          response.data;
        if (results) {
          todasAsignaturas = [...todasAsignaturas, ...results];
        }

        // Normalizar la URL del siguiente enlace
        url = next ? normalizeUrl(next) : null;
      }

      console.log(
        `Total asignaturas disponibles cargadas:`,
        todasAsignaturas.length
      );
      return todasAsignaturas;
    } catch (error) {
      console.error(
        "Error al cargar todas las asignaturas disponibles:",
        error
      );
      return [];
    }
  };

  // Helper para cargar datos completos de asignaturas
  const cargarAsignaturasCompletas = async (
    asignaturasCarrera: AsignaturaCarrera[]
  ) => {
    if (asignaturasCarrera.length === 0) return asignaturasCarrera;

    // Verificar si los datos están completos
    const primerItem = asignaturasCarrera[0];
    if (primerItem.asignatura && primerItem.asignatura.codigo) {
      // Los datos ya están completos
      return asignaturasCarrera;
    }

    console.log("Datos de asignatura incompletos, cargando por separado...");

    // Obtener todos los IDs de asignaturas
    const idsAsignaturas = asignaturasCarrera
      .map((ac) => ac.asignatura?.id || ac.asignatura)
      .filter((id) => id);

    if (idsAsignaturas.length === 0) return asignaturasCarrera;

    try {
      // Cargar los datos completos de las asignaturas
      const promesasAsignaturas = idsAsignaturas.map((id) =>
        API.get(`/facet/asignatura/${id}/`)
      );
      const respuestasAsignaturas = await Promise.all(promesasAsignaturas);

      // Combinar los datos
      const asignaturasCompletas = asignaturasCarrera.map((ac, index) => ({
        ...ac,
        asignatura: respuestasAsignaturas[index]?.data || ac.asignatura,
      }));

      console.log("Asignaturas con datos completos:", asignaturasCompletas);
      return asignaturasCompletas;
    } catch (error) {
      console.error("Error al cargar datos completos de asignaturas:", error);
      return asignaturasCarrera;
    }
  };

  // Funciones para manejar asignaturas
  const verAsignaturasCarrera = async (carrera: Carrera) => {
    try {
      setCarreraSeleccionada(carrera);
      setModalAsignaturasVisible(true);

      // Limpiar estados anteriores
      setAsignaturasCarrera([]);
      setTodasAsignaturas([]);
      setFiltroAsignaturas("");
      setAsignaturaParaAgregar(null);

      // Cargar TODAS las asignaturas de la carrera (con paginación)
      const todasAsignaturasCarrera = await cargarTodasAsignaturasCarrera(
        carrera.id
      );
      setAsignaturasCarrera(todasAsignaturasCarrera);

      // Cargar TODAS las asignaturas disponibles (con paginación)
      const todasAsignaturasDisponibles =
        await cargarTodasAsignaturasDisponibles();
      setTodasAsignaturas(todasAsignaturasDisponibles);
    } catch (error) {
      console.error("Error al cargar asignaturas:", error);
      Swal.fire({
        title: "Error!",
        text: "No se pudieron cargar las asignaturas.",
        icon: "error",
        backdrop: `rgba(0, 0, 0, 0.4)`,
        customClass: {
          container: "swal-high-z-index",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal2-container");
          if (swalContainer) {
            (swalContainer as HTMLElement).style.zIndex = "20000";
          }
        },
      });
    }
  };

  const abrirModalAgregarAsignatura = async () => {
    try {
      setModalAgregarAsignaturaVisible(true);

      // Cargar TODAS las asignaturas disponibles (con paginación)
      const todasAsignaturasDisponibles =
        await cargarTodasAsignaturasDisponibles();
      setTodasAsignaturas(todasAsignaturasDisponibles);

      // Limpiar filtros
      setFiltroNombreAsignatura("");
      setFiltroCodigoAsignatura("");
      setFiltroModuloAsignatura("");
      setFiltroTipoAsignatura("");
      setAsignaturaParaAgregar(null);
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "No se pudieron cargar las asignaturas.",
        icon: "error",
        backdrop: `rgba(0, 0, 0, 0.4)`,
        customClass: {
          container: "swal-high-z-index",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal2-container");
          if (swalContainer) {
            (swalContainer as HTMLElement).style.zIndex = "20000";
          }
        },
      });
    }
  };

  const filtrarAsignaturasDisponibles = () => {
    let url = `/facet/asignatura/?`;
    const params = new URLSearchParams();

    if (filtroNombreAsignatura.trim())
      params.append("nombre__icontains", filtroNombreAsignatura);
    if (filtroCodigoAsignatura.trim())
      params.append("codigo__icontains", filtroCodigoAsignatura);
    if (filtroModuloAsignatura.trim())
      params.append("modulo__icontains", filtroModuloAsignatura);
    if (filtroTipoAsignatura.trim())
      params.append("tipo", filtroTipoAsignatura);
    params.append("estado", "1");

    url += params.toString();

    API.get(url)
      .then((response) => {
        setTodasAsignaturas(response.data.results || []);
      })
      .catch((error) => {
        console.error("Error al filtrar asignaturas:", error);
      });
  };

  const agregarAsignaturaACarrera = async () => {
    if (!asignaturaParaAgregar || !carreraSeleccionada) {
      Swal.fire({
        title: "Error!",
        text: "Selecciona una asignatura.",
        icon: "error",
        backdrop: `rgba(0, 0, 0, 0.4)`,
        customClass: {
          container: "swal-high-z-index",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal2-container");
          if (swalContainer) {
            (swalContainer as HTMLElement).style.zIndex = "20000";
          }
        },
      });
      return;
    }

    try {
      // Verificar si la asignatura ya está agregada
      const yaExiste = asignaturasCarrera.some(
        (ac) => ac.asignatura.id === asignaturaParaAgregar.id
      );

      if (yaExiste) {
        Swal.fire({
          title: "Error!",
          text: "Esta asignatura ya está agregada a la carrera.",
          icon: "error",
          backdrop: `rgba(0, 0, 0, 0.4)`,
          customClass: {
            container: "swal-high-z-index",
          },
          didOpen: () => {
            const swalContainer = document.querySelector(".swal2-container");
            if (swalContainer) {
              (swalContainer as HTMLElement).style.zIndex = "20000";
            }
          },
        });
        return;
      }

      await API.post(`/facet/asignatura-carrera/`, {
        asignatura: asignaturaParaAgregar.id,
        carrera: carreraSeleccionada.id,
        estado: "1",
      });

      Swal.fire({
        title: "¡Éxito!",
        text: "Asignatura agregada correctamente.",
        icon: "success",
        backdrop: `rgba(0, 0, 0, 0.4)`,
        customClass: {
          container: "swal-high-z-index",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal2-container");
          if (swalContainer) {
            (swalContainer as HTMLElement).style.zIndex = "20000";
          }
        },
      });

      // Cerrar modal de agregar
      setModalAgregarAsignaturaVisible(false);

      // Recargar TODAS las asignaturas de la carrera
      const asignaturasActualizadas = await cargarTodasAsignaturasCarrera(
        carreraSeleccionada.id
      );
      setAsignaturasCarrera(asignaturasActualizadas);
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "No se pudo agregar la asignatura.",
        icon: "error",
        backdrop: `rgba(0, 0, 0, 0.4)`,
        customClass: {
          container: "swal-high-z-index",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal2-container");
          if (swalContainer) {
            (swalContainer as HTMLElement).style.zIndex = "20000";
          }
        },
      });
    }
  };

  const eliminarAsignaturaDeCarrera = async (asignaturaCarreraId: number) => {
    try {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta asignatura se eliminará de la carrera",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        backdrop: `rgba(0, 0, 0, 0.4)`,
        customClass: {
          container: "swal-high-z-index",
        },
        didOpen: () => {
          // Forzar z-index adicional si es necesario
          const swalContainer = document.querySelector(".swal2-container");
          if (swalContainer) {
            (swalContainer as HTMLElement).style.zIndex = "20000";
          }
        },
      });

      if (result.isConfirmed) {
        await API.delete(`/facet/asignatura-carrera/${asignaturaCarreraId}/`);
        Swal.fire({
          title: "¡Eliminado!",
          text: "La asignatura ha sido eliminada de la carrera.",
          icon: "success",
          backdrop: `rgba(0, 0, 0, 0.4)`,
          customClass: {
            container: "swal-high-z-index",
          },
          didOpen: () => {
            const swalContainer = document.querySelector(".swal2-container");
            if (swalContainer) {
              (swalContainer as HTMLElement).style.zIndex = "20000";
            }
          },
        });

        // Recargar TODAS las asignaturas de la carrera
        if (carreraSeleccionada) {
          const asignaturasActualizadas = await cargarTodasAsignaturasCarrera(
            carreraSeleccionada.id
          );
          setAsignaturasCarrera(asignaturasActualizadas);
        }
      }
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "No se pudo eliminar la asignatura.",
        icon: "error",
        backdrop: `rgba(0, 0, 0, 0.4)`,
        customClass: {
          container: "swal-high-z-index",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal2-container");
          if (swalContainer) {
            (swalContainer as HTMLElement).style.zIndex = "20000";
          }
        },
      });
    }
  };

  const asignaturasDisponibles = todasAsignaturas.filter(
    (asignatura) =>
      !asignaturasCarrera.some((ac) => ac.asignatura.id === asignatura.id)
  );

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Carreras</h1>
          </div>

          <div className="p-6">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => router.push("/dashboard/careers/create")}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                <AddIcon /> Agregar Carrera
              </button>
              <button
                onClick={descargarExcel}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                <FileDownloadIcon /> Descargar Excel
              </button>
            </div>

            <FilterContainer onApply={filtrarCarreras} onClear={limpiarFiltros}>
              <FilterInput
                label="Nombre"
                value={filtroNombre}
                onChange={setFiltroNombre}
                placeholder="Buscar por nombre"
              />
              <FilterSelect
                label="Tipo"
                value={filtroTipo}
                onChange={setFiltroTipo}
                options={[
                  { value: "Grado", label: "Grado" },
                  { value: "Posgrado", label: "Posgrado" },
                ]}
                placeholder="Seleccionar tipo"
              />
              <FilterInput
                label="Plan de Estudio"
                value={filtroPlanEstudio}
                onChange={setFiltroPlanEstudio}
                placeholder="Buscar por plan de estudio"
              />
              <EstadoFilter value={filtroEstado} onChange={setFiltroEstado} />
            </FilterContainer>

            <ResponsiveTable>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Plan de Estudio</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Asignaturas</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {carreras.map((carrera) => (
                  <TableRow
                    key={carrera.id}
                    className="hover:bg-gray-50 transition-colors duration-150">
                    <TableCell className="text-gray-800">
                      {carrera.nombre}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {carrera.tipo}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {carrera.planestudio}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {carrera.estado === "1" ? "Activo" : "Inactivo"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => verAsignaturasCarrera(carrera)}
                        className="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-100 transition-colors duration-200"
                        title="Ver Asignaturas">
                        <SubjectIcon />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/careers/edit/${carrera.id}`)
                          }
                          className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors duration-200"
                          title="Editar">
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => eliminarCarrera(carrera.id)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100 transition-colors duration-200"
                          title="Eliminar">
                          <DeleteIcon />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ResponsiveTable>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => prevUrl && fetchData(prevUrl)}
                disabled={!prevUrl}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  !prevUrl
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}>
                Anterior
              </button>
              <span className="text-gray-600 font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => nextUrl && fetchData(nextUrl)}
                disabled={!nextUrl}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  !nextUrl
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}>
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para administrar asignaturas de la carrera */}
      <Dialog
        open={modalAsignaturasVisible}
        onClose={() => setModalAsignaturasVisible(false)}
        maxWidth="lg"
        fullWidth
        style={{ zIndex: 9999 }}
        PaperProps={{
          style: {
            borderRadius: "12px",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            zIndex: 10000,
          },
        }}>
        <DialogTitle className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
          Asignaturas de {carreraSeleccionada?.nombre}
        </DialogTitle>
        <DialogContent className="p-6">
          <Grid container spacing={3}>
            {/* Botón para agregar nueva asignatura */}
            <Grid item xs={12}>
              <div className="flex justify-between items-center mb-6 mt-4">
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold">
                  Asignaturas Actuales ({asignaturasCarrera.length})
                </Typography>
                <button
                  onClick={abrirModalAgregarAsignatura}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                  <AddIcon className="mr-1" /> Agregar Asignatura
                </button>
              </div>
            </Grid>

            {/* Lista de asignaturas actuales */}
            <Grid item xs={12}>
              {asignaturasCarrera.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay asignaturas asignadas a esta carrera
                </div>
              ) : (
                <TableContainer
                  component={Paper}
                  className="shadow-lg rounded-lg overflow-hidden"
                  style={{ maxHeight: "400px", overflow: "auto" }}>
                  <Table size="small">
                    <TableHead className="bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0 z-10">
                      <TableRow>
                        <TableCell className="text-white font-semibold py-2">
                          Código
                        </TableCell>
                        <TableCell className="text-white font-semibold py-2">
                          Nombre
                        </TableCell>
                        <TableCell className="text-white font-semibold py-2">
                          Módulo
                        </TableCell>
                        <TableCell className="text-white font-semibold py-2">
                          Tipo
                        </TableCell>
                        <TableCell className="text-white font-semibold py-2">
                          Estado
                        </TableCell>
                        <TableCell className="text-white font-semibold py-2">
                          Acciones
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {asignaturasCarrera.map((asignaturaCarrera) => (
                        <TableRow
                          key={asignaturaCarrera.id}
                          className="hover:bg-blue-50 transition-colors duration-200">
                          <TableCell className="font-medium py-2">
                            {asignaturaCarrera.asignatura?.codigo ||
                              "Sin código"}
                          </TableCell>
                          <TableCell className="font-medium py-2">
                            {asignaturaCarrera.asignatura?.nombre ||
                              "Sin nombre"}
                          </TableCell>
                          <TableCell className="py-2">
                            {asignaturaCarrera.asignatura?.modulo ||
                              "Sin módulo"}
                          </TableCell>
                          <TableCell className="py-2">
                            {asignaturaCarrera.asignatura?.tipo || "Sin tipo"}
                          </TableCell>
                          <TableCell className="py-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                asignaturaCarrera.estado === "1"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                              {asignaturaCarrera.estado === "1"
                                ? "Activo"
                                : "Inactivo"}
                            </span>
                          </TableCell>
                          <TableCell className="py-2">
                            <button
                              onClick={() =>
                                eliminarAsignaturaDeCarrera(
                                  asignaturaCarrera.id
                                )
                              }
                              className="p-1 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-100 transition-colors duration-200"
                              title="Eliminar de la carrera">
                              <RemoveIcon />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className="p-4">
          <button
            onClick={() => setModalAsignaturasVisible(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all duration-200 font-medium">
            Cerrar
          </button>
        </DialogActions>
      </Dialog>

      {/* Modal para seleccionar asignatura a agregar */}
      <Dialog
        open={modalAgregarAsignaturaVisible}
        onClose={() => setModalAgregarAsignaturaVisible(false)}
        maxWidth="lg"
        fullWidth
        style={{ zIndex: 10001 }}
        PaperProps={{
          style: {
            borderRadius: "12px",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            zIndex: 10002,
          },
        }}>
        <DialogTitle className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
          Seleccionar Asignatura para {carreraSeleccionada?.nombre}
        </DialogTitle>
        <DialogContent className="p-4">
          <Grid container spacing={2} className="mb-4 mt-4">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Código"
                value={filtroCodigoAsignatura}
                onChange={(e) => setFiltroCodigoAsignatura(e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Buscar por código"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Nombre"
                value={filtroNombreAsignatura}
                onChange={(e) => setFiltroNombreAsignatura(e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Buscar por nombre"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Módulo"
                value={filtroModuloAsignatura}
                onChange={(e) => setFiltroModuloAsignatura(e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Buscar por módulo"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Tipo"
                value={filtroTipoAsignatura}
                onChange={(e) => setFiltroTipoAsignatura(e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Buscar por tipo"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <div className="flex gap-2">
                <button
                  onClick={filtrarAsignaturasDisponibles}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                  Filtrar
                </button>
                <button
                  onClick={() => {
                    setFiltroNombreAsignatura("");
                    setFiltroCodigoAsignatura("");
                    setFiltroModuloAsignatura("");
                    setFiltroTipoAsignatura("");
                    // Recargar TODAS las asignaturas
                    cargarTodasAsignaturasDisponibles().then((asignaturas) => {
                      setTodasAsignaturas(asignaturas);
                    });
                  }}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                  Limpiar
                </button>
              </div>
            </Grid>
          </Grid>

          {asignaturaParaAgregar && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 shadow-sm">
              <p className="text-sm font-medium text-gray-800">
                <span className="font-bold text-blue-700">
                  Asignatura Seleccionada:
                </span>{" "}
                <span className="text-gray-900">
                  {asignaturaParaAgregar.nombre}
                </span>
              </p>
              <p className="text-sm font-medium text-gray-800">
                <span className="font-bold text-blue-700">Código:</span>{" "}
                <span className="text-gray-900">
                  {asignaturaParaAgregar.codigo}
                </span>{" "}
                <span className="font-bold text-blue-700">Módulo:</span>{" "}
                <span className="text-gray-900">
                  {asignaturaParaAgregar.modulo}
                </span>{" "}
                <span className="font-bold text-blue-700">Tipo:</span>{" "}
                <span className="text-gray-900">
                  {asignaturaParaAgregar.tipo}
                </span>
              </p>
            </div>
          )}

          <TableContainer
            component={Paper}
            className="shadow-lg rounded-lg overflow-hidden"
            style={{ maxHeight: "400px" }}>
            <Table size="small">
              <TableHead className="bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0 z-10">
                <TableRow>
                  <TableCell className="text-white font-semibold py-2">
                    Código
                  </TableCell>
                  <TableCell className="text-white font-semibold py-2">
                    Nombre
                  </TableCell>
                  <TableCell className="text-white font-semibold py-2">
                    Módulo
                  </TableCell>
                  <TableCell className="text-white font-semibold py-2">
                    Tipo
                  </TableCell>
                  <TableCell className="text-white font-semibold py-2">
                    Estado
                  </TableCell>
                  <TableCell className="text-white font-semibold py-2">
                    Seleccionar
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {asignaturasDisponibles.map((asignatura) => (
                  <TableRow
                    key={asignatura.id}
                    className="hover:bg-blue-50 transition-colors duration-200">
                    <TableCell className="font-medium py-2">
                      {asignatura.codigo}
                    </TableCell>
                    <TableCell className="font-medium py-2">
                      {asignatura.nombre}
                    </TableCell>
                    <TableCell className="font-medium py-2">
                      {asignatura.modulo}
                    </TableCell>
                    <TableCell className="font-medium py-2">
                      {asignatura.tipo}
                    </TableCell>
                    <TableCell className="font-medium py-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          asignatura.estado === "1"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {asignatura.estado === "1" ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <button
                        onClick={() => setAsignaturaParaAgregar(asignatura)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium text-sm">
                        Seleccionar
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {asignaturasDisponibles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay asignaturas disponibles para agregar
            </div>
          )}
        </DialogContent>
        <DialogActions className="p-4">
          <button
            onClick={() => setModalAgregarAsignaturaVisible(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-all duration-200 font-medium">
            Cancelar
          </button>
          <button
            onClick={agregarAsignaturaACarrera}
            disabled={!asignaturaParaAgregar}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              asignaturaParaAgregar
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transform hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}>
            Agregar a Carrera
          </button>
        </DialogActions>
      </Dialog>
    </DashboardMenu>
  );
};

export default withAuth(ListaCarreras);
