import { useEffect, useState } from "react";
import "./styles.css";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import BasicModal from "@/utils/modal";
import ModalConfirmacion from "@/utils/modalConfirmacion";
import { useRouter } from "next/router"; // Importa useRouter de Next.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DashboardMenu from "../../../..";
import withAuth from "../../../../../../components/withAut";
import API from "@/api/axiosConfig";

// Habilita los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const CrearAsignaturaCarrera = () => {
  const router = useRouter();
  const { idCarrera } = router.query; // Obtener idCarrera de la URL

  interface Area {
    id: number;
    departamento: number;
    nombre: string;
    estado: 0 | 1;
  }

  interface Departamento {
    id: number;
    nombre: string;
    telefono: string;
    estado: 0 | 1;
    interno: string;
  }

  type TipoAsignatura = "Electiva" | "Obligatoria";
  type TipoCarrera = "Pregrado" | "Grado" | "Posgrado";

  interface Asignatura {
    id: number;
    area: number;
    departamento: number;
    codigo: string;
    nombre: string;
    modulo: string;
    programa: string;
    tipo: TipoAsignatura;
    estado: 0 | 1;
  }

  interface Carrera {
    id: number;
    nombre: string;
    tipo: TipoCarrera;
    planestudio: string;
    sitio: string;
    estado: 0 | 1;
  }

  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [idasignatura, setIdasignatura] = useState<number>();
  const [iddepartamento, setIddepartamento] = useState<number>(0);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [modulo, setModulo] = useState("");
  const [programa, setPrograma] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});
  const [openAsignatura, setOpenAsignatura] = useState(false);
  const [filtroAsignaturas, setFiltroAsignaturas] = useState("");

  const handleOpenAsignatura = () => {
    setOpenAsignatura(true);
  };

  const handleClose = () => {
    setOpenAsignatura(false);
  };

  const handleOpenModal = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
    setFn(() => onConfirm);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
  };

  const handleConfirmModal = () => {
    router.push(`/dashboard/careers/asignaturaCarrera/${idCarrera}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get(`/facet/asignatura/`);
        setAsignaturas(response.data.results);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleConfirmSelection = () => {
    handleClose();
  };

  const handleFilterAsignaturas = (filtro: string) => {
    return asignaturas.filter(
      (asignatura) =>
        asignatura.nombre.includes(filtro.toUpperCase()) ||
        asignatura.codigo.includes(filtro.toUpperCase())
    );
  };

  const crearNuevaAsignaturaEnCarrera = async () => {
    const nuevaAsignaturaEnCarrera = {
      carrera: idCarrera,
      asignatura: idasignatura,
      estado: estado,
    };

    try {
      const response = await API.post(
        `/facet/asignatura-carrera/`,
        nuevaAsignaturaEnCarrera
      );
      handleOpenModal(
        "Éxito",
        "Se creó la asignatura en carrera con éxito.",
        handleConfirmModal
      );
    } catch (error) {
      handleOpenModal("Error", "No se pudo realizar la acción.", () => {});
    }
  };

  return (
    <DashboardMenu>
      <div className="p-6">
        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Agregar Asignatura en Carrera
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <button
                onClick={handleOpenAsignatura}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                Seleccionar Asignatura
              </button>

              <Dialog
                open={openAsignatura}
                onClose={handleClose}
                maxWidth="md"
                fullWidth>
                <DialogTitle>Seleccionar Asignatura</DialogTitle>
                <DialogContent>
                  <TextField
                    label="Buscar por Código o Nombre"
                    value={filtroAsignaturas}
                    onChange={(e) => setFiltroAsignaturas(e.target.value)}
                    fullWidth
                    margin="normal"
                    variant="outlined"
                  />
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow className="bg-blue-500 text-white">
                          <TableCell className="text-white font-medium">
                            Código
                          </TableCell>
                          <TableCell className="text-white font-medium">
                            Nombre
                          </TableCell>
                          <TableCell className="text-white font-medium">
                            Seleccionar
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {handleFilterAsignaturas(filtroAsignaturas).map(
                          (asignatura) => (
                            <TableRow
                              key={asignatura.id}
                              className="hover:bg-gray-50">
                              <TableCell>{asignatura.codigo}</TableCell>
                              <TableCell>{asignatura.nombre}</TableCell>
                              <TableCell>
                                <button
                                  onClick={() => {
                                    setIdasignatura(asignatura.id);
                                    setNombre(asignatura.nombre);
                                    setCodigo(asignatura.codigo);
                                    setOpenAsignatura(false);
                                  }}
                                  className={`px-3 py-1 rounded-md transition-colors duration-200 border ${
                                    asignatura.id === idasignatura
                                      ? "bg-green-500 text-white border-green-500 hover:bg-green-600"
                                      : "border-gray-300 hover:bg-gray-100"
                                  }`}>
                                  Seleccionar
                                </button>
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </DialogContent>
                <DialogActions>
                  <button
                    onClick={handleClose}
                    className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100">
                    Cerrar
                  </button>
                  <button
                    onClick={handleConfirmSelection}
                    className="ml-2 px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600">
                    Confirmar Selección
                  </button>
                </DialogActions>
              </Dialog>
            </Grid>

            {idasignatura && (
              <Grid item xs={12} className="mt-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                  <p className="text-green-800 font-medium">
                    Asignatura seleccionada:
                  </p>
                  <p className="mt-1">
                    <strong>Código:</strong> {codigo}
                  </p>
                  <p>
                    <strong>Nombre:</strong> {nombre}
                  </p>
                </div>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" className="mb-4">
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

            <Grid item xs={12} className="mt-4">
              <button
                onClick={crearNuevaAsignaturaEnCarrera}
                disabled={!idasignatura || !estado}
                className={`px-4 py-2 rounded-md ${
                  !idasignatura || !estado
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
                }`}>
                Crear Asignatura en Carrera
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

export default withAuth(CrearAsignaturaCarrera);
