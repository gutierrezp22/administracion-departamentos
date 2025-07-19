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
import API from "@/api/axiosConfig";
import { formatFechaParaBackend } from "@/utils/dateHelpers";

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
      fecha: formatFechaParaBackend(fecha), // Convierte la fecha a formato YYYY-MM-DD para el backend
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
        <Paper elevation={3} className="bg-white shadow-lg rounded-lg">
          {/* Título separado */}
          <div className="p-4 border-b border-gray-200">
            <Typography variant="h5" className="text-gray-800 font-semibold">
              Crear Resolución
            </Typography>
          </div>

          {/* Contenido del formulario */}
          <div className="p-4">
            <Grid container spacing={2}>
              {/* Sección: Información Principal */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Información Principal
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Nro Expediente"
                  value={nroExpediente}
                  onChange={(e) => setNroExpediente(e.target.value)}
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
                  label="Nro Resolución"
                  value={nroResolucion}
                  onChange={(e) => setNroResolucion(e.target.value)}
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
                  select
                  fullWidth
                  label="Tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
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
                    "& .MuiSelect-icon": {
                      color: "#6b7280",
                      transition: "color 0.2s ease",
                    },
                    "&:hover .MuiSelect-icon": {
                      color: "#3b82f6",
                    },
                  }}>
                  <MenuItem value="Rector">Rector</MenuItem>
                  <MenuItem value="Decano">Decano</MenuItem>
                  <MenuItem value="Consejo_Superior">Consejo Superior</MenuItem>
                  <MenuItem value="Consejo_Directivo">
                    Consejo Directivo
                  </MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
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
                    "& .MuiSelect-icon": {
                      color: "#6b7280",
                      transition: "color 0.2s ease",
                    },
                    "&:hover .MuiSelect-icon": {
                      color: "#3b82f6",
                    },
                  }}>
                  <MenuItem value="1">Activo</MenuItem>
                  <MenuItem value="0">Inactivo</MenuItem>
                </TextField>
              </Grid>

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Sección: Documento y Fecha */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Documento y Fecha
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Link Documento Adjunto"
                  value={adjunto}
                  onChange={(e) => setAdjunto(e.target.value)}
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
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                        size: "small",
                        className: "modern-input",
                        sx: {
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
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              {/* Botón de acción centrado */}
              <Grid item xs={12}>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={crearNuevaResolucion}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Crear Resolución
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>

          {/* Modal */}
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
