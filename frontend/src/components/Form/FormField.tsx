import React from "react";
import {
  TextField,
  TextFieldProps,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectProps,
} from "@mui/material";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#3b82f6",
      backgroundColor: "#ffffff",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
    "&.Mui-focused": {
      borderColor: "#3b82f6",
      backgroundColor: "#ffffff",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#6b7280",
    fontWeight: 500,
    backgroundColor: "#ffffff",
    padding: "0 4px",
    "&.Mui-focused": {
      color: "#3b82f6",
      fontWeight: 600,
      backgroundColor: "#ffffff",
    },
    "&.MuiFormLabel-filled": {
      backgroundColor: "#ffffff",
    },
  },
  "& .MuiInputBase-input": {
    color: "#1f2937",
    fontWeight: 500,
    fontSize: "0.875rem",
    padding: "8px 12px",
  },
  "& .MuiSelect-icon": {
    color: "#6b7280",
    transition: "color 0.2s ease",
  },
  "&:hover .MuiSelect-icon": {
    color: "#3b82f6",
  },
};

export const formInputSx = inputSx;

type SelectOption = {
  value: string | number;
  label: React.ReactNode;
};

type FormFieldProps = Omit<TextFieldProps, "variant" | "size"> & {
  options?: SelectOption[];
};

const FormField: React.FC<FormFieldProps> = ({ options, children, sx, ...rest }) => {
  const mergedSx = sx ? { ...inputSx, ...(sx as object) } : inputSx;

  if (options) {
    return (
      <TextField
        select
        fullWidth
        variant="outlined"
        size="small"
        className="modern-input"
        sx={mergedSx}
        {...rest}
      >
        {options.map((opt) => (
          <MenuItem key={String(opt.value)} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  return (
    <TextField
      fullWidth
      variant="outlined"
      size="small"
      className="modern-input"
      sx={mergedSx}
      {...rest}
    >
      {children}
    </TextField>
  );
};

type FormSelectProps = {
  label: string;
  value: string | number | "";
  onChange: (value: any) => void;
  children: React.ReactNode;
};

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  onChange,
  children,
}) => {
  return (
    <FormControl fullWidth size="small" className="modern-input" sx={inputSx}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={(e) => onChange(e.target.value)}>
        {children}
      </Select>
    </FormControl>
  );
};

export default FormField;
