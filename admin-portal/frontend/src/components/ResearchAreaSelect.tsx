import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  FormHelperText,
  SelectChangeEvent,
} from '@mui/material';

interface ResearchAreaSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  options: string[];
  label?: string;
  customLabel?: string;
  customPlaceholder?: string;
}

export const ResearchAreaSelect: React.FC<ResearchAreaSelectProps> = ({
  value,
  onChange,
  error,
  helperText,
  required = false,
  options,
  label = "Research Area",
  customLabel = "Specify Research Area",
  customPlaceholder = "Enter your specific research area"
}) => {
  const [selectedValue, setSelectedValue] = useState(value || '');
  const [customValue, setCustomValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    // Check if current value is "Others" or a custom value
    if (value === 'Others' || (value && !options.includes(value))) {
      setSelectedValue('Others');
      setCustomValue(value === 'Others' ? '' : value);
      setShowCustomInput(true);
    } else {
      setSelectedValue(value || '');
      setShowCustomInput(false);
    }
  }, [value, options]);

  const handleSelectChange = (event: SelectChangeEvent) => {
    const newValue = event.target.value;
    setSelectedValue(newValue);
    
    if (newValue === 'Others') {
      setShowCustomInput(true);
      onChange('Others');
    } else {
      setShowCustomInput(false);
      setCustomValue('');
      onChange(newValue);
    }
  };

  const handleCustomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCustomValue = event.target.value;
    setCustomValue(newCustomValue);
    // Send the custom value to parent, or 'Others' if empty
    onChange(newCustomValue || 'Others');
  };

  return (
    <Box>
      <FormControl fullWidth error={error} required={required}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={selectedValue}
          onChange={handleSelectChange}
          label={label}
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>

      {showCustomInput && (
        <TextField
          fullWidth
          label={customLabel}
          value={customValue}
          onChange={handleCustomChange}
          margin="normal"
          required={required && selectedValue === 'Others'}
          error={error && !customValue && selectedValue === 'Others'}
          helperText={
            error && !customValue && selectedValue === 'Others'
              ? `Please specify the ${label.toLowerCase()}`
              : customPlaceholder
          }
          placeholder={customPlaceholder}
        />
      )}
    </Box>
  );
};
