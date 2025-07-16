import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Grid,
} from "@mui/material";
import BasicModal from "@/utils/modal";
import ModalConfirmacion from "@/utils/modalConfirmacion";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import { API_BASE_URL } from "../../../../utils/config";
import API from "../../../../api/axiosConfig";

dayjs.extend(utc);
dayjs.extend(timezone);

const EditarDepartamento = () => {
  const router = useRouter();
  const { id: idDepartamento } = router.query; // Obtener el id de la URL

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);

  const [departamento, setDepartamento] = useState({
    nombre: "",
    telefono: "",
    estado: "",
    interno: "",
  });

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    router.push("/dashboard/departments/");
  };

  useEffect(() => {
    if (idDepartamento) {
      const fetchData = async () => {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/facet/departamento/${idDepartamento}/`
          );
          setDepartamento(response.data);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchData();
    }
  }, [idDepartamento]);

  const edicionDepartamento = async () => {
    try {
      await API.put(`/facet/departamento/${idDepartamento}/`, departamento);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  const eliminarDepartamento = async () => {
    try {
      await API.delete(`/facet/departamento/${idDepartamento}/`);
      handleOpenModal(
        "Departamento Eliminado",
        "La acción se realizó con éxito."
      );
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <Paper elevation={3} className="bg-white shadow-lg rounded-lg">
          {/* Título separado */}
          <div className="p-4 border-b border-gray-200">
            <Typography variant="h5" className="text-gray-800 font-semibold">
              Editar Departamento
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
                  value={departamento.nombre}
                  onChange={(e) =>
                    setDepartamento({ ...departamento, nombre: e.target.value })
                  }
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Teléfono"
                  value={departamento.telefono}
                  onChange={(e) =>
                    setDepartamento({ ...departamento, telefono: e.target.value })
                  }
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Interno"
                  value={departamento.interno}
                  onChange={(e) =>
                    setDepartamento({ ...departamento, interno: e.target.value })
                  }
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="estado-label">Estado</InputLabel>
                  <Select
                    labelId="estado-label"
                    id="estado-select"
                    value={departamento.estado}
                    label="Estado"
                    onChange={(e) =>
                      setDepartamento({ ...departamento, estado: e.target.value })
                    }>
                    <MenuItem value={1}>Activo</MenuItem>
                    <MenuItem value={0}>Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Botones de acción centrados */}
              <Grid item xs={12}>
                <div className="flex justify-center gap-3 mt-6">
                  <button
                    onClick={edicionDepartamento}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Guardar Cambios
                  </button>
                  <button
                    onClick={() => setConfirmarEliminacion(true)}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Eliminar
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
          />
          <ModalConfirmacion
            open={confirmarEliminacion}
            onClose={() => setConfirmarEliminacion(false)}
            onConfirm={() => {
              setConfirmarEliminacion(false);
              eliminarDepartamento();
            }}
          />
        </Paper>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(EditarDepartamento);
