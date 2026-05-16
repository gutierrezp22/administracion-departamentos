import React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

interface FormDatePickerProps {
  label: string;
  value: Dayjs | null;
  onChange: (date: Dayjs | null) => void;
  format?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Date picker estilizado igual a FilterDatePicker / FormField: bg-gray-50,
 * rounded-xl, hover azul, popper bottom-start sin flip.
 */
const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  value,
  onChange,
  format = "DD/MM/YYYY",
  required,
  disabled,
  placeholder = "dd/mm/aaaa",
}) => {
  return (
    <div className="flex flex-col">
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          value={value}
          onChange={onChange}
          format={format}
          disabled={disabled}
          slotProps={{
            textField: {
              fullWidth: true,
              size: "small",
              placeholder,
              sx: {
                "& .MuiOutlinedInput-root": {
                  borderRadius: "0.75rem",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  transition: "all 0.2s ease",
                  paddingRight: "8px",
                  fontFamily: "inherit",
                  fontSize: "0.875rem",
                  color: "#1f2937",
                  "& fieldset": { border: "none" },
                  "&:hover": {
                    backgroundColor: "#ffffff",
                    borderColor: "#60a5fa",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "#ffffff",
                    borderColor: "#3b82f6",
                    boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "#f3f4f6",
                    color: "#9ca3af",
                  },
                  "& input": {
                    padding: "10px 12px",
                  },
                  "& .MuiSvgIcon-root": {
                    fontSize: "1.125rem",
                    color: "#9ca3af",
                  },
                },
              },
            },
            popper: {
              placement: "bottom-start",
              modifiers: [
                { name: "flip", enabled: false },
                { name: "preventOverflow", enabled: false },
                { name: "hide", enabled: false },
                { name: "offset", options: { offset: [0, 4] } },
              ],
              sx: { zIndex: 1500 },
            },
          }}
        />
      </LocalizationProvider>
    </div>
  );
};

export default FormDatePicker;
