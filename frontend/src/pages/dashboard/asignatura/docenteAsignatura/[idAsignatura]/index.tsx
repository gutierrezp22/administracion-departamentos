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
  Tooltip,
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

const ListaDocenteAsignatura: React.FC = () => {
  const router = useRouter();
  const { idAsignatura } = router.query;
  const pageSize = 10;

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

  useEffect(() => {
    if (idAsignatura) {
      // Cargar información de la asignatura
      fetchAsignaturaInfo();
      const initialUrl = `${API_BASE_URL}/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`;
      setCurrentUrl(initialUrl);
    }
  }, [idAsignatura]);

  useEffect(() => {
    if (currentUrl) {
      fetchData(currentUrl);
    }
  }, [currentUrl]);

  const fetchAsignaturaInfo = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/facet/asignatura/${idAsignatura}/`
      );
      setAsignaturaNombre(response.data.nombre);
    } catch (error) {
      console.error("Error fetching asignatura:", error);
    }
  };

  const fetchData = async (url: string) => {
    try {
      const response = await axios.get(url);
      const data = response.data;

      setAsignaturaDocentes(data.results || data);
      setPrevUrl(data.previous || null);
      setNextUrl(data.next || null);
      setTotalItems(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / pageSize));

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
      ? `${API_BASE_URL}/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`
      : `${API_BASE_URL}/facet/asignatura-docente/proximos_a_vencer/?asignatura=${idAsignatura}`;
    setCurrentUrl(baseUrl);
  };

  const filtrarAsignaturaDocentes = () => {
    let baseUrl = mostrarVencimientos
      ? `${API_BASE_URL}/facet/asignatura-docente/proximos_a_vencer/?asignatura=${idAsignatura}`
      : `${API_BASE_URL}/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`;

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
      ? `${API_BASE_URL}/facet/asignatura-docente/proximos_a_vencer/?asignatura=${idAsignatura}`
      : `${API_BASE_URL}/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`;
    setCurrentUrl(baseUrl);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;

    let baseUrl = mostrarVencimientos
      ? `${API_BASE_URL}/facet/asignatura-docente/proximos_a_vencer/?asignatura=${idAsignatura}`
      : `${API_BASE_URL}/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`;

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
      const response = await axios.post(`${API_BASE_URL}/facet/notificacion/`, {
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

  const descargarExcel = async () => {
    try {
      let allDocentes: AsignaturaDocente[] = [];
      let baseUrl = mostrarVencimientos
        ? `${API_BASE_URL}/facet/asignatura-docente/proximos_a_vencer/?asignatura=${idAsignatura}`
        : `${API_BASE_URL}/facet/asignatura-docente/list_detalle/?asignatura=${idAsignatura}`;

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

      let url = params.toString() ? `${baseUrl}&${params.toString()}` : baseUrl;

      // Obtener todos los datos para el Excel
      while (url) {
        const response = await axios.get(url);
        const { results, next } = response.data;
        allDocentes = [...allDocentes, ...results];
        url = next;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        allDocentes.map((docente) => ({
          Nombre: docente.docente.persona.nombre,
          Apellido: docente.docente.persona.apellido,
          DNI: docente.docente.persona.dni,
          Email: docente.docente.persona.email || "N/A",
          Condición: docente.condicion,
          Cargo: docente.cargo,
          Dedicación: docente.dedicacion,
          "Fecha de Inicio": docente.fecha_de_inicio
            ? dayjs(docente.fecha_de_inicio).format("DD/MM/YYYY")
            : "N/A",
          "Fecha de Vencimiento": docente.fecha_de_vencimiento
            ? dayjs(docente.fecha_de_vencimiento).format("DD/MM/YYYY")
            : "N/A",
          Estado: docente.estado === 1 ? "Activo" : "Inactivo",
          Notificado: docente.notificado ? "Sí" : "No",
        }))
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
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al descargar",
        text: "Se produjo un error al exportar los datos.",
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

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHead>
                <TableRow className="bg-blue-500">
                  <TableCell className="text-white font-semibold">
                    Nombre
                  </TableCell>
                  <TableCell className="text-white font-semibold">
                    DNI
                  </TableCell>
                  <TableCell className="text-white font-semibold">
                    Condición
                  </TableCell>
                  <TableCell className="text-white font-semibold">
                    Cargo
                  </TableCell>
                  <TableCell className="text-white font-semibold">
                    Dedicación
                  </TableCell>
                  <TableCell className="text-white font-semibold">
                    Fecha Inicio
                  </TableCell>
                  <TableCell className="text-white font-semibold">
                    Fecha Vencimiento
                  </TableCell>
                  <TableCell className="text-white font-semibold">
                    Acciones
                  </TableCell>
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
            </Table>
          </div>

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
              Página {currentPage} de {totalPages} ({totalItems} registros)
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
    </DashboardMenu>
  );
};

export default withAuth(ListaDocenteAsignatura);
