import { useEffect, useState, useCallback } from "react";
import "./styles.css";
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
  FormControlLabel,
  Checkbox,
  Tooltip,
} from "@mui/material";
import ResponsiveTable from "../../../../../components/ResponsiveTable";
import AddIcon from "@mui/icons-material/Add";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useRouter } from "next/router";
import DashboardMenu from "../../..";
import dayjs from "dayjs";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Link from "next/link";
import withAuth from "../../../../../components/withAut"; // Importa el HOC
import Swal from "sweetalert2";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import EmailIcon from "@mui/icons-material/Email";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
  FilterContainer,
  FilterInput,
  FilterSelect,
  EstadoFilter,
} from "../../../../../components/Filters";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Función para normalizar URLs de paginación
const normalizeUrl = (url: string) => {
  return url.replace(window.location.origin, "").replace(/^\/+/, "/");
};

const ListaDocenteAsignatura: React.FC = () => {
  const router = useRouter();
  const { idAsignatura } = router.query;
  const pageSize = 10;

  type Condicion =
    | "Regular"
    | "Interino"
    | "Transitorio"
    | "Licencia sin goce de sueldo"
    | "Renuncia"
    | "Licencia con goce de sueldo";
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

  interface Resolucion {
    id: number;
    nexpediente: string;
    nresolucion: string;
    tipo: string;
    fecha: string;
    fecha_creacion: string;
    adjunto?: string;
    observaciones?: string;
    estado: 0 | 1;
  }

  interface AsignaturaDocente {
    id: number;
    docente: Docente;
    resolucion?: Resolucion;
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
  const [filtroApellido, setFiltroApellido] = useState("");
  const [filtroDni, setFiltroDni] = useState("");
  const [filtroCondicion, setFiltroCondicion] = useState<Condicion | "">("");
  const [filtroCargo, setFiltroCargo] = useState<Cargo | "">("");
  const [filtroDedicacion, setFiltroDedicacion] = useState<Dedicacion | "">("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [mostrarVencimientos, setMostrarVencimientos] = useState(false);
  const [asignaturaNombre, setAsignaturaNombre] = useState("");
  const [modalDocenteVisible, setModalDocenteVisible] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] =
    useState<AsignaturaDocente | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchAsignaturaInfo = useCallback(async () => {
    try {
      const response = await API.get(`/facet/asignatura/${idAsignatura}/`);
      setAsignaturaNombre(response.data.nombre);
    } catch (error) {
      console.error("Error fetching asignatura:", error);
    }
  }, [idAsignatura]);

  useEffect(() => {
    if (idAsignatura) {
      // Cargar información de la asignatura
      fetchAsignaturaInfo();
      const initialUrl = `/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`;
      setCurrentUrl(initialUrl);
    }
  }, [idAsignatura, fetchAsignaturaInfo]);

  useEffect(() => {
    if (currentUrl) {
      fetchData(currentUrl);
    }
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      const response = await API.get(url);
      const data = response.data;

      console.log("Response data:", data);
      console.log("Data count:", data.count);
      console.log("Data results:", data.results);
      console.log("Data length:", Array.isArray(data) ? data.length : 'Not array');

      // Si data es un array directamente (sin paginación)
      if (Array.isArray(data)) {
        setAsignaturaDocentes(data);
        setPrevUrl(null);
        setNextUrl(null);
        setTotalItems(data.length);
        setTotalPages(Math.ceil(data.length / pageSize));
        setCurrentPage(1);
      } else {
        // Si data tiene estructura de paginación
        setAsignaturaDocentes(data.results || []);
        setPrevUrl(data.previous ? normalizeUrl(data.previous) : null);
        setNextUrl(data.next ? normalizeUrl(data.next) : null);
        setTotalItems(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / pageSize));
      }

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
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los datos. Por favor, intenta de nuevo.",
      });
    }
  };

  const toggleVencimientos = () => {
    setMostrarVencimientos(!mostrarVencimientos);
    const baseUrl = mostrarVencimientos
      ? `/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`
      : `/facet/asignatura-docente/proximos_a_vencer/?asignatura=${idAsignatura}`;
    setCurrentUrl(baseUrl);
  };

  const filtrarAsignaturaDocentes = () => {
    let baseUrl = mostrarVencimientos
      ? `/facet/asignatura-docente/proximos_a_vencer/?asignatura=${idAsignatura}`
      : `/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`;

    const params = new URLSearchParams();

    if (filtroNombre.trim())
      params.append("docente__persona__nombre__icontains", filtroNombre.trim());
    if (filtroApellido.trim())
      params.append(
        "docente__persona__apellido__icontains",
        filtroApellido.trim()
      );
    if (filtroDni.trim())
      params.append("docente__persona__dni__icontains", filtroDni.trim());
    if (filtroCargo) params.append("cargo", filtroCargo);
    if (filtroDedicacion) params.append("dedicacion", filtroDedicacion);
    if (filtroCondicion) params.append("condicion", filtroCondicion);

    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado && filtroEstado !== "todos") {
      params.append(
        "docente__persona__estado__icontains",
        filtroEstado.toString()
      );
    }

    const finalUrl = params.toString()
      ? `${baseUrl}&${params.toString()}`
      : baseUrl;
    setCurrentUrl(finalUrl);
  };

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroApellido("");
    setFiltroDni("");
    setFiltroCondicion("");
    setFiltroCargo("");
    setFiltroDedicacion("");
    setFiltroEstado("1");

    const baseUrl = mostrarVencimientos
      ? `/facet/asignatura-docente/proximos_a_vencer/?asignatura=${idAsignatura}`
      : `/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`;
    setCurrentUrl(baseUrl);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;

    let baseUrl = mostrarVencimientos
      ? `/facet/asignatura-docente/proximos_a_vencer/?asignatura=${idAsignatura}`
      : `/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`;

    const params = new URLSearchParams();

    if (filtroNombre.trim())
      params.append("docente__persona__nombre__icontains", filtroNombre.trim());
    if (filtroApellido.trim())
      params.append(
        "docente__persona__apellido__icontains",
        filtroApellido.trim()
      );
    if (filtroDni.trim())
      params.append("docente__persona__dni__icontains", filtroDni.trim());
    if (filtroCargo) params.append("cargo", filtroCargo);
    if (filtroDedicacion) params.append("dedicacion", filtroDedicacion);
    if (filtroCondicion) params.append("condicion", filtroCondicion);

    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado && filtroEstado !== "todos") {
      params.append(
        "docente__persona__estado__icontains",
        filtroEstado.toString()
      );
    }

    const offset = (newPage - 1) * pageSize;
    params.append("offset", offset.toString());
    params.append("limit", pageSize.toString());

    const finalUrl = `${baseUrl}&${params.toString()}`;
    setCurrentUrl(finalUrl);
  };

  const enviarNotificacion = async (id: number, email: string) => {
    try {
      const response = await API.post(`/facet/notificacion/`, {
        persona: id,
        mensaje: `Estimado/a docente, le recordamos que debe actualizar su documentación académica. Gracias.`,
      });

      if (response.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Notificación enviada",
          text: `Se ha enviado la notificación a ${email}`,
        });

        // Actualizar el estado local para marcar como notificado
        setAsignaturaDocentes((prev) =>
          prev.map((docente) =>
            docente.docente.persona.id === id
              ? { ...docente, notificado: true }
              : docente
          )
        );
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo enviar la notificación",
      });
    }
  };

  const confirmarReenvio = async (id: number, email: string) => {
    const result = await Swal.fire({
      title: "¿Reenviar notificación?",
      text: `¿Está seguro de reenviar la notificación a ${email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, reenviar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      await enviarNotificacion(id, email);
    }
  };

  const eliminarDocenteAsignatura = async (id: number) => {
    const result = await Swal.fire({
      title: "¿Eliminar asignación?",
      text: "¿Está seguro de eliminar esta asignación de docente? Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await API.delete(`/facet/asignatura-docente/${id}/`);

        Swal.fire({
          icon: "success",
          title: "Eliminado",
          text: "La asignación de docente ha sido eliminada exitosamente.",
        });

        // Recargar los datos
        if (currentUrl) {
          fetchData(currentUrl);
        }
      } catch (error) {
        console.error("Error al eliminar:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar la asignación. Por favor, intenta de nuevo.",
        });
      }
    }
  };

  const verDocente = async (docente: AsignaturaDocente) => {
    try {
      // Obtener datos completos incluyendo resolución
      const response = await API.get(
        `/facet/asignatura-docente/${docente.id}/`
      );
      const docenteCompleto = response.data;

      setDocenteSeleccionado(docenteCompleto);
      setModalDocenteVisible(true);
    } catch (error) {
      console.error("Error al obtener datos completos del docente:", error);
      // Fallback: usar los datos básicos si falla la llamada
      setDocenteSeleccionado(docente);
      setModalDocenteVisible(true);
    }
  };

  const cerrarModalDocente = () => {
    setModalDocenteVisible(false);
    setDocenteSeleccionado(null);
  };

  const descargarExcel = async () => {
    try {
      setIsDownloading(true);
      let allDocentes: AsignaturaDocente[] = [];
      let baseUrl = mostrarVencimientos
        ? `/facet/asignatura-docente/proximos_a_vencer/?asignatura=${idAsignatura}`
        : `/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`;

      const params = new URLSearchParams();

      if (filtroNombre.trim())
        params.append(
          "docente__persona__nombre__icontains",
          filtroNombre.trim()
        );
      if (filtroApellido.trim())
        params.append(
          "docente__persona__apellido__icontains",
          filtroApellido.trim()
        );
      if (filtroDni.trim())
        params.append("docente__persona__dni__icontains", filtroDni.trim());
      if (filtroCargo) params.append("cargo", filtroCargo);
      if (filtroDedicacion) params.append("dedicacion", filtroDedicacion);
      if (filtroCondicion) params.append("condicion", filtroCondicion);

      if (filtroEstado === "todos") {
        params.append("show_all", "true");
      } else if (filtroEstado && filtroEstado !== "todos") {
        params.append(
          "docente__persona__estado__icontains",
          filtroEstado.toString()
        );
      }

      let url: string | null = params.toString()
        ? `${baseUrl}&${params.toString()}`
        : baseUrl;

      // Obtener todos los datos para el Excel
      while (url) {
        const response: any = await API.get(url);

        // Verificar si la respuesta es un array directo o tiene paginación
        if (Array.isArray(response.data)) {
          // Respuesta es directamente un array
          allDocentes = [...allDocentes, ...response.data];
          url = null; // No hay paginación
        } else {
          // Respuesta tiene estructura de paginación
          const { results, next }: { results?: any[]; next?: string } =
            response.data;
          if (results && Array.isArray(results)) {
            allDocentes = [...allDocentes, ...results];
          }
          url = next ? normalizeUrl(next) : null;
        }
      }

      // Obtener datos completos de cada docente (incluyendo resolución)
      const docentesCompletos = await Promise.all(
        allDocentes.map(async (docente) => {
          try {
            const response = await API.get(
              `/facet/asignatura-docente/${docente.id}/`
            );
            return response.data;
          } catch (error) {
            console.error(
              "Error obteniendo datos completos del docente:",
              docente.id,
              error
            );
            return docente; // Usar datos básicos si falla
          }
        })
      );

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        docentesCompletos.map((docente) => {
          try {
            return {
              Nombre: docente.docente?.persona?.nombre || "N/A",
              Apellido: docente.docente?.persona?.apellido || "N/A",
              DNI: docente.docente?.persona?.dni || "N/A",
              Email: docente.docente?.persona?.email || "N/A",
              Condición: docente.condicion || "N/A",
              Cargo: docente.cargo || "N/A",
              Dedicación: docente.dedicacion || "N/A",
              "Nro Resolución": docente.resolucion?.nresolucion || "N/A",
              "Fecha de Inicio": docente.fecha_de_inicio
                ? dayjs(docente.fecha_de_inicio).format("DD/MM/YYYY")
                : "N/A",
              "Fecha de Vencimiento": docente.fecha_de_vencimiento
                ? dayjs(docente.fecha_de_vencimiento).format("DD/MM/YYYY")
                : "N/A",
              Estado: docente.estado == 1 ? "Activo" : "Inactivo",
              Notificado: docente.notificado ? "Sí" : "No",
            };
          } catch (error) {
            console.error("Error procesando docente:", docente, error);
            return {
              Nombre: "Error",
              Apellido: "Error",
              DNI: "Error",
              Email: "Error",
              Condición: "Error",
              Cargo: "Error",
              Dedicación: "Error",
              "Nro Resolución": "Error",
              "Fecha de Inicio": "Error",
              "Fecha de Vencimiento": "Error",
              Estado: "Error",
              Notificado: "Error",
            };
          }
        })
      );

      XLSX.utils.book_append_sheet(workbook, worksheet, "Docentes Asignatura");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = mostrarVencimientos
        ? `docentes-proximos-vencer-${asignaturaNombre || idAsignatura}.xlsx`
        : `docentes-asignatura-${asignaturaNombre || idAsignatura}.xlsx`;

      saveAs(excelBlob, fileName);

      // Simular un pequeño delay para mostrar el modal antes de cerrar
      setTimeout(() => {
        setIsDownloading(false);
      }, 1500);
    } catch (error) {
      setIsDownloading(false);
      console.error("Error completo al exportar:", error);
      Swal.fire({
        icon: "error",
        title: "Error al descargar",
        text: `Se produjo un error al exportar los datos: ${
          (error as Error).message || String(error)
        }`,
      });
    }
  };

  return (
    <DashboardMenu>
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/asignatura/list")}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <ArrowBackIcon />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Docentes de Asignatura
              </h1>
              {asignaturaNombre && (
                <p className="text-gray-600 mt-1">
                  Asignatura: {asignaturaNombre}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() =>
                router.push(
                  `/dashboard/asignatura/docenteAsignatura/${idAsignatura}/create`
                )
              }
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <AddIcon /> Agregar Docente
            </button>
            <button
              onClick={descargarExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <FileDownloadIcon /> Descargar Excel
            </button>
            <button
              onClick={toggleVencimientos}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                mostrarVencimientos
                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}>
              {mostrarVencimientos ? "Ver Todos" : "Próximos a Vencer"}
            </button>
          </div>

          <FilterContainer
            onApply={filtrarAsignaturaDocentes}
            onClear={limpiarFiltros}>
            <FilterInput
              label="Nombre"
              value={filtroNombre}
              onChange={setFiltroNombre}
              placeholder="Buscar por nombre"
            />
            <FilterInput
              label="Apellido"
              value={filtroApellido}
              onChange={setFiltroApellido}
              placeholder="Buscar por apellido"
            />
            <FilterInput
              label="DNI"
              value={filtroDni}
              onChange={setFiltroDni}
              placeholder="Buscar por DNI"
            />
            <FilterSelect
              label="Condición"
              value={filtroCondicion}
              onChange={(value) => setFiltroCondicion(value as Condicion | "")}
              options={[
                { value: "Regular", label: "Regular" },
                { value: "Interino", label: "Interino" },
                { value: "Transitorio", label: "Transitorio" },
                {
                  value: "Licencia sin goce de sueldo",
                  label: "Licencia sin goce de sueldo",
                },
                { value: "Renuncia", label: "Renuncia" },
                {
                  value: "Licencia con goce de sueldo",
                  label: "Licencia con goce de sueldo",
                },
              ]}
              placeholder="Seleccionar condición"
            />
            <FilterSelect
              label="Cargo"
              value={filtroCargo}
              onChange={(value) => setFiltroCargo(value as Cargo | "")}
              options={[
                { value: "Titular", label: "Titular" },
                { value: "Asociado", label: "Asociado" },
                { value: "Adjunto", label: "Adjunto" },
                { value: "Jtp", label: "JTP" },
                { value: "Adg", label: "ADG" },
                {
                  value: "Ayudante_estudiantil",
                  label: "Ayudante Estudiantil",
                },
              ]}
              placeholder="Seleccionar cargo"
            />
            <FilterSelect
              label="Dedicación"
              value={filtroDedicacion}
              onChange={(value) =>
                setFiltroDedicacion(value as Dedicacion | "")
              }
              options={[
                { value: "Exclusiva", label: "Exclusiva" },
                { value: "Media", label: "Media" },
                { value: "Simple", label: "Simple" },
              ]}
              placeholder="Seleccionar dedicación"
            />
            <EstadoFilter value={filtroEstado} onChange={setFiltroEstado} />
          </FilterContainer>

          <ResponsiveTable>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>DNI</TableCell>
                <TableCell>Condición</TableCell>
                <TableCell>Cargo</TableCell>
                <TableCell>Dedicación</TableCell>
                <TableCell>Fecha Inicio</TableCell>
                <TableCell>Fecha Vencimiento</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {asignaturaDocentes.length > 0 ? (
                asignaturaDocentes.map((docente) => (
                  <TableRow
                    key={docente.id}
                    className="hover:bg-gray-50 transition-colors duration-150">
                    <TableCell className="text-gray-800">
                      {docente.docente.persona.nombre}{" "}
                      {docente.docente.persona.apellido}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {docente.docente.persona.dni}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {docente.condicion}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {docente.cargo}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {docente.dedicacion}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {docente.fecha_de_inicio
                        ? dayjs(docente.fecha_de_inicio).format("DD/MM/YYYY")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {docente.fecha_de_vencimiento
                        ? dayjs(docente.fecha_de_vencimiento).format(
                            "DD/MM/YYYY"
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Tooltip title="Ver detalles">
                          <button
                            onClick={() => verDocente(docente)}
                            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                            <VisibilityIcon />
                          </button>
                        </Tooltip>

                        <Tooltip title="Editar">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/asignatura/docenteAsignatura/${idAsignatura}/edit/${docente.id}`
                              )
                            }
                            className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                            <EditIcon />
                          </button>
                        </Tooltip>

                        {docente.docente.persona.email && (
                          <Tooltip
                            title={
                              docente.notificado
                                ? "Notificación ya enviada. ¿Enviar de nuevo?"
                                : "Enviar Notificación"
                            }>
                            <button
                              onClick={() =>
                                docente.notificado
                                  ? confirmarReenvio(
                                      docente.docente.persona.id,
                                      docente.docente.persona.email!
                                    )
                                  : enviarNotificacion(
                                      docente.docente.persona.id,
                                      docente.docente.persona.email!
                                    )
                              }
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                docente.notificado
                                  ? "text-green-600 hover:text-green-800 hover:bg-green-100"
                                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                              }`}>
                              {docente.notificado ? (
                                <MarkEmailReadIcon />
                              ) : (
                                <EmailIcon />
                              )}
                            </button>
                          </Tooltip>
                        )}

                        <Tooltip title="Eliminar">
                          <button
                            onClick={() =>
                              eliminarDocenteAsignatura(docente.id)
                            }
                            className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-100 transition-colors duration-200">
                            <DeleteIcon />
                          </button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500">
                    No se encontraron registros
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </ResponsiveTable>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                currentPage > 1
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}>
              Anterior
            </button>
            <span className="text-gray-600 font-medium">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                currentPage < totalPages
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}>
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal para Ver Detalles del Docente */}
      {modalDocenteVisible && docenteSeleccionado && (
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
            onClick={cerrarModalDocente}></div>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto z-[10001] relative">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Detalles del Docente en Asignatura
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
                    Información Personal
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Nombre Completo
                      </label>
                      <p className="text-gray-900 font-medium">
                        {docenteSeleccionado.docente.persona.nombre}{" "}
                        {docenteSeleccionado.docente.persona.apellido}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        DNI
                      </label>
                      <p className="text-gray-900 font-medium">
                        {docenteSeleccionado.docente.persona.dni ||
                          "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Email
                      </label>
                      <p className="text-gray-900 font-medium">
                        {docenteSeleccionado.docente.persona.email ||
                          "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Estado
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          docenteSeleccionado.estado == 1
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {docenteSeleccionado.estado == 1
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información del Cargo */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
                    Información del Cargo
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Condición
                      </label>
                      <p className="text-gray-900 font-medium">
                        {docenteSeleccionado.condicion || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Cargo
                      </label>
                      <p className="text-gray-900 font-medium">
                        {docenteSeleccionado.cargo || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Dedicación
                      </label>
                      <p className="text-gray-900 font-medium">
                        {docenteSeleccionado.dedicacion || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Notificado
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          docenteSeleccionado.notificado
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {docenteSeleccionado.notificado ? "Sí" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de Resolución - Ancho completo */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                  Información de Resolución
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Nro Expediente
                      </label>
                      <p className="text-gray-900 font-medium">
                        {docenteSeleccionado.resolucion?.nexpediente ||
                          "No especificado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Nro Resolución
                      </label>
                      <p className="text-gray-900 font-medium">
                        {docenteSeleccionado.resolucion?.nresolucion ||
                          "No especificado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Tipo
                      </label>
                      <p className="text-gray-900 font-medium">
                        {docenteSeleccionado.resolucion?.tipo ||
                          "No especificado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Fecha Resolución
                      </label>
                      <p className="text-gray-900 font-medium">
                        {docenteSeleccionado.resolucion?.fecha
                          ? dayjs(docenteSeleccionado.resolucion.fecha).format(
                              "DD/MM/YYYY"
                            )
                          : "No especificado"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Período de Asignación - Ancho completo */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                  Período de Asignación
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Fecha de Inicio
                      </label>
                      <p className="text-gray-900 font-medium">
                        {docenteSeleccionado.fecha_de_inicio
                          ? dayjs(docenteSeleccionado.fecha_de_inicio).format(
                              "DD/MM/YYYY"
                            )
                          : "No especificado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Fecha de Vencimiento
                      </label>
                      <p className="text-gray-900 font-medium">
                        {docenteSeleccionado.fecha_de_vencimiento
                          ? dayjs(
                              docenteSeleccionado.fecha_de_vencimiento
                            ).format("DD/MM/YYYY")
                          : "No especificado"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={cerrarModalDocente}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200">
                Cerrar
              </button>
              <button
                onClick={() => {
                  cerrarModalDocente();
                  router.push(
                    `/dashboard/asignatura/docenteAsignatura/${idAsignatura}/edit/${docenteSeleccionado.id}`
                  );
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
            <h3 className="text-xl font-bold text-center mb-2">
              Descargando Excel
            </h3>
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

export default withAuth(ListaDocenteAsignatura);
