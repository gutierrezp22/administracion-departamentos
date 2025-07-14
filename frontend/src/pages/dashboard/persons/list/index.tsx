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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
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
    titulo: string;
  }

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroApellido, setFiltroApellido] = useState("");
  const [filtroDni, setFiltroDni] = useState("");
  const [filtroLegajo, setFiltroLegajo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `${API_BASE_URL}/facet/persona/?estado=1`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const router = useRouter();

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      const response = await API.get(url);
      setPersonas(response.data.results);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setTotalItems(response.data.count);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al obtener los datos.",
      });
    }
  };

  const filtrarPersonas = () => {
    let url = `${API_BASE_URL}/facet/persona/?`;
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
    setCurrentUrl(url);
  };

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroApellido("");
    setFiltroDni("");
    setFiltroLegajo("");
    setFiltroEstado("1");
    setCurrentUrl(`${API_BASE_URL}/facet/persona/?estado=1`);
  };

  const descargarExcel = async () => {
    try {
      let allPersonas: Persona[] = [];
      let url = `${API_BASE_URL}/facet/persona/?`;
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
        url = next;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        allPersonas.map((persona) => ({
          Nombre: persona.nombre,
          Apellido: persona.apellido,
          DNI: persona.dni,
          Legajo: persona.legajo,
          Teléfono: persona.telefono,
          Email: persona.email,
          Interno: persona.interno,
          Título: persona.titulo,
          Estado: persona.estado === "1" ? "Activo" : "Inactivo",
        }))
      );

      XLSX.utils.book_append_sheet(workbook, worksheet, "Personas");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(excelBlob, "personas.xlsx");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al descargar",
        text: "Se produjo un error al exportar los datos.",
      });
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
        await API.delete(`${API_BASE_URL}/facet/persona/${id}/`);
        Swal.fire("Eliminado!", "La persona ha sido eliminada.", "success");
        fetchData(currentUrl);
      }
    } catch (error) {
      Swal.fire("Error!", "No se pudo eliminar la persona.", "error");
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Personas</h1>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => router.push("/dashboard/persons/create")}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
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
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
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

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHead>
                <TableRow className="bg-blue-500">
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Nombre</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Apellido</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>DNI</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Legajo</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Teléfono</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Email</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Interno</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Título</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Estado</TableCell>
                  <TableCell className="text-white font-semibold" style={{ color: '#fff' }}>Acciones</TableCell>
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
                      {persona.titulo}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {persona.estado === "1" ? "Activo" : "Inactivo"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/persons/edit/${persona.id}`)
                          }
                          className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => eliminarPersona(persona.id)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-100 transition-colors duration-200">
                          <DeleteIcon />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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
    </DashboardMenu>
  );
};

export default withAuth(ListaPersonas);
