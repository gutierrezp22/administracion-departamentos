import { useEffect, useState } from "react";
import "./styles.css";
import axios from "axios";
import {
  Typography,
  Paper,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Grid,
  MenuItem,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DashboardMenu from "../../../../dashboard";
import { useRouter } from "next/router";
import BasicModal from "@/utils/modal";
import ModalConfirmacion from "@/utils/modalConfirmacion";
import withAuth from "../../../../../components/withAut";
import { API_BASE_URL } from "../../../../../utils/config";
import API from "@/api/axiosConfig";

const ListaAsignaturaCarrera = () => {
  const router = useRouter();
  const { idCarrera } = router.query;
  const pageSize = 10; // Tamaño de página estándar

  interface Area {
    idarea: number;
    iddepartamento: number;
    nombre: string;
    estado: 0 | 1;
  }

  interface AsignaturaCarrera {
    id: number;
    idcarrera: number;
    idasignatura: number;
    idarea: number;
    iddepartamento: number;
    estado: 0 | 1;
  }

  interface Departamento {
    iddepartamento: number;
    nombre: string;
  }

  interface Asignatura {
    idasignatura: number;
    idarea: number;
    iddepartamento: number;
    codigo: string;
    nombre: string;
    modulo: string;
    tipo: "Electiva" | "Obligatoria";
    estado: 0 | 1;
  }

  const [asignaturasCarrera, setAsignaturasCarrera] = useState<
    AsignaturaCarrera[]
  >([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [filtroCodigo, setFiltroCodigo] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroModulo, setFiltroModulo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const totalPages = Math.ceil(totalItems / pageSize);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [idAsignaturaCarrera, setIdAsignaturaCarrera] = useState<number | null>(
    null
  );

  const handleOpenModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMessage("");
  };

  useEffect(() => {
    if (idCarrera) {
      fetchData();
    }
  }, [idCarrera]);

  const fetchData = async () => {
    try {
      const [areasRes, asignaturasRes, deptosRes, asignaturasCarreraRes] =
        await Promise.all([
          axios.get(`${API_BASE_URL}/facet/area/`),
          axios.get(`${API_BASE_URL}/facet/asignatura/`),
          axios.get(`${API_BASE_URL}/facet/departamento/`),
          axios.get(`${API_BASE_URL}/facet/asignatura-carrera/`, {
            params: { idcarrera: idCarrera },
          }),
        ]);

      setAreas(areasRes.data.results);
      setAsignaturas(asignaturasRes.data.results);
      setDepartamentos(deptosRes.data.results);
      setAsignaturasCarrera(asignaturasCarreraRes.data.results);
      setTotalItems(
        asignaturasCarreraRes.data.count ||
          asignaturasCarreraRes.data.results.length
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const descargarExcel = async () => {
    try {
      let allAsignaturasCarrera: AsignaturaCarrera[] = [];
      let url = `${API_BASE_URL}/facet/asignatura-carrera/?idcarrera=${idCarrera}`;

      // Aplicar los filtros a la URL
      const params = new URLSearchParams();
      if (filtroCodigo) params.append("codigo__icontains", filtroCodigo);
      if (filtroNombre) params.append("nombre__icontains", filtroNombre);
      if (filtroTipo) params.append("tipo", filtroTipo);
      if (filtroModulo) params.append("modulo__icontains", filtroModulo);
      url += `&${params.toString()}`;

      // Obtener todos los datos con paginación
      while (url) {
        const response = await axios.get(url);
        const { results, next } = response.data;
        allAsignaturasCarrera = [...allAsignaturasCarrera, ...results];
        url = next; // Continuar con la siguiente página si existe
      }

      // Generar el archivo Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        allAsignaturasCarrera.map((asignaturaCarrera) => {
          const asignatura = asignaturas.find(
            (asig) => asig.idasignatura === asignaturaCarrera.idasignatura
          );
          const departamento = departamentos.find(
            (depto) => depto.iddepartamento === asignaturaCarrera.iddepartamento
          );
          const area = areas.find(
            (area) => area.idarea === asignaturaCarrera.idarea
          );

          return {
            Código: asignatura?.codigo || "",
            Asignatura: asignatura?.nombre || "",
            Módulo: asignatura?.modulo || "",
            Departamento: departamento?.nombre || "",
            Área: area?.nombre || "",
          };
        })
      );

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Asignaturas de Carrera"
      );
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const excelBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(excelBlob, "asignaturas_carrera.xlsx");
    } catch (error) {
      console.error("Error downloading Excel:", error);
    }
  };

  const filtrarAsignaturas = () => {
    // Aplicar filtros y actualizar estado
    setAsignaturasCarrera(
      asignaturasCarrera.filter((asignaturaCarrera) => {
        const asignatura = asignaturas.find(
          (asig) => asig.idasignatura === asignaturaCarrera.idasignatura
        );
        if (!asignatura) return false;

        return (
          asignatura.codigo
            .toLowerCase()
            .includes(filtroCodigo.toLowerCase()) &&
          asignatura.nombre
            .toLowerCase()
            .includes(filtroNombre.toLowerCase()) &&
          (filtroTipo === "" || asignatura.tipo === filtroTipo) &&
          asignatura.modulo.toLowerCase().includes(filtroModulo.toLowerCase())
        );
      })
    );
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentItems = asignaturasCarrera.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handleDeleteAsignatura = async () => {
    if (idAsignaturaCarrera !== null) {
      try {
        await API.delete(`/facet/asignatura-carrera/${idAsignaturaCarrera}/`);
        setAsignaturasCarrera((prevAsignaturas) =>
          prevAsignaturas.filter(
            (asignatura) => asignatura.id !== idAsignaturaCarrera
          )
        );
        handleOpenModal(
          "Asignatura Eliminada",
          "La asignatura fue eliminada con éxito."
        );
      } catch (error) {
        handleOpenModal("Error", "No se pudo eliminar la asignatura.");
        console.error("Error deleting asignatura:", error);
      }
      setConfirmarEliminacion(false);
    }
  };

  return (
    <DashboardMenu>
      <div className="p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() =>
              router.push(
                `/dashboard/careers/asignaturaCarrera/${idCarrera}/create`
              )
            }
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <AddIcon /> Agregar Asignatura
          </button>
          <button
            onClick={descargarExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
            <FileDownloadIcon /> Descargar Excel
          </button>
        </div>

        <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h4" gutterBottom className="text-gray-800">
            Asignaturas de Carrera
          </Typography>

          <Grid container spacing={2} marginBottom={2}>
            <Grid item xs={4}>
              <TextField
                label="Código"
                value={filtroCodigo}
                onChange={(e) => setFiltroCodigo(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Nombre"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                select
                label="Tipo"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                fullWidth
                variant="outlined">
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                <MenuItem value="Electiva">Electiva</MenuItem>
                <MenuItem value="Obligatoria">Obligatoria</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Módulo"
                value={filtroModulo}
                onChange={(e) => setFiltroModulo(e.target.value)}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={4}>
              <button
                onClick={filtrarAsignaturas}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200">
                Filtrar
              </button>
            </Grid>
          </Grid>

          <TableContainer component={Paper} className="mb-4">
            <Table>
              <TableHead>
                <TableRow className="bg-blue-500 text-white">
                  <TableCell className="text-white font-medium">
                    Código
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Asignatura
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Módulo
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    Departamento
                  </TableCell>
                  <TableCell className="text-white font-medium">Área</TableCell>
                  <TableCell className="text-white font-medium" align="center">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((asignaturaCarrera) => {
                    const asignaturaAsociada = asignaturas.find(
                      (asignatura) =>
                        asignatura.idasignatura ===
                        asignaturaCarrera.idasignatura
                    );
                    const departamentoAsociado = departamentos.find(
                      (depto) =>
                        depto.iddepartamento ===
                        asignaturaCarrera.iddepartamento
                    );
                    const areaAsociado = areas.find(
                      (area) => area.idarea === asignaturaCarrera.idarea
                    );

                    return (
                      <TableRow
                        key={asignaturaCarrera.id}
                        className="hover:bg-gray-50">
                        <TableCell>{asignaturaAsociada?.codigo}</TableCell>
                        <TableCell>{asignaturaAsociada?.nombre}</TableCell>
                        <TableCell>{asignaturaAsociada?.modulo}</TableCell>
                        <TableCell>{departamentoAsociado?.nombre}</TableCell>
                        <TableCell>{areaAsociado?.nombre}</TableCell>
                        <TableCell align="center">
                          <button
                            onClick={() => {
                              setIdAsignaturaCarrera(asignaturaCarrera.id);
                              setConfirmarEliminacion(true);
                            }}
                            className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100 transition-colors duration-200">
                            <DeleteIcon />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" className="py-4">
                      No se encontraron registros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-md ${
                currentPage === 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              } transition-colors duration-200`}>
              Anterior
            </button>
            <Typography variant="body1">
              Página {currentPage} de {Math.max(1, totalPages)}
            </Typography>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage >= totalPages}
              className={`px-4 py-2 rounded-md ${
                currentPage >= totalPages
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              } transition-colors duration-200`}>
              Siguiente
            </button>
          </div>
        </Paper>

        <BasicModal
          open={modalVisible}
          onClose={handleCloseModal}
          title={modalTitle}
          content={modalMessage}
        />
        <ModalConfirmacion
          open={confirmarEliminacion}
          onClose={() => setConfirmarEliminacion(false)}
          onConfirm={handleDeleteAsignatura}
        />
      </div>
    </DashboardMenu>
  );
};

export default withAuth(ListaAsignaturaCarrera);
