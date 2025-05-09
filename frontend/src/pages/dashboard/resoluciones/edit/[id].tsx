import { useEffect, useState } from 'react';
import './styles.css';
import axios from 'axios';
import { Container, Grid, Paper, Typography, TextField, Button, InputLabel, Select, MenuItem, FormControl } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import BasicModal from '@/utils/modal';
import ModalConfirmacion from '@/utils/modalConfirmacion';
import { useRouter } from 'next/router';
import DashboardMenu from '../..';
import withAuth from "../../../../components/withAut"; 
import { API_BASE_URL } from "../../../../utils/config";
import API from '@/api/axiosConfig';

dayjs.extend(utc);
dayjs.extend(timezone);

const EditarResolucion = () => {
  const router = useRouter();
  const { id: idResolucion } = router.query;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [redirectAfterClose, setRedirectAfterClose] = useState(false); // Controla la redirección

  const [nroExpediente, setNroExpediente] = useState('');
  const [nroResolucion, setNroResolucion] = useState('');
  const [tipo, setTipo] = useState('');
  const [adjunto, setAdjunto] = useState('');
  const [fecha, setFecha] = useState<Dayjs | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [estado, setEstado] = useState<string>('0');

  useEffect(() => {
    const fetchData = async () => {
      if (idResolucion) {
        try {
          const response = await axios.get(`${API_BASE_URL}/facet/resolucion/${idResolucion}/`);

          setNroExpediente(response.data.nexpediente);
          setNroResolucion(response.data.nresolucion);
          setTipo(response.data.tipo);
          setAdjunto(response.data.adjunto);

          const parsedFecha = dayjs(response.data.fecha, "DD/MM/YYYY HH:mm:ss");
          setFecha(parsedFecha.isValid() ? parsedFecha : null);

          setObservaciones(response.data.observaciones);
          setEstado(String(response.data.estado));
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();
  }, [idResolucion]);

  const edicionResolucion = async () => {
    const resolucionEditada = {
      nexpediente: nroExpediente,
      nresolucion: nroResolucion,
      tipo: tipo || "",
      adjunto: adjunto,
      observaciones: observaciones,
      fecha: fecha && fecha.isValid() ? fecha.toISOString() : "",
      estado: estado,
    };

    try {
      await API.put(`/facet/resolucion/${idResolucion}/`, resolucionEditada);
      setRedirectAfterClose(true); // Activa la redirección después de cerrar el modal
      handleOpenModal('Éxito', 'La acción se realizó con éxito.');
    } catch (error) {
      handleOpenModal('Error', 'NO se pudo realizar la acción.');
    }
  };

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage('');
    if (redirectAfterClose) {
      router.push('/dashboard/resoluciones/');
      setRedirectAfterClose(false); // Restablece la bandera
    }
  };

  const eliminarResolucion = async () => {
    try {
      await API.delete(`/facet/resolucion/${idResolucion}/`);
      setRedirectAfterClose(true); // Activa la redirección después de cerrar el modal
      handleOpenModal('Resolución Eliminada', 'La acción se realizó con éxito.');
    } catch (error) {
      handleOpenModal('Error', 'NO se pudo realizar la acción.');
    }
  };

  return (
    <DashboardMenu>
    <Container maxWidth="lg">
      <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
        <Typography variant="h4" gutterBottom>
          Editar Resolución
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Nro Expediente"
              value={nroExpediente}
              onChange={(e) => setNroExpediente(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Nro Resolución"
              value={nroResolucion}
              onChange={(e) => setNroResolucion(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
          <FormControl fullWidth margin="none">
            <InputLabel id="tipo-select-label">Tipo</InputLabel>
            <Select
              labelId="tipo-select-label"
              value={tipo}
              label="Tipo"
              onChange={(e) => setTipo(e.target.value)}
            >
              <MenuItem value="Rector">Rector</MenuItem>
              <MenuItem value="Decano">Decano</MenuItem>
              <MenuItem value="Consejo_Superior">Consejo Superior</MenuItem>
              <MenuItem value="Consejo_Directivo">Consejo Directivo</MenuItem>
            </Select>
          </FormControl>
        </Grid>
          <Grid item xs={12}>
            <TextField
              label="Link Documento Adjunto"
              value={adjunto}
              onChange={(e) => setAdjunto(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <MenuItem value={1}>Activo</MenuItem>
                <MenuItem value={0}>Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} marginBottom={2}>
            <Button variant="contained" onClick={edicionResolucion}>
              Editar
            </Button>
            <Button onClick={() => setConfirmarEliminacion(true)} variant="contained" color="error" style={{ marginLeft: '8px' }}>
              Eliminar
            </Button>
          </Grid>
        </Grid>
        <BasicModal open={modalVisible} onClose={handleCloseModal} title={modalTitle} content={modalMessage} />
        <ModalConfirmacion
          open={confirmarEliminacion}
          onClose={() => setConfirmarEliminacion(false)}
          onConfirm={() => {
            setConfirmarEliminacion(false);
            eliminarResolucion();
          }}
        />
      </Paper>
    </Container>
    </DashboardMenu>
  );
};

export default withAuth(EditarResolucion);
