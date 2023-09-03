import { Slider, Box, TextField } from '@mui/material';
import { useState, useEffect } from 'react';

const ParameterSlider = ({ min, max, value, onChange }) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSliderChange = (event, newValue) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value === '' ? '' : Number(event.target.value));
    onChange(event.target.value === '' ? '' : Number(event.target.value));
  };

  return (
    <Box sx={{ width: 250 }}>
      <Slider
        value={inputValue}
        onChange={handleSliderChange}
        min={min}
        max={max}
        aria-labelledby="input-slider"
      />
      <TextField
        value={inputValue}
        onChange={handleInputChange}
        inputProps={{
          step: (max - min) / 100,
          min,
          max,
          type: 'number',
          'aria-labelledby': 'input-slider',
        }}
      />
    </Box>
  );
};

export default ParameterSlider;
