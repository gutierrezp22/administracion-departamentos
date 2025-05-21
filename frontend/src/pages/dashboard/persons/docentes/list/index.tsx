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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Link from "next/link";
import DashboardMenu from "../../../../dashboard";
import withAuth from "../../../../../components/withAut";
import { API_BASE_URL } from "../../../../../utils/config";
import { useRouter } from "next/router";

const ListaDocentes = () => {
  const router = useRouter();

  const h1Style = {
    color: "black",
  };

  interface Persona {
    id: number;
    nombre: string;
    apellido: string;
    telefono: string;
    dni: string;
    estado: 0 | 1; // Aquí indicas que 'estado' es un enum que puede ser 0 o 1
    email: string;
    interno: string;
    legajo: string;
  }

  interface Docente {
    id: number;
    persona: number;
    persona_detalle: {
      id: number;
      nombre: string;
      apellido: string;
      dni: string;
      email: string;
      telefono: string;
      legajo: string;
    };
    observaciones: string;
    estado: 0 | 1 | "0" | "1"; // Puede ser cadena o número según lo que devuelva el backend.
  }

  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [filtroDni, setFiltroDni] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroApellido, setFiltroApellido] = useState("");
  const [filtroLegajo, setFiltroLegajo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string | number>("");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `${API_BASE_URL}/facet/docente/`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      const response = await axios.get(url);
      setDocentes(response.data.results);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setTotalItems(response.data.count);
      setCurrentPage(1);

      const personasResponse = await axios.get(
        `${API_BASE_URL}/facet/persona/`
      );
      setPersonas(personasResponse.data.results);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const filtrarDocentes = () => {
    let url = `${API_BASE_URL}/facet/docente/?`;
    const params = new URLSearchParams();
    if (filtroNombre !== "") {
      params.append("persona__nombre__icontains", filtroNombre);
    }
    if (filtroDni !== "") {
      params.append("persona__dni__icontains", filtroDni);
    }
    if (filtroEstado !== "") {
      params.append("estado", filtroEstado.toString());
    }
    if (filtroApellido !== "") {
      params.append("persona__apellido__icontains", filtroApellido);
    }
    if (filtroLegajo !== "") {
      params.append("persona__legajo__icontains", filtroLegajo);
    }
    url += params.toString();
    setCurrentUrl(url);
  };

  const exportToExcel = async () => {
    try {
      let allDocentes: Docente[] = [];
      let url = `${API_BASE_URL}/facet/docente/`; // Asegúrate de que la URL sea correcta

      // Fetch all pages of docentes
      while (url) {
        const response = await axios.get(url);
        const { results, next } = response.data;
        allDocentes = [...allDocentes, ...results];
        url = next; // Update URL for the next page
      }

      const ws = XLSX.utils.json_to_sheet(
        allDocentes.map((docente) => {
          const persona = personas.find((p) => p.id === docente.persona);
          return {
            Nombre: persona?.nombre || "",
            Apellido: persona?.apellido || "",
            DNI: persona?.dni || "",
            Legajo: persona?.legajo || "",
            Observaciones: docente.observaciones,
            Estado: docente.estado === 1 ? "Activo" : "Inactivo",
          };
        })
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Docentes");
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([wbout], { type: "application/octet-stream" }),
        "docentes.xlsx"
      );
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => router.push("/dashboard/persons/docentes/create")}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <AddIcon /> Agregar Docente
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <FileDownloadIcon /> Descargar Excel
          </button>
        </div>

        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Docentes
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="DNI"
                value={filtroDni}
                onChange={(e) => setFiltroDni(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Nombre"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Apellido"
                value={filtroApellido}
                onChange={(e) => setFiltroApellido(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={4} marginBottom={2}>
              <TextField
                label="Legajo"
                value={filtroLegajo}
                onChange={(e) => setFiltroLegajo(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={4} marginBottom={2}>
              <TextField
                select
                fullWidth
                label="Estado"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                variant="outlined"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="0">Inactivo</MenuItem>
                <MenuItem value="1">Activo</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={4} marginBottom={2}>
              <button
                onClick={filtrarDocentes}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200">
                Filtrar
              </button>
            </Grid>
          </Grid>

          <TableContainer component={Paper} className="mt-4">
            <Table>
              <TableHead>
                <TableRow className="bg-blue-500 text-white">
                  <TableCell className="text-white font-medium">
                    Nombre
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Apellido
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    DNI
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Legajo
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Observaciones
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Estado
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {docentes.map((docente) => {
                  const { persona_detalle: persona } = docente;

                  return (
                    <TableRow key={docente.id} className="hover:bg-gray-50">
                      <TableCell>{persona.nombre}</TableCell>
                      <TableCell>{persona.apellido}</TableCell>
                      <TableCell>{persona.dni}</TableCell>
                      <TableCell>{persona.legajo}</TableCell>
                      <TableCell>{docente.observaciones}</TableCell>
                      <TableCell>{docente.estado == 1 ? 'Activo' : 'Inactivo'}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => router.push(`/dashboard/persons/docentes/edit/${docente.id}`)}
                          className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors duration-200">
                          <EditIcon />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

export default withAuth(ListaDocentes);
