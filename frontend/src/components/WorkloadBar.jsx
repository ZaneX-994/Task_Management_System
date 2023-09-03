import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { Typography, Box } from '@mui/material';

const WorkloadBar = (props) => {
  let {value, size} = props;
  let pcolor = 'success';
  let tcolor = 'black';
  let valueText = `${value}%`;

  if (value <= 25) {
    pcolor = 'success';
    tcolor = 'green';
  } else if (value <= 75) {
    pcolor = 'warning';
    tcolor = 'darkOrange'
  } else if (value <= 100) {
    pcolor = 'error';
    tcolor = 'red';
  } else {
    pcolor = 'inherit';
    tcolor = 'black';
    valueText = '100%+'
  }

  const defaultTypographySize = 0.7; // in rem
  const defaultCircularProgressSize = 40; // in px
  const typographySize = defaultTypographySize * size / defaultCircularProgressSize;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', top: '-15px', left: '20px', }}>
      <CircularProgress
        color={pcolor}
        variant="determinate"
        thickness={4.5}
        size={size}
        value={value <= 100 ? value : 100}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          component="div"
          color={tcolor}
          sx={{ fontSize: `${typographySize}rem` }} 
        >{valueText}</Typography>
      </Box>
    </Box>
  );
};

export default WorkloadBar;