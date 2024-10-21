import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardMedia, Typography } from '@mui/material';
import { Howl } from 'howler'; // Importamos Howl

function Cartas({ carta }) {
  // Usamos useRef para mantener una referencia al sonido
  const sonidoRef = useRef(null);

  // Efecto para reproducir el audio cuando la carta cambia
  useEffect(() => {
    if (carta && carta.audio) {
      // Si ya hay un sonido cargado, lo detenemos antes de cargar el nuevo
      if (sonidoRef.current) {
        sonidoRef.current.stop();
      }

      // Cargamos el nuevo sonido usando Howl
      sonidoRef.current = new Howl({
        src: [carta.audio],
        volume: 1,
      });

      // Reproducimos el sonido
      sonidoRef.current.play();

      // Limpiar el sonido cuando el componente se desmonta o la carta cambia
      return () => {
        if (sonidoRef.current) {
          sonidoRef.current.stop();
        }
      };
    }
  }, [carta]); // Este efecto se ejecuta cada vez que cambia la carta

  // Verificamos si la carta está definida
  if (!carta) {
    return (
      <Typography variant="h6" align="center" sx={{ marginTop: '2rem', color: '#fff' }}>
        Cargando carta...
      </Typography>
    );
  }

  return (
    <Card
      sx={{
        maxWidth: 600,
        margin: '0 auto',
        marginTop: '2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fondo semi-transparente
        color: '#fff', // Texto en blanco
      }}
    >
      <CardMedia
        component="img"
        image={carta.imagen} // Usamos directamente carta.imagen
        alt={carta.nombre}
        sx={{ height: 400 }}
      />
      <CardContent>
        <Typography
          variant="h5"
          align="center"
          sx={{
            color: '#fff',
            textTransform: 'uppercase',
          }}
        >
          {carta.nombre}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default Cartas;
