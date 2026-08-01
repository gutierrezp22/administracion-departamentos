"use client";
import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Swal from "sweetalert2";
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from "react-icons/fi";
import API from "@/api/axiosConfig";

interface ResetPasswordCardProps {
  uid: string;
  token: string;
}

/**
 * Tarjeta de restablecimiento de contraseña, compartida por las dos rutas
 * de entrada: /login/reset-password/<uid>/<token>/ (path) y
 * /login/reset-password/?uid=...&token=... (query string, compatible con
 * export estático sin rewrites del servidor).
 */
const ResetPasswordCard: React.FC<ResetPasswordCardProps> = ({ uid, token }) => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasNumber = /\d/.test(pass);
    const hasLetter = /[a-zA-Z]/.test(pass);
    return minLength && hasNumber && hasLetter;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Las contraseñas no coinciden.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (!validatePassword(password)) {
      Swal.fire({
        icon: "error",
        title: "Contraseña inválida",
        text: "La contraseña debe tener al menos 8 caracteres e incluir letras y números.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setIsLoading(true);

    try {
      await API.post(`/facet/password/reset/confirm/${uid}/${token}/`, {
        new_password: password,
        confirm_new_password: confirmPassword,
      });

      await Swal.fire({
        icon: "success",
        title: "¡Contraseña actualizada!",
        text: "Tu contraseña se restableció correctamente. Ya podés iniciar sesión con tu nueva contraseña.",
        confirmButtonText: "Ir al inicio de sesión",
        confirmButtonColor: "#3b82f6",
      });

      router.push("/login");
    } catch (error: any) {
      console.error("Error al restablecer contraseña:", error);
      let mensaje =
        "No se pudo restablecer la contraseña. El enlace puede haber expirado.";
      if (!error?.response) {
        mensaje =
          "No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente.";
      } else if (error.response.status === 400) {
        const data = error.response.data;
        const detalle =
          data?.detail ||
          data?.error ||
          (typeof data === "object"
            ? Object.values(data).flat().join(" ")
            : null);
        if (detalle) mensaje = String(detalle);
      }
      Swal.fire({
        icon: "error",
        title: "Error",
        text: mensaje,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return "";

    if (validatePassword(password)) {
      return "text-green-600";
    } else if (password.length >= 6) {
      return "text-yellow-600";
    } else {
      return "text-red-600";
    }
  };

  const inputClass =
    "appearance-none block w-full px-3 py-3 pl-10 pr-10 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all duration-200";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Elementos decorativos sutiles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500 opacity-5"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-600 opacity-5"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-400 opacity-5"></div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm relative z-10 border border-gray-100">
        <div className="text-center">
          <Image
            src="/logoFACET.png"
            alt="Logo FACET"
            width={140}
            height={42}
            className="h-10 w-auto mx-auto mb-6"
            unoptimized
          />
          <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-green-50 mb-6">
            <FiCheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Nueva contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Ingresá tu nueva contraseña para completar el restablecimiento
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className={inputClass}
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {password && (
                <p className={`mt-1 text-xs ${passwordStrength()}`}>
                  {validatePassword(password)
                    ? "✓ Contraseña segura"
                    : "Mínimo 8 caracteres, incluir letras y números"}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className={inputClass}
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {confirmPassword && (
                <p
                  className={`mt-1 text-xs ${
                    password === confirmPassword
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                  {password === confirmPassword
                    ? "✓ Las contraseñas coinciden"
                    : "✗ Las contraseñas no coinciden"}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={
                isLoading ||
                !validatePassword(password) ||
                password !== confirmPassword
              }
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 ease-in-out shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Restableciendo...
                </>
              ) : (
                <>
                  <FiCheckCircle className="mr-2 h-4 w-4" />
                  Restablecer contraseña
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            Volver al inicio de sesión
          </Link>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} FACET — UNT. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordCard;
