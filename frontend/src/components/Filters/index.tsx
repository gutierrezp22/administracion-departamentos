import React, { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  ChevronDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { useSelectNavigation } from "@/hooks/useSelectNavigation";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnterPress) {
      e.preventDefault();
      onEnterPress();
    }
  };

  // Para tipo date: forzar apertura del datepicker al clickear cualquier parte del input.
  const handleDateClick = () => {
    const el = inputRef.current;
    if (!el) return;
    // showPicker() es la API moderna (Chrome 99+, Edge, Firefox). Si no existe, focus.
    const anyEl = el as HTMLInputElement & { showPicker?: () => void };
    if (typeof anyEl.showPicker === "function") {
      try {
        anyEl.showPicker();
      } catch {
        anyEl.focus();
      }
    } else {
      anyEl.focus();
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
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={type === "date" ? handleDateClick : undefined}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            hover:border-blue-400 hover:bg-white
            transition-all duration-200 ease-out
            text-sm text-gray-800 placeholder-gray-400
            shadow-sm cursor-text"
        />
        {type === "text" && !icon && (
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200 pointer-events-none" />
        )}
        {type === "date" && (
          <CalendarIcon
            onClick={handleDateClick}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200 cursor-pointer"
          />
        )}
      </div>
    </div>
  );
};

interface FilterDatePickerProps {
  label: string;
  /** Valor en formato "YYYY-MM-DD" (para coincidir con FilterInput type="date"). */
  value: string;
  /** Recibe "YYYY-MM-DD" o cadena vacía al limpiar. */
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

import {
  datePickerTextFieldSx,
  datePickerPopperSlotProps,
} from "@/styles/datePickerSlotProps";

/**
 * Date picker consistente con los demás filtros, basado en MUI DatePicker.
 * Reemplazo de <input type="date"> que evita el picker nativo del browser.
 */
export const FilterDatePicker: React.FC<FilterDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  className = "",
}) => {
  const dayjsValue: Dayjs | null = value ? dayjs(value) : null;

  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
        {label}
      </label>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          value={dayjsValue}
          onChange={(d) => onChange(d && d.isValid() ? d.format("YYYY-MM-DD") : "")}
          format="DD/MM/YYYY"
          slotProps={{
            textField: {
              fullWidth: true,
              size: "small",
              placeholder,
              sx: datePickerTextFieldSx,
            },
            popper: datePickerPopperSlotProps,
          }}
        />
      </LocalizationProvider>
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { highlighted, setHighlighted, selectIndex, handleTriggerKeyDown } =
    useSelectNavigation({ open, setOpen, options, value, onChange });

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const displayText = selected ? selected.label : placeholder;
  const isPlaceholder = !selected;

  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
        {icon && <span className="text-blue-500">{icon}</span>}
        {label}
      </label>
      <div className="relative group" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          onKeyDown={handleTriggerKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            hover:border-blue-400 hover:bg-white
            transition-all duration-200 ease-out
            text-sm text-left
            shadow-sm cursor-pointer
            pr-10
            ${isPlaceholder ? "text-gray-400" : "text-gray-800"}
            ${open ? "border-blue-500 ring-2 ring-blue-500/20 bg-white" : ""}`}
        >
          {displayText}
        </button>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-all duration-200 ${
              open ? "rotate-180 text-blue-500" : ""
            }`}
          />
        </div>
        {open && (
          <ul
            className="absolute left-0 right-0 top-full mt-1 z-30
              bg-white border border-gray-200 rounded-xl shadow-lg
              max-h-60 overflow-y-auto
              py-1
              animate-[fadeIn_0.15s_ease-out]"
            role="listbox"
          >
            <li
              role="option"
              aria-selected={value === ""}
              onClick={() => selectIndex(0)}
              onMouseEnter={() => setHighlighted(0)}
              className={`px-3 py-2 text-sm text-gray-400 hover:text-gray-700 cursor-pointer flex items-center gap-2
                ${highlighted === 0 ? "bg-blue-50" : "hover:bg-blue-50"}`}
            >
              <span className="w-4" />
              {placeholder}
            </li>
            {options.map((option, i) => {
              const isSelected = option.value === value;
              const isHighlighted = highlighted === i + 1;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectIndex(i + 1)}
                  onMouseEnter={() => setHighlighted(i + 1)}
                  className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors duration-150
                    ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : isHighlighted
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-800 hover:bg-gray-50"
                    }`}
                >
                  {isSelected ? (
                    <CheckIcon className="h-4 w-4 text-blue-600 shrink-0" />
                  ) : (
                    <span className="w-4" />
                  )}
                  <span className="truncate">{option.label}</span>
                </li>
              );
            })}
          </ul>
        )}
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
  showClearButton = true,
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
        {onClear && showClearButton && (
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { highlighted, setHighlighted, selectIndex, handleTriggerKeyDown } =
    useSelectNavigation({ open, setOpen, options, value, onChange });

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const displayText = selected ? selected.label : placeholder;
  const isPlaceholder = !selected;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
          hover:border-blue-400
          transition-all duration-200
          text-sm text-left
          shadow-sm cursor-pointer
          pr-8
          ${isPlaceholder ? "text-gray-400" : "text-gray-700"}
          ${open ? "border-blue-500 ring-2 ring-blue-500/20" : ""}`}
      >
        {displayText}
      </button>
      <ChevronDownIcon
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none transition-transform duration-200 ${
          open ? "rotate-180 text-blue-500" : ""
        }`}
      />
      {open && (
        <ul
          className="absolute left-0 right-0 top-full mt-1 z-30
            bg-white border border-gray-200 rounded-lg shadow-lg
            max-h-60 overflow-y-auto py-1
            animate-[fadeIn_0.15s_ease-out]"
          role="listbox"
        >
          <li
            role="option"
            aria-selected={value === ""}
            onClick={() => selectIndex(0)}
            onMouseEnter={() => setHighlighted(0)}
            className={`px-3 py-2 text-sm text-gray-400 hover:text-gray-700 cursor-pointer flex items-center gap-2
              ${highlighted === 0 ? "bg-blue-50" : "hover:bg-blue-50"}`}
          >
            <span className="w-4" />
            {placeholder}
          </li>
          {options.map((option, i) => {
            const isSelected = option.value === value;
            const isHighlighted = highlighted === i + 1;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => selectIndex(i + 1)}
                onMouseEnter={() => setHighlighted(i + 1)}
                className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors duration-150
                  ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : isHighlighted
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {isSelected ? (
                  <CheckIcon className="h-4 w-4 text-blue-600 shrink-0" />
                ) : (
                  <span className="w-4" />
                )}
                <span className="truncate">{option.label}</span>
              </li>
            );
          })}
        </ul>
      )}
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
