import { useEffect, useState } from 'react';
import './styles.css';
import {
  Container,
  Paper,
  TextField,
  Button,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Grid,
  Typography,
} from '@mui/material';
import BasicModal from '@/utils/modal';
import { useRouter } from 'next/router';
import DashboardMenu from '../../../dashboard';
import withAuth from "../../../../components/withAut"; 
import API from '@/api/axiosConfig';

interface Titulo {
  id: number;
  nombre: string;
}

// Componente para crear una nueva persona
const CrearPersona = () => {
  const router = useRouter();

  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [legajo, setLegajo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [interno, setInterno] = useState('');
  const [estado, setEstado] = useState('1'); // Valor por defecto: Activo
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [tituloId, setTituloId] = useState<number | ''>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [fn, setFn] = useState(() => () => {});

  // Función para capitalizar la primera letra de un texto
  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  // Funciones de control del modal
  const handleOpenModal = (title: string, message: string, onConfirm: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
    setFn(() => onConfirm);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage('');
  };

  // Obtener títulos al cargar la página
  useEffect(() => {
    const fetchTitulos = async () => {
      try {
        const response = await API.get(`/facet/tipo-titulo/`);
        setTitulos(response.data.results);
      } catch (error) {
        console.error('Error al obtener títulos:', error);
      }
    };

    fetchTitulos();
  }, []);

  const handleConfirmModal = () => {
    router.push('/dashboard/persons/');
  };

  // Función para crear una nueva persona
  const crearNuevaPersona = async () => {
    // Validar campos requeridos
    if (!nombre.trim() || !apellido.trim() || !dni.trim()) {
      handleOpenModal('Error', 'Los campos Nombre, Apellido y DNI son obligatorios.', () => {});
      return;
    }

    const nuevaPersona = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim() || null,
      dni: dni.trim(),
      estado: estado,
      email: email.trim() || null,
      interno: interno.trim() ? parseInt(interno.trim()) : null,
      legajo: legajo.trim() || null,
      titulo: tituloId || null,
    };

    try {
      const response = await API.post(`/facet/persona/`, nuevaPersona);
      handleOpenModal('Éxito', 'Se creó la persona con éxito.', handleConfirmModal);
    } catch (error) {
      console.error('Error al crear persona:', error);
      handleOpenModal('Error', 'No se pudo realizar la acción.', () => {});
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <Paper elevation={3} className="bg-white shadow-lg rounded-lg">
          {/* Título separado */}
          <div className="p-4 border-b border-gray-200">
            <Typography variant="h5" className="text-gray-800 font-semibold">
              Crear Persona
            </Typography>
          </div>
          
          {/* Contenido del formulario */}
          <div className="p-4">
            <Grid container spacing={2}>
              {/* Sección: Información Personal */}
              <Grid item xs={12}>
                <Typography variant="h6" className="text-gray-700 font-semibold mb-3">
                  Información Personal
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField 
                  label="DNI" 
                  value={dni} 
                  onChange={(e) => setDni(e.target.value)} 
                  fullWidth 
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Legajo"
                  value={legajo}
                  onChange={(e) => setLegajo(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nombres"
                  value={nombre}
                  onChange={(e) => setNombre(capitalizeFirstLetter(e.target.value))}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Apellido"
                  value={apellido}
                  onChange={(e) => setApellido(capitalizeFirstLetter(e.target.value))}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>
              
              {/* Sección: Información de Contacto */}
              <Grid item xs={12}>
                <Typography variant="h6" className="text-gray-700 font-semibold mb-3">
                  Información de Contacto
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField 
                  label="Teléfono" 
                  value={telefono} 
                  onChange={(e) => setTelefono(e.target.value)} 
                  fullWidth 
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField 
                  label="Email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  fullWidth 
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField 
                  label="Interno" 
                  value={interno} 
                  onChange={(e) => setInterno(e.target.value)} 
                  fullWidth 
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Título</InputLabel>
                  <Select 
                    value={tituloId} 
                    label="Título" 
                    onChange={(e) => setTituloId(Number(e.target.value))}>
                    <MenuItem value="">Sin título</MenuItem>
                    {titulos.map((titulo) => (
                      <MenuItem key={titulo.id} value={titulo.id}>
                        {titulo.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select 
                    value={estado} 
                    label="Estado" 
                    onChange={(e) => setEstado(e.target.value)}>
                    <MenuItem value={1}>Activo</MenuItem>
                    <MenuItem value={0}>Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Botón de acción centrado */}
              <Grid item xs={12}>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={crearNuevaPersona}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Crear Persona
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>
          
          <BasicModal open={modalVisible} onClose={handleCloseModal} title={modalTitle} content={modalMessage} onConfirm={fn} />
        </Paper>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(CrearPersona);
