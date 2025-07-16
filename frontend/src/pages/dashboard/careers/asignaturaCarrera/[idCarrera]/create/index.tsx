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
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Agregar Asignatura en Carrera</h1>
          </div>
          
          <div className="p-4">
            <Typography variant="h6" className="text-gray-700 font-semibold mb-3">
              Selección de Asignatura
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <button
                  onClick={handleOpenAsignatura}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium w-full">
                  Seleccionar Asignatura
                </button>

                <Dialog
                  open={openAsignatura}
                  onClose={handleClose}
                  maxWidth="md"
                  fullWidth
                  PaperProps={{ style: { borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' } }}>
                  <DialogTitle className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
                    Seleccionar Asignatura
                  </DialogTitle>
                  <DialogContent className="p-4">
                    <TextField
                      label="Buscar por Código o Nombre"
                      value={filtroAsignaturas}
                      onChange={(e) => setFiltroAsignaturas(e.target.value)}
                      fullWidth
                      margin="normal"
                      variant="outlined"
                      size="small"
                    />
                    <TableContainer component={Paper} className="mt-4" style={{ maxHeight: '400px' }}>
                      <Table size="small">
                        <TableHead className="bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0 z-10">
                          <TableRow>
                            <TableCell className="text-white font-semibold">
                              Código
                            </TableCell>
                            <TableCell className="text-white font-semibold">
                              Nombre
                            </TableCell>
                            <TableCell className="text-white font-semibold">
                              Seleccionar
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {handleFilterAsignaturas(filtroAsignaturas).map(
                            (asignatura) => (
                              <TableRow
                                key={asignatura.id}
                                className="hover:bg-blue-50 transition-colors duration-200">
                                <TableCell className="font-medium">{asignatura.codigo}</TableCell>
                                <TableCell className="font-medium">{asignatura.nombre}</TableCell>
                                <TableCell>
                                  <button
                                    onClick={() => {
                                      setIdasignatura(asignatura.id);
                                      setNombre(asignatura.nombre);
                                      setCodigo(asignatura.codigo);
                                      setOpenAsignatura(false);
                                    }}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 border ${
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
                  <DialogActions className="p-4">
                    <button
                      onClick={handleClose}
                      className="px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-100">
                      Cerrar
                    </button>
                    <button
                      onClick={handleConfirmSelection}
                      className="ml-2 px-3 py-1 text-sm rounded-md bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                      Confirmar Selección
                    </button>
                  </DialogActions>
                </Dialog>
              </Grid>

              {idasignatura && (
                <Grid item xs={12} className="mt-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm">
                    <p className="text-sm font-medium text-gray-800">
                      <span className="font-bold text-blue-700">Asignatura seleccionada:</span>
                    </p>
                    <p className="mt-1 text-gray-900">
                      <strong>Código:</strong> {codigo}
                    </p>
                    <p className="text-gray-900">
                      <strong>Nombre:</strong> {nombre}
                    </p>
                  </div>
                </Grid>
              )}

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
            
            <div className="flex justify-center mt-6">
              <button
                onClick={crearNuevaAsignaturaEnCarrera}
                disabled={!idasignatura || !estado}
                className={`px-6 py-3 rounded-lg transition-all duration-200 transform font-medium ${
                  !idasignatura || !estado
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:scale-105"
                }`}>
                Crear Asignatura en Carrera
              </button>
            </div>
          </div>
        </div>
        
        <BasicModal
          open={modalVisible}
          onClose={handleCloseModal}
          title={modalTitle}
          content={modalMessage}
          onConfirm={fn}
        />
      </div>
    </DashboardMenu>
  );
};

export default withAuth(CrearAsignaturaCarrera);
