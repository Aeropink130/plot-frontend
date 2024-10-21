// src/components/Countdown.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import theme from '../theme';

const Countdown = ({ contador }) => {
  return (
    <Box
      sx={{
        height: '100vh',
        background: theme.palette.background.default,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Typography variant="h1" sx={{ color: theme.palette.text.primary }}>
        {contador}
      </Typography>
    </Box>
  );
};

export default Countdown;
