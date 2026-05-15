import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import { Alert, Switch, FormControlLabel } from "@mui/material";
import Swal from "sweetalert2";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import "./styles.css";
import BasicModal from "../../../../utils/modal";
import {
  FormContainer,
  FormSection,
  FormField,
  FormActions,
  FormButton,
} from "@/components/Form";

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

  const fetchRoles = useCallback(async () => {
    try {
      const response = await API.get(`/facet/roles/`);
      setRoles(Array.isArray(response.data) ? response.data : response.data.results);
    } catch (error) {
      console.error("Error al cargar roles:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los roles.",
      });
    }
  }, []);

  const fetchUsuario = useCallback(async () => {
    try {
      const response = await API.get(`/facet/users/${id}/`);
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
  }, [id, router]);

  useEffect(() => {
    if (id) {
      fetchRoles();
      fetchUsuario();
    }
  }, [id, fetchRoles, fetchUsuario]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (!formData.nombre) newErrors.nombre = "El nombre es requerido";
    if (!formData.apellido) newErrors.apellido = "El apellido es requerido";

    if (!formData.legajo) {
      newErrors.legajo = "El legajo es requerido";
    } else if (isNaN(Number(formData.legajo))) {
      newErrors.legajo = "El legajo debe ser un número";
    }

    if (!formData.documento) {
      newErrors.documento = "El documento es requerido";
    } else if (isNaN(Number(formData.documento))) {
      newErrors.documento = "El documento debe ser un número";
    }

    if (!formData.rol) newErrors.rol = "El rol es requerido";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

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

      await API.put(`/facet/users/${id}/`, userData);

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
      <FormContainer title="Editar Usuario">
        <FormSection title="Información de Acceso">
          <FormField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            required
          />
        </FormSection>

        <FormSection title="Información Personal">
          <FormField
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => handleInputChange("nombre", e.target.value)}
            error={!!errors.nombre}
            helperText={errors.nombre}
            required
          />
          <FormField
            label="Apellido"
            value={formData.apellido}
            onChange={(e) => handleInputChange("apellido", e.target.value)}
            error={!!errors.apellido}
            helperText={errors.apellido}
            required
          />
          <FormField
            label="Legajo"
            value={formData.legajo}
            onChange={(e) => handleInputChange("legajo", e.target.value)}
            error={!!errors.legajo}
            helperText={errors.legajo}
            required
          />
          <FormField
            label="Documento"
            value={formData.documento}
            onChange={(e) => handleInputChange("documento", e.target.value)}
            error={!!errors.documento}
            helperText={errors.documento}
            required
          />
        </FormSection>

        <FormSection title="Rol y Estado">
          <FormField
            label="Rol"
            value={formData.rol}
            onChange={(e) => handleInputChange("rol", e.target.value)}
            error={!!errors.rol}
            helperText={errors.rol}
            required
            options={roles.map((r) => ({ value: r.id.toString(), label: r.descripcion }))}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => handleInputChange("is_active", e.target.checked)}
              />
            }
            label={formData.is_active ? "Usuario Activo" : "Usuario Inactivo"}
          />
        </FormSection>

        <FormActions>
          <FormButton onClick={() => handleSubmit()} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </FormButton>
        </FormActions>
      </FormContainer>
    </DashboardMenu>
  );
};

export default withAuth(EditarUsuario);
