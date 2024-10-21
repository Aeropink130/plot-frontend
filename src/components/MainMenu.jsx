// src/components/MainMenu.js
import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import theme from '../theme';

const MainMenu = ({ dificultad, setDificultad, handleIniciar, roomCode }) => {
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
        Bienvenid@s a la Lotería Millennial
      </Typography>
      {/* Mostrar el código de la sala */}
      {roomCode && (
        <Typography variant="h5" sx={{ color: theme.palette.text.primary }}>
          Código de sala: {roomCode}
        </Typography>
      )}
      <FormControl sx={{ minWidth: 120, marginBottom: '2rem' }} variant="outlined">
        <InputLabel id="dificultad-label" sx={{ color: '#fff' }}>
          Dificultad
        </InputLabel>
        <Select
          labelId="dificultad-label"
          id="dificultad-select"
          value={dificultad}
          label="Dificultad"
          onChange={(e) => setDificultad(e.target.value)}
          sx={{
            color: '#fff',
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: '#fff',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#fff',
            },
            '.MuiSvgIcon-root': {
              color: '#fff',
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                backgroundColor: '#4e54c8',
              },
            },
            MenuListProps: {
              sx: {
                color: '#fff',
                '& .MuiMenuItem-root:hover': {
                  backgroundColor: '#8f94fb',
                },
              },
            },
          }}
        >
          <MenuItem value="facil">Fácil</MenuItem>
          <MenuItem value="medio">Medio</MenuItem>
          <MenuItem value="dificil">Difícil</MenuItem>
        </Select>
      </FormControl>
      <Button
        variant="contained"
        color="primary"
        onClick={handleIniciar}
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          fontSize: '1.2rem',
        }}
      >
        Iniciar
      </Button>
    </Box>
  );
};

export default MainMenu;
