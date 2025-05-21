import { useEffect, useState } from 'react';
import './styles.css';
import axios from 'axios';
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
  TableRow 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useRouter } from 'next/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import DashboardMenu from '../../../dashboard';
import withAuth from "../../../../components/withAut"; 
import { API_BASE_URL } from "../../../../utils/config";

type TipoCarrera = 'Pregrado' | 'Grado' | 'Posgrado';

interface Carrera {
  id: number;
  nombre: string;
  tipo: TipoCarrera;
  planestudio: string;
  sitio: string;
  estado: 0 | 1;
}

const ListaCarreras = () => {
  const router = useRouter();
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string | number>('');
  const [filtroPlanEstudio, setFiltroPlanEstudio] = useState('');
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(`${API_BASE_URL}/facet/carrera/`);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

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
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const filtrarCarreras = () => {
    let url = `${API_BASE_URL}/facet/carrera/?`;
    const params = new URLSearchParams();
    if (filtroNombre !== '') {
      params.append('nombre__icontains', filtroNombre);
    }
    if (filtroEstado !== '') {
      params.append('estado', filtroEstado.toString());
    }
    if (filtroTipo !== '') {
      params.append('tipo', filtroTipo);
    }
    if (filtroPlanEstudio !== '') {
      params.append('planestudio__icontains', filtroPlanEstudio);
    }
    url += params.toString();
    setCurrentUrl(url);
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const descargarExcel = async () => {
    try {
      let allCarreras: Carrera[] = [];

      let url = `${API_BASE_URL}/facet/carrera/?`;
      const params = new URLSearchParams();
      if (filtroNombre !== '') {
        params.append('nombre__icontains', filtroNombre);
      }
      if (filtroEstado !== '') {
        params.append('estado', filtroEstado.toString());
      }
      if (filtroTipo !== '') {
        params.append('tipo', filtroTipo);
      }
      if (filtroPlanEstudio !== '') {
        params.append('planestudio__icontains', filtroPlanEstudio);
      }
      url += params.toString();

      while (url) {
        const response = await axios.get(url);
        const { results, next } = response.data;

        allCarreras = [...allCarreras, ...results];
        url = next;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(allCarreras);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Carreras');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(excelBlob, 'carreras.xlsx');
    } catch (error) {
      console.error('Error downloading Excel:', error);
    }
  };

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => router.push('/dashboard/careers/create')}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200"
          >
            <AddIcon /> Agregar Carrera
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
            Carreras
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
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  label="Tipo"
                >
                  <MenuItem value=""><em>Todos</em></MenuItem>
                  <MenuItem value="Pregrado">Pregrado</MenuItem>
                  <MenuItem value="Grado">Grado</MenuItem>
                  <MenuItem value="Posgrado">Posgrado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value=""><em>Todos</em></MenuItem>
                  <MenuItem value={1}>Activo</MenuItem>
                  <MenuItem value={0}>Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Plan de Estudio"
                value={filtroPlanEstudio}
                onChange={(e) => setFiltroPlanEstudio(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4} marginBottom={2}>
              <button
                onClick={filtrarCarreras}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Filtrar
              </button>
            </Grid>
          </Grid>

          <TableContainer component={Paper} className="mt-4">
            <Table>
              <TableHead>
                <TableRow style={{ backgroundColor: '#3b82f6' }}>
                  <TableCell style={{ color: 'white', fontWeight: 500 }}>Nombre</TableCell>
                  <TableCell style={{ color: 'white', fontWeight: 500 }}>Tipo</TableCell>
                  <TableCell style={{ color: 'white', fontWeight: 500 }}>Plan de Estudio</TableCell>
                  <TableCell style={{ color: 'white', fontWeight: 500 }}>Sitio</TableCell>
                  <TableCell style={{ color: 'white', fontWeight: 500 }}>Asignaturas</TableCell>
                  <TableCell style={{ color: 'white', fontWeight: 500 }}>Estado</TableCell>
                  <TableCell style={{ color: 'white', fontWeight: 500 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {carreras.map(carrera => (
                  <TableRow key={carrera.id} className="hover:bg-gray-50">
                    <TableCell>{carrera.nombre}</TableCell>
                    <TableCell>{carrera.tipo}</TableCell>
                    <TableCell>{carrera.planestudio}</TableCell>
                    <TableCell>{carrera.sitio}</TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => router.push(`/dashboard/careers/asignaturaCarrera/${carrera.id}`)}
                        className="p-2 text-purple-500 hover:text-purple-700 rounded-full hover:bg-purple-50 transition-colors duration-200"
                      >
                        <NoteAltIcon />
                      </button>
                    </TableCell>
                    <TableCell>{carrera.estado == 1 ? "Activo" : "Inactivo"}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => router.push(`/dashboard/careers/edit/${carrera.id}`)}
                        className="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50 transition-colors duration-200"
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
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
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
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
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

export default withAuth(ListaCarreras);
