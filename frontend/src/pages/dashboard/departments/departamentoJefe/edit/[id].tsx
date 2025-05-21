import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { useRouter } from "next/router";
import DashboardMenu from "../../..";
import BasicModal from "@/utils/modal";
import ModalConfirmacion from "@/utils/modalConfirmacion";
import withAuth from "../../../../../components/withAut";
import { API_BASE_URL } from "../../../../../utils/config";
import API from "../../../../../api/axiosConfig";

const EditarDepartamentoJefe = () => {
  const router = useRouter();
  const { id } = router.query;

  interface Resolucion {
    id: number;
    nexpediente: string;
    nresolucion: string;
  }

  interface Persona {
    id: number;
    nombre: string;
    apellido: string;
  }

  interface Jefe {
    id: number;
    persona: Persona;
  }

  interface Departamento {
    id: number;
    nombre: string;
  }

  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(null);
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState("");
  const [departamento, setDepartamento] = useState<Departamento | null>(null);
  const [jefe, setJefe] = useState<Jefe | null>(null);
  const [resolucion, setResolucion] = useState<Resolucion | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/facet/jefe-departamento/${id}/obtener_detalle/`
          );
          const data = response.data;

          setFechaInicio(dayjs(data.fecha_de_inicio));
          setFechaFin(data.fecha_de_fin ? dayjs(data.fecha_de_fin) : null);
          setObservaciones(data.observaciones);
          setEstado(String(data.estado));
          setDepartamento(data.departamento);
          setJefe(data.jefe);
          setResolucion(data.resolucion);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
  }, [id]);

  const eliminarJefeDepartamento = async () => {
    try {
      await API.delete(`/facet/jefe-departamento/${id}/`);
      handleOpenModal(
        "Departamento Jefe Eliminado",
        "La acción se realizó con éxito."
      );
    } catch (error) {
      console.error("Error al hacer la solicitud DELETE:", error);
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  const edicionDepartamentoJefe = async () => {
    const jefeDepartamentoEditado = {
      fecha_de_inicio: fechaInicio?.toISOString(),
      fecha_de_fin: fechaFin?.toISOString(),
      observaciones,
      estado: Number(estado),
      departamento: departamento?.id,
      jefe: jefe?.id,
      resolucion: resolucion?.id,
    };

    try {
      await API.put(`/facet/jefe-departamento/${id}/`, jefeDepartamentoEditado);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      console.error("Error al hacer la solicitud PUT:", error);
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
    router.push("/dashboard/departments/departamentoJefe/");
  };

  return (
    <DashboardMenu>
      <div className="p-6">
        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Editar Jefe de Departamento
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Nro Resolución"
                value={resolucion?.nresolucion || ""}
                fullWidth
                InputProps={{ readOnly: true }}
                variant="outlined"
                className="mb-4"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Nombre Jefe"
                value={`${jefe?.persona.nombre || ""} ${
                  jefe?.persona.apellido || ""
                }`}
                fullWidth
                InputProps={{ readOnly: true }}
                variant="outlined"
                className="mb-4"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Nombre Departamento"
                value={departamento?.nombre || ""}
                fullWidth
                InputProps={{ readOnly: true }}
                variant="outlined"
                className="mb-4"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                fullWidth
                variant="outlined"
                className="mb-4"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" className="mb-4">
                <InputLabel id="estado-label">Estado</InputLabel>
                <Select
                  labelId="estado-label"
                  id="estado-select"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="1">Activo</MenuItem>
                  <MenuItem value="0">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Fecha de Inicio"
                  value={fechaInicio}
                  onChange={(date) => setFechaInicio(date)}
                  className="w-full"
                  slotProps={{ textField: { variant: "outlined", fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Fecha de Fin"
                  value={fechaFin}
                  onChange={(date) => setFechaFin(date)}
                  className="w-full"
                  slotProps={{ textField: { variant: "outlined", fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} className="mt-4 flex gap-2">
              <button
                onClick={edicionDepartamentoJefe}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200">
                Guardar Cambios
              </button>
              <button
                onClick={() => setConfirmarEliminacion(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors duration-200">
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
            onConfirm={() => eliminarJefeDepartamento()}
          />
        </Paper>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(EditarDepartamentoJefe);
