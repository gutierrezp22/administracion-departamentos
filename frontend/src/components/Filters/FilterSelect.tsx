import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

interface Option {
  value: string | number;
  label: string;
}

interface FilterSelectProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Todos",
}) => {
  return (
    <FormControl
      fullWidth
      variant="outlined"
      size="small"
      style={{ minWidth: 120, marginBottom: 0 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as string)}
        label={label}
        displayEmpty>
        <MenuItem value="">{placeholder}</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default FilterSelect;
