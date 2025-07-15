import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  TextField,
  Button,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Grid,
} from "@mui/material";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router"; // Importa useRouter de Next.js
import dayjs from "dayjs"; // Asegúrate de tener instalada esta dependencia
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DashboardMenu from "../../../dashboard";
import withAuth from "../../../../components/withAut";
import { API_BASE_URL } from "../../../../utils/config";
import API from "../../../../api/axiosConfig";

// Habilita los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const CrearDepartamento = () => {
  const h1Style = {
    color: "black",
  };

  const router = useRouter(); // Usamos useRouter para manejar la navegación

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState("");
  const [interno, setInterno] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

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
    router.push("/dashboard/departments/"); // Redirige después de cerrar el modal
  };

  const crearNuevoDepartamento = async () => {
    let nuevoDepartamento = {
      nombre: nombre,
      telefono: telefono,
      estado: Number(estado), // Asegúrate de convertir a número
      interno: interno,
    };

    try {
      const response = await API.post(
        "/facet/departamento/",
        nuevoDepartamento
      );
      handleOpenModal(
        "Éxito",
        "Se creó el departamento con éxito.",
        handleConfirmModal
      );
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.", () => {});
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <Paper elevation={3} className="bg-white shadow-lg rounded-lg">
          {/* Título separado */}
          <div className="p-4 border-b border-gray-200">
            <Typography variant="h5" className="text-gray-800 font-semibold">
              Crear Departamento
            </Typography>
          </div>
          
          {/* Contenido del formulario */}
          <div className="p-4">
            <Grid container spacing={2}>
              {/* Sección: Información del Departamento */}
              <Grid item xs={12}>
                <Typography variant="h6" className="text-gray-700 font-semibold mb-3">
                  Información del Departamento
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nombre"
                  value={nombre}
                  onChange={(e) =>
                    setNombre(capitalizeFirstLetter(e.target.value))
                  }
                  fullWidth
                  variant="outlined"
                  size="small"
                />
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
                  <InputLabel id="demo-simple-select-label">Estado</InputLabel>
                  <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
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
                    onClick={crearNuevoDepartamento}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Crear Departamento
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>
          
          <BasicModal
            open={modalVisible}
            onClose={handleCloseModal}
            title={modalTitle}
            content={modalMessage}
            onConfirm={fn}
          />
        </Paper>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(CrearDepartamento);
