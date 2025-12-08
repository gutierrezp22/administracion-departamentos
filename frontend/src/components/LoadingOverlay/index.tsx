import React from "react";

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Componente de overlay de carga unificado para todo el sistema.
 * Muestra un spinner con un mensaje opcional mientras se cargan datos.
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = "Cargando...",
  fullScreen = true,
}) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">{message}</p>
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
