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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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
  FilterSelect,
  EstadoFilter,
} from "../../../../components/Filters";

const ListaCarreras = () => {
  interface Carrera {
    id: number;
    nombre: string;
    tipo: string;
    planestudio: string;
    estado: string;
  }

  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroPlanEstudio, setFiltroPlanEstudio] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `${API_BASE_URL}/facet/carrera/`
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
      const response = await axios.get(url);
      setCarreras(response.data.results);
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

  const filtrarCarreras = () => {
    let url = `${API_BASE_URL}/facet/carrera/?`;
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
    params.append("page", "1");
    url += params.toString();
    setCurrentPage(1);
    setCurrentUrl(url);
  };

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroTipo("");
    setFiltroPlanEstudio("");
    setFiltroEstado("1");
  };

  const handlePageChange = (newPage: number) => {
    let url = `${API_BASE_URL}/facet/carrera/?`;
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

    params.append("page", newPage.toString());
    url += params.toString();

    setCurrentPage(newPage);
    setCurrentUrl(url);
  };

  const descargarExcel = async () => {
    try {
      let allCarreras: Carrera[] = [];
      let url = `${API_BASE_URL}/facet/carrera/?`;
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
        const response = await axios.get(url);
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
        await axios.delete(`${API_BASE_URL}/facet/carrera/${id}/`);
        Swal.fire("Eliminado!", "La carrera ha sido eliminada.", "success");
        fetchData(currentUrl);
      }
    } catch (error) {
      Swal.fire("Error!", "No se pudo eliminar la carrera.", "error");
    }
  };

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

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHead>
                  <TableRow className="bg-blue-500">
                    <TableCell className="text-white font-semibold">
                      Nombre
                    </TableCell>
                    <TableCell className="text-white font-semibold">
                      Tipo
                    </TableCell>
                    <TableCell className="text-white font-semibold">
                      Plan de Estudio
                    </TableCell>
                    <TableCell className="text-white font-semibold">
                      Estado
                    </TableCell>
                    <TableCell className="text-white font-semibold">
                      Acciones
                    </TableCell>
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
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/careers/edit/${carrera.id}`
                              )
                            }
                            className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors duration-200">
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => eliminarCarrera(carrera.id)}
                            className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100 transition-colors duration-200">
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
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaCarreras);
