import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
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
      setRoles(Array.isArray(response.data) ? response.data : response.data.results);
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

    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
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

  const handleInputChange = (field: string, value: string) => {
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
      <FormContainer title="Crear Nuevo Usuario">
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
          <FormField
            label="Contraseña"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            error={!!errors.password}
            helperText={errors.password}
            required
          />
          <FormField
            label="Confirmar Contraseña"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
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

        <FormSection title="Rol">
          <FormField
            label="Rol"
            value={formData.rol}
            onChange={(e) => handleInputChange("rol", e.target.value)}
            error={!!errors.rol}
            helperText={errors.rol}
            required
            options={roles.map((r) => ({ value: r.id.toString(), label: r.descripcion }))}
          />
        </FormSection>

        <FormActions>
          <FormButton onClick={() => handleSubmit()}>Crear Usuario</FormButton>
        </FormActions>
      </FormContainer>
    </DashboardMenu>
  );
};

export default withAuth(CrearUsuario);
