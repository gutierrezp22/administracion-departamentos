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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import DashboardMenu from "../../..";
import withAuth from "../../../../../components/withAut";
import { normalizeUrl } from "../../../../../utils/urlHelpers";

import {
  FilterContainer,
  FilterInput,
  FilterSelect,
  EstadoFilter,
} from "../../../../../components/Filters";

const ListaJefesDepartamentos = () => {
  interface JefeDepartamento {
    id: number;
    jefe: {
      id: number;
      persona: {
        id: number;
        nombre: string;
        apellido: string;
        dni: string;
        legajo: string;
        telefono: string;
        email: string;
        estado: string;
      };
      estado: string;
    };
    departamento: {
      id: number;
      nombre: string;
    };
    resolucion: {
      id: number;
      nresolucion: string;
      nexpediente: string;
    };
    fecha_de_inicio: string;
    fecha_de_fin: string;
    observaciones: string;
    estado: string;
    notificado: boolean;
  }

  const [jefesDepartamentos, setJefesDepartamentos] = useState<
    JefeDepartamento[]
  >([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroApellido, setFiltroApellido] = useState("");
  const [filtroDni, setFiltroDni] = useState("");
  const [filtroLegajo, setFiltroLegajo] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroResolucion, setFiltroResolucion] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [filtroVencimientos, setFiltroVencimientos] = useState<string>("todos");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `/facet/jefe-departamento/list_detalle/`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const router = useRouter();

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl, fetchData]);

  const fetchData = async (url: string) => {
    try {
      // Si la URL es absoluta (comienza con http), extraer solo la parte de la ruta
      let apiUrl = url;
      if (url.startsWith("http")) {
        const urlObj = new URL(url);
        apiUrl = urlObj.pathname + urlObj.search;
      }

      const response = await API.get(url);
      let filteredResults = response.data.results;

      // Filtro temporal en el frontend para próximos vencimientos
      if (filtroVencimientos === "proximos") {
        const today = new Date();
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(today.getMonth() + 1);

        filteredResults = response.data.results.filter(
          (jefe: JefeDepartamento) => {
            const fechaFin = new Date(jefe.fecha_de_fin);
            return fechaFin >= today && fechaFin <= oneMonthFromNow;
          }
        );
      }

      setJefesDepartamentos(filteredResults);
      setNextUrl(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrl(response.data.previous ? normalizeUrl(response.data.previous) : null);
      setTotalItems(filteredResults.length);

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al obtener los datos.",
      });
    }
  };

  const filtrarJefesDepartamentos = () => {
    let url = `/facet/jefe-departamento/list_detalle/`;
    const params = new URLSearchParams();

    if (filtroNombre !== "") {
      params.append("jefe__persona__nombre__icontains", filtroNombre);
    }
    if (filtroDni !== "") {
      params.append("jefe__persona__dni__icontains", filtroDni);
    }
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado !== "" && filtroEstado !== "todos") {
      params.append("jefe__estado", filtroEstado.toString());
    }
    if (filtroApellido !== "") {
      params.append("jefe__persona__apellido__icontains", filtroApellido);
    }
    if (filtroLegajo !== "") {
      params.append("jefe__persona__legajo__icontains", filtroLegajo);
    }
    if (filtroDepartamento !== "") {
      params.append("departamento__nombre__icontains", filtroDepartamento);
    }
    if (filtroResolucion !== "") {
      params.append("resolucion__nresolucion__icontains", filtroResolucion);
    }

    // Filtro de vencimientos
    if (filtroVencimientos === "proximos") {
      params.append("proximos_vencimientos", "true");
    }

    const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;
    setCurrentUrl(finalUrl);
  };

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroApellido("");
    setFiltroDni("");
    setFiltroLegajo("");
    setFiltroDepartamento("");
    setFiltroResolucion("");
    setFiltroEstado("1");
    setFiltroVencimientos("todos");
  };

  const descargarExcel = async () => {
    try {
      let allJefesDepartamentos: JefeDepartamento[] = [];
      let url = `/facet/jefe-departamento/?`;
      const params = new URLSearchParams();

      if (filtroNombre !== "")
        params.append("jefe__persona__nombre__icontains", filtroNombre);
      if (filtroApellido !== "")
        params.append("jefe__persona__apellido__icontains", filtroApellido);
      if (filtroDni !== "")
        params.append("jefe__persona__dni__icontains", filtroDni);
      if (filtroLegajo !== "")
        params.append("jefe__persona__legajo__icontains", filtroLegajo);
      if (filtroDepartamento !== "")
        params.append("departamento__nombre__icontains", filtroDepartamento);
      if (filtroResolucion !== "")
        params.append("resolucion__nresolucion__icontains", filtroResolucion);
      if (filtroEstado === "todos") {
        params.append("show_all", "true");
      } else if (filtroEstado !== "" && filtroEstado !== "todos") {
        params.append("estado", filtroEstado.toString());
      }
      url += params.toString();

      while (url) {
        const response = await API.get(url);
        const { results, next } = response.data;
        allJefesDepartamentos = [...allJefesDepartamentos, ...results];
        url = next;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        allJefesDepartamentos.map((jefeDepartamento) => ({
          Nombre: jefeDepartamento.jefe.persona.nombre,
          Apellido: jefeDepartamento.jefe.persona.apellido,
          DNI: jefeDepartamento.jefe.persona.dni,
          Legajo: jefeDepartamento.jefe.persona.legajo,
          Departamento: jefeDepartamento.departamento.nombre,
          Resolución: jefeDepartamento.resolucion.nresolucion,
          "Fecha Inicio": new Date(
            jefeDepartamento.fecha_de_inicio
          ).toLocaleDateString(),
          "Fecha Fin": new Date(
            jefeDepartamento.fecha_de_fin
          ).toLocaleDateString(),
          Estado: jefeDepartamento.estado === "1" ? "Activo" : "Inactivo",
        }))
      );

      XLSX.utils.book_append_sheet(workbook, worksheet, "JefesDepartamentos");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(excelBlob, "jefes_departamentos.xlsx");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al descargar",
        text: "Se produjo un error al exportar los datos.",
      });
    }
  };

  const eliminarJefeDepartamento = async (id: number) => {
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
        await API.delete(`/facet/jefe-departamento/${id}/`);
        Swal.fire(
          "Eliminado!",
          "El jefe de departamento ha sido eliminado.",
          "success"
        );
        fetchData(currentUrl);
      }
    } catch (error) {
      Swal.fire(
        "Error!",
        "No se pudo eliminar el jefe de departamento.",
        "error"
      );
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">
            Jefes de Departamento
          </h1>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() =>
                router.push("/dashboard/departments/departamentoJefe/create")
              }
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <AddIcon /> Agregar Jefe de Departamento
            </button>
            <button
              onClick={descargarExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
              <FileDownloadIcon /> Descargar Excel
            </button>
          </div>

          <FilterContainer
            onApply={filtrarJefesDepartamentos}
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
            <FilterInput
              label="Legajo"
              value={filtroLegajo}
              onChange={setFiltroLegajo}
              placeholder="Buscar por legajo"
            />
            <FilterInput
              label="Departamento"
              value={filtroDepartamento}
              onChange={setFiltroDepartamento}
              placeholder="Buscar por departamento"
            />
            <FilterInput
              label="Resolución"
              value={filtroResolucion}
              onChange={setFiltroResolucion}
              placeholder="Buscar por resolución"
            />
            <EstadoFilter value={filtroEstado} onChange={setFiltroEstado} />
            <FilterSelect
              label="Vencimientos"
              value={filtroVencimientos}
              onChange={setFiltroVencimientos}
              options={[
                { value: "proximos", label: "Próximos Vencimientos (1 mes)" },
              ]}
              placeholder="Todos"
            />
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
                  Departamento
                </TableCell>
                <TableCell>
                  Resolución
                </TableCell>
                <TableCell>
                  Fecha Inicio
                </TableCell>
                <TableCell>
                  Fecha Fin
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
                {jefesDepartamentos.map((jefeDepartamento) => (
                  <TableRow
                    key={jefeDepartamento.id}
                    className="hover:bg-gray-50">
                    <TableCell className="text-gray-800">
                      {jefeDepartamento.jefe.persona.nombre}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {jefeDepartamento.jefe.persona.apellido}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {jefeDepartamento.jefe.persona.dni}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {jefeDepartamento.jefe.persona.legajo}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {jefeDepartamento.departamento.nombre}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {jefeDepartamento.resolucion.nresolucion}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {new Date(
                        jefeDepartamento.fecha_de_inicio
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {new Date(
                        jefeDepartamento.fecha_de_fin
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {jefeDepartamento.estado === "1" ? "Activo" : "Inactivo"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/departments/departamentoJefe/edit/${jefeDepartamento.id}`
                            )
                          }
                          className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                          <EditIcon />
                        </button>
                        <button
                          onClick={() =>
                            eliminarJefeDepartamento(jefeDepartamento.id)
                          }
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

export default withAuth(ListaJefesDepartamentos);
