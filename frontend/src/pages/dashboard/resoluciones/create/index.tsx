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
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs"; // Asegúrate de tener instalada esta dependencia
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BasicModal from "@/utils/modal";
import Swal from "sweetalert2";
import { useRouter } from "next/router"; // Importa useRouter de Next.js
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut"; 
import { API_BASE_URL } from "../../../../utils/config";
import API from "@/api/axiosConfig";

// Habilita los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const CrearResolucion = () => {
  const router = useRouter(); // Usamos useRouter para manejar la navegación

  interface Resolucion {
    idresolucion: number;
    nexpediente: string;
    nresolucion: string;
    tipo: string;
    fechadecarga: Date;
    fecha: Date; // Aquí indicas que 'fecha' es de tipo Date
    adjunto: string;
    estado: 0 | 1; // Aquí indicas que 'estado' es un enum que puede ser 0 o 1
    // Otros campos según sea necesario
  }

  const [nroExpediente, setNroExpediente] = useState("");
  const [nroResolucion, setNroResolucion] = useState("");
  const [tipo, setTipo] = useState("");
  const [adjunto, setAdjunto] = useState("");
  const [fechaCarga, setFechaCarga] = useState("");
  const [fecha, setFecha] = useState<dayjs.Dayjs | null>(null);
  const [estado, setEstado] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});

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
    router.push("/dashboard/resoluciones/"); // Navegar a la lista de resoluciones
  };

  const crearNuevaResolucion = async () => {
    const nuevaResolucion = {
      nexpediente: nroExpediente,
      nresolucion: nroResolucion,
      tipo: tipo || "",
      adjunto: adjunto,
      observaciones: "", // Puedes asignar el valor que corresponda
      fechadecarga: new Date(), // Usamos la fecha actual
      fecha: fecha ? fecha.toISOString() : null, // Convierte la fecha a formato ISO si existe
      estado: estado,
    };

    try {
      const response = await API.post(`/facet/resolucion/`, nuevaResolucion);
      handleOpenModal(
        "Éxito",
        "Se creó la resolución con éxito.",
        handleConfirmModal
      );
    } catch (error) {
      handleOpenModal("Error", "NO se pudo realizar la acción.", () => {});
    }
  };

  return (
    <DashboardMenu>
    <Container maxWidth="lg">
        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
          Crear Resolución
        </Typography>
        {/* Agrega controles de entrada y botones para los filtros */}
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
                <MenuItem value="Consejo_Directivo">Consejo Directivo</MenuItem>
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
          <Grid item xs={12} marginBottom={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Fecha"
                value={fecha}
                onChange={(date) => {
                  if (date) {
                    const fechaSeleccionada = dayjs(date).utc(); // Usa .utc() para evitar problemas de zona horaria
                    setFecha(fechaSeleccionada);
                  }
                }}
                  slotProps={{
                    textField: { fullWidth: true, variant: "outlined" },
                  }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} marginBottom={2}>
              <button
                onClick={crearNuevaResolucion}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
              Crear
              </button>
            </Grid>
          </Grid>
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
                    onClick={() => {
                      handleCloseModal();
                      fn();
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium">
                    OK
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

export default withAuth(CrearResolucion);
