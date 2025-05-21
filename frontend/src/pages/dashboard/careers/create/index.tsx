import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import { Typography, TextField, Grid, Paper, MenuItem } from "@mui/material";
import dayjs from "dayjs"; // Asegúrate de tener instalada esta dependencia
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router"; // Importa useRouter de Next.js
import DashboardMenu from "../../../dashboard";
import withAuth from "../../../../components/withAut";
import { API_BASE_URL } from "../../../../utils/config";
import API from "../../../../api/axiosConfig";

// Habilita los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const CrearCarrera = () => {
  const router = useRouter(); // Usamos useRouter de Next.js

  type TipoCarrera = "Pregrado" | "Grado" | "Posgrado";

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [planEstudio, setPlanEstudio] = useState("");
  const [sitio, setsitio] = useState("");
  const [estado, setEstado] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});

  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  const handleOpenModal = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setModalTitle(title); // Establecer el título del modal
    setModalMessage(message);
    setModalVisible(true);
    setFn(() => onConfirm);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
  };

  const handleConfirmModal = () => {
    router.push("/dashboard/careers/"); // Cambia a router.push para el enrutamiento en Next.js
  };

  const crearNuevaCarrera = async () => {
    let nuevaCarrera = {
      nombre: nombre,
      tipo: tipo,
      planestudio: planEstudio,
      sitio: sitio,
      estado: estado,
    };

    try {
      const response = await API.post(`/facet/carrera/`, nuevaCarrera);
      handleOpenModal(
        "Éxito",
        "Se creó la carrera con éxito.",
        handleConfirmModal
      );
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.", () => {});
    }
  };

  return (
    <DashboardMenu>
      <div className="p-6">
        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Carrera
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
                <MenuItem value={1}>Activo</MenuItem>
                <MenuItem value={0}>Inactivo</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} marginBottom={2}>
              <button
                onClick={crearNuevaCarrera}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                Crear
              </button>
            </Grid>
          </Grid>
          <BasicModal
            open={modalVisible}
            onClose={handleCloseModal}
            title={modalTitle}
            content={modalMessage}
            onConfirm={fn}
          />
        </Paper>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(CrearCarrera);
