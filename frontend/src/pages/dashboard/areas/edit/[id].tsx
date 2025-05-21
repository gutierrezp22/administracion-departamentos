import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import {
  Container,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Grid,
} from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BasicModal from "@/utils/modal";
import ModalConfirmacion from "@/utils/modalConfirmacion";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import DashboardMenu from "../../../dashboard";
import withAuth from "../../../../components/withAut"; // Importa el HOC
import { API_BASE_URL } from "../../../../utils/config";

dayjs.extend(utc);
dayjs.extend(timezone);

const EditarArea = () => {
  const router = useRouter();
  const { id: idArea } = router.query; // Captura el idArea directamente de la URL

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    router.push("/dashboard/areas/");
  };

  const [area, setArea] = useState<any | null>(null);
  const [iddepartamento, setIddepartamento] = useState<number>(0);
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState<number | "">(0);

  useEffect(() => {
    const fetchData = async () => {
      if (idArea) {
        // Verifica que idArea no sea undefined
        try {
          const response = await axios.get(
            `${API_BASE_URL}/facet/area/${idArea}/`
          );
          const data = response.data;
          setArea(data);
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Error al obtener los datos.",
          });
        }
      }
    };

    fetchData();
  }, [idArea]);

  useEffect(() => {
    if (area) {
      setIddepartamento(area.departamento);
      setNombre(area.nombre);
      setEstado(area.estado);
    }
  }, [area]);

  const edicionArea = async () => {
    const areaEditada = {
      departamento: iddepartamento,
      nombre: nombre,
      estado: estado,
    };

    try {
      await axios.put(`${API_BASE_URL}/facet/area/${idArea}/`, areaEditada, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  const eliminarArea = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/facet/area/${idArea}/`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      handleOpenModal("Área Eliminada", "La acción se realizó con éxito.");
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Areas
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                value={area?.departamento || ""}
                disabled
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Estado"
                value={estado}
                onChange={(e) => setEstado(Number(e.target.value))}
                fullWidth
                variant="outlined">
                <MenuItem value={1}>Activo</MenuItem>
                <MenuItem value={0}>Inactivo</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} marginBottom={2}>
              <button
                onClick={edicionArea}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                Editar
              </button>
              <button
                onClick={() => setConfirmarEliminacion(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200 ml-2">
                Eliminar
              </button>
            </Grid>
          </Grid>
          <BasicModal
            open={modalVisible}
            onClose={handleCloseModal}
            title={modalTitle}
            content={modalMessage}
          />
          <ModalConfirmacion
            open={confirmarEliminacion}
            onClose={() => setConfirmarEliminacion(false)}
            onConfirm={() => {
              setConfirmarEliminacion(false);
              eliminarArea();
            }}
          />
        </Paper>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(EditarArea);
