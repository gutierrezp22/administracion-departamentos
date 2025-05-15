import { useEffect, useState } from 'react';
import './styles.css';
import axios from 'axios';
import {
  Typography,
  Paper,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useRouter } from 'next/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Swal from "sweetalert2";
import DashboardMenu from '../../../dashboard';
import withAuth from "../../../../components/withAut";
import { API_BASE_URL } from "../../../../utils/config";


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

const ListaAreas = () => {
  const router = useRouter();

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(`${API_BASE_URL}/facet/area/`);
  const [currentUrlDepto, setCurrentUrlDepto] = useState<string>(`${API_BASE_URL}/facet/departamento/`);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    fetchData(currentUrl, currentUrlDepto);
  }, [currentUrl, currentUrlDepto]);

  const fetchData = async (url: string, url2: string) => {
    try {
      const response = await axios.get(url);
      const deptos = await axios.get(url2);
      setAreas(response.data.results);
      setDepartamentos(deptos.data.results);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setTotalItems(response.data.count);
      setCurrentPage(1);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al obtener los datos.',
      });
    }
  };

  const filtrarAreas = () => {
    let url = `${API_BASE_URL}/facet/area/?`;
    const params = new URLSearchParams();
    if (filtroNombre !== '') {
      params.append('nombre__icontains', filtroNombre);
    }
    url += params.toString();
    setCurrentUrl(url);
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const descargarExcel = async () => {
    try {
      let allAreas: Area[] = [];
      let url = `${API_BASE_URL}/facet/area/?`;
      const params = new URLSearchParams();
      if (filtroNombre !== '') {
        params.append('nombre__icontains', filtroNombre);
      }
      url += params.toString();
  
      // Obtener todos los departamentos para enlazar con las áreas
      const departamentosResponse = await axios.get(`${API_BASE_URL}/facet/departamento/`);
      const departamentos: Departamento[] = departamentosResponse.data.results;
  
      while (url) {
        const response = await axios.get(url);
        const { results, next } = response.data;
  
        // Mapea los datos para incluir solo las columnas requeridas
        allAreas = [
          ...allAreas,
          ...results.map((area: any) => {
            const departamentoNombre = departamentos.find(depto => depto.id === area.departamento)?.nombre || 'Departamento no encontrado';
            return {
              nombre: area.nombre, // Nombre original del área
              "nombre Departamento": departamentoNombre, // Nombre del departamento relacionado
              estado: area.estado,
            };
          }),
        ];
        url = next;
      }
  
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(allAreas);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Areas');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(excelBlob, 'areas.xlsx');
    } catch (error) {
      console.error('Error downloading Excel:', error);
    }
  };
  
  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => router.push('/dashboard/areas/create')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200"
          >
            <AddIcon /> Agregar Area
          </button>
          <button
            onClick={descargarExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200"
          >
            <FileDownloadIcon /> Descargar Excel
          </button>
        </div>

        <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Areas
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
            <Grid item xs={4} marginBottom={2}>
              <button
                onClick={filtrarAreas}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Filtrar
              </button>
            </Grid>
          </Grid>

          <TableContainer component={Paper} className="mt-4">
            <Table>
              <TableHead>
                <TableRow className="bg-blue-600 text-white">
                  <TableCell className="text-white font-medium">Nombre</TableCell>
                  <TableCell className="text-white font-medium">Departamento</TableCell>
                  <TableCell className="text-white font-medium">Estado</TableCell>
                  <TableCell className="text-white font-medium"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id} className="hover:bg-gray-50">
                    <TableCell>{area.nombre}</TableCell>
                    <TableCell>
                      {departamentos.find(depto => depto.id === area.departamento)?.nombre || 'Departamento no encontrado'}
                    </TableCell>
                    <TableCell>{area.estado == 1 ? "Activo" : "Inactivo"}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => router.push(`/dashboard/areas/edit/${area.id}`)}
                        className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors duration-200"
                      >
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
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } transition-colors duration-200`}
            >
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
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } transition-colors duration-200`}
            >
              Siguiente
            </button>
          </div>
        </Paper>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaAreas);
