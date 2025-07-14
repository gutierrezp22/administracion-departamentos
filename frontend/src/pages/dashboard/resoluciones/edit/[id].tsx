import { useEffect, useState } from "react";
import "./styles.css";
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BasicModal from "@/utils/modal";
import ModalConfirmacion from "@/utils/modalConfirmacion";
import { useRouter } from "next/router";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import API from "@/api/axiosConfig";

dayjs.extend(utc);
dayjs.extend(timezone);

const EditarResolucion = () => {
  const router = useRouter();
  const { id: idResolucion } = router.query;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [redirectAfterClose, setRedirectAfterClose] = useState(false); // Controla la redirección

  const [nroExpediente, setNroExpediente] = useState("");
  const [nroResolucion, setNroResolucion] = useState("");
  const [tipo, setTipo] = useState("");
  const [adjunto, setAdjunto] = useState("");
  const [fecha, setFecha] = useState<Dayjs | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState<string>("0");

  useEffect(() => {
    const fetchData = async () => {
      if (idResolucion) {
        try {
          const response = await API.get(`/facet/resolucion/${idResolucion}/`);

          setNroExpediente(response.data.nexpediente);
          setNroResolucion(response.data.nresolucion);
          setTipo(response.data.tipo);
          setAdjunto(response.data.adjunto);

          const parsedFecha = dayjs(response.data.fecha, "DD/MM/YYYY HH:mm:ss");
          setFecha(parsedFecha.isValid() ? parsedFecha : null);

          setObservaciones(response.data.observaciones);
          setEstado(String(response.data.estado));
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
  }, [idResolucion]);

  const edicionResolucion = async () => {
    const resolucionEditada = {
      nexpediente: nroExpediente,
      nresolucion: nroResolucion,
      tipo: tipo || "",
      adjunto: adjunto,
      observaciones: observaciones,
      fecha: fecha && fecha.isValid() ? fecha.toISOString() : "",
      estado: estado,
    };

    try {
      await API.put(`/facet/resolucion/${idResolucion}/`, resolucionEditada);
      setRedirectAfterClose(true); // Activa la redirección después de cerrar el modal
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
    if (redirectAfterClose) {
      router.push("/dashboard/resoluciones/");
      setRedirectAfterClose(false); // Restablece la bandera
    }
  };

  const eliminarResolucion = async () => {
    try {
      await API.delete(`/facet/resolucion/${idResolucion}/`);
      setRedirectAfterClose(true); // Activa la redirección después de cerrar el modal
      handleOpenModal(
        "Resolución Eliminada",
        "La acción se realizó con éxito."
      );
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  const renderModalConfirmacion = () => {
    if (!confirmarEliminacion) return null;

    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
        <div
          className="fixed inset-0 bg-black opacity-50"
          onClick={() => setConfirmarEliminacion(false)}></div>
        <div className="bg-white rounded-lg shadow-xl p-6 w-96 z-50 relative">
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
                eliminarResolucion();
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
    );
  };

  const renderBasicModal = () => {
    if (!modalVisible) return null;

    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
        <div
          className="fixed inset-0 bg-black opacity-50"
          onClick={handleCloseModal}></div>
        <div className="bg-white rounded-lg shadow-xl p-6 w-96 z-50 relative">
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
    );
  };

  return (
    <>
      <DashboardMenu>
        <Container maxWidth="lg">
          <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
            <Typography variant="h4" gutterBottom className="text-gray-800">
              Editar Resolución
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Nro Expediente"
                  value={nroExpediente}
                  onChange={(e) => setNroExpediente(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Nro Resolución"
                  value={nroResolucion}
                  onChange={(e) => setNroResolucion(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  variant="outlined">
                  <MenuItem value="Rector">Rector</MenuItem>
                  <MenuItem value="Decano">Decano</MenuItem>
                  <MenuItem value="Consejo_Superior">Consejo Superior</MenuItem>
                  <MenuItem value="Consejo_Directivo">
                    Consejo Directivo
                  </MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Link Documento Adjunto"
                  value={adjunto}
                  onChange={(e) => setAdjunto(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  variant="outlined">
                  <MenuItem value="1">Activo</MenuItem>
                  <MenuItem value="0">Inactivo</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} marginBottom={2}>
                <button
                  onClick={edicionResolucion}
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
          </Paper>
        </Container>
      </DashboardMenu>

      {renderModalConfirmacion()}
      {renderBasicModal()}
    </>
  );
};

export default withAuth(EditarResolucion);
