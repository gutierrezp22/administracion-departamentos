import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import {
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import GroupIcon from "@mui/icons-material/Group";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useRouter } from "next/router";
import DashboardMenu from "../../../dashboard";
import withAuth from "../../../../components/withAut";
import { API_BASE_URL } from "../../../../utils/config";

const ListaAsignaturas = () => {
  type EstadoAsignatura = "Electiva" | "Obligatoria";

  interface Area {
    id: number;
    departamento: number;
    nombre: string;
    estado: 0 | 1;
  }

  interface Departamento {
    id: number;
    nombre: string;
    telefono: string;
    estado: 0 | 1;
    interno: string;
  }

  interface Asignatura {
    id: number;
    area: number;
    departamento: number;
    codigo: string;
    nombre: string;
    modulo: string;
    programa: string;
    tipo: EstadoAsignatura;
    estado: 0 | 1;
  }

  const router = useRouter();
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [filtroCodigo, setFiltroCodigo] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroModulo, setFiltroModulo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string | number>("");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `${API_BASE_URL}/facet/asignatura/`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      const [asignaturasRes, departamentosRes, areasRes] = await Promise.all([
        axios.get(url),
        axios.get(`${API_BASE_URL}/facet/departamento/`),
        axios.get(`${API_BASE_URL}/facet/area/`),
      ]);

      setAsignaturas(asignaturasRes.data.results);
      setDepartamentos(departamentosRes.data.results);
      setAreas(areasRes.data.results);
      setNextUrl(asignaturasRes.data.next);
      setPrevUrl(asignaturasRes.data.previous);
      setTotalItems(asignaturasRes.data.count);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const filtrarAsignaturas = () => {
    let url = `${API_BASE_URL}/facet/asignatura/?`;
    const params = new URLSearchParams();
    if (filtroNombre !== "") {
      params.append("nombre__icontains", filtroNombre);
    }
    if (filtroCodigo !== "") {
      params.append("codigo__icontains", filtroCodigo);
    }
    if (filtroEstado !== "") {
      params.append("estado", filtroEstado.toString());
    }
    if (filtroTipo !== "") {
      params.append("tipo", filtroTipo);
    }
    if (filtroModulo !== "") {
      params.append("modulo__icontains", filtroModulo);
    }
    url += params.toString();
    setCurrentUrl(url);
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const descargarExcel = async () => {
    try {
      let allAsignaturas: Asignatura[] = [];

      // Construir URL con filtros
      let url = `${API_BASE_URL}/facet/asignatura/?`;
      const params = new URLSearchParams();
      if (filtroNombre !== "") {
        params.append("nombre__icontains", filtroNombre);
      }
      if (filtroEstado !== "") {
        params.append("estado", filtroEstado.toString());
      }
      if (filtroTipo !== "") {
        params.append("tipo", filtroTipo);
      }
      if (filtroModulo !== "") {
        params.append("modulo__icontains", filtroModulo);
      }
      url += params.toString();

      // Iterar sobre las páginas de resultados
      while (url) {
        const response = await axios.get(url);
        const { results, next } = response.data;
        allAsignaturas = [...allAsignaturas, ...results];
        url = next;
      }

      // Preparar los datos en el formato requerido para el Excel
      const dataForExcel = allAsignaturas.map((asignatura) => ({
        Codigo: asignatura.codigo,
        Nombre: asignatura.nombre,
        Modulo: asignatura.modulo,
        Tipo: asignatura.tipo,
        Estado: asignatura.estado == 1 ? "Activo" : "Inactivo",
        Area:
          areas.find((area) => area.id === asignatura.area)?.nombre ||
          "Área no encontrada",
        Departamento:
          departamentos.find((depto) => depto.id === asignatura.departamento)
            ?.nombre || "Departamento no encontrado",
      }));

      // Generar y descargar el archivo Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
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
      console.error("Error downloading Excel:", error);
    }
  };

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => router.push("/dashboard/asignatura/create")}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <AddIcon /> Agregar Asignatura
          </button>
          <button
            onClick={descargarExcel}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <FileDownloadIcon /> Descargar Excel
          </button>
        </div>

        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Asignaturas
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="Codigo"
                value={filtroCodigo}
                onChange={(e) => setFiltroCodigo(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Nombre"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth margin="none">
                <InputLabel id="demo-simple-select-label">Tipo</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={filtroTipo}
                  label="Tipo"
                  onChange={(e) => setFiltroTipo(e.target.value)}>
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  <MenuItem value={"Electiva"}>Electiva</MenuItem>
                  <MenuItem value={"Obligatoria"}>Obligatoria</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4} marginBottom={2}>
              <TextField
                label="Modulo"
                value={filtroModulo}
                onChange={(e) => setFiltroModulo(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4} marginBottom={2}>
              <button
                onClick={filtrarAsignaturas}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200">
                Filtrar
              </button>
            </Grid>
          </Grid>

          <TableContainer component={Paper} className="mt-4">
            <Table>
              <TableHead>
                <TableRow style={{ backgroundColor: "#3b82f6" }}>
                  <TableCell style={{ color: "white", fontWeight: 500 }}>
                    Codigo
                  </TableCell>
                  <TableCell style={{ color: "white", fontWeight: 500 }}>
                    Nombre
                  </TableCell>
                  <TableCell style={{ color: "white", fontWeight: 500 }}>
                    Modulo
                  </TableCell>
                  <TableCell style={{ color: "white", fontWeight: 500 }}>
                    Programa
                  </TableCell>
                  <TableCell style={{ color: "white", fontWeight: 500 }}>
                    Tipo
                  </TableCell>
                  <TableCell style={{ color: "white", fontWeight: 500 }}>
                    Estado
                  </TableCell>
                  <TableCell style={{ color: "white", fontWeight: 500 }}>
                    Area
                  </TableCell>
                  <TableCell style={{ color: "white", fontWeight: 500 }}>
                    Departamento
                  </TableCell>
                  <TableCell style={{ color: "white", fontWeight: 500 }}>
                    Docentes
                  </TableCell>
                  <TableCell
                    style={{ color: "white", fontWeight: 500 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {asignaturas.map((asignatura) => (
                  <TableRow key={asignatura.id} className="hover:bg-gray-50">
                    <TableCell>{asignatura.codigo}</TableCell>
                    <TableCell>{asignatura.nombre}</TableCell>
                    <TableCell>{asignatura.modulo}</TableCell>
                    <TableCell className="text-center">
                      <a
                        href={asignatura.programa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700">
                        <TextSnippetIcon />
                      </a>
                    </TableCell>
                    <TableCell>{asignatura.tipo}</TableCell>
                    <TableCell>
                      {asignatura.estado == 1 ? "Activo" : "Inactivo"}
                    </TableCell>
                    <TableCell>
                      {areas.find((area) => area.id === asignatura.area)
                        ?.nombre || "Área no encontrada"}
                    </TableCell>
                    <TableCell>
                      {departamentos.find(
                        (depto) => depto.id === asignatura.departamento
                      )?.nombre || "Departamento no encontrado"}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/asignatura/docenteAsignatura/${asignatura.id}`
                          )
                        }
                        className="p-2 text-purple-500 hover:text-purple-700 rounded-full hover:bg-purple-50 transition-colors duration-200">
                        <GroupIcon />
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/asignatura/edit/${asignatura.id}`
                          )
                        }
                        className="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50 transition-colors duration-200">
                        <EditIcon />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => {
                prevUrl && setCurrentUrl(prevUrl);
                setCurrentPage(currentPage - 1);
              }}
              disabled={!prevUrl}
              className={`px-4 py-2 rounded-md ${
                prevUrl
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors duration-200`}>
              Anterior
            </button>
            <Typography variant="body1">
              Página {currentPage} de {totalPages}
            </Typography>
            <button
              onClick={() => {
                nextUrl && setCurrentUrl(nextUrl);
                setCurrentPage(currentPage + 1);
              }}
              disabled={!nextUrl}
              className={`px-4 py-2 rounded-md ${
                nextUrl
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors duration-200`}>
              Siguiente
            </button>
          </div>
        </Paper>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaAsignaturas);
