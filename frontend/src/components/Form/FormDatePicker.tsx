import React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import {
  datePickerTextFieldSx,
  datePickerPopperSlotProps,
} from "@/styles/datePickerSlotProps";

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
              sx: datePickerTextFieldSx,
            },
            popper: datePickerPopperSlotProps,
          }}
        />
      </LocalizationProvider>
    </div>
  );
};

export default FormDatePicker;
