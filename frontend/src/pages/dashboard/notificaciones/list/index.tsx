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
import Swal from "sweetalert2";
import DashboardMenu from '../../../dashboard';
import withAuth from "../../../../components/withAut"; 
import { API_BASE_URL } from "../../../../utils/config";

interface Notificacion {
  id: number;
  fecha_creacion: string;
  leido: boolean;
  mensaje: string;
  persona: number;
  persona_apellido: string;
  persona_nombre: string;
}


const ListaNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [filtroApellido, setFiltroApellido] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroMensaje, setFiltroMensaje] = useState('');
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  // const [currentUrl, setCurrentUrl] = useState<string>(`${API_BASE_URL}/facet/notificacion/`);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `${API_BASE_URL}/facet/notificacion/`
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
      setNotificaciones(response.data.results);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setTotalItems(response.data.count);
      setCurrentPage(url.includes("page=") ? parseInt(new URL(url).searchParams.get("page") || "1") : 1);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al obtener las notificaciones.",
      });
    }
  };

  const filtrarNotificaciones = () => {
    let url = `${API_BASE_URL}/facet/notificacion/?`;
    const params = new URLSearchParams();

    // Asegurarse de que los filtros no estén vacíos antes de agregarlos
    if (filtroApellido.trim() !== "") {
        params.append("persona_apellido", filtroApellido.trim());
    }
    if (filtroNombre.trim() !== "") {
        params.append("persona_nombre", filtroNombre.trim());
    }
    if (filtroFecha.trim() !== "") {
        params.append("fecha_creacion_after", filtroFecha);
        params.append("fecha_creacion_before", filtroFecha);
    }
    if (filtroMensaje.trim() !== "") {
        params.append("mensaje__icontains", filtroMensaje.trim());
    }

    params.append("page_size", pageSize.toString());
    params.append("page", "1"); // Siempre reiniciar en la primera página

    // Verificar si hay filtros antes de cambiar la URL
    const finalUrl = url + params.toString();

    if (params.toString().length > 0) {
        setCurrentUrl(finalUrl);
    } else {
        console.warn("⚠ No se aplicaron filtros, URL no se actualizará.");
    }
};




  const mostrarMensaje = (mensaje: string) => {
    Swal.fire({
      title: "Mensaje enviado",
      text: mensaje,
      icon: "info",
    });
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom>
            Notificaciones
          </Typography>

          <Grid container spacing={2} marginBottom={2}>
            <Grid item xs={4}>
              <TextField
                label="Buscar por apellido"
                value={filtroApellido}
                onChange={(e) => setFiltroApellido(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Buscar por nombre"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Buscar por fecha"
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={filtrarNotificaciones}>
                Filtrar
              </Button>
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow className="header-row">
                  <TableCell className="header-cell">
                    <Typography variant="subtitle1">Apellido</Typography>
                  </TableCell>
                  <TableCell className="header-cell">
                    <Typography variant="subtitle1">Nombre</Typography>
                  </TableCell>
                  <TableCell className="header-cell">
                    <Typography variant="subtitle1">Fecha</Typography>
                  </TableCell>
                  <TableCell className="header-cell">
                    <Typography variant="subtitle1">Mensaje</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notificaciones.map((noti) => (
                  <TableRow key={noti.id}>
                    <TableCell>{noti.persona_apellido}</TableCell>
                    <TableCell>{noti.persona_nombre}</TableCell>
                    <TableCell>
                    {noti.fecha_creacion
                      ? (() => {
                          const [day, month, year] = noti.fecha_creacion.split(" ")[0].split("/"); // Extraer partes de la fecha
                          const fixedDate = new Date(`${year}-${month}-${day}T00:00:00`); // Crear fecha en formato correcto sin afectar la zona horaria
                          return fixedDate.toLocaleDateString();
                        })()
                      : "Fecha inválida"}
                  </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => mostrarMensaje(noti.mensaje)}
                      >
                        Ver Mensaje
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Controles de paginación */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => prevUrl && setCurrentUrl(prevUrl)}
              disabled={!prevUrl}
            >
              Anterior
            </Button>
            <Typography variant="body1">
              Página {currentPage} de {totalPages}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => nextUrl && setCurrentUrl(nextUrl)}
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

export default withAuth(ListaNotificaciones);