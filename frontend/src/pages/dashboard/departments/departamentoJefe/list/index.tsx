import { useEffect, useState } from 'react';
import './styles.css';
import axios from 'axios';
import { Container, Grid, Paper,FormControlLabel,Checkbox, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography, TextField, Button, InputLabel, Select, MenuItem, FormControl, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'; // Ícono de email con check
import Link from 'next/link'; // Cambiado para usar Link de Next.js
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import DashboardMenu from '../../../../dashboard';
import dayjs from 'dayjs';
import withAuth from "../../../../../components/withAut"; 
import { API_BASE_URL } from "../../../../../utils/config";
import Swal from 'sweetalert2';
// import { FormControlLabel, Checkbox } from "@mui/material";



const ListaDepartamentosJefe = () => {
  const h1Style = {
    color: 'black',
  };

  interface Departamento {
    id: number;
    nombre: string;
    telefono: string;
    estado: 0 | 1;
  }

  interface Resolucion {
    id: number;
    nexpediente: string;
    nresolucion: string;
    tipo: string;
    fechadecarga: string; // Actualizado de Date a string
    fecha: string; // Actualizado de Date a string
    adjunto: string;
    observaciones: string;
    estado: 0 | 1;
  }

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
  }

  interface Jefe {
    id: number;
    persona: Persona;
    observaciones: string;
    estado: 0 | 1;
  }

  interface DepartamentoJefe {
    id: number;
    jefe: Jefe; // Cambiado de number a Jefe
    departamento: Departamento;
    resolucion: Resolucion;
    fecha_de_inicio: string; // Actualizado de Date a string
    fecha_de_fin: string | null; // Actualizado de Date a string | null
    observaciones: string;
    estado: 0 | 1;
    notificado: boolean; // ✅ Agregado campo notificado
  }

  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [deptoJefes, setDeptoJefes] = useState<DepartamentoJefe[]>([]);
  const [jefes, setJefes] = useState<Jefe[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroDni, setFiltroDni] = useState('');
  const [filtroApellido, setFiltroApellido] = useState('');
  const [filtroLegajo, setFiltroLegajo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string | number>('');
  const [filtroDepartamento, setFiltroDepartamento] = useState<string | ''>('');
  const [filtroResolucion, setFiltroResolucion] = useState<string | ''>('');
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(`${API_BASE_URL}/facet/jefe-departamento/list_detalle/`);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mostrarVencimientos, setMostrarVencimientos] = useState(false);


  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      const response = await axios.get(url);
      setDeptoJefes(response.data.results);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setTotalItems(response.data.count);
      setCurrentPage(1);

      const personasResponse = await axios.get(`${API_BASE_URL}/facet/persona/`);
      setPersonas(personasResponse.data.results);
      const departamentosResponse = await axios.get(`${API_BASE_URL}/facet/departamento/`);
      setDepartamentos(departamentosResponse.data.results);
      const resolucionesResponse = await axios.get(`${API_BASE_URL}/facet/resolucion/`);
      setResoluciones(resolucionesResponse.data.results);
      const jefesResponse = await axios.get(`${API_BASE_URL}/facet/jefe/list_jefes_persona/`);
      setJefes(jefesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // ✅ Función para alternar el modo de "Próximos vencimientos"
const toggleVencimientos = () => {
  setMostrarVencimientos(!mostrarVencimientos);
  const newUrl = mostrarVencimientos
    ? `${API_BASE_URL}/facet/jefe-departamento/list_detalle/`
    : `${API_BASE_URL}/facet/jefe-departamento/list_proximos_vencimientos/`;
  setCurrentUrl(newUrl);
};


// ✅ Función para enviar notificación manualmente
const enviarNotificacion = async (id: number, email: string) => {
  try {
    // ✅ Confirmación antes de enviar la notificación
    const confirmacion = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Se enviará una notificación a ${email}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, enviar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) {
      return; // ❌ Cancelar si el usuario no confirma
    }

    // ✅ Mostrar modal de carga
    Swal.fire({
      title: "Enviando notificación...",
      text: "Por favor, espera mientras se envía la notificación.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading(); // 🔄 Mostrar spinner de carga
      }
    });

    // ✅ Enviar la notificación
    await axios.post(`${API_BASE_URL}/facet/notificacion/crear_notificacion/`, {
      persona_id: id,
      mensaje: `Recordatorio: Tu cargo vence pronto. Contacta administración para renovarlo.`,
    });

    // ✅ Mostrar confirmación cuando se complete
    Swal.fire({
      icon: "success",
      title: "Notificación enviada",
      text: `Se envió un correo a ${email}`,
    });

  } catch (error) {
    console.error("Error enviando notificación:", error);

    // ❌ Mostrar error en caso de fallo
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo enviar la notificación.",
    });
  }
};

