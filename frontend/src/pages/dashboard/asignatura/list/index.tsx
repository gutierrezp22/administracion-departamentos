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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PeopleIcon from "@mui/icons-material/People";
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

const ListaAsignaturas = () => {
  interface Asignatura {
    id: number;
    nombre: string;
    codigo: string;
    tipo: string;
    modulo: string;
    programa: string;
    estado: string;
    area: number;
    departamento: number;
    area_detalle: {
      id: number;
      nombre: string;
    };
    departamento_detalle: {
      id: number;
      nombre: string;
    };
  }

  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroCodigo, setFiltroCodigo] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroModulo, setFiltroModulo] = useState("");
  const [filtroPrograma, setFiltroPrograma] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `/facet/asignatura/`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const router = useRouter();

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await API.get(url);
      setAsignaturas(response.data.results);
      setNextUrl(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrl(response.data.previous ? normalizeUrl(response.data.previous) : null);
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

  const filtrarAsignaturas = () => {
    let url = `/facet/asignatura/?`;
    const params = new URLSearchParams();
    if (filtroNombre !== "") {
      params.append("nombre__icontains", filtroNombre);
    }
    if (filtroCodigo !== "") {
      params.append("codigo__icontains", filtroCodigo);
    }
    if (filtroTipo !== "") {
      params.append("tipo", filtroTipo);
    }
    if (filtroModulo !== "") {
      params.append("modulo__icontains", filtroModulo);
    }
    if (filtroPrograma !== "") {
      params.append("programa__icontains", filtroPrograma);
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
    setFiltroNombre("");
    setFiltroCodigo("");
    setFiltroTipo("");
    setFiltroModulo("");
    setFiltroPrograma("");
    setFiltroEstado("1");
  };

  const handlePageChange = (newPage: number) => {
    let url = `/facet/asignatura/?`;
    const params = new URLSearchParams();

    if (filtroNombre !== "") {
      params.append("nombre__icontains", filtroNombre);
    }
    if (filtroCodigo !== "") {
      params.append("codigo__icontains", filtroCodigo);
    }
    if (filtroTipo !== "") {
      params.append("tipo", filtroTipo);
    }
    if (filtroModulo !== "") {
      params.append("modulo__icontains", filtroModulo);
    }
    if (filtroPrograma !== "") {
      params.append("programa__icontains", filtroPrograma);
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

  const eliminarAsignatura = async (id: number) => {
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
        await API.delete(`/facet/asignatura/${id}/`);
        Swal.fire("Eliminado!", "La asignatura ha sido eliminada.", "success");
        fetchData(currentUrl);
      }
    } catch (error) {
      Swal.fire("Error!", "No se pudo eliminar la asignatura.", "error");
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
              Cargando asignaturas...
            </p>
          </div>
        </div>
      </DashboardMenu>
    );
  }

  const descargarExcel = async () => {
    try {
      let allAsignaturas: Asignatura[] = [];
      let url = `/facet/asignatura/?`;
      const params = new URLSearchParams();

      if (filtroNombre !== "") params.append("nombre__icontains", filtroNombre);
      if (filtroCodigo !== "") params.append("codigo__icontains", filtroCodigo);
      if (filtroTipo !== "") params.append("tipo", filtroTipo);
      if (filtroModulo !== "") params.append("modulo__icontains", filtroModulo);
      if (filtroPrograma !== "")
        params.append("programa__icontains", filtroPrograma);
      if (filtroEstado === "todos") {
        params.append("show_all", "true");
      } else if (filtroEstado !== "" && filtroEstado !== "todos") {
        params.append("estado", filtroEstado.toString());
      }
      url += params.toString();

      while (url) {
        const response = await API.get(url);
        const { results, next } = response.data;
        allAsignaturas = [...allAsignaturas, ...results];
        url = next;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        allAsignaturas.map((asignatura) => ({
          Código: asignatura.codigo,
          Nombre: asignatura.nombre,
          Módulo: asignatura.modulo,
          Programa: asignatura.programa || "N/A",
          Tipo: asignatura.tipo,
          Área: asignatura.area_detalle?.nombre || "N/A",
          Departamento: asignatura.departamento_detalle?.nombre || "N/A",
          Estado: asignatura.estado === "1" ? "Activo" : "Inactivo",
        }))
      );

      XLSX.utils.book_append_sheet(workbook, worksheet, "Asignaturas");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(excelBlob, "asignaturas.xlsx");
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
          <h1 className="text-2xl font-bold text-gray-800">Asignaturas</h1>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => router.push("/dashboard/asignatura/create")}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <AddIcon /> Agregar Asignatura
            </button>
            <button
              onClick={descargarExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <FileDownloadIcon /> Descargar Excel
            </button>
          </div>

          <FilterContainer
            onApply={filtrarAsignaturas}
            onClear={limpiarFiltros}>
            <FilterInput
              label="Nombre"
              value={filtroNombre}
              onChange={setFiltroNombre}
              placeholder="Buscar por nombre"
            />
            <FilterInput
              label="Código"
              value={filtroCodigo}
              onChange={setFiltroCodigo}
              placeholder="Buscar por código"
            />
            <FilterSelect
              label="Tipo"
              value={filtroTipo}
              onChange={setFiltroTipo}
              options={[
                { value: "Teórica", label: "Teórica" },
                { value: "Práctica", label: "Práctica" },
                { value: "Teórico-Práctica", label: "Teórico-Práctica" },
              ]}
              placeholder="Seleccionar tipo"
            />
            <FilterInput
              label="Módulo"
              value={filtroModulo}
              onChange={setFiltroModulo}
              placeholder="Buscar por módulo"
            />
            <EstadoFilter value={filtroEstado} onChange={setFiltroEstado} />
          </FilterContainer>

          <ResponsiveTable>
            <TableHead>
              <TableRow>
                <TableCell>
                  Código
                </TableCell>
                <TableCell>
                  Nombre
                </TableCell>
                <TableCell>
                  Módulo
                </TableCell>
                <TableCell>
                  Programa
                </TableCell>
                <TableCell>
                  Tipo
                </TableCell>
                <TableCell>
                  Área
                </TableCell>
                <TableCell>
                  Departamento
                </TableCell>
                <TableCell>
                  Estado
                </TableCell>
                <TableCell>
                  Docentes
                </TableCell>
                <TableCell>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
              <TableBody>
                {asignaturas.map((asignatura) => (
                  <TableRow key={asignatura.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-800">
                      {asignatura.codigo}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {asignatura.nombre}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {asignatura.modulo}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {asignatura.programa || "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {asignatura.tipo}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {asignatura.area_detalle?.nombre || "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {asignatura.departamento_detalle?.nombre || "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {asignatura.estado === "1" ? "Activo" : "Inactivo"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/asignatura/docenteAsignatura/${asignatura.id}`
                          )
                        }
                        className="p-2 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-100 transition-colors duration-200"
                        title="Gestionar docentes">
                        <PeopleIcon />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/asignatura/edit/${asignatura.id}`
                            )
                          }
                          className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => eliminarAsignatura(asignatura.id)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-100 transition-colors duration-200">
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
    </DashboardMenu>
  );
};

export default withAuth(ListaAsignaturas);
