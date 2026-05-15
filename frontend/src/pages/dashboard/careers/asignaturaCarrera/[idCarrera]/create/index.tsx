import { useEffect, useState } from "react";
import "./styles.css";
import {
  Paper,
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
import { useRouter } from "next/router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DashboardMenu from "../../../..";
import withAuth from "../../../../../../components/withAut";
import API from "@/api/axiosConfig";
import {
  FormContainer,
  FormSection,
  FormField,
  FormActions,
  FormButton,
  SelectorButton,
} from "@/components/Form";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

dayjs.extend(utc);
dayjs.extend(timezone);

const CrearAsignaturaCarrera = () => {
  const router = useRouter();
  const { idCarrera } = router.query;

  type TipoAsignatura = "Electiva" | "Obligatoria";

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

  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [idasignatura, setIdasignatura] = useState<number>();
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});
  const [openAsignatura, setOpenAsignatura] = useState(false);
  const [filtroAsignaturas, setFiltroAsignaturas] = useState("");

  const handleOpenAsignatura = () => setOpenAsignatura(true);
  const handleClose = () => setOpenAsignatura(false);

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
      await API.post(`/facet/asignatura-carrera/`, nuevaAsignaturaEnCarrera);
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
      <FormContainer title="Agregar Asignatura en Carrera">
        <FormSection title="Selección de Asignatura">
          <SelectorButton
            label="Seleccionar Asignatura"
            onClick={handleOpenAsignatura}
            selectedLabel="Asignatura"
            selectedValue={idasignatura ? `${codigo} - ${nombre}` : undefined}
          />
        </FormSection>

        <FormSection title="Estado">
          <FormField
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            options={[
              { value: 1, label: "Activo" },
              { value: 0, label: "Inactivo" },
            ]}
          />
        </FormSection>

        <FormActions>
          <FormButton
            variant="success"
            onClick={crearNuevaAsignaturaEnCarrera}
            disabled={!idasignatura || !estado}
          >
            Crear Asignatura en Carrera
          </FormButton>
        </FormActions>

        <Dialog
          open={openAsignatura}
          onClose={handleClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              borderRadius: "12px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            },
          }}>
          <DialogTitle className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
            Seleccionar Asignatura
          </DialogTitle>
          <DialogContent className="p-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 mb-5 mt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <FunnelIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">Filtros de Búsqueda</span>
                </div>
                <button
                  onClick={() => setFiltroAsignaturas("")}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  <span>Limpiar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-3">
                <div className="relative">
                  <input
                    type="text"
                    value={filtroAsignaturas}
                    onChange={(e) => setFiltroAsignaturas(e.target.value)}
                    placeholder="Buscar por Código o Nombre"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
                      focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                      hover:border-blue-400 hover:bg-white
                      transition-all duration-200
                      text-sm text-gray-700 placeholder-gray-400
                      shadow-sm pr-9"
                  />
                  <MagnifyingGlassIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <TableContainer component={Paper} style={{ maxHeight: "400px", overflow: "auto" }}>
              <Table size="small">
                <TableHead className="bg-gradient-to-r from-blue-500 to-blue-600 sticky top-0 z-10">
                  <TableRow>
                    <TableCell className="text-white font-semibold">Código</TableCell>
                    <TableCell className="text-white font-semibold">Nombre</TableCell>
                    <TableCell className="text-white font-semibold">Seleccionar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {handleFilterAsignaturas(filtroAsignaturas).map((asignatura) => (
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
                  ))}
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

        <BasicModal
          open={modalVisible}
          onClose={handleCloseModal}
          title={modalTitle}
          content={modalMessage}
          onConfirm={fn}
        />
      </FormContainer>
    </DashboardMenu>
  );
};

export default withAuth(CrearAsignaturaCarrera);
