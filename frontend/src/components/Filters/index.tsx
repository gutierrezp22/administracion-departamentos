import React from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface FilterInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date";
  className?: string;
  onEnterPress?: () => void;
  icon?: React.ReactNode;
}

export const FilterInput: React.FC<FilterInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  onEnterPress,
  icon,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnterPress) {
      e.preventDefault();
      onEnterPress();
    }
  };

  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
        {icon && <span className="text-blue-500">{icon}</span>}
        {label}
      </label>
      <div className="relative group">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
            hover:border-blue-400 hover:bg-white
            transition-all duration-200 ease-out
            text-sm text-gray-800 placeholder-gray-400
            shadow-sm"
        />
        {type === "text" && !icon && (
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
        )}
        {type === "date" && (
          <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
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
  icon?: React.ReactNode;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  className = "",
  icon,
}) => {
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
        {icon && <span className="text-blue-500">{icon}</span>}
        {label}
      </label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
            hover:border-blue-400 hover:bg-white
            transition-all duration-200 ease-out
            text-sm text-gray-800
            shadow-sm appearance-none cursor-pointer
            pr-10"
        >
          <option value="" className="text-gray-400">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="text-gray-800">
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDownIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
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
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-sm border border-gray-200/60 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <FunnelIcon className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-gray-800">Filtros de Búsqueda</h3>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="flex items-center space-x-1.5 text-sm text-gray-500 hover:text-red-500 
              transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-red-50"
          >
            <XMarkIcon className="h-4 w-4" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
        {childrenWithEnterPress}
      </div>

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <button
          onClick={onApply}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 
            hover:from-blue-600 hover:to-blue-700 
            text-white px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20
            transition-all duration-200 font-semibold text-sm
            hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
        >
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

// Nuevo componente: Filtro compacto para modales
interface CompactFilterInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onEnterPress?: () => void;
  className?: string;
}

export const CompactFilterInput: React.FC<CompactFilterInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  onEnterPress,
  className = "",
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnterPress) {
      e.preventDefault();
      onEnterPress();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || label}
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg
          focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
          hover:border-blue-400
          transition-all duration-200
          text-sm text-gray-700 placeholder-gray-400
          shadow-sm"
      />
      <MagnifyingGlassIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
    </div>
  );
};

interface CompactFilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export const CompactFilterSelect: React.FC<CompactFilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Todos",
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg
          focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
          hover:border-blue-400
          transition-all duration-200
          text-sm text-gray-700
          shadow-sm appearance-none cursor-pointer
          pr-8"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
};

// Contenedor compacto para filtros en modales
interface CompactFilterContainerProps {
  children: React.ReactNode;
  onApply: () => void;
  onClear?: () => void;
}

export const CompactFilterContainer: React.FC<CompactFilterContainerProps> = ({
  children,
  onApply,
  onClear,
}) => {
  const childrenWithEnterPress = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === CompactFilterInput) {
      return React.cloneElement(child as React.ReactElement<CompactFilterInputProps>, {
        onEnterPress: onApply,
      });
    }
    return child;
  });

  return (
    <div className="bg-gray-50/50 rounded-xl border border-gray-200/60 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-700">Filtros</span>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors duration-200"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
        {childrenWithEnterPress}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onApply}
          className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 
            text-white px-4 py-1.5 rounded-lg shadow-sm
            transition-all duration-200 text-sm font-medium
            hover:shadow-md hover:-translate-y-0.5"
        >
          <MagnifyingGlassIcon className="h-3.5 w-3.5" />
          <span>Buscar</span>
        </button>
      </div>
    </div>
  );
};
