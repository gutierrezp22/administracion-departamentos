import { useEffect, useState } from 'react';
import './styles.css';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DeleteIcon from '@mui/icons-material/Delete';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Swal from "sweetalert2";
import DashboardMenu from '../../../dashboard';
import withAuth from "../../../../components/withAut"; 
import { API_BASE_URL } from "../../../../utils/config";

interface Notificacion {
  id: number;
  persona: number;
  mensaje: string;
  leido: boolean;
  fecha_creacion: string;
}

const ListaNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [filtroMensaje, setFiltroMensaje] = useState('');
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(`${API_BASE_URL}/facet/notificacion/`);

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      const response = await axios.get(url);
      setNotificaciones(response.data.results);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al obtener las notificaciones.',
      });
    }
  };

  const filtrarNotificaciones = () => {
    let url = `${API_BASE_URL}/facet/notificacion/?`;
    const params = new URLSearchParams();
    if (filtroMensaje !== '') {
      params.append('mensaje__icontains', filtroMensaje);
    }
    url += params.toString();
    setCurrentUrl(url);
  };

  const marcarComoLeida = async (id: number) => {
    try {
      await axios.patch(`${API_BASE_URL}/facet/notificacion/${id}/`, { leido: true });
      fetchData(currentUrl);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo marcar como leída.',
      });
    }
  };

  const eliminarNotificacion = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/facet/notificacion/${id}/`);
      fetchData(currentUrl);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la notificación.',
      });
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
          <Typography variant="h4" gutterBottom>
            Notificaciones
          </Typography>

          <Grid container spacing={2} marginBottom={2}>
            <Grid item xs={4}>
              <TextField
                label="Buscar mensaje"
                value={filtroMensaje}
                onChange={(e) => setFiltroMensaje(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <Button variant="contained" onClick={filtrarNotificaciones}>
                Filtrar
              </Button>
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow className='header-row'>
                  <TableCell className='header-cell'>
                    <Typography variant="subtitle1">Mensaje</Typography>
                  </TableCell>
                  <TableCell className='header-cell'>
                    <Typography variant="subtitle1">Fecha</Typography>
                  </TableCell>
                  <TableCell className='header-cell'>
                    <Typography variant="subtitle1">Estado</Typography>
                  </TableCell>
                  <TableCell className='header-cell'>
                    <Typography variant="subtitle1">Acciones</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notificaciones.map((noti) => (
                  <TableRow key={noti.id}>
                    <TableCell>{noti.mensaje}</TableCell>
                    <TableCell>{new Date(noti.fecha_creacion).toLocaleDateString()}</TableCell>
                    <TableCell>{noti.leido ? 'Leído' : 'No leído'}</TableCell>
                    <TableCell>
                      {!noti.leido && (
                        <Button onClick={() => marcarComoLeida(noti.id)} color="primary">
                          <MarkEmailReadIcon />
                        </Button>
                      )}
                      <Button onClick={() => eliminarNotificacion(noti.id)} color="secondary">
                        <DeleteIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(ListaNotificaciones);
