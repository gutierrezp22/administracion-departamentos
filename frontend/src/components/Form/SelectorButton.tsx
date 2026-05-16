import React from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

interface SelectorButtonProps {
  label: string;
  onClick: () => void;
  selectedLabel?: string;
  selectedValue?: React.ReactNode;
  /** Si es true y no hay selección, se muestra con énfasis (borde naranja, "Requerido") */
  required?: boolean;
  /** Texto auxiliar que aparece bajo el botón vacío para guiar al usuario */
  hint?: string;
}

/**
 * Botón para seleccionar una entidad relacionada (Persona, Departamento, etc.)
 * con feedback visual claro de estado:
 *  - VACÍO + required → card dashed naranja + chip "Requerido"
 *  - VACÍO + opcional → card dashed gris suave
 *  - SELECCIONADO → card verde con check + botón "Cambiar"
 */
const SelectorButton: React.FC<SelectorButtonProps> = ({
  label,
  onClick,
  selectedLabel,
  selectedValue,
  required = false,
  hint,
}) => {
  const isSelected =
    selectedValue !== undefined &&
    selectedValue !== null &&
    selectedValue !== "";

  if (isSelected) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-300 rounded-xl px-4 py-3 transition-all duration-200">
        <div className="flex-shrink-0 text-green-600">
          <CheckCircleIcon sx={{ fontSize: 24 }} />
        </div>
        <div className="flex-1 min-w-0">
          {selectedLabel && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-green-700">
              {selectedLabel}
            </p>
          )}
          <p className="text-sm font-medium text-gray-900 truncate">
            {selectedValue}
          </p>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="flex-shrink-0 text-xs font-semibold text-green-700 hover:text-green-900 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors duration-200">
          Cambiar
        </button>
      </div>
    );
  }

  // Estado vacío
  const baseStyle = required
    ? "bg-orange-50/60 border-2 border-dashed border-orange-300 hover:border-orange-500 hover:bg-orange-50"
    : "bg-gray-50/60 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/40";

  const iconColor = required ? "text-orange-500" : "text-gray-400";
  const textColor = required ? "text-orange-900" : "text-gray-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full ${baseStyle} rounded-xl px-4 py-4 transition-all duration-200 group flex items-center gap-3 text-left`}>
      <div className={`flex-shrink-0 ${iconColor} group-hover:scale-110 transition-transform duration-200`}>
        {required ? (
          <ErrorOutlineIcon sx={{ fontSize: 28 }} />
        ) : (
          <AddCircleOutlineIcon sx={{ fontSize: 28 }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold ${textColor}`}>{label}</p>
          {required && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-200 px-1.5 py-0.5 rounded-full">
              Requerido
            </span>
          )}
        </div>
        <p className={`text-xs mt-0.5 ${required ? "text-orange-700" : "text-gray-500"}`}>
          {hint || "Click para seleccionar"}
        </p>
      </div>
    </button>
  );
};

export default SelectorButton;
