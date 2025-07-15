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
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Editar Área</h1>
          </div>

          <div className="p-4">
            <Grid container spacing={2}>
              {/* Sección de Información del Área */}
              <Grid item xs={12}>
                <Typography variant="h6" className="text-gray-700 font-semibold mb-3">
                  Información del Área
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Nombre del Área"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Estado"
                      value={estado}
                      onChange={(e) => setEstado(Number(e.target.value))}
                      fullWidth
                      variant="outlined"
                      size="small">
                      <MenuItem value={1}>Activo</MenuItem>
                      <MenuItem value={0}>Inactivo</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Grid>

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Sección de Departamento */}
              <Grid item xs={12}>
                <Typography variant="h6" className="text-gray-700 font-semibold mb-3">
                  Departamento Asignado
                </Typography>
                <TextField
                  value={area?.departamento || ""}
                  disabled
                  fullWidth
                  variant="outlined"
                  size="small"
                  label="Departamento"
                />
              </Grid>

              {/* Botones de acción */}
              <Grid item xs={12}>
                <div className="flex justify-center gap-3 mt-6">
                  <button
                    onClick={edicionArea}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Guardar Cambios
                  </button>
                  <button
                    onClick={() => setConfirmarEliminacion(true)}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Eliminar Área
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>
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
            eliminarArea();
          }}
        />
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(EditarArea);
