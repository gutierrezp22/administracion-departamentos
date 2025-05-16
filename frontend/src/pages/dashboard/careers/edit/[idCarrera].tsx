import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import { Typography, TextField, Grid, Paper, MenuItem } from "@mui/material";
import dayjs from "dayjs"; // Asegúrate de tener instalada esta dependencia
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BasicModal from "@/utils/modal";
import ModalConfirmacion from "@/utils/modalConfirmacion";
import { useRouter } from "next/router"; // Importa useRouter de Next.js
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import { API_BASE_URL } from "../../../../utils/config";
import API from "@/api/axiosConfig";

// Habilita los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const EditarCarrera: React.FC = () => {
  const router = useRouter(); // Usamos useRouter de Next.js
  const { idCarrera } = router.query; // Obtenemos el idCarrera desde la ruta7

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title); // Establecer el título del modal
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    router.push("/dashboard/careers/"); // Usamos router.push para la navegación
  };

  const [modalOpen, setModalOpen] = useState(false);
  const closeModal = () => setModalOpen(false);

  type TipoCarrera = "Pregrado" | "Grado" | "Posgrado";

  interface Carrera {
    idCarrera: number;
    nombre: string;
    tipo: TipoCarrera;
    planestudio: string;
    sitio: string;
    estado: 0 | 1;
  }

  const [carrera, setCarrera] = useState<Carrera>();
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [planEstudio, setPlanEstudio] = useState("");
  const [sitio, setsitio] = useState("");
  const [estado, setEstado] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (idCarrera) {
        // Verificamos que idCarrera esté definido
        try {
          const response = await axios.get(
            `${API_BASE_URL}/facet/carrera/${idCarrera}/`
          );
          const data = response.data;
          setCarrera(data);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
  }, [idCarrera]);

  useEffect(() => {
    if (carrera) {
      setNombre(carrera.nombre);
      setEstado(String(carrera.estado));
      setTipo(String(carrera.tipo));
      setPlanEstudio(carrera.planestudio);
      setsitio(carrera.sitio);
    }
  }, [carrera]);

  const edicionCarrera = async () => {
    const carreraEditada = {
      nombre: nombre,
      tipo: tipo,
      planestudio: planEstudio,
      sitio: sitio,
      estado: estado,
    };

    try {
      await API.put(`/facet/carrera/${idCarrera}/`, carreraEditada);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      console.error("Error al hacer la solicitud PUT:", error);
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  const eliminarCarrera = async () => {
    try {
      await API.delete(`/facet/carrera/${idCarrera}/`);
      handleOpenModal("Carrera Eliminada", "La acción se realizó con éxito.");
    } catch (error) {
      console.error("Error al hacer la solicitud DELETE:", error);
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <div className="p-6">
        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Editar Carrera
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
                select
                label="Tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoCarrera)}
                fullWidth
                variant="outlined">
                <MenuItem value="Pregrado">Pregrado</MenuItem>
                <MenuItem value="Grado">Grado</MenuItem>
                <MenuItem value="Posgrado">Posgrado</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Plan de Estudio"
                value={planEstudio}
                onChange={(e) => setPlanEstudio(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Sitio"
                value={sitio}
                onChange={(e) => setsitio(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                label="Estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                fullWidth
                variant="outlined">
                <MenuItem value="1">Activo</MenuItem>
                <MenuItem value="0">Inactivo</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} marginBottom={2} className="flex gap-4">
              <button
                onClick={edicionCarrera}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                Editar
              </button>
              <button
                onClick={() => setConfirmarEliminacion(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
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
              eliminarCarrera();
            }}
          />
        </Paper>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(EditarCarrera);
