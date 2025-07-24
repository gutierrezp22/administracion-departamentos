"use client";
import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FiMail, FiArrowLeft, FiSend } from "react-icons/fi";
import "../../app/globals.css";
import API from "@/api/axiosConfig";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await API.post(`/facet/password/reset/`, {
        email,
      });

      await Swal.fire({
        icon: "success",
        title: "Correo enviado",
        text: "Se ha enviado un enlace de recuperación a su correo electrónico. Revise su bandeja de entrada y spam.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#2563eb",
      });

      router.push("/login");
    } catch (error) {
      console.error("Error al solicitar recuperación:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo enviar el correo de recuperación. Verifique que el correo electrónico esté registrado.",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-blue-50 mb-6">
            <FiSend className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Ingrese su correo electrónico y le enviaremos un enlace para restablecer su contraseña
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                  placeholder="nombre@ejemplo.com"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
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
                  Enviando...
                </>
              ) : (
                <>
                  <FiSend className="mr-2 h-4 w-4" />
                  Enviar Enlace de Recuperación
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
              <FiArrowLeft className="mr-1 h-4 w-4" />
              Volver al inicio de sesión
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} FACET - UNT. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </div>
  );
}