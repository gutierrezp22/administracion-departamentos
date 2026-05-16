import React from "react";

interface LoadingOverlayProps {
  message?: string;
  /**
   * - `fullScreen` (default): cubre toda la pantalla con backdrop.
   * - `overlay`: position absolute sobre el padre relative — útil para
   *    mostrar carga solo sobre la grilla/tabla sin tapar el resto.
   * - `inline`: bloque inline con spinner pequeño.
   */
  variant?: "fullScreen" | "overlay" | "inline";
  /** @deprecated usar `variant="inline"` */
  fullScreen?: boolean;
}

/**
 * Componente de overlay de carga unificado.
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = "Cargando...",
  variant,
  fullScreen,
}) => {
  // Backwards-compat con la prop antigua fullScreen
  const resolved: "fullScreen" | "overlay" | "inline" =
    variant ?? (fullScreen === false ? "inline" : "fullScreen");

  if (resolved === "fullScreen") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">{message}</p>
        </div>
      </div>
    );
  }

  if (resolved === "overlay") {
    return (
      <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
        <div className="bg-white rounded-lg px-6 py-4 flex items-center gap-3 shadow-lg border border-gray-200">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="text-gray-700 text-sm font-medium">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
};

export default LoadingOverlay;
