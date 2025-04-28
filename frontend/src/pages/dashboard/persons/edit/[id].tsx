import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Grid,
  Paper,
  TextField,
  Button,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Typography,
} from '@mui/material';
import BasicModal from '@/utils/modal';
import ModalConfirmacion from '@/utils/modalConfirmacion';
import { useRouter } from 'next/router';
import DashboardMenu from '../..';
import withAuth from "../../../../components/withAut";
import { API_BASE_URL } from "../../../../utils/config";
import API from '@/api/axiosConfig';

const EditarPersona: React.FC = () => {
  const router = useRouter();
  const { id: idPersona } = router.query;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);

  interface Persona {
    id: number;
    nombre: string;
    apellido: string;
    telefono: string;
    dni: string;
    estado: 0 | 1;
    email: string;
    interno: number | null; // ⚡ Interno ahora es un número entero o null
    legajo: string;
    titulo: number | null;
  }

  interface Titulo {
    id: number;
    nombre: string;
  }

  const [persona, setPersona] = useState<Persona | null>(null);
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [legajo, setLegajo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [interno, setInterno] = useState<number | ''>(''); // ⚡ Asegurar tipo seguro
  const [estado, setEstado] = useState('1');
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [tituloId, setTituloId] = useState<number | ''>('');

  useEffect(() => {
    const fetchTitulos = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/facet/tipo-titulo/`);
        setTitulos(response.data.results);
      } catch (error) {
        console.error('Error al obtener títulos:', error);
      }
    };

    fetchTitulos();
  }, []);

  useEffect(() => {
    if (idPersona) {
      const fetchData = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/facet/persona/${idPersona}/`);
          const personaData = response.data;
          setPersona(personaData);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchData();
    }
  }, [idPersona]);

  useEffect(() => {
    if (persona) {
      setDni(persona.dni ?? '');
      setNombre(persona.nombre ?? '');
      setApellido(persona.apellido ?? '');
      setLegajo(persona.legajo ?? '');
      setTelefono(persona.telefono ?? '');
      setEmail(persona.email ?? '');
      setInterno(persona.interno ?? ''); // ⚡ Asegurar tipo seguro
      setEstado(String(persona.estado ?? '1'));
      setTituloId(persona.titulo ?? '');
    }
  }, [persona]);

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage('');
    router.push('/dashboard/persons/');
  };

  const edicionPersona = async () => {
    const personaEditada = {
      nombre,
      apellido,
      telefono,
      dni,
      estado: Number(estado),
      email,
      interno: interno !== '' ? Number(interno) : null, // ⚡ Convertir interno a número o null
      legajo,
      titulo: tituloId,
    };

    try {
      await API.put(`/facet/persona/${idPersona}/`, personaEditada);
      handleOpenModal('Éxito', 'La acción se realizó con éxito.');
    } catch (error) {
      console.error('Error al hacer la solicitud PUT:', error);
      handleOpenModal('Error', 'No se pudo realizar la acción.');
    }
  };

  const eliminarPersona = async () => {
    try {
      await API.delete(`/facet/persona/${idPersona}/`);
      handleOpenModal('Persona Eliminada', 'La acción se realizó con éxito.');
    } catch (error) {
      console.error('Error al hacer la solicitud DELETE:', error);
      handleOpenModal('Error', 'No se pudo realizar la acción.');
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
          <Typography variant="h4" gutterBottom>
            Editar Persona
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="DNI" value={dni} onChange={(e) => setDni(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Nombres" value={nombre} onChange={(e) => setNombre(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="titulo-label">Título</InputLabel>
                <Select
                  labelId="titulo-label"
                  value={tituloId}
                  onChange={(e) => setTituloId(Number(e.target.value))}
                >
                  <MenuItem value="">Sin título</MenuItem>
                  {titulos.map((titulo) => (
                    <MenuItem key={titulo.id} value={titulo.id}>
                      {titulo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="estado-label">Estado</InputLabel>
                <Select labelId="estado-label" value={estado} onChange={(e) => setEstado(e.target.value)}>
                  <MenuItem value="1">Activo</MenuItem>
                  <MenuItem value="0">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12}>
  <TextField
    label="Interno"
    type="number" // ✅ Asegurar que solo acepte números
    value={interno}
    onChange={(e) => setInterno(e.target.value === '' ? '' : Number(e.target.value))} // ✅ Conversión segura
    fullWidth
  />
</Grid>


            {/* ✅ Botones de acción */}
            <Grid item xs={12} marginBottom={2}>
              <Button variant="contained" onClick={edicionPersona}>
                Editar
              </Button>
              <Button onClick={() => setConfirmarEliminacion(true)} variant="contained" color="error" style={{ marginLeft: '8px' }}>
                Eliminar
              </Button>
            </Grid>
          </Grid>

          {/* Modales */}
          <BasicModal open={modalVisible} onClose={handleCloseModal} title={modalTitle} content={modalMessage} />
          <ModalConfirmacion open={confirmarEliminacion} onClose={() => setConfirmarEliminacion(false)} onConfirm={eliminarPersona} />
        </Paper>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(EditarPersona);
