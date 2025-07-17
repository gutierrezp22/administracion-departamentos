import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Swal from "sweetalert2";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import { API_BASE_URL } from "../../../../utils/config";
import "./styles.css";
import BasicModal from "../../../../utils/modal";

interface Rol {
  id: number;
  descripcion: string;
}

const CrearUsuario = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    apellido: "",
    legajo: "",
    documento: "",
    rol: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await API.get(`/facet/roles/`);
      setRoles(
        Array.isArray(response.data) ? response.data : response.data.results
      );
    } catch (error) {
      console.error("Error al cargar roles:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los roles.",
      });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validar email
    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    // Validar nombre
    if (!formData.nombre) {
      newErrors.nombre = "El nombre es requerido";
    }

    // Validar apellido
    if (!formData.apellido) {
      newErrors.apellido = "El apellido es requerido";
    }

    // Validar legajo
    if (!formData.legajo) {
      newErrors.legajo = "El legajo es requerido";
    } else if (isNaN(Number(formData.legajo))) {
      newErrors.legajo = "El legajo debe ser un número";
    }

    // Validar documento
    if (!formData.documento) {
      newErrors.documento = "El documento es requerido";
    } else if (isNaN(Number(formData.documento))) {
      newErrors.documento = "El documento debe ser un número";
    }

    // Validar rol
    if (!formData.rol) {
      newErrors.rol = "El rol es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        apellido: formData.apellido,
        legajo: parseInt(formData.legajo),
        documento: parseInt(formData.documento),
        rol: formData.rol ? parseInt(formData.rol) : null,
        is_active: true,
      };

      await API.post(`/facet/users/`, userData);

      Swal.fire({
        icon: "success",
        title: "Usuario creado exitosamente",
        text: "El usuario ha sido creado y está activo en el sistema.",
        confirmButtonText: "Aceptar",
      }).then(() => {
        router.push("/dashboard/usuarios");
      });
    } catch (error: any) {
      console.error("Error al crear usuario:", error);

      let errorMessage = "Error al crear el usuario";

      if (error.response?.data) {
        if (error.response.data.email) {
          errorMessage = "El email ya está registrado en el sistema";
        } else if (error.response.data.legajo) {
          errorMessage = "El legajo ya está registrado en el sistema";
        } else if (error.response.data.documento) {
          errorMessage = "El documento ya está registrado en el sistema";
        } else if (error.response.data.rol) {
          errorMessage = "El rol seleccionado no es válido";
        } else if (typeof error.response.data === "object") {
          errorMessage = Object.values(error.response.data).join(", ");
        }
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || roles.length === 0) {
    return (
      <DashboardMenu>
        <BasicModal
          open={true}
          onClose={() => {}}
          title="Cargando..."
          content="Por favor espere mientras se cargan los datos."
        />
      </DashboardMenu>
    );
  }

  return (
    <DashboardMenu>
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <Typography variant="h5" className="font-bold text-gray-800">
            Crear Nuevo Usuario
          </Typography>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Información de Acceso */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Información de Acceso
                </Typography>
              </Grid>

              {/* Email */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                  size="small"
                  className="modern-input"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: "500",
                      backgroundColor: "#ffffff",
                      padding: "0 4px",
                      "&.Mui-focused": {
                        color: "#326ce5",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                      },
                    },
                    "& .MuiFormLabel-filled": {
                      backgroundColor: "#ffffff",
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

              {/* Contraseña */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  error={!!errors.password}
                  helperText={errors.password}
                  required
                  size="small"
                  className="modern-input"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: "500",
                      backgroundColor: "#ffffff",
                      padding: "0 4px",
                      "&.Mui-focused": {
                        color: "#326ce5",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                      },
                    },
                    "& .MuiFormLabel-filled": {
                      backgroundColor: "#ffffff",
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

              {/* Confirmar Contraseña */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirmar Contraseña"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  required
                  size="small"
                  className="modern-input"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: "500",
                      backgroundColor: "#ffffff",
                      padding: "0 4px",
                      "&.Mui-focused": {
                        color: "#326ce5",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                      },
                    },
                    "& .MuiFormLabel-filled": {
                      backgroundColor: "#ffffff",
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

              {/* Rol */}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Rol"
                  value={formData.rol}
                  onChange={(e) => handleInputChange("rol", e.target.value)}
                  error={!!errors.rol}
                  helperText={errors.rol}
                  required
                  size="small"
                  className="modern-input"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: "500",
                      backgroundColor: "#ffffff",
                      padding: "0 4px",
                      "&.Mui-focused": {
                        color: "#326ce5",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                      },
                    },
                    "& .MuiFormLabel-filled": {
                      backgroundColor: "#ffffff",
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
                      color: "#326ce5",
                    },
                  }}>
                  {roles.map((rol) => (
                    <MenuItem key={rol.id} value={rol.id}>
                      {rol.descripcion}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Separador visual */}
              <Grid item xs={12}>
                <div className="border-t border-gray-200 my-4"></div>
              </Grid>

              {/* Información Personal */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Información Personal
                </Typography>
              </Grid>

              {/* Nombre */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  error={!!errors.nombre}
                  helperText={errors.nombre}
                  required
                  size="small"
                  className="modern-input"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: "500",
                      backgroundColor: "#ffffff",
                      padding: "0 4px",
                      "&.Mui-focused": {
                        color: "#326ce5",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                      },
                    },
                    "& .MuiFormLabel-filled": {
                      backgroundColor: "#ffffff",
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

              {/* Apellido */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Apellido"
                  value={formData.apellido}
                  onChange={(e) =>
                    handleInputChange("apellido", e.target.value)
                  }
                  error={!!errors.apellido}
                  helperText={errors.apellido}
                  required
                  size="small"
                  className="modern-input"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: "500",
                      backgroundColor: "#ffffff",
                      padding: "0 4px",
                      "&.Mui-focused": {
                        color: "#326ce5",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                      },
                    },
                    "& .MuiFormLabel-filled": {
                      backgroundColor: "#ffffff",
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

              {/* Información Institucional */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  className="text-gray-700 font-semibold mb-3">
                  Información Institucional
                </Typography>
              </Grid>

              {/* Legajo */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Legajo"
                  type="number"
                  value={formData.legajo}
                  onChange={(e) => handleInputChange("legajo", e.target.value)}
                  error={!!errors.legajo}
                  helperText={errors.legajo}
                  required
                  size="small"
                  className="modern-input"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: "500",
                      backgroundColor: "#ffffff",
                      padding: "0 4px",
                      "&.Mui-focused": {
                        color: "#326ce5",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                      },
                    },
                    "& .MuiFormLabel-filled": {
                      backgroundColor: "#ffffff",
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

              {/* Documento */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Documento"
                  type="number"
                  value={formData.documento}
                  onChange={(e) =>
                    handleInputChange("documento", e.target.value)
                  }
                  error={!!errors.documento}
                  helperText={errors.documento}
                  required
                  size="small"
                  className="modern-input"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#326ce5",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 0 3px rgba(59, 130, 160, 0.1)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: "500",
                      backgroundColor: "#ffffff",
                      padding: "0 4px",
                      "&.Mui-focused": {
                        color: "#326ce5",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                      },
                    },
                    "& .MuiFormLabel-filled": {
                      backgroundColor: "#ffffff",
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

            <div className="flex justify-center mt-6">
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <SaveIcon />
                }
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium">
                {loading ? "Creando..." : "Crear Usuario"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(CrearUsuario);
