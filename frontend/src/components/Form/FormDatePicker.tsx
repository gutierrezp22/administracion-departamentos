import React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { Dayjs } from "dayjs";
import { formInputSx } from "./FormField";

interface FormDatePickerProps {
  label: string;
  value: Dayjs | null;
  onChange: (date: Dayjs | null) => void;
  format?: string;
}

const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  value,
  onChange,
  format = "DD/MM/YYYY",
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        value={value}
        onChange={onChange}
        format={format}
        slotProps={{
          textField: {
            fullWidth: true,
            variant: "outlined",
            size: "small",
            className: "modern-input",
            sx: formInputSx,
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default FormDatePicker;
