import React, { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

/**
 * Estilo unificado de inputs/selects para formularios. Mismo lenguaje visual
 * que los filtros (FilterInput / FilterSelect): rounded-xl, bg-gray-50, hover
 * azul, focus ring azul.
 *
 * Para evitar romper código existente mantenemos:
 *   - `label` arriba en lugar de label flotante.
 *   - `onChange(e)` recibe un evento sintético (con `e.target.value` y opcional
 *     `e.target.checked`), tal como antes con MUI TextField.
 *   - props `error`, `helperText`, `disabled`, `required`, `multiline`, `rows`,
 *     `type`, `placeholder`, `InputLabelProps`.
 */

type FieldEvent<T = string> = {
  target: { value: T };
};

export type SelectOption = {
  value: string | number;
  label: React.ReactNode;
};

export interface FormFieldProps {
  label?: React.ReactNode;
  value: string | number | "" | null | undefined;
  onChange?: (e: FieldEvent<any>) => void;
  options?: SelectOption[];
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
  /** ignorado: para compatibilidad con la API anterior basada en MUI */
  InputLabelProps?: unknown;
  /** ignorado: para compatibilidad */
  InputProps?: { readOnly?: boolean };
  className?: string;
  /** Soporte de input controlado de archivo */
  name?: string;
}

const baseInputClass =
  "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 " +
  "hover:border-blue-400 hover:bg-white " +
  "transition-all duration-200 ease-out " +
  "text-sm text-gray-800 placeholder-gray-400 shadow-sm " +
  "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed";

const errorInputClass =
  "border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50";

/** Campo `required` que aún no fue completado: borde naranja sutil */
const pendingInputClass =
  "border-orange-300 bg-orange-50/40";

const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  options,
  type = "text",
  placeholder,
  required,
  disabled,
  error,
  helperText,
  multiline,
  rows = 3,
  className = "",
  InputProps,
  name,
}) => {
  const isSelect = Array.isArray(options);
  const readOnly = InputProps?.readOnly;

  // Campo `required` que sigue vacío (sin error explícito) → indicador naranja sutil
  const isPending =
    required &&
    !error &&
    !disabled &&
    (value === "" || value === null || value === undefined);

  const stateClass = error
    ? errorInputClass
    : isPending
    ? pendingInputClass
    : "";

  return (
    <div className={`flex flex-col ${className}`}>
      {label !== undefined && label !== "" && (
        <label className={labelClass}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {isSelect ? (
        <FormSelectInput
          value={value ?? ""}
          onChange={(v) =>
            onChange?.({ target: { value: v } } as FieldEvent<unknown>)
          }
          options={options!}
          placeholder={placeholder}
          disabled={disabled}
          error={error}
          pending={isPending}
        />
      ) : multiline ? (
        <textarea
          name={name}
          value={(value ?? "") as string}
          onChange={(e) =>
            onChange?.({ target: { value: e.target.value } } as FieldEvent<string>)
          }
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className={`${baseInputClass} resize-y min-h-[80px] ${stateClass}`}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={(value ?? "") as string}
          onChange={(e) =>
            onChange?.({ target: { value: e.target.value } } as FieldEvent<string>)
          }
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className={`${baseInputClass} ${stateClass}`}
        />
      )}

      {helperText && (
        <p
          className={`text-xs mt-1 ${
            error ? "text-red-600" : "text-gray-500"
          }`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

// ---------- Select custom (mismo dropdown que FilterSelect) ----------

interface FormSelectInputProps {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  pending?: boolean;
}

const FormSelectInput: React.FC<FormSelectInputProps> = ({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  disabled,
  error,
  pending,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const selected = options.find((o) => String(o.value) === String(value));
  const displayText = selected ? selected.label : placeholder;
  const isPlaceholder = !selected;

  return (
    <div className="relative group" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`${baseInputClass} text-left pr-10 cursor-pointer ${
          isPlaceholder ? "text-gray-400" : "text-gray-800"
        } ${open ? "border-blue-500 ring-2 ring-blue-500/20 bg-white" : ""} ${
          error ? errorInputClass : pending ? pendingInputClass : ""
        }`}>
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
            max-h-60 overflow-y-auto py-1"
          role="listbox">
          <li
            role="option"
            aria-selected={value === ""}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="px-3 py-2 text-sm text-gray-400 hover:bg-blue-50 hover:text-gray-700 cursor-pointer flex items-center gap-2">
            <span className="w-4" />
            {placeholder}
          </li>
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <li
                key={String(option.value)}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(String(option.value));
                  setOpen(false);
                }}
                className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors duration-150
                  ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-800 hover:bg-gray-50"
                  }`}>
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

// Compat: export del estilo sx por si algún código antiguo lo usaba
export const formInputSx = {};

// Compat: FormSelect viejo (basado en MUI) — solo por si quedó algún import
export const FormSelect: React.FC<{
  label: string;
  value: string | number | "";
  onChange: (value: any) => void;
  children: React.ReactNode;
}> = ({ label, value, onChange, children }) => {
  // Extrae options de los children (MenuItem)
  const options: SelectOption[] = React.Children.toArray(children)
    .filter((child) => React.isValidElement(child))
    .map((child) => {
      const el = child as React.ReactElement<{ value: any; children: React.ReactNode }>;
      return { value: el.props.value, label: el.props.children };
    });
  return (
    <FormField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
    />
  );
};

export default FormField;
