import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  className?: string;
}

/**
 * Componente de paginación unificado para todas las listas del sistema.
 * Proporciona navegación consistente entre páginas con estilos uniformes.
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  className = "",
}) => {
  const buttonBaseClasses =
    "px-4 py-2 rounded-lg font-medium transition-colors duration-200";
  const activeClasses = "bg-blue-500 text-white hover:bg-blue-600";
  const disabledClasses = "bg-gray-300 text-gray-500 cursor-not-allowed";

  return (
    <nav
      aria-label="Paginación"
      className={`flex justify-between items-center mt-6 ${className}`}>
      <button
        onClick={onPrevious}
        disabled={!hasPrevious}
        aria-disabled={!hasPrevious}
        className={`${buttonBaseClasses} ${
          hasPrevious ? activeClasses : disabledClasses
        }`}
      >
        Anterior
      </button>
      <span aria-live="polite" className="text-gray-600 font-medium">
        Página {currentPage} de {totalPages || 1}
      </span>
      <button
        onClick={onNext}
        disabled={!hasNext}
        aria-disabled={!hasNext}
        className={`${buttonBaseClasses} ${
          hasNext ? activeClasses : disabledClasses
        }`}
      >
        Siguiente
      </button>
    </nav>
  );
};

export default Pagination;
