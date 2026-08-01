"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Swal from "sweetalert2";
import { FiLock, FiMail, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import "../../app/globals.css";
import API from "@/api/axiosConfig";

export default function LoginPage() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await API.post(`/login/token/`, { email, password });

      sessionStorage.setItem("access_token", response.data.access);
      sessionStorage.setItem("refresh_token", response.data.refresh);

      if (response.data.user) {
        sessionStorage.setItem("user_email", response.data.user.email || email);
        sessionStorage.setItem(
          "user_name",
          response.data.user.nombre || response.data.user.email || email
        );
        sessionStorage.setItem("user_rol", response.data.user.rol || "");
      } else {
        sessionStorage.setItem("user_email", email);
        sessionStorage.setItem("user_name", email);
      }

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Si el usuario todavía usa la clave por defecto o venció la rotación,
      // llevarlo directo a cambiar la contraseña
      const hasChangedPassword =
        response.data.has_changed_password ??
        response.data.user?.has_changed_password;
      if (hasChangedPassword === false) {
        await Swal.fire({
          icon: "info",
          title: "Actualizá tu contraseña",
          text: "Por seguridad, necesitás cambiar tu contraseña antes de continuar.",
          confirmButtonText: "Continuar",
          confirmButtonColor: "#3b82f6",
        });
        router.push("/dashboard/change-password");
        return;
      }

      router.push("/dashboard/home");
    } catch (error: any) {
      console.error("Error de autenticación:", error);
      let mensaje = "Correo electrónico o contraseña incorrectos.";
      if (!error?.response) {
        mensaje =
          "No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente.";
      } else if (error.response.status >= 500) {
        mensaje =
          "El servidor no está disponible en este momento. Intentá más tarde.";
      }
      Swal.fire({
        icon: "error",
        title: "Error de autenticación",
        text: mensaje,
        confirmButtonText: "Entendido",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full pl-11 pr-3 py-3 bg-white border border-gray-200 rounded-xl " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 " +
    "hover:border-gray-400 " +
    "transition-all duration-200 ease-out " +
    "text-sm text-gray-900 placeholder-gray-400 shadow-sm";

  return (
    <div className="min-h-screen flex bg-white">
      {/* Panel izquierdo (branding) — visible en md+ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-400 mix-blend-overlay blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-indigo-400 mix-blend-overlay blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-cyan-300 mix-blend-overlay blur-3xl" />
        </div>

        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Contenido del panel */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <div className="inline-flex items-center justify-center bg-white rounded-2xl px-5 py-3 shadow-2xl">
              <Image
                src="/logoFACET.png"
                alt="Logo FACET"
                width={160}
                height={48}
                className="h-12 w-auto"
                unoptimized
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
                Administración de
                <br />
                <span className="text-blue-200">Departamentos</span>
              </h1>
              <p className="mt-4 text-base text-blue-100/90 max-w-md leading-relaxed">
                Sistema integral de gestión académica de la Facultad de Ciencias
                Exactas y Tecnología — Universidad Nacional de Tucumán.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 max-w-md">
              <FeatureChip text="Cargos docentes" />
              <FeatureChip text="Resoluciones" />
              <FeatureChip text="Asignaturas" />
              <FeatureChip text="Departamentos" />
            </div>
          </div>

          <div className="text-xs text-blue-200/70">
            © {new Date().getFullYear()} FACET — UNT. Todos los derechos
            reservados.
          </div>
        </div>
      </div>

      {/* Panel derecho (form) */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-12 bg-gray-50">
        <div className="max-w-md w-full">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 text-center">
            <Image
              src="/logoFACET.png"
              alt="Logo FACET"
              width={140}
              height={42}
              className="h-10 w-auto mx-auto"
              unoptimized
            />
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Bienvenido
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingresá tus credenciales para acceder al sistema
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FiMail className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className={inputClass}
                  placeholder="nombre@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700">
                  Contraseña
                </label>
                <Link
                  href="/login/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FiLock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className={`${inputClass} pr-11`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-blue-500 focus:outline-none transition-colors duration-200"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }>
                  {showPassword ? (
                    <FiEyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <FiEye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <label
              htmlFor="remember-me"
              className="flex items-center cursor-pointer group select-none">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500/20 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                Recordarme en este dispositivo
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-black shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <FiArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer mobile */}
          <div className="lg:hidden mt-10 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} FACET — UNT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const FeatureChip: React.FC<{ text: string }> = ({ text }) => (
  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium text-white">
    {text}
  </span>
);
