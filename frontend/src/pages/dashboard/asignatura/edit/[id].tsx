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

  return (
    <DashboardMenu>
      <Container maxWidth="lg">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">
              Editar Asignatura
            </h1>
          </div>

          <div className="p-4">
            <Grid container spacing={2}>
              {/* Sección de Información Básica */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-6">
                  Información Básica
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Nombre de la Asignatura"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value.toUpperCase())}
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
                      label="Código"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.toUpperCase())}
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
                </Grid>
              </Grid>

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Sección de Información Adicional */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-6">
                  Información Adicional
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Módulo"
                      value={modulo}
                      onChange={(e) => setModulo(e.target.value.toUpperCase())}
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
                      label="Link Programa Adjunto"
                      value={programa}
                      onChange={(e) => setPrograma(e.target.value)}
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
                      label="Tipo"
                      value={tipo}
                      onChange={(e) =>
                        setTipo(e.target.value as TipoAsignatura)
                      }
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
                      }}>
                      <MenuItem value="Electiva">Electiva</MenuItem>
                      <MenuItem value="Obligatoria">Obligatoria</MenuItem>
                    </TextField>
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
                      }}>
                      <MenuItem value={1}>Activo</MenuItem>
                      <MenuItem value={0}>Inactivo</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Grid>

              {/* Botones de acción */}
              <Grid item xs={12}>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={edicionAsignatura}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                    Guardar Cambios
                  </button>
                </div>
              </Grid>
            </Grid>
          </div>
        </div>

        <BasicModal
          open={modalVisible}
          onClose={handleCloseModal}
          title={modalTitle}
          content={modalMessage}
        />
      </Container>
    </DashboardMenu>
  );
};

export default withAuth(EditarAsignatura);
