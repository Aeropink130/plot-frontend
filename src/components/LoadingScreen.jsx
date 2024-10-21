// src/components/LoadingScreen.js
import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import theme from '../theme';

const LoadingScreen = () => {
  return (
    <Box
      sx={{
        height: '100vh',
        background: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column', // Para alinear el spinner y el texto verticalmente
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <CircularProgress
        color="primary"
        sx={{ mb: 3 }} // Margen inferior para separar el spinner del texto
      />
      <Typography variant="h4" sx={{ color: theme.palette.text.primary }}>
        Cargando recursos...
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