const confirmarReenvio = async (id: number, email: string) => {
  try {
    const confirmacion = await Swal.fire({
      title: "¿Reenviar notificación?",
      text: `Esta persona ya fue notificada. ¿Quieres enviarla de nuevo?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, reenviar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    await enviarNotificacion(id, email);
  } catch (error) {
    console.error("Error reenviando notificación:", error);
  }
};


const filtrarJefesDepartamentos = () => {
  let baseUrl = mostrarVencimientos
    ? `${API_BASE_URL}/facet/jefe-departamento/list_proximos_vencimientos/`
    : `${API_BASE_URL}/facet/jefe-departamento/list_detalle/`;

  const params = new URLSearchParams();
  if (filtroNombre !== '') {
    params.append('jefe__persona__nombre__icontains', filtroNombre);
  }
  if (filtroDni !== '') {
    params.append('jefe__persona__dni__icontains', filtroDni);
  }
  if (filtroEstado !== '') {
    params.append('jefe__estado', filtroEstado.toString());
  }
  if (filtroApellido !== '') {
    params.append('jefe__persona__apellido__icontains', filtroApellido);
  }
  if (filtroLegajo !== '') {
    params.append('jefe__persona__legajo__icontains', filtroLegajo);
  }
  if (filtroDepartamento !== '') {
    params.append('departamento__nombre__icontains', filtroDepartamento);
  }
  if (filtroResolucion !== '') {
    params.append('resolucion__nresolucion__icontains', filtroResolucion);
  }

  const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  setCurrentUrl(finalUrl);
};


  
const descargarExcel = async () => {
  try {
    let allDeptoJefes: DepartamentoJefe[] = [];

    // Usa la URL personalizada para obtener los detalles de jefe con la información completa
    let url = `${API_BASE_URL}/facet/jefe-departamento/list_detalle/`;

    while (url) {
      const response = await axios.get(url);
      const data = response.data;  // Asumimos que data es un array directamente

      // Mapea los resultados, asegurando que `nombre` y `apellido` estén disponibles
      allDeptoJefes = [
        ...allDeptoJefes,
        ...data.map((item: any) => ({
          ...item,
          jefe: {
            persona: {
              nombre: item.jefe.persona.nombre,
              apellido: item.jefe.persona.apellido,
            },
          },
          fecha_de_inicio: formatFecha(item.fecha_de_inicio),
          fecha_de_fin: item.fecha_de_fin ? formatFecha(item.fecha_de_fin) : 'N/A',
        })),
      ];

      // Aquí, asegúrate de actualizar `url` si la respuesta proporciona una paginación con `next`
      url = response.data.next; // Cambiar esta línea si `next` se encuentra en otro nivel
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      allDeptoJefes.map((item) => ({
        'Nombre': item.jefe.persona.nombre,
        'Apellido': item.jefe.persona.apellido,
        'Departamento': item.departamento.nombre,
        'Resolución': item.resolucion.nresolucion,
        'Fecha de Inicio': item.fecha_de_inicio,
        'Fecha de Fin': item.fecha_de_fin,
        'Estado': item.estado == 1 ? 'Activo' : 'Inactivo',
        'Observaciones': item.observaciones,
      }))
    );

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Departamento Jefes');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(excelBlob, 'departamento_jefes.xlsx');
  } catch (error) {
    console.error('Error downloading Excel:', error);
  }
};

  const formatFecha = (fecha: string) => dayjs(fecha).format('DD-MM-YYYY');

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
    <Container maxWidth="lg">
      <div>
        <Link href="/dashboard/departments/departamentoJefe/create" passHref>
          <Button variant="contained" endIcon={<AddIcon />}>
            Agregar Jefe
          </Button>
        </Link>
        <Button variant="contained" color="primary" onClick={descargarExcel} style={{ marginLeft: '10px' }}>
          Descargar Excel
        </Button>
      </div>

      <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
        <Typography variant="h4" gutterBottom>
          Jefes Departamentos
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
            <TextField
              label="Departamento"
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={4} marginBottom={2}>
            <TextField
              label="Resolución"
              value={filtroResolucion}
              onChange={(e) => setFiltroResolucion(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={4} marginBottom={2}>
            <FormControlLabel
              control={
                <Checkbox checked={mostrarVencimientos} onChange={toggleVencimientos} />
              }
              label="Próximos Vencimientos"
            />
          </Grid>
          <Grid item xs={4} marginBottom={2}>
            <Button variant="contained" onClick={filtrarJefesDepartamentos}>
              Filtrar
            </Button>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow className='header-row'>
        <TableCell className='header-cell'>
          <Typography variant="subtitle1">Nombre</Typography>
        </TableCell>
        <TableCell className='header-cell'>
          <Typography variant="subtitle1">Apellido</Typography>
        </TableCell>
        <TableCell className='header-cell'>
          <Typography variant="subtitle1">Departamento</Typography>
        </TableCell>
        <TableCell className='header-cell'>
          <Typography variant="subtitle1">Resolución</Typography>
        </TableCell>
        <TableCell className='header-cell'>
          <Typography variant="subtitle1">Fecha de Inicio</Typography>
        </TableCell>
        <TableCell className='header-cell'>
          <Typography variant="subtitle1">Fecha de Fin</Typography>
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
      {deptoJefes.map((deptoJefe) => (
        <TableRow key={deptoJefe.id}>
          <TableCell>{deptoJefe.jefe.persona.nombre}</TableCell>
          <TableCell>{deptoJefe.jefe.persona.apellido}</TableCell>
          <TableCell>{deptoJefe.departamento.nombre}</TableCell>
          <TableCell>{deptoJefe.resolucion.nresolucion}</TableCell>
          <TableCell>{formatFecha(deptoJefe.fecha_de_inicio)}</TableCell>
          <TableCell>{deptoJefe.fecha_de_fin ? formatFecha(deptoJefe.fecha_de_fin) : '-'}</TableCell>
          <TableCell>{deptoJefe.estado == 1 ? 'Activo' : 'Inactivo'}</TableCell>
          
           {/* ✅ Acciones: Ver, Editar y Notificar */}
          <TableCell>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Ver Observaciones */}
              <Tooltip title="Ver Observaciones">
                <VisibilityIcon style={{ cursor: 'pointer' }} />
              </Tooltip>

              {/* Editar */}
              <Tooltip title="Editar">
                <Link href={`/dashboard/departments/departamentoJefe/edit/${deptoJefe.id}`} passHref>
                  <EditIcon style={{ cursor: 'pointer' }} />
                </Link>
              </Tooltip>

              {/* Notificar (solo si tiene email) */}
              {deptoJefe.jefe.persona.email && (
            <Tooltip title={deptoJefe.notificado ? "Notificación ya enviada. ¿Enviar de nuevo?" : "Enviar Notificación"}>
              {deptoJefe.notificado ? (
                <MarkEmailReadIcon
                  style={{ cursor: 'pointer', color: 'green' }} 
                  onClick={() => confirmarReenvio(deptoJefe.jefe.persona.id, deptoJefe.jefe.persona.email)}
                />
              ) : (
                <EmailIcon
                  style={{ cursor: 'pointer' }} 
                  onClick={() => enviarNotificacion(deptoJefe.jefe.persona.id, deptoJefe.jefe.persona.email)}
                />
              )}
            </Tooltip>
          )}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              prevUrl && setCurrentUrl(prevUrl);
              setCurrentPage(currentPage - 1);
            }}
            disabled={!prevUrl}
          >
            Anterior
          </Button>
          <Typography variant="body1">
            Página {currentPage} de {Math.ceil(totalItems / pageSize)}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              nextUrl && setCurrentUrl(nextUrl);
              setCurrentPage(currentPage + 1);
            }}
            disabled={!nextUrl}
          >
            Siguiente
          </Button>
        </div>
      </Paper>
    </Container>
    </DashboardMenu>
  );
};

export default withAuth(ListaDepartamentosJefe);
