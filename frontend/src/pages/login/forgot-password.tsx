"use client";
import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
      await API.post(`/facet/password/reset/`, { email });

      await Swal.fire({
        icon: "success",
        title: "Correo enviado",
        text: "Se ha enviado un enlace de recuperación a su correo electrónico. Revise su bandeja de entrada y spam.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#3b82f6",
        customClass: {
          popup: "rounded-2xl shadow-xl",
        },
      });

      router.push("/login");
    } catch (error) {
      console.error("Error al solicitar recuperación:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo enviar el correo de recuperación. Verifique que el correo electrónico esté registrado.",
        confirmButtonColor: "#3b82f6",
        customClass: {
          popup: "rounded-2xl shadow-xl",
        },
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
      {/* Panel izquierdo (branding) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-400 mix-blend-overlay blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-indigo-400 mix-blend-overlay blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-cyan-300 mix-blend-overlay blur-3xl" />
        </div>

        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

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

          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              Recuperá tu
              <br />
              <span className="text-blue-200">acceso</span>
            </h1>
            <p className="text-base text-blue-100/90 max-w-md leading-relaxed">
              Te enviaremos un enlace seguro al correo electrónico asociado con
              tu cuenta para que puedas restablecer tu contraseña.
            </p>
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

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors duration-200 mb-6 group">
            <FiArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Volver al inicio de sesión
          </button>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingresá tu correo y te enviaremos las instrucciones.
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
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <FiSend className="h-4 w-4" />
                  <span>Enviar enlace</span>
                </>
              )}
            </button>
          </form>

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
