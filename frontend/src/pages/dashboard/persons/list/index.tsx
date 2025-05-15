import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import {
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import WorkIcon from "@mui/icons-material/Work";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Link from "next/link";
import { useRouter } from "next/router";
import DashboardMenu from "../../../dashboard";
import withAuth from "../../../../components/withAut";
import { API_BASE_URL } from "../../../../utils/config";

interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  dni: string;
  estado: 0 | 1;
  email: string;
  interno: string;
  legajo: string;
  titulo: Titulo | null;
}

interface Titulo {
  id: number;
  nombre: string;
}

const ListaPersonas = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [filtroDni, setFiltroDni] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroApellido, setFiltroApellido] = useState("");
  const [filtroLegajo, setFiltroLegajo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string | number>("");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `${API_BASE_URL}/facet/persona/`
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
      setPersonas(response.data.results);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setTotalItems(response.data.count);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching data:", error);
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
    if (filtroEstado !== "") {
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

  const descargarExcel = async () => {
    try {
      let allPersona: Persona[] = [];
      let url = `${API_BASE_URL}/facet/persona/?`;
      const params = new URLSearchParams();
      if (filtroNombre !== "") {
        params.append("nombre__icontains", filtroNombre);
      }
      if (filtroEstado !== "") {
        params.append("estado", filtroEstado.toString());
      }
      if (filtroApellido !== "") {
        params.append("apellido__icontains", filtroApellido);
      }
      if (filtroLegajo !== "") {
        params.append("legajo__icontains", filtroLegajo);
      }
      url += params.toString();

      while (url) {
        const response = await axios.get(url);
        const { results, next } = response.data;

        allPersona = [...allPersona, ...results];
        url = next;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        allPersona.map((persona) => ({
          Nombre: persona.nombre,
          Apellido: persona.apellido,
          Telefono: persona.telefono,
          DNI: persona.dni,
          Estado: persona.estado == 1 ? "Activo" : "Inactivo",
          Email: persona.email,
          Interno: persona.interno,
          Legajo: persona.legajo,
          Titulo: persona.titulo ? String(persona.titulo) : "",
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
      console.error("Error downloading Excel:", error);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => router.push("/dashboard/persons/create")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <AddIcon /> Agregar Persona
          </button>
          <button
            onClick={() => router.push("/dashboard/persons/jefes")}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <PeopleIcon /> Jefes
          </button>
          <button
            onClick={() => router.push("/dashboard/persons/docentes")}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <SchoolIcon /> Docentes
          </button>
          <button
            onClick={() => router.push("/dashboard/persons/noDocentes")}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <WorkIcon /> No Docentes
          </button>
          <button
            onClick={descargarExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <FileDownloadIcon /> Descargar Excel
          </button>
        </div>

        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Personas
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="DNI"
                value={filtroDni}
                onChange={(e) => setFiltroDni(e.target.value)}
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
              <TextField
                label="Apellido"
                value={filtroApellido}
                onChange={(e) => setFiltroApellido(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4} marginBottom={2}>
              <TextField
                label="Legajo"
                value={filtroLegajo}
                onChange={(e) => setFiltroLegajo(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4} marginBottom={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  label="Estado">
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="0">Inactivo</MenuItem>
                  <MenuItem value="1">Activo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4} marginBottom={2}>
              <button
                onClick={filtrarPersonas}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200">
                Filtrar
              </button>
            </Grid>
          </Grid>

          <TableContainer component={Paper} className="mt-4">
            <Table>
              <TableHead>
                <TableRow className="bg-blue-600 text-white">
                  <TableCell className="text-white font-medium">
                    Nombre
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Apellido
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Teléfono
                  </TableCell>
                  <TableCell className="text-white font-medium">DNI</TableCell>
                  <TableCell className="text-white font-medium">
                    Estado
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Email
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Interno
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Legajo
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Título
                  </TableCell>
                  <TableCell className="text-white font-medium"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {personas.map((persona) => (
                  <TableRow key={persona.id} className="hover:bg-gray-50">
                    <TableCell>{persona.nombre}</TableCell>
                    <TableCell>{persona.apellido}</TableCell>
                    <TableCell>{persona.telefono}</TableCell>
                    <TableCell>{persona.dni}</TableCell>
                    <TableCell>
                      {persona.estado == 1 ? "Activo" : "Inactivo"}
                    </TableCell>
                    <TableCell>{persona.email}</TableCell>
                    <TableCell>{persona.interno}</TableCell>
                    <TableCell>{persona.legajo}</TableCell>
                    <TableCell>
                      {persona.titulo ? String(persona.titulo) : ""}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          router.push(`/dashboard/persons/edit/${persona.id}`)
                        }
                        className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors duration-200">
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
                  ? "bg-blue-600 text-white hover:bg-blue-700"
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
                  ? "bg-blue-600 text-white hover:bg-blue-700"
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

export default withAuth(ListaPersonas);
