import { useEffect, useState } from "react";

interface SelectOption {
  value: string;
}

interface UseSelectNavigationArgs {
  open: boolean;
  setOpen: (open: boolean) => void;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Si el listbox incluye una primera opción "vacía" (placeholder) */
  includeEmptyOption?: boolean;
}

/**
 * Navegación por teclado para los selects personalizados (FilterSelect,
 * CompactFilterSelect, FormSelectInput): flechas para moverse, Enter/Espacio
 * para abrir o seleccionar, Home/End, Escape para cerrar.
 *
 * Espacio de índices: si includeEmptyOption, 0 = opción vacía y las demás
 * corren una posición; si no, 0..n-1 mapean directo a options.
 */
export function useSelectNavigation({
  open,
  setOpen,
  options,
  value,
  onChange,
  includeEmptyOption = true,
}: UseSelectNavigationArgs) {
  const offset = includeEmptyOption ? 1 : 0;
  const total = options.length + offset;
  const [highlighted, setHighlighted] = useState(-1);

  // Al abrir, resaltar la opción seleccionada actual
  useEffect(() => {
    if (!open) {
      setHighlighted(-1);
      return;
    }
    const selectedIdx = options.findIndex((o) => o.value === value);
    setHighlighted(selectedIdx >= 0 ? selectedIdx + offset : includeEmptyOption ? 0 : -1);
  }, [open, options, value, offset, includeEmptyOption]);

  const selectIndex = (idx: number) => {
    if (idx < 0 || idx >= total) return;
    if (includeEmptyOption && idx === 0) {
      onChange("");
    } else {
      onChange(options[idx - offset].value);
    }
    setOpen(false);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          setHighlighted((h) => Math.min(h + 1, total - 1));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          setHighlighted((h) => Math.max(h - 1, 0));
        }
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setHighlighted(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setHighlighted(total - 1);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          selectIndex(highlighted);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        if (open) setOpen(false);
        break;
    }
  };

  return { highlighted, setHighlighted, selectIndex, handleTriggerKeyDown };
}
