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
import ActionMenu from "../../../../components/ActionMenu";
import LoadingOverlay from "@/components/LoadingOverlay";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import VisibilityIcon from "@mui/icons-material/Visibility";
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
import Pagination from "@/components/Pagination";
import DetailModal, { StatusBadge } from "@/components/DetailModal";
import { normalizeUrl } from "@/utils/urlHelpers";

const ListaPersonas = () => {
  interface Persona {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    legajo: string;
    telefono: string;
    email: string;
    interno: string;
    estado: string;
    titulo: string | number | null;
    fecha_nacimiento: string | null;
  }

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroApellido, setFiltroApellido] = useState("");
  const [filtroDni, setFiltroDni] = useState("");
  const [filtroLegajo, setFiltroLegajo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [viewPersona, setViewPersona] = useState<Persona | null>(null);
  const [modalViewVisible, setModalViewVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [titulos, setTitulos] = useState<{ id: number; nombre: string }[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `/facet/persona/?estado=1`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const router = useRouter();

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    const fetchTitulos = async () => {
      try {
        // Traer todos los títulos (LimitOffsetPagination por defecto)
        const response = await API.get(`/facet/tipo-titulo/?limit=1000`);
        setTitulos(
          Array.isArray(response.data)
            ? response.data
            : response.data.results || []
        );
      } catch (error) {
        console.error("Error al obtener títulos:", error);
      }
    };

    fetchTitulos();
  }, []);

  const fetchData = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await API.get(url);
      setPersonas(response.data.results);
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

  const filtrarPersonas = () => {
    let url = `/facet/persona/?`;
    const params = new URLSearchParams();
    if (filtroNombre !== "") {
      params.append("nombre__icontains", filtroNombre);
    }
    if (filtroDni !== "") {
      params.append("dni__icontains", filtroDni);
    }
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado !== "" && filtroEstado !== "todos") {
      params.append("estado", filtroEstado.toString());
    }
    if (filtroApellido !== "") {
      params.append("apellido__icontains", filtroApellido);
    }
    if (filtroLegajo !== "") {
      params.append("legajo__icontains", filtroLegajo);
    }
    url += params.toString();
    setCurrentPage(1);
    setCurrentUrl(url);
  };

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroApellido("");
    setFiltroDni("");
    setFiltroLegajo("");
    setFiltroEstado("1");
    setCurrentPage(1);
    setCurrentUrl(`/facet/persona/?estado=1`);
  };

  const descargarExcel = async () => {
    try {
      setIsDownloading(true);
      let allPersonas: Persona[] = [];
      let url = `/facet/persona/?`;
      const params = new URLSearchParams();

      if (filtroNombre !== "") params.append("nombre__icontains", filtroNombre);
      if (filtroApellido !== "")
        params.append("apellido__icontains", filtroApellido);
      if (filtroDni !== "") params.append("dni__icontains", filtroDni);
      if (filtroLegajo !== "") params.append("legajo__icontains", filtroLegajo);
      if (filtroEstado === "todos") {
        params.append("show_all", "true");
      } else if (filtroEstado !== "" && filtroEstado !== "todos") {
        params.append("estado", filtroEstado.toString());
      }
      url += params.toString();

      while (url) {
        const response = await API.get(url);
        const { results, next } = response.data;
        allPersonas = [...allPersonas, ...results];
        url = next ? normalizeUrl(next) : "";
      }

      await exportToExcel({
        fileName: "personas.xlsx",
        sheetName: "Personas",
        rows: allPersonas.map((persona) => ({
          Nombre: persona.nombre,
          Apellido: persona.apellido,
          DNI: persona.dni,
          Legajo: persona.legajo,
          Teléfono: persona.telefono,
          Email: persona.email,
          Interno: persona.interno,
          Título: obtenerNombreTitulo(persona.titulo),
          "Fecha de Nacimiento": formatearFecha(persona.fecha_nacimiento),
          Estado: persona.estado === "1" ? "Activo" : "Inactivo",
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

  const verPersona = async (id: number) => {
    try {
      const response = await API.get(`/facet/persona/${id}/`);
      setViewPersona(response.data);
      setModalViewVisible(true);
    } catch (error) {
      Swal.fire(
        "Error!",
        "No se pudo obtener los datos de la persona.",
        "error"
      );
    }
  };

  const eliminarPersona = async (id: number) => {
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
        await API.delete(`/facet/persona/${id}/`);
        Swal.fire("Eliminado!", "La persona ha sido eliminada.", "success");
        fetchData(currentUrl);
      }
    } catch (error) {
      Swal.fire("Error!", "No se pudo eliminar la persona.", "error");
    }
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return "No especificada";

    try {
      // Si la fecha ya está en formato DD/MM/YYYY, la devolvemos tal como está
      if (fecha.includes("/")) {
        return fecha;
      }

      // Si la fecha está en formato YYYY-MM-DD, la convertimos
      if (fecha.includes("-")) {
        const parts = fecha.split("-");
        if (parts.length === 3) {
          const [year, month, day] = parts;
          return `${day}/${month}/${year}`;
        }
      }

      return "Fecha inválida";
    } catch (error) {
      console.error("Error al formatear fecha:", fecha, error);
      return "Fecha inválida";
    }
  };

  const obtenerNombreTitulo = (titulo: string | number | null) => {
    if (!titulo) return "Sin título";

    // Si es un string, puede ser el nombre del título (de la lista) o un ID
    if (typeof titulo === "string") {
      // Si es un número (ID), buscar en la lista de títulos
      if (!isNaN(parseInt(titulo))) {
        const tituloObj = titulos.find((t) => t.id === parseInt(titulo));
        return tituloObj ? tituloObj.nombre : "Sin título";
      }
      // Si no es un número, asumir que es el nombre del título
      return titulo;
    }

    // Si es un número, buscar en la lista de títulos
    if (typeof titulo === "number") {
      const tituloObj = titulos.find((t) => t.id === titulo);
      return tituloObj ? tituloObj.nombre : "Sin título";
    }

    return "Sin título";
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
      <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Personas</h1>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => router.push("/dashboard/persons/create")}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-semibold text-sm">
              <AddIcon /> Agregar Persona
            </button>
            <button
              onClick={() => router.push("/dashboard/persons/docentes")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <PeopleIcon /> Docentes
            </button>
            <button
              onClick={() => router.push("/dashboard/persons/jefes")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <PeopleIcon /> Jefes
            </button>
            <button
              onClick={() => router.push("/dashboard/persons/noDocentes")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <PeopleIcon /> No Docentes
            </button>
            <button
              onClick={descargarExcel}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 font-semibold text-sm">
              <FileDownloadIcon /> Descargar Excel
            </button>
          </div>

          <FilterContainer onApply={filtrarPersonas} onClear={limpiarFiltros}>
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

          <div className="relative">

            {isLoading && <LoadingOverlay variant="overlay" message="Cargando..." />}

            <ResponsiveTable dense>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Apellido</TableCell>
                <TableCell>DNI</TableCell>
                <TableCell>Legajo</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Interno</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Fecha de Nacimiento</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {personas.map((persona) => (
                <TableRow key={persona.id} className="hover:bg-gray-50">
                  <TableCell className="text-gray-800">
                    {persona.nombre}
                  </TableCell>
                  <TableCell className="text-gray-800">
                    {persona.apellido}
                  </TableCell>
                  <TableCell className="text-gray-800">
                    {persona.dni}
                  </TableCell>
                  <TableCell className="text-gray-800">
                    {persona.legajo}
                  </TableCell>
                  <TableCell className="text-gray-800">
                    {persona.telefono}
                  </TableCell>
                  <TableCell className="text-gray-800">
                    {persona.email}
                  </TableCell>
                  <TableCell className="text-gray-800">
                    {persona.interno}
                  </TableCell>
                  <TableCell className="text-gray-800">
                    {obtenerNombreTitulo(persona.titulo)}
                  </TableCell>
                  <TableCell className="text-gray-800">
                    {formatearFecha(persona.fecha_nacimiento)}
                  </TableCell>
                  <TableCell className="text-gray-800">
                    <StatusBadge estado={String(persona.estado)} />
                  </TableCell>
                  <TableCell>
                    <ActionMenu
                      items={[
                        {
                          items: [
                            {
                              label: "Ver detalles",
                              icon: <VisibilityIcon fontSize="small" />,
                              onClick: () => verPersona(persona.id),
                            },
                            {
                              label: "Editar",
                              icon: <EditIcon fontSize="small" />,
                              onClick: () =>
                                router.push(`/dashboard/persons/edit/${persona.id}`),
                            },
                          ],
                        },
                        {
                          items: [
                            {
                              label: "Eliminar",
                              icon: <DeleteIcon fontSize="small" />,
                              onClick: () => eliminarPersona(persona.id),
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
            onPrevious={() => {
              if (prevUrl) {
                setCurrentUrl(prevUrl);
                setCurrentPage(currentPage - 1);
              }
            }}
            onNext={() => {
              if (nextUrl) {
                setCurrentUrl(nextUrl);
                setCurrentPage(currentPage + 1);
              }
            }}
            hasPrevious={!!prevUrl}
            hasNext={!!nextUrl}
          />
        </div>
      </div>
      </div>

      {/* Modal de vista de persona */}
      {viewPersona && (
        <DetailModal
          open={modalViewVisible}
          onClose={() => setModalViewVisible(false)}
          onEdit={() => {
            setModalViewVisible(false);
            router.push(`/dashboard/persons/edit/${viewPersona.id}`);
          }}
          title="Detalles de la Persona"
          sections={[
            {
              title: "Información personal",
              fields: [
                { label: "DNI", value: viewPersona.dni },
                { label: "Legajo", value: viewPersona.legajo },
                { label: "Nombres", value: viewPersona.nombre },
                { label: "Apellido", value: viewPersona.apellido },
                {
                  label: "Fecha de Nacimiento",
                  value: formatearFecha(viewPersona.fecha_nacimiento),
                },
              ],
            },
            {
              title: "Información de contacto",
              fields: [
                { label: "Teléfono", value: viewPersona.telefono },
                { label: "Email", value: viewPersona.email },
                { label: "Interno", value: viewPersona.interno },
                { label: "Título", value: obtenerNombreTitulo(viewPersona.titulo) },
                {
                  label: "Estado",
                  value: <StatusBadge estado={String(viewPersona.estado)} />,
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

export default withAuth(ListaPersonas);


