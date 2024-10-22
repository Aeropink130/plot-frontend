import React from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import theme from '../theme';

const WaitingRoomScreen = ({
  roomName,
  roomCode,
  players = [],
  isHost,
  handleStartGame,
  handleCancel,
  difficulty,
  setDifficulty, // Añadido para actualizar la dificultad
}) => {
  const canStartGame = players.length >= 2;

  return (
    <Box
      sx={{
        height: '100vh',
        background: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        pt: 4,
        px: 2,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          marginBottom: '1rem',
          color: theme.palette.text.primary,
          textTransform: 'uppercase',
        }}
      >
        Sala de Espera
      </Typography>
      <Typography variant="h5" sx={{ color: theme.palette.text.primary }}>
        Nombre de la sala: {roomName}
      </Typography>
      <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
        Código de la sala: {roomCode}
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
          Jugadores en la sala:
        </Typography>
        <List sx={{ color: theme.palette.text.primary }}>
          {players.map((player, index) => (
            <ListItem key={index}>
              {`Jugador ${index + 1}: ${player.name}`}
            </ListItem>
          ))}
        </List>
      </Box>

      {isHost && (
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="dificultad-label">Dificultad</InputLabel>
            <Select
              labelId="dificultad-label"
              value={difficulty}
              label="Dificultad"
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <MenuItem value="facil">Fácil</MenuItem>
              <MenuItem value="medio">Medio</MenuItem>
              <MenuItem value="dificil">Difícil</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {isHost && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleStartGame}
          sx={{ mt: 2 }}
          disabled={!canStartGame}
        >
          Iniciar
        </Button>
      )}
      <Button
        variant="contained"
        color="secondary"
        onClick={handleCancel}
        sx={{ mt: 2 }}
      >
        Cancelar
      </Button>
    </Box>
  );
};

export default WaitingRoomScreen;
