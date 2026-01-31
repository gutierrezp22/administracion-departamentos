import { useState } from "react";
import "./styles.css";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import BasicModal from "@/utils/modal";
import { useRouter } from "next/router";
import DashboardMenu from "../../../../dashboard";
import withAuth from "../../../../../components/withAut";
import API from "@/api/axiosConfig";
import SearchModal from "@/components/SearchModal";

interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  dni: string;
  estado: 0 | 1;
  email: string;
  interno: string;
  legajo: string;
  fecha_creacion: string;
}

const CrearJefe = () => {
  const router = useRouter();

  const [persona, setPersona] = useState<Persona | null>(null);
  const [openPersona, setOpenPersona] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [estado, setEstado] = useState<number>(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [fn, setFn] = useState(() => () => {});

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

  const handleSelectPersona = (p: Persona) => {
    setPersona(p);
    setOpenPersona(false);
  };

  const handleConfirmModal = () => {
    router.push("/dashboard/persons/jefes/");
  };

  const crearNuevoJefeDepartamento = async () => {
    if (!persona?.id) {
      handleOpenModal("Error", "No se ha seleccionado una persona.", () => {});
      return;
    }

    const nuevoJefe = {
      persona: persona.id,
      observaciones,
      estado,
    };

    try {
      // 🔹 Verificar si la persona ya es un jefe
      const response = await API.get(`/facet/jefe/existe_jefe/`, {
        params: { persona_id: persona.id },
      });

      if (response.data.existe) {
        handleOpenModal(
          "Error",
          "Ya existe un jefe con esta persona.",
          () => {}
        );
        return; // 🔹 Detener ejecución si la persona ya es jefe
      }

      // ✅ Si la persona NO es jefe, proceder a crearla
      const postResponse = await API.post(`/facet/jefe/`, nuevoJefe);

      handleOpenModal("Bien", "Se creó el jefe con éxito", handleConfirmModal);
    } catch (error) {
      console.error("Error en la verificación o creación del jefe:", error);

      const axiosError = error as any;
      if (axiosError?.response?.status === 400) {
        handleOpenModal(
          "Error",
          "Los datos enviados no son válidos.",
          () => {}
        );
      } else {
        handleOpenModal("Error", "No se pudo realizar la acción.", () => {});
      }
    }
  };

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <Paper elevation={3} className="bg-white shadow-lg rounded-lg">
          {/* Título separado */}
          <div className="p-4 border-b border-gray-200">
            <Typography variant="h5" className="text-gray-800 font-semibold">
              Agregar Jefe
            </Typography>
          </div>

          {/* Contenido del formulario */}
          <div className="p-4">
            <Grid container spacing={2}>
              {/* Sección: Selección de Persona */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Selección de Persona
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <button
                  onClick={() => setOpenPersona(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                  Seleccionar Persona
                </button>
                {persona && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2 shadow-sm">
                    <p className="text-sm font-medium text-gray-800">
                      <span className="font-bold text-blue-700">
                        Persona Seleccionada:
                      </span>{" "}
                      <span className="text-gray-900">{`${persona.apellido}, ${persona.nombre}`}</span>
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      <span className="font-bold text-blue-700">
                        DNI:
                      </span>{" "}
                      <span className="text-gray-900">{persona.dni}</span>
                    </p>
                  </div>
                )}
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
                  disabled
                  label="DNI"
                  value={persona?.dni || ""}
                  fullWidth
                  variant="outlined"
                  size="small"
                  className="modern-input"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#3b82f6",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#3b82f6",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: "500",
                      backgroundColor: "#ffffff",
                      padding: "0 4px",
                      "&.Mui-focused": {
                        color: "#3b82f6",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                      },
                      "&.MuiFormLabel-filled": {
                        backgroundColor: "#ffffff",
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: "#1f2937",
                      fontWeight: "500",
                      fontSize: "0.875rem",
                      padding: "8px 12px",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  disabled
                  label="Nombre Completo"
                  value={persona ? `${persona.apellido} ${persona.nombre}` : ""}
                  fullWidth
                  variant="outlined"
                  size="small"
                  className="modern-input"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#3b82f6",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#3b82f6",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: "500",
                      backgroundColor: "#ffffff",
                      padding: "0 4px",
                      "&.Mui-focused": {
                        color: "#3b82f6",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                      },
                      "&.MuiFormLabel-filled": {
                        backgroundColor: "#ffffff",
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: "#1f2937",
                      fontWeight: "500",
                      fontSize: "0.875rem",
                      padding: "8px 12px",
                    },
                  }}
                />
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
                  className="modern-input"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#3b82f6",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#3b82f6",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: "500",
                      backgroundColor: "#ffffff",
                      padding: "0 4px",
                      "&.Mui-focused": {
                        color: "#3b82f6",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                      },
                      "&.MuiFormLabel-filled": {
                        backgroundColor: "#ffffff",
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: "#1f2937",
                      fontWeight: "500",
                      fontSize: "0.875rem",
                      padding: "8px 12px",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl
                  fullWidth
                  size="small"
                  className="modern-input"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#3b82f6",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#3b82f6",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: "500",
                      backgroundColor: "#ffffff",
                      padding: "0 4px",
                      "&.Mui-focused": {
                        color: "#3b82f6",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                      },
                      "&.MuiFormLabel-filled": {
                        backgroundColor: "#ffffff",
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: "#1f2937",
                      fontWeight: "500",
                      fontSize: "0.875rem",
                      padding: "8px 12px",
                    },
                    "& .MuiSelect-icon": {
                      color: "#6b7280",
                      transition: "color 0.2s ease",
                    },
                    "&:hover .MuiSelect-icon": {
                      color: "#3b82f6",
                    },
                  }}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={estado}
                    label="Estado"
                    onChange={(e) => setEstado(Number(e.target.value))}>
                    <MenuItem value={1}>Activo</MenuItem>
                    <MenuItem value={0}>Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Botón de acción centrado */}
              <Grid item xs={12}>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={crearNuevoJefeDepartamento}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Crear Jefe
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>

          <SearchModal<Persona>
            open={openPersona}
            onClose={() => setOpenPersona(false)}
            onSelect={handleSelectPersona}
            title="Seleccionar Persona"
            apiEndpoint="/facet/persona/"
            columns={[
              { key: "dni", label: "DNI" },
              { key: "apellido", label: "Apellido" },
              { key: "nombre", label: "Nombre" },
              { key: "legajo", label: "Legajo" },
            ]}
            filterFields={[
              { key: "nombre", label: "Nombre", placeholder: "Buscar por nombre", filterParam: "nombre__icontains" },
              { key: "apellido", label: "Apellido", placeholder: "Buscar por apellido", filterParam: "apellido__icontains" },
              { key: "dni", label: "DNI", placeholder: "Buscar por DNI", filterParam: "dni__icontains" },
              { key: "legajo", label: "Legajo", placeholder: "Buscar por legajo", filterParam: "legajo__icontains" },
            ]}
            getItemId={(item) => item.id}
          />

          <BasicModal
            open={modalVisible}
            onClose={handleCloseModal}
            title={modalTitle}
            content={modalMessage}
            onConfirm={fn}
          />
        </Paper>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(CrearJefe);
