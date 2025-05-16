import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import {
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";
import DashboardMenu from "../../../dashboard";
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
  const [filtroMensaje, setFiltroMensaje] = useState("");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
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
      setCurrentPage(
        url.includes("page=")
          ? parseInt(new URL(url).searchParams.get("page") || "1")
          : 1
      );
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
      <div className="p-6">
        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
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
              <button
                onClick={filtrarNotificaciones}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200">
                Filtrar
              </button>
            </Grid>
          </Grid>

          <TableContainer component={Paper} className="mt-4">
            <Table>
              <TableHead>
                <TableRow style={{ backgroundColor: "#3b82f6" }}>
                  <TableCell style={{ color: "white", fontWeight: 500 }}>
                    Apellido
                  </TableCell>
                  <TableCell style={{ color: "white", fontWeight: 500 }}>
                    Nombre
                  </TableCell>
                  <TableCell style={{ color: "white", fontWeight: 500 }}>
                    Fecha
                  </TableCell>
                  <TableCell style={{ color: "white", fontWeight: 500 }}>
                    Mensaje
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notificaciones.map((noti) => (
                  <TableRow key={noti.id} className="hover:bg-gray-50">
                    <TableCell>{noti.persona_apellido}</TableCell>
                    <TableCell>{noti.persona_nombre}</TableCell>
                    <TableCell>
                      {noti.fecha_creacion
                        ? (() => {
                            const [day, month, year] = noti.fecha_creacion
                              .split(" ")[0]
                              .split("/");
                            const fixedDate = new Date(
                              `${year}-${month}-${day}T00:00:00`
                            );
                            return fixedDate.toLocaleDateString();
                          })()
                        : "Fecha inválida"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => mostrarMensaje(noti.mensaje)}
                        className="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50 transition-colors duration-200">
                        <VisibilityIcon />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => prevUrl && setCurrentUrl(prevUrl)}
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
              onClick={() => nextUrl && setCurrentUrl(nextUrl)}
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

export default withAuth(ListaNotificaciones);
