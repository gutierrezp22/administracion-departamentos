import { useEffect, useState } from "react";
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
  Chip,
} from "@mui/material";
import ResponsiveTable from "../../../../components/ResponsiveTable";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
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
  EstadoFilter,
} from "../../../../components/Filters";
import { FilterSelect } from "../../../../components/Filters";
import BasicModal from "../../../../utils/modal";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Función para normalizar URLs de paginación
const normalizeUrl = (url: string) => {
  return url.replace(window.location.origin, "").replace(/^\/+/, "/");
};

// Configurar dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Función para formatear fechas
const formatearFecha = (fecha: string | null) => {
  if (!fecha) return "No disponible";
  
  try {
    const fechaStr = String(fecha).trim();
    
    // Detectar si es formato DD/MM/YYYY HH:mm:ss (formato español)
    const formatoEspanol = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    const match = fechaStr.match(formatoEspanol);
    
    if (match) {
      const [, dia, mes, anio, hora, minuto, segundo] = match;
      // Convertir a formato ISO: YYYY-MM-DD HH:mm:ss
      const fechaISO = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')} ${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}:${segundo.padStart(2, '0')}`;
      
      const fechaParseada = dayjs(fechaISO);
      if (fechaParseada.isValid()) {
        return fechaParseada.format("DD/MM/YYYY HH:mm");
      }
    }
    
    // Si no es formato español, intentar parseo directo con dayjs
    const fechaParseada = dayjs(fechaStr);
    if (fechaParseada.isValid()) {
      return fechaParseada.format("DD/MM/YYYY HH:mm");
    }
    
    // Fallback: intentar con Date nativo
    const nativeDate = new Date(fechaStr);
    if (!isNaN(nativeDate.getTime())) {
      return dayjs(nativeDate).format("DD/MM/YYYY HH:mm");
    }
    
    return "Fecha inválida";
  } catch (error) {
    console.error("Error al formatear fecha:", fecha, error);
    return "Error en fecha";
  }
};

