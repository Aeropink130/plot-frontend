// src/components/FinishedScreen.js
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import theme from '../theme';

const FinishedScreen = ({ handleReiniciar, ganador, players }) => {
  const winnerPlayer = players.find((player) => player.id === ganador);

  return (
    <Box
      sx={{
        height: '100vh',
        background: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          marginBottom: '2rem',
          color: theme.palette.text.primary,
          textTransform: 'uppercase',
        }}
      >
        ¡{winnerPlayer ? winnerPlayer.name : 'Alguien'} ha ganado!
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleReiniciar}
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          fontSize: '1.2rem',
        }}
      >
        Reiniciar
      </Button>
    </Box>
  );
};

export default FinishedScreen;
