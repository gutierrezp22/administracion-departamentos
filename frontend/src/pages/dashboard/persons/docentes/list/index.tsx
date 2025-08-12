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
import ResponsiveTable from "../../../../../components/ResponsiveTable";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import DashboardMenu from "../../..";
import withAuth from "../../../../../components/withAut";
import { API_BASE_URL } from "../../../../../utils/config";
import {
  FilterContainer,
  FilterInput,
  EstadoFilter,
} from "../../../../../components/Filters";

// Función para normalizar URLs de paginación
const normalizeUrl = (url: string) => {
  if (url.startsWith('http')) {
    // Extract path and query from full URL
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  }
  return url.replace(/^\/+/, "/");
};

const ListaDocentes = () => {
  interface Docente {
    id: number;
    persona: number;
    persona_detalle: {
      id: number;
      nombre: string;
      apellido: string;
      dni: string;
      legajo: string;
      telefono: string;
      email: string;
    };
    estado: string;
  }

  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroApellido, setFiltroApellido] = useState("");
  const [filtroDni, setFiltroDni] = useState("");
  const [filtroLegajo, setFiltroLegajo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `/facet/docente/?estado=1`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewDocente, setViewDocente] = useState<Docente | null>(null);
  const [modalViewVisible, setModalViewVisible] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await API.get(url);
      setDocentes(response.data.results);
      setNextUrl(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrl(
        response.data.previous ? normalizeUrl(response.data.previous) : null
      );
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

  const filtrarDocentes = () => {
    let url = `/facet/docente/?`;
    const params = new URLSearchParams();
    if (filtroNombre !== "") {
      params.append("persona__nombre__icontains", filtroNombre);
    }
    if (filtroDni !== "") {
      params.append("persona__dni__icontains", filtroDni);
    }
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado !== "" && filtroEstado !== "todos") {
      params.append("estado", filtroEstado.toString());
    }
    if (filtroApellido !== "") {
      params.append("persona__apellido__icontains", filtroApellido);
    }
    if (filtroLegajo !== "") {
      params.append("persona__legajo__icontains", filtroLegajo);
    }
    url += params.toString();
    setCurrentUrl(url);
  };

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroApellido("");
    setFiltroDni("");
    setFiltroLegajo("");
    setFiltroEstado("1");
    setCurrentUrl(`/facet/docente/?estado=1`);
  };

  const descargarExcel = async () => {
    try {
      let allDocentes: Docente[] = [];
      let url = `/facet/docente/?`;
      const params = new URLSearchParams();

      if (filtroNombre !== "")
        params.append("persona__nombre__icontains", filtroNombre);
      if (filtroApellido !== "")
        params.append("persona__apellido__icontains", filtroApellido);
      if (filtroDni !== "") params.append("persona__dni__icontains", filtroDni);
      if (filtroLegajo !== "")
        params.append("persona__legajo__icontains", filtroLegajo);
      if (filtroEstado === "todos") {
        params.append("show_all", "true");
      } else if (filtroEstado !== "" && filtroEstado !== "todos") {
        params.append("estado", filtroEstado.toString());
      }
      url += params.toString();

      while (url) {
        const response = await API.get(url);
        const { results, next } = response.data;
        allDocentes = [...allDocentes, ...results];
        url = next;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        allDocentes.map((docente) => ({
          Nombre: docente.persona_detalle?.nombre || "N/A",
          Apellido: docente.persona_detalle?.apellido || "N/A",
          DNI: docente.persona_detalle?.dni || "N/A",
          Legajo: docente.persona_detalle?.legajo || "N/A",
          Teléfono: docente.persona_detalle?.telefono || "N/A",
          Email: docente.persona_detalle?.email || "N/A",
          Estado: docente.estado === "1" ? "Activo" : "Inactivo",
        }))
      );

      XLSX.utils.book_append_sheet(workbook, worksheet, "Docentes");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(excelBlob, "docentes.xlsx");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al descargar",
        text: "Se produjo un error al exportar los datos.",
      });
    }
  };

  const verDocente = async (id: number) => {
    try {
      const response = await API.get(`/facet/docente/${id}/`);
      setViewDocente(response.data);
      setModalViewVisible(true);
    } catch (error) {
      Swal.fire(
        "Error!",
        "No se pudo obtener los datos del docente.",
        "error"
      );
    }
  };

  const eliminarDocente = async (id: number) => {
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
        await API.delete(`/facet/docente/${id}/`);
        Swal.fire("Eliminado!", "El docente ha sido eliminado.", "success");
        fetchData(currentUrl);
      }
    } catch (error) {
      Swal.fire("Error!", "No se pudo eliminar el docente.", "error");
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
              Cargando docentes...
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
          <h1 className="text-2xl font-bold text-gray-800">Docentes</h1>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => router.push("/dashboard/persons/docentes/create")}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <AddIcon /> Agregar Docente
            </button>
            <button
              onClick={descargarExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <FileDownloadIcon /> Descargar Excel
            </button>
          </div>

          <FilterContainer onApply={filtrarDocentes} onClear={limpiarFiltros}>
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
            <FilterInput
              label="Legajo"
              value={filtroLegajo}
              onChange={setFiltroLegajo}
              placeholder="Buscar por legajo"
            />
            <EstadoFilter value={filtroEstado} onChange={setFiltroEstado} />
          </FilterContainer>

          <ResponsiveTable>
            <TableHead>
              <TableRow>
                <TableCell>
                  Nombre
                </TableCell>
                <TableCell>
                  Apellido
                </TableCell>
                <TableCell>
                  DNI
                </TableCell>
                <TableCell>
                  Legajo
                </TableCell>
                <TableCell>
                  Teléfono
                </TableCell>
                <TableCell>
                  Email
                </TableCell>
                <TableCell>
                  Interno
                </TableCell>
                <TableCell>
                  Estado
                </TableCell>
                <TableCell>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
              <TableBody>
                {docentes.map((docente) => (
                  <TableRow key={docente.id} className="hover:bg-gray-50">
                    <TableCell
                      className="text-gray-800"
                      style={{ color: "#1f2937" }}>
                      {docente.persona_detalle?.nombre || "N/A"}
                    </TableCell>
                    <TableCell
                      className="text-gray-800"
                      style={{ color: "#1f2937" }}>
                      {docente.persona_detalle?.apellido || "N/A"}
                    </TableCell>
                    <TableCell
                      className="text-gray-800"
                      style={{ color: "#1f2937" }}>
                      {docente.persona_detalle?.dni || "N/A"}
                    </TableCell>
                    <TableCell
                      className="text-gray-800"
                      style={{ color: "#1f2937" }}>
                      {docente.persona_detalle?.legajo || "N/A"}
                    </TableCell>
                    <TableCell
                      className="text-gray-800"
                      style={{ color: "#1f2937" }}>
                      {docente.persona_detalle?.telefono || "N/A"}
                    </TableCell>
                    <TableCell
                      className="text-gray-800"
                      style={{ color: "#1f2937" }}>
                      {docente.persona_detalle?.email || "N/A"}
                    </TableCell>
                    <TableCell
                      className="text-gray-800"
                      style={{ color: "#1f2937" }}>
                      N/A
                    </TableCell>
                    <TableCell
                      className="text-gray-800"
                      style={{ color: "#1f2937" }}>
                      {docente.estado === "1" ? "Activo" : "Inactivo"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => verDocente(docente.id)}
                          className="p-2 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-100 transition-colors duration-200"
                          title="Ver detalles">
                          <VisibilityIcon />
                        </button>
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/persons/docentes/edit/${docente.id}`
                            )
                          }
                          className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                          title="Editar">
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => eliminarDocente(docente.id)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-100 transition-colors duration-200"
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
              onClick={() => {
                prevUrl && setCurrentUrl(prevUrl);
                setCurrentPage(currentPage - 1);
              }}
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
              onClick={() => {
                nextUrl && setCurrentUrl(nextUrl);
                setCurrentPage(currentPage + 1);
              }}
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

      {/* Modal de vista de docente */}
      {modalViewVisible && viewDocente && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[10000]"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setModalViewVisible(false)}
          ></div>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto z-[10001] relative">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Detalles del Docente
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
                        DNI
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewDocente.persona_detalle?.dni || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Legajo
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewDocente.persona_detalle?.legajo || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Nombres
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewDocente.persona_detalle?.nombre || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Apellido
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewDocente.persona_detalle?.apellido || "No especificado"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
                    Información de Contacto
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Teléfono
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewDocente.persona_detalle?.telefono || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Email
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewDocente.persona_detalle?.email || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Estado
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          viewDocente.estado === "1"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {viewDocente.estado === "1" ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setModalViewVisible(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setModalViewVisible(false);
                  router.push(`/dashboard/persons/docentes/edit/${viewDocente.id}`);
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardMenu>
  );
};

export default withAuth(ListaDocentes);
