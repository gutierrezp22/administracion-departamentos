/**
 * Estilos compartidos del MUI DatePicker (FilterDatePicker y FormDatePicker).
 * Única fuente de verdad: cualquier ajuste de la apariencia del date picker
 * se hace acá y aplica en ambos componentes.
 */

export const datePickerTextFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "0.75rem",
    backgroundColor: "#f9fafb", // gray-50
    border: "1px solid #e5e7eb", // gray-200
    transition: "all 0.2s ease",
    paddingRight: "8px",
    fontFamily: "inherit",
    fontSize: "0.875rem",
    color: "#1f2937", // gray-800
    "& fieldset": { border: "none" },
    "&:hover": {
      backgroundColor: "#ffffff",
      borderColor: "#60a5fa", // blue-400
    },
    "&.Mui-focused": {
      backgroundColor: "#ffffff",
      borderColor: "#3b82f6", // blue-500
      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
    },
    "&.Mui-disabled": {
      backgroundColor: "#f3f4f6", // gray-100
      color: "#9ca3af", // gray-400
    },
    "& input": {
      padding: "10px 12px",
    },
    "& .MuiSvgIcon-root": {
      fontSize: "1.125rem",
      color: "#9ca3af", // gray-400
    },
  },
} as const;

export const datePickerPopperSlotProps = {
  placement: "bottom-start" as const,
  modifiers: [
    { name: "flip", enabled: false },
    { name: "preventOverflow", enabled: false },
    { name: "hide", enabled: false },
    { name: "offset", options: { offset: [0, 4] } },
  ],
  sx: { zIndex: 1500 },
};
