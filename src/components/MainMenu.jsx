import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Collapse,
} from '@mui/material';
import theme from '../theme';

const MainMenu = ({ handleCreateRoom, handleJoinRoom }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const toggleCreateForm = () => {
    setShowCreateForm((prev) => !prev);
    setShowJoinForm(false);
  };

  const toggleJoinForm = () => {
    setShowJoinForm((prev) => !prev);
    setShowCreateForm(false);
  };

  const handleCreateRoomConfirm = () => {
    handleCreateRoom(roomName);
  };

  const handleJoinRoomConfirm = () => {
    handleJoinRoom(roomCode);
  };

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
        px: 2,
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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={toggleCreateForm}
          sx={{ width: 200 }}
        >
          Crear Sala
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={toggleJoinForm}
          sx={{ width: 200 }}
        >
          Unirse a Sala
        </Button>
      </Box>

      {/* Formulario para Crear Sala */}
      <Collapse in={showCreateForm} sx={{ mt: 2 }}>
        <TextField
          label="Nombre de la sala"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          sx={{ mb: 2, width: '300px' }}
          InputLabelProps={{ style: { color: '#fff' } }}
          InputProps={{
            style: { color: '#fff' },
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateRoomConfirm}
          disabled={!roomName}
        >
          Confirmar
        </Button>
      </Collapse>

      {/* Formulario para Unirse a Sala */}
      <Collapse in={showJoinForm} sx={{ mt: 2 }}>
        <TextField
          label="Código de la sala"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          sx={{ mb: 2, width: '300px' }}
          InputLabelProps={{ style: { color: '#fff' } }}
          InputProps={{
            style: { color: '#fff' },
          }}
        />
        <Button
          variant="contained"
          color="secondary"
          onClick={handleJoinRoomConfirm}
          disabled={!roomCode}
        >
          Confirmar
        </Button>
      </Collapse>
    </Box>
  );
};

export default MainMenu;
