import { useEffect, useState } from "react";
import "./styles.css";
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
} from "@mui/material";
import { useRouter } from "next/router";
import DashboardMenu from "../../..";
import withAuth from "../../../../../components/withAut";
import API from "@/api/axiosConfig";

const EditarJefe: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [persona, setPersona] = useState<number>(0);

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    router.push("/dashboard/persons/jefes/");
  };

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, SetDni] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get(`/facet/jefe/${id}/obtener_jefe/`);

        // Extrae y configura los datos del jefe y la persona asociada
        setPersona(response.data.persona.id);
        setNombre(response.data.persona.nombre);
        setApellido(response.data.persona.apellido);
        SetDni(response.data.persona.dni);
        setObservaciones(response.data.observaciones);
        setEstado(response.data.estado);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const edicionDepartamentoJefe = async () => {
    const jefeEditado = {
      persona: persona,
      observaciones: observaciones,
      estado: estado,
    };

    try {
      await API.put(`/facet/jefe/${id}/`, jefeEditado);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.");
      console.error(error);
    }
  };

  const eliminarJefe = async () => {
    try {
      await API.delete(`/facet/jefe/${id}/`);
      handleOpenModal("Jefe Eliminado", "La acción se realizó con éxito.");
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
              Editar Jefe
            </Typography>
          </div>

          {/* Contenido del formulario */}
          <div className="p-4">
            <Grid container spacing={2}>
              {/* Sección: Información de la Persona */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Información de la Persona
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  disabled
                  label="Nombre Completo"
                  value={`${apellido} ${nombre}`}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="DNI"
                  value={dni}
                  disabled
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Sección: Información del Jefe */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Información del Jefe
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2}
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

              {/* Botones de acción centrados */}
              <Grid item xs={12}>
                <div className="flex justify-center gap-3 mt-6">
                  <button
                    onClick={edicionDepartamentoJefe}
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

          {/* Modales */}
          {modalVisible && (
            <div
              className="fixed inset-0 flex items-center justify-center z-[10000]"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}>
              <div className="fixed inset-0 bg-black opacity-50"></div>
              <div className="bg-white rounded-lg shadow-xl p-6 w-96 z-[10001] relative">
                <h3 className="text-xl font-bold text-center mb-2 text-gray-900">
                  {modalTitle}
                </h3>
                <hr className="my-3 border-gray-200" />
                <p className="text-gray-800 text-lg text-center mb-6 font-medium">
                  {modalMessage}
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={handleCloseModal}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium">
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {confirmarEliminacion && (
            <div
              className="fixed inset-0 flex items-center justify-center z-[10000]"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}>
              <div
                className="fixed inset-0 bg-black opacity-50"
                onClick={() => setConfirmarEliminacion(false)}></div>
              <div className="bg-white rounded-lg shadow-xl p-6 w-96 z-[10001] relative">
                <h3 className="text-xl font-bold text-center mb-2 text-gray-900">
                  Confirmar Eliminación
                </h3>
                <hr className="my-3 border-gray-200" />
                <p className="text-gray-800 text-lg text-center mb-6 font-medium">
                  ¿Estás seguro?
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setConfirmarEliminacion(false);
                      eliminarJefe();
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md font-medium">
                    Eliminar
                  </button>
                  <button
                    onClick={() => setConfirmarEliminacion(false)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </Paper>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(EditarJefe);
