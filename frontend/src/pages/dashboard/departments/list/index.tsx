import React, { useState, useEffect } from "react";
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
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import ViewComfyIcon from "@mui/icons-material/ViewComfy";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PeopleIcon from "@mui/icons-material/People";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useRouter } from "next/router"; // Importa useRouter de Next.js
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut"; // Importa el HOC
import { API_BASE_URL } from "../../../../utils/config";

interface Departamento {
  id: number;
  nombre: string;
  telefono: string;
  estado: 0 | 1;
  interno: string;
}

const ListaDepartamentos = () => {
  const router = useRouter(); // Usamos useRouter para manejar la navegación
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string | number>("");
  const [filtroTelefono, setFiltroTelefono] = useState("");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `${API_BASE_URL}/facet/departamento/`
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
      setDepartamentos(response.data.results);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setTotalItems(response.data.count);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const filtrarDepartamentos = () => {
    let url = `${API_BASE_URL}/facet/departamento/?`;
    const params = new URLSearchParams();
    if (filtroNombre !== "") {
      params.append("nombre__icontains", filtroNombre);
    }
    if (filtroEstado !== "") {
      params.append("estado", filtroEstado.toString());
    }
    if (filtroTelefono !== "") {
      params.append("telefono__icontains", filtroTelefono);
    }
    url += params.toString();
    setCurrentUrl(url);
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const descargarExcel = async () => {
    try {
      let allDepartamentos: Departamento[] = [];

      let url = `${API_BASE_URL}/facet/departamento/?`;
      const params = new URLSearchParams();
      if (filtroNombre !== "") {
        params.append("nombre__icontains", filtroNombre);
      }
      if (filtroEstado !== "") {
        params.append("estado", filtroEstado.toString());
      }
      if (filtroTelefono !== "") {
        params.append("telefono__icontains", filtroTelefono);
      }
      url += params.toString();

      while (url) {
        const response = await axios.get(url);
        const { results, next } = response.data;

        allDepartamentos = [
          ...allDepartamentos,
          ...results.map((departamento: any) => ({
            nombre: departamento.nombre,
            telefono: departamento.telefono,
            estado: departamento.estado,
            interno: departamento.interno,
          })),
        ];
        url = next;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(allDepartamentos);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Departamentos");
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(excelBlob, "departamentos.xlsx");
    } catch (error) {
      console.error("Error downloading Excel:", error);
    }
  };

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => router.push("/dashboard/departments/create")}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <AddIcon /> Agregar Departamento
          </button>
          <button
            onClick={() =>
              router.push("/dashboard/departments/departamentoJefe")
            }
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <PeopleIcon /> Jefes
          </button>
          <button
            onClick={descargarExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <FileDownloadIcon /> Descargar Excel
          </button>
        </div>

        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Departamentos
          </Typography>

          <Grid container spacing={2} marginBottom={2}>
            <Grid item xs={4}>
              <TextField
                label="Nombre"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  label="Estado">
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  <MenuItem value={1}>Activo</MenuItem>
                  <MenuItem value={0}>Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Teléfono"
                value={filtroTelefono}
                onChange={(e) => setFiltroTelefono(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4} marginBottom={2}>
              <button
                onClick={filtrarDepartamentos}
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
                    Teléfono
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Estado
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Interno
                  </TableCell>
                  <TableCell className="text-white font-medium"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departamentos.map((departamento) => (
                  <TableRow key={departamento.id} className="hover:bg-gray-50">
                    <TableCell>{departamento.nombre}</TableCell>
                    <TableCell>{departamento.telefono}</TableCell>
                    <TableCell>
                      {departamento.estado == 1 ? "Activo" : "Inactivo"}
                    </TableCell>
                    <TableCell>{departamento.interno}</TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/departments/edit/${departamento.id}`
                          )
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

export default withAuth(ListaDepartamentos);
