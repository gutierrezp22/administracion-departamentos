import { useEffect, useState } from "react";
import "./styles.css";
import {
  Container,
  Typography,
  Paper,
  TextField,
  Grid,
  MenuItem,
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
import API from "@/api/axiosConfig";

dayjs.extend(utc);
dayjs.extend(timezone);

type TipoAsignatura = "Electiva" | "Obligatoria";

const EditarAsignatura: React.FC = () => {
  const router = useRouter();
  const { id: idAsignatura } = router.query; // Captura el ID de la URL de manera similar a EditarArea

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
    router.push("/dashboard/asignatura/");
  };

  const [asignatura, setAsignatura] = useState<any>();
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
      if (idAsignatura) {
        // Verifica que idAsignatura no sea undefined
        try {
          const response = await API.get(`/facet/asignatura/${idAsignatura}/`);
          const data = response.data;
          setAsignatura(data);
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
  }, [idAsignatura]);

  useEffect(() => {
    if (asignatura) {
      setIdarea(asignatura.area);
      setIddepartamento(asignatura.departamento);
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
      area: idarea,
      departamento: iddepartamento,
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
      handleOpenModal("Error", "NO se pudo realizar la acción.");
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Editar Asignatura
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value.toUpperCase())}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Modulo"
                value={modulo}
                onChange={(e) => setModulo(e.target.value.toUpperCase())}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Link Programa Adjunto"
                value={programa}
                onChange={(e) => setPrograma(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoAsignatura)}
                fullWidth
                variant="outlined">
                <MenuItem value="Electiva">Electiva</MenuItem>
                <MenuItem value="Obligatoria">Obligatoria</MenuItem>
              </TextField>
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
                onClick={edicionAsignatura}
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
        </Paper>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(EditarAsignatura);
