// src/components/GameScreen.js
import React, { useState } from 'react';
import { Box, Button, LinearProgress, Grid } from '@mui/material';
import Cartas from './Cartas.jsx';
import theme from '../theme';

const GameScreen = ({
  cartasMezcladas,
  indiceCarta,
  imagenesPreCargadas,
  tiempoTranscurrido,
  tiempoTotal,
  playerTemplate,
  handleGane,
}) => {
  const [markedCards, setMarkedCards] = useState([]);

  const toggleCard = (cardName) => {
    if (markedCards.includes(cardName)) {
      setMarkedCards(markedCards.filter((name) => name !== cardName));
    } else {
      setMarkedCards([...markedCards, cardName]);
    }
  };

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

      {/* Plantilla del jugador */}
      <Box sx={{ marginTop: '2rem', width: '80%' }}>
        <Grid container spacing={1}>
          {playerTemplate.map((card, index) => (
            <Grid item xs={3} key={index}>
              <Box
                sx={{
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '4px',
                  backgroundColor: markedCards.includes(card.nombre)
                    ? 'lightgreen'
                    : 'white',
                  cursor: 'pointer',
                }}
                onClick={() => toggleCard(card.nombre)}
              >
                <img
                  src={imagenesPreCargadas[card.nombre]}
                  alt={card.nombre}
                  style={{ width: '100%', height: 'auto' }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Botón "¡Gané!" */}
      <Box sx={{ marginTop: '1rem' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleGane(markedCards)}
        >
          ¡Gané!
        </Button>
      </Box>
    </Box>
  );
};

export default GameScreen;
