import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import {
  Container,
  Paper,
  TextField,
  Button,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Grid,
  Typography,
} from "@mui/material";
import BasicModal from "@/utils/modal";
import ModalConfirmacion from "@/utils/modalConfirmacion";
import { useRouter } from "next/router"; // Importa useRouter de Next.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DashboardMenu from "../../../../dashboard";
import withAuth from "../../../../../components/withAut";
import API from "@/api/axiosConfig";

// Habilita los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const EditarAsignaturaCarrera: React.FC = () => {
  const router = useRouter();
  const { idAsignatura } = router.query; // Obtener idAsignatura de la URL

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
    router.push("/dashboard/asignaturas/"); // Navega a la página de asignaturas
  };

  type TipoAsignatura = "Electiva" | "Obligatoria";

  interface Asignatura {
    idasignatura: number;
    idarea: number;
    iddepartamento: number;
    codigo: string;
    nombre: string;
    modulo: string;
    programa: string;
    tipo: TipoAsignatura;
    estado: 0 | 1;
  }

  const [asignatura, setAsignatura] = useState<Asignatura | null>(null);
  const [iddepartamento, setIddepartamento] = useState<number>(0);
  const [idarea, setIdarea] = useState<number>(0);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [modulo, setModulo] = useState("");
  const [programa, setPrograma] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!idAsignatura) return; // Asegúrate de que idAsignatura esté disponible
      try {
        const response = await API.get(`/facet/asignatura/${idAsignatura}`);
        const data = response.data;
        setAsignatura(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [idAsignatura]);

  useEffect(() => {
    if (asignatura) {
      setIdarea(asignatura.idarea);
      setIddepartamento(asignatura.iddepartamento);
      setNombre(asignatura.nombre);
      setCodigo(asignatura.codigo);
      setEstado(String(asignatura.estado));
      setTipo(String(asignatura.tipo));
      setModulo(asignatura.modulo);
      setPrograma(asignatura.programa);
    }
  }, [asignatura]);

  const edicionAsignatura = async () => {
    const asignaturaEditada = {
      idarea: idarea,
      iddepartamento: iddepartamento,
      codigo: codigo,
      nombre: nombre,
      modulo: modulo,
      programa: programa,
      tipo: tipo,
      estado: estado,
    };

    try {
      await API.put(`/facet/asignatura/${idAsignatura}/`, asignaturaEditada);
      handleOpenModal("Éxito", "La acción se realizó con éxito.");
    } catch (error) {
      console.error("Error al hacer la solicitud PUT:", error);
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  const eliminarAsignatura = async () => {
    try {
      await API.delete(`/facet/asignatura/${idAsignatura}/`);
      handleOpenModal(
        "Asignatura Eliminada",
        "La acción se realizó con éxito."
      );
    } catch (error) {
      console.error("Error al hacer la solicitud DELETE:", error);
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">
              Editar Asignatura
            </h1>
          </div>

          <div className="p-4">
            <Typography
              variant="h6"
              className="text-gray-700 font-semibold mb-3">
              Información de la Asignatura
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value.toUpperCase())}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Código"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Módulo"
                  value={modulo}
                  onChange={(e) => setModulo(e.target.value.toUpperCase())}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Link Programa Adjunto"
                  value={programa}
                  onChange={(e) => setPrograma(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="tipo-label">Tipo</InputLabel>
                  <Select
                    labelId="tipo-label"
                    id="tipo-select"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoAsignatura)}
                    label="Tipo">
                    <MenuItem value="Electiva">Electiva</MenuItem>
                    <MenuItem value="Obligatoria">Obligatoria</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="estado-label">Estado</InputLabel>
                  <Select
                    labelId="estado-label"
                    id="estado-select"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    label="Estado">
                    <MenuItem value={1}>Activo</MenuItem>
                    <MenuItem value={0}>Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={edicionAsignatura}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                Guardar Cambios
              </button>
              <button
                onClick={() => setConfirmarEliminacion(true)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                Eliminar Asignatura
              </button>
            </div>
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
            eliminarAsignatura();
          }}
        />
      </div>
    </DashboardMenu>
  );
};

export default withAuth(EditarAsignaturaCarrera);
