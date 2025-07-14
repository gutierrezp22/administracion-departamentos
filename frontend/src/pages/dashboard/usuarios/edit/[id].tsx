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
  Switch,
  FormControlLabel,
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

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  legajo: number;
  documento: number;
  rol: number;
  rol_detalle: string;
  is_active: boolean;
  has_changed_password: boolean;
}

const EditarUsuario = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    apellido: "",
    legajo: "",
    documento: "",
    rol: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (id) {
      fetchRoles();
      fetchUsuario();
    }
  }, [id]);

  const fetchRoles = async () => {
    try {
      const response = await API.get(`${API_BASE_URL}/facet/roles/`);
      console.log("Respuesta de roles:", response.data);
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

  const fetchUsuario = async () => {
    try {
      const response = await API.get(`${API_BASE_URL}/facet/users/${id}/`);
      const userData = response.data;
      setUsuario(userData);
      setFormData({
        email: userData.email || "",
        nombre: userData.nombre || "",
        apellido: userData.apellido || "",
        legajo: userData.legajo?.toString() || "",
        documento: userData.documento?.toString() || "",
        rol:
          (userData.rol && typeof userData.rol === "number"
            ? userData.rol.toString()
            : "") || "",
        is_active: userData.is_active,
      });
    } catch (error) {
      console.error("Error al cargar usuario:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la información del usuario.",
      }).then(() => {
        router.push("/dashboard/usuarios");
      });
    } finally {
      setLoadingData(false);
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

  const handleInputChange = (field: string, value: string | boolean) => {
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
        nombre: formData.nombre,
        apellido: formData.apellido,
        legajo: parseInt(formData.legajo),
        documento: parseInt(formData.documento),
        rol: parseInt(formData.rol),
        is_active: formData.is_active,
      };

      await API.put(`${API_BASE_URL}/facet/users/${id}/`, userData);

      Swal.fire({
        icon: "success",
        title: "Usuario actualizado exitosamente",
        text: "Los cambios han sido guardados correctamente.",
        confirmButtonText: "Aceptar",
      }).then(() => {
        router.push("/dashboard/usuarios");
      });
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);

      let errorMessage = "Error al actualizar el usuario";

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

  if (loadingData) {
    return (
      <DashboardMenu>
        <BasicModal
          open={true}
          onClose={() => {}}
          title="Cargando usuario..."
          content="Por favor espere mientras se cargan los datos del usuario."
        />
      </DashboardMenu>
    );
  }

  if (!usuario) {
    return (
      <DashboardMenu>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <Alert severity="error">
            No se pudo cargar la información del usuario.
          </Alert>
        </div>
      </DashboardMenu>
    );
  }

  return (
    <DashboardMenu>
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Editar Usuario</h1>
          </div>
        </div>

        <div className="p-6">
          <Paper className="p-6">
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
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
                  />
                </Grid>

                {/* Nombre */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      handleInputChange("nombre", e.target.value)
                    }
                    error={!!errors.nombre}
                    helperText={errors.nombre}
                    required
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
                  />
                </Grid>

                {/* Legajo */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Legajo"
                    type="number"
                    value={formData.legajo}
                    onChange={(e) =>
                      handleInputChange("legajo", e.target.value)
                    }
                    error={!!errors.legajo}
                    helperText={errors.legajo}
                    required
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
                  />
                </Grid>

                {/* Rol */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.rol}>
                    <InputLabel>Rol</InputLabel>
                    <Select
                      value={formData.rol}
                      onChange={(e) => handleInputChange("rol", e.target.value)}
                      label="Rol"
                      required>
                      {roles.map((rol) => (
                        <MenuItem key={rol.id} value={rol.id}>
                          {rol.descripcion}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.rol && (
                      <Typography variant="caption" color="error">
                        {errors.rol}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                {/* Estado */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active}
                        onChange={(e) =>
                          handleInputChange("is_active", e.target.checked)
                        }
                        color="primary"
                      />
                    }
                    label="Usuario Activo"
                  />
                  <Typography
                    variant="caption"
                    display="block"
                    color="textSecondary">
                    Desactivar un usuario lo excluye del sistema pero mantiene
                    sus datos
                  </Typography>
                </Grid>

                {/* Información adicional */}
                <Grid item xs={12}>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Typography variant="h6" gutterBottom>
                      Información del Usuario
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Rol actual:</strong> {usuario.rol_detalle}
                        </Typography>
                      </Grid>
                    </Grid>
                  </div>
                </Grid>
              </Grid>

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={
                    loading ? <CircularProgress size={20} /> : <SaveIcon />
                  }
                  className="bg-blue-500 hover:bg-blue-600">
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </Paper>
        </div>
      </div>
    </DashboardMenu>
  );
};

export default withAuth(EditarUsuario);