const ListaUsuarios = () => {
  interface Usuario {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    legajo: number;
    documento: number;
    rol: number;
    rol_detalle: string;
    is_active: boolean;
    date_joined: string;
    last_login: string;
    has_changed_password: boolean;
  }
  interface Rol {
    id: number;
    descripcion: string;
  }

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [filtroEmail, setFiltroEmail] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroApellido, setFiltroApellido] = useState("");
  const [filtroLegajo, setFiltroLegajo] = useState("");
  const [filtroDocumento, setFiltroDocumento] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `/facet/users/?is_active=true`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewUsuario, setViewUsuario] = useState<Usuario | null>(null);
  const [modalViewVisible, setModalViewVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await API.get(`/facet/roles/`);
      setRoles(
        Array.isArray(response.data) ? response.data : response.data.results
      );
    } catch (error) {
      console.error("Error al cargar roles:", error);
    }
  };

  const fetchData = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await API.get(url);
      setUsuarios(response.data.results);
      setNextUrl(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrl(response.data.previous ? normalizeUrl(response.data.previous) : null);
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

  const filtrarUsuarios = () => {
    let url = `/facet/users/?`;
    const params = new URLSearchParams();

    if (filtroEmail !== "") {
      params.append("email__icontains", filtroEmail);
    }
    if (filtroNombre !== "") {
      params.append("nombre__icontains", filtroNombre);
    }
    if (filtroApellido !== "") {
      params.append("apellido__icontains", filtroApellido);
    }
    if (filtroLegajo !== "") {
      params.append("legajo__icontains", filtroLegajo);
    }
    if (filtroDocumento !== "") {
      params.append("documento__icontains", filtroDocumento);
    }
    if (filtroRol !== "") {
      params.append("rol", filtroRol);
    }
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado !== "" && filtroEstado !== "todos") {
      params.append("is_active", filtroEstado === "1" ? "true" : "false");
    }

    params.append("page", "1");
    url += params.toString();
    setCurrentPage(1);
    setCurrentUrl(url);
  };

  const limpiarFiltros = () => {
    setFiltroEmail("");
    setFiltroNombre("");
    setFiltroApellido("");
    setFiltroLegajo("");
    setFiltroDocumento("");
    setFiltroRol("");
    setFiltroEstado("1");
    setCurrentUrl(`/facet/users/?is_active=true`);
  };

  const handlePageChange = (newPage: number) => {
    let url = `/facet/users/?`;
    const params = new URLSearchParams();

    if (filtroEmail !== "") {
      params.append("email__icontains", filtroEmail);
    }
    if (filtroNombre !== "") {
      params.append("nombre__icontains", filtroNombre);
    }
    if (filtroApellido !== "") {
      params.append("apellido__icontains", filtroApellido);
    }
    if (filtroLegajo !== "") {
      params.append("legajo__icontains", filtroLegajo);
    }
    if (filtroDocumento !== "") {
      params.append("documento__icontains", filtroDocumento);
    }
    if (filtroRol !== "") {
      params.append("rol", filtroRol);
    }
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado !== "" && filtroEstado !== "todos") {
      params.append("is_active", filtroEstado === "1" ? "true" : "false");
    }

    params.append("page", newPage.toString());
    url += params.toString();

    setCurrentPage(newPage);
    setCurrentUrl(url);
  };

  const verUsuario = async (id: number) => {
    try {
      const response = await API.get(`/facet/users/${id}/`);
      setViewUsuario(response.data);
      setModalViewVisible(true);
    } catch (error) {
      Swal.fire(
        "Error!",
        "No se pudo obtener los datos del usuario.",
        "error"
      );
    }
  };

  const descargarExcel = async () => {
    try {
      setIsDownloading(true);
      let allUsuarios: Usuario[] = [];
      let url = `/facet/users/?`;
      const params = new URLSearchParams();

      if (filtroEmail !== "") params.append("email__icontains", filtroEmail);
      if (filtroNombre !== "") params.append("nombre__icontains", filtroNombre);
      if (filtroApellido !== "")
        params.append("apellido__icontains", filtroApellido);
      if (filtroLegajo !== "") params.append("legajo__icontains", filtroLegajo);
      if (filtroDocumento !== "")
        params.append("documento__icontains", filtroDocumento);
      if (filtroRol !== "") params.append("rol_detalle__icontains", filtroRol);
      if (filtroEstado === "todos") {
        params.append("show_all", "true");
      } else if (filtroEstado !== "" && filtroEstado !== "todos") {
        params.append("is_active", filtroEstado === "1" ? "true" : "false");
      }

      url += params.toString();

      while (url) {
        const response = await API.get(url);
        const { results, next } = response.data;
        allUsuarios = [...allUsuarios, ...results];
        url = next;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        allUsuarios.map((usuario) => ({
          Email: usuario.email,
          Nombre: usuario.nombre,
          Apellido: usuario.apellido,
          Legajo: usuario.legajo,
          Documento: usuario.documento,
          Rol: usuario.rol_detalle,
          Estado: usuario.is_active ? "Activo" : "Inactivo",
          "Fecha de Registro": new Date(
            usuario.date_joined
          ).toLocaleDateString(),
          "Último Login": usuario.last_login
            ? new Date(usuario.last_login).toLocaleDateString()
            : "Nunca",
          "Cambió Contraseña": usuario.has_changed_password ? "Sí" : "No",
        }))
      );

      XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(excelBlob, "usuarios.xlsx");
      
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

  const eliminarUsuario = async (id: number) => {
    try {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción desactivará el usuario del sistema",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, desactivar",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        await API.patch(`/facet/users/${id}/`, {
          is_active: false,
        });
        Swal.fire("Desactivado!", "El usuario ha sido desactivado.", "success");
        fetchData(currentUrl);
      }
    } catch (error) {
      Swal.fire("Error!", "No se pudo desactivar el usuario.", "error");
    }
  };

  const activarUsuario = async (id: number) => {
    try {
      const result = await Swal.fire({
        title: "¿Activar usuario?",
        text: "¿Deseas activar este usuario en el sistema?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, activar",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        await API.patch(`/facet/users/${id}/`, {
          is_active: true,
        });
        Swal.fire("Activado!", "El usuario ha sido activado.", "success");
        fetchData(currentUrl);
      }
    } catch (error) {
      Swal.fire("Error!", "No se pudo activar el usuario.", "error");
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
              Cargando usuarios...
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
          <h1 className="text-2xl font-bold text-gray-800">
            Usuarios del Sistema
          </h1>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => router.push("/dashboard/usuarios/create")}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <AddIcon /> Agregar Usuario
            </button>
            <button
              onClick={descargarExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <FileDownloadIcon /> Descargar Excel
            </button>
          </div>

          <FilterContainer onApply={filtrarUsuarios} onClear={limpiarFiltros}>
            <FilterInput
              label="Email"
              value={filtroEmail}
              onChange={setFiltroEmail}
              placeholder="Buscar por email"
            />
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
              label="Legajo"
              value={filtroLegajo}
              onChange={setFiltroLegajo}
              placeholder="Buscar por legajo"
            />
            <FilterInput
              label="Documento"
              value={filtroDocumento}
              onChange={setFiltroDocumento}
              placeholder="Buscar por documento"
            />
            {/* Filtro de rol como selector por ID */}
            <FilterSelect
              label="Rol"
              value={filtroRol}
              onChange={setFiltroRol}
              options={roles.map((rol) => ({
                value: String(rol.id),
                label: rol.descripcion,
              }))}
              placeholder="Todos"
            />
            <EstadoFilter value={filtroEstado} onChange={setFiltroEstado} />
          </FilterContainer>

          <div className="mt-6">
            <ResponsiveTable className="shadow-lg">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Apellido</TableCell>
                  <TableCell>Legajo</TableCell>
                  <TableCell>Documento</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id} className="hover:bg-gray-50">
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>{usuario.nombre}</TableCell>
                    <TableCell>{usuario.apellido}</TableCell>
                    <TableCell>{usuario.legajo}</TableCell>
                    <TableCell>{usuario.documento}</TableCell>
                    <TableCell>
                      <Chip
                        label={usuario.rol_detalle || "Sin rol"}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={usuario.is_active ? "Activo" : "Inactivo"}
                        color={usuario.is_active ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Tooltip title="Ver detalles">
                          <button
                            onClick={() => verUsuario(usuario.id)}
                            className="p-2 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-100 transition-colors duration-200">
                            <VisibilityIcon />
                          </button>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/usuarios/edit/${usuario.id}`
                              )
                            }
                            className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                            <EditIcon />
                          </button>
                        </Tooltip>
                        {usuario.is_active ? (
                          <Tooltip title="Desactivar">
                            <button
                              onClick={() => eliminarUsuario(usuario.id)}
                              className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-100 transition-colors duration-200">
                              <DeleteIcon />
                            </button>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Activar">
                            <button
                              onClick={() => activarUsuario(usuario.id)}
                              className="p-2 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-100 transition-colors duration-200">
                              <PersonIcon />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ResponsiveTable>

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
      </div>

      {/* Modal de vista de usuario */}
      {modalViewVisible && viewUsuario && (
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
                Detalles del Usuario
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
                        Email
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewUsuario.email || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Nombre
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewUsuario.nombre || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Apellido
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewUsuario.apellido || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Legajo
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewUsuario.legajo || "No especificado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Documento
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewUsuario.documento || "No especificado"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información del Sistema */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
                    Información del Sistema
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Rol
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewUsuario.rol_detalle || "Sin rol asignado"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Estado
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          viewUsuario.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {viewUsuario.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Fecha de Registro
                      </label>
                      <p className="text-gray-900 font-medium">
                        {formatearFecha(viewUsuario.date_joined)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Último Login
                      </label>
                      <p className="text-gray-900 font-medium">
                        {viewUsuario.last_login ? formatearFecha(viewUsuario.last_login) : "Nunca"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Cambió Contraseña
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          viewUsuario.has_changed_password
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {viewUsuario.has_changed_password ? "Sí" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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
                  router.push(`/dashboard/usuarios/edit/${viewUsuario.id}`);
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

export default withAuth(ListaUsuarios);
