import React from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface FilterInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date";
  className?: string;
  onEnterPress?: () => void;
}

export const FilterInput: React.FC<FilterInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  onEnterPress,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnterPress) {
      e.preventDefault();
      onEnterPress();
    }
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm text-gray-800 bg-white placeholder-gray-500"
        />
        {type === "text" && (
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        )}
      </div>
    </div>
  );
};

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  className = "",
}) => {
  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm appearance-none bg-white text-gray-800">
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

interface FilterContainerProps {
  children: React.ReactNode;
  onApply: () => void;
  onClear?: () => void;
  showClearButton?: boolean;
}

export const FilterContainer: React.FC<FilterContainerProps> = ({
  children,
  onApply,
  onClear,
  showClearButton = false,
}) => {
  // Clonar los children y pasarles la función onEnterPress
  const childrenWithEnterPress = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === FilterInput) {
      return React.cloneElement(child as React.ReactElement<FilterInputProps>, {
        onEnterPress: onApply,
      });
    }
    return child;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
            <XMarkIcon className="h-4 w-4" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
        {childrenWithEnterPress}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onApply}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-sm transition-colors duration-200 font-medium">
          <MagnifyingGlassIcon className="h-4 w-4" />
          <span>Buscar</span>
        </button>
      </div>
    </div>
  );
};

// Componente específico para filtro de estado
export const EstadoFilter: React.FC<{
  value: string;
  onChange: (value: string) => void;
  className?: string;
}> = ({ value, onChange, className = "" }) => {
  return (
    <FilterSelect
      label="Estado"
      value={value}
      onChange={onChange}
      options={[
        { value: "todos", label: "Todos" },
        { value: "1", label: "Activo" },
        { value: "0", label: "Inactivo" },
      ]}
      placeholder="Seleccionar estado"
      className={className}
    />
  );
};

// Componente específico para filtro de tipo
export const TipoFilter: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}> = ({ value, onChange, options, className = "" }) => {
  return (
    <FilterSelect
      label="Tipo"
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Seleccionar tipo"
      className={className}
    />
  );
};
