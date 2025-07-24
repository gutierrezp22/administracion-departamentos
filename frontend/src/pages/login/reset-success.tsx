"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { FiCheckCircle, FiArrowRight } from "react-icons/fi";
import "../../app/globals.css";

export default function ResetSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Elementos decorativos sutiles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-green-500 opacity-5"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-green-600 opacity-5"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-green-400 opacity-5"></div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm relative z-10 border border-gray-100 text-center">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-50 mb-6">
            <FiCheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            ¡Contraseña Restablecida!
          </h2>
          <p className="text-gray-600 mb-8">
            Su contraseña ha sido restablecida exitosamente. Ahora puede iniciar sesión con su nueva contraseña.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push("/login")}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out shadow-sm">
            <span>Ir al Inicio de Sesión</span>
            <FiArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} FACET - UNT. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </div>
  );
}