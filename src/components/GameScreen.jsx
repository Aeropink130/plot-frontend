// src/components/GameScreen.js
import React from 'react';
import { Box, Button, LinearProgress } from '@mui/material';
import Cartas from './Cartas.jsx';
import theme from '../theme';

const GameScreen = ({
  cartasMezcladas,
  indiceCarta,
  imagenesPreCargadas,
  tiempoTranscurrido,
  tiempoTotal,
  pausado,
  handlePauseResume,
  handleReiniciar,
}) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '3rem',
      }}
    >
      {/* Contenedor para la carta y la barra de progreso */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <Cartas
          carta={cartasMezcladas[indiceCarta]}
          imagenesPreCargadas={imagenesPreCargadas}
        />
        <LinearProgress
          variant="determinate"
          value={(tiempoTranscurrido / tiempoTotal) * 100}
          sx={{
            width: '100%',
            marginTop: '1rem',
            height: '10px',
            borderRadius: '5px',
            '& .MuiLinearProgress-bar': {
              backgroundColor: theme.palette.primary.main,
            },
            backgroundColor: '#ccc',
          }}
        />
      </Box>

      {/* Botones */}
      <Box sx={{ marginTop: '1rem' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePauseResume}
          sx={{ marginRight: '1rem' }}
        >
          {pausado ? 'Reanudar' : 'Pausar'}
        </Button>
        <Button variant="contained" color="secondary" onClick={handleReiniciar}>
          Reiniciar
        </Button>
      </Box>
    </Box>
  );
};

export default GameScreen;
