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
  MenuItem,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { useRouter } from "next/router";
import DashboardMenu from "../../..";
import BasicModal from "@/utils/modal";

import withAuth from "../../../../../components/withAut";
import { API_BASE_URL } from "../../../../../utils/config";
import API from "../../../../../api/axiosConfig";
import { parseFechaDDMMYYYY, formatFechaParaBackend } from "@/utils/dateHelpers";

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

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/facet/jefe-departamento/${id}/obtener_detalle/`
          );
          const data = response.data;

          setFechaInicio(parseFechaDDMMYYYY(data.fecha_de_inicio));
          setFechaFin(parseFechaDDMMYYYY(data.fecha_de_fin));
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

  const edicionDepartamentoJefe = async () => {
    const jefeDepartamentoEditado = {
      fecha_de_inicio: formatFechaParaBackend(fechaInicio),
      fecha_de_fin: formatFechaParaBackend(fechaFin),
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
      <Container maxWidth="lg">
        <Paper elevation={3} className="bg-white shadow-lg rounded-lg">
          {/* Título separado */}
          <div className="p-4 border-b border-gray-200">
            <Typography variant="h5" className="text-gray-800 font-semibold">
              Editar Jefe de Departamento
            </Typography>
          </div>

          {/* Contenido del formulario */}
          <div className="p-4">
            <Grid container spacing={2}>
              {/* Sección: Información de la Asignación */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Información de la Asignación
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Nro Resolución"
                  value={resolucion?.nresolucion || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
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
                  label="Nombre Jefe"
                  value={`${jefe?.persona.nombre || ""} ${
                    jefe?.persona.apellido || ""
                  }`}
                  fullWidth
                  InputProps={{ readOnly: true }}
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

              <Grid item xs={12}>
                <TextField
                  label="Nombre Departamento"
                  value={departamento?.nombre || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
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

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Sección: Período y Estado */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Período y Estado
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Fecha de Inicio"
                    value={fechaInicio}
                    onChange={(date) => setFechaInicio(date)}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        variant: "outlined",
                        fullWidth: true,
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

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Fecha de Fin"
                    value={fechaFin}
                    onChange={(date) => setFechaFin(date)}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        variant: "outlined",
                        fullWidth: true,
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

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
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

              {/* Botón de acción centrado */}
              <Grid item xs={12}>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={edicionDepartamentoJefe}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Guardar Cambios
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>

          <BasicModal
            open={modalVisible}
            onClose={handleCloseModal}
            title={modalTitle}
            content={modalMessage}
          />
        </Paper>
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(EditarDepartamentoJefe);
