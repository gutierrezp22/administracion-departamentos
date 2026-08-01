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
import ActionMenu from "../../../../components/ActionMenu";
import LoadingOverlay from "@/components/LoadingOverlay";
import Pagination from "@/components/Pagination";
import DetailModal, { StatusBadge } from "@/components/DetailModal";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Tooltip from "@mui/material/Tooltip";
import { exportToExcel } from "@/utils/exportToExcel";
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
import { normalizeUrl } from "@/utils/urlHelpers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

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
      // Derivar página actual desde offset/limit (LimitOffsetPagination)
      const queryParams = new URLSearchParams(url.split("?")[1] || "");
      const limit = parseInt(queryParams.get("limit") || "", 10) || pageSize;
      const offset = parseInt(queryParams.get("offset") || "0", 10);
      setPageSize(limit);
      setCurrentPage(Math.floor(offset / limit) + 1);
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

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    fetchRoles();
  }, []);

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
    setCurrentPage(1);
    setCurrentUrl(`/facet/users/?is_active=true`);
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
      if (filtroRol !== "") params.append("rol", filtroRol);
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
        url = next ? normalizeUrl(next) : "";
      }

      await exportToExcel({
        fileName: "usuarios.xlsx",
        sheetName: "Usuarios",
        rows: allUsuarios.map((usuario) => ({
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

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">
              Usuarios
            </h1>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={() => router.push("/dashboard/usuarios/create")}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-semibold text-sm">
                <AddIcon /> Agregar Usuario
              </button>
              <button
                onClick={descargarExcel}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 font-semibold text-sm">
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

            <div className="mt-6 relative">
              {isLoading && <LoadingOverlay variant="overlay" message="Cargando..." />}
              <ResponsiveTable dense className="shadow-lg">
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
                        <StatusBadge estado={usuario.is_active ? "1" : "0"} />
                      </TableCell>
                      <TableCell>
                        <ActionMenu
                          items={[
                            {
                              items: [
                                {
                                  label: "Ver detalles",
                                  icon: <VisibilityIcon fontSize="small" />,
                                  onClick: () => verUsuario(usuario.id),
                                },
                                {
                                  label: "Editar",
                                  icon: <EditIcon fontSize="small" />,
                                  onClick: () =>
                                    router.push(`/dashboard/usuarios/edit/${usuario.id}`),
                                },
                              ],
                            },
                            {
                              items: usuario.is_active
                                ? [
                                    {
                                      label: "Desactivar",
                                      icon: <DeleteIcon fontSize="small" />,
                                      onClick: () => eliminarUsuario(usuario.id),
                                      danger: true,
                                    },
                                  ]
                                : [
                                    {
                                      label: "Activar",
                                      icon: <PersonIcon fontSize="small" />,
                                      onClick: () => activarUsuario(usuario.id),
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
              onPrevious={() => {
                if (prevUrl) {
                  setCurrentUrl(prevUrl);
                }
              }}
              onNext={() => {
                if (nextUrl) {
                  setCurrentUrl(nextUrl);
                }
              }}
              hasPrevious={!!prevUrl}
              hasNext={!!nextUrl}
            />
          </div>
        </div>
      </div>

      {/* Modal de vista de usuario */}
      {viewUsuario && (
        <DetailModal
          open={modalViewVisible}
          onClose={() => setModalViewVisible(false)}
          onEdit={() => {
            setModalViewVisible(false);
            router.push(`/dashboard/usuarios/edit/${viewUsuario.id}`);
          }}
          title="Detalles del Usuario"
          sections={[
            {
              title: "Información Personal",
              fields: [
                { label: "Email", value: viewUsuario.email },
                { label: "Nombre", value: viewUsuario.nombre },
                { label: "Apellido", value: viewUsuario.apellido },
                { label: "Legajo", value: viewUsuario.legajo },
                { label: "Documento", value: viewUsuario.documento },
              ],
            },
            {
              title: "Información del Sistema",
              fields: [
                {
                  label: "Rol",
                  value: viewUsuario.rol_detalle || "Sin rol asignado",
                },
                {
                  label: "Estado",
                  value: (
                    <StatusBadge estado={viewUsuario.is_active ? "1" : "0"} />
                  ),
                },
                {
                  label: "Fecha de Registro",
                  value: formatearFecha(viewUsuario.date_joined),
                },
                {
                  label: "Último Login",
                  value: viewUsuario.last_login
                    ? formatearFecha(viewUsuario.last_login)
                    : "Nunca",
                },
                {
                  label: "Cambió Contraseña",
                  value: viewUsuario.has_changed_password ? "Sí" : "No",
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

export default withAuth(ListaUsuarios);
