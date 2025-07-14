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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
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
    `${API_BASE_URL}/facet/users/?is_active=true`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await API.get(`${API_BASE_URL}/facet/roles/`);
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
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setTotalItems(response.data.count);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al obtener los datos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filtrarUsuarios = () => {
    let url = `${API_BASE_URL}/facet/users/?`;
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
    setCurrentUrl(`${API_BASE_URL}/facet/users/?is_active=true`);
  };

  const descargarExcel = async () => {
    try {
      let allUsuarios: Usuario[] = [];
      let url = `${API_BASE_URL}/facet/users/?`;
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
    } catch (error) {
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
        await API.patch(`${API_BASE_URL}/facet/users/${id}/`, {
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
        await API.patch(`${API_BASE_URL}/facet/users/${id}/`, {
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

  if (isLoading) {
    return (
      <DashboardMenu>
        <BasicModal
          open={true}
          onClose={() => {}}
          title="Cargando usuarios..."
          content="Por favor espere mientras se cargan los usuarios."
        />
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
            <TableContainer component={Paper} className="shadow-lg">
              <Table>
                <TableHead>
                  <TableRow className="bg-blue-500">
                    <TableCell
                      className="text-white font-semibold"
                      style={{ color: "#fff" }}>
                      Email
                    </TableCell>
                    <TableCell
                      className="text-white font-semibold"
                      style={{ color: "#fff" }}>
                      Nombre
                    </TableCell>
                    <TableCell
                      className="text-white font-semibold"
                      style={{ color: "#fff" }}>
                      Apellido
                    </TableCell>
                    <TableCell
                      className="text-white font-semibold"
                      style={{ color: "#fff" }}>
                      Legajo
                    </TableCell>
                    <TableCell
                      className="text-white font-semibold"
                      style={{ color: "#fff" }}>
                      Documento
                    </TableCell>
                    <TableCell
                      className="text-white font-semibold"
                      style={{ color: "#fff" }}>
                      Rol
                    </TableCell>
                    <TableCell
                      className="text-white font-semibold"
                      style={{ color: "#fff" }}>
                      Estado
                    </TableCell>
                    <TableCell
                      className="text-white font-semibold"
                      style={{ color: "#fff" }}>
                      Acciones
                    </TableCell>
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
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/usuarios/edit/${usuario.id}`
                              )
                            }
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors">
                            <EditIcon />
                          </button>
                          {usuario.is_active ? (
                            <button
                              onClick={() => eliminarUsuario(usuario.id)}
                              className="p-1 text-red-600 hover:text-red-800 transition-colors">
                              <DeleteIcon />
                            </button>
                          ) : (
                            <button
                              onClick={() => activarUsuario(usuario.id)}
                              className="p-1 text-green-600 hover:text-green-800 transition-colors">
                              <PersonIcon />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Mostrando {usuarios.length} de {totalItems} usuarios
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (prevUrl) {
                      setCurrentUrl(prevUrl);
                    }
                  }}
                  disabled={!prevUrl}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300">
                  Anterior
                </button>
                <button
                  onClick={() => {
                    if (nextUrl) {
                      setCurrentUrl(nextUrl);
                    }
                  }}
                  disabled={!nextUrl}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300">
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaUsuarios);
