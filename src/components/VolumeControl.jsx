// src/components/VolumeControl.js
import React from 'react';
import { Box, IconButton, Slider, Collapse, ClickAwayListener } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

const VolumeControl = ({
  volume,
  setVolume,
  showVolumeControl,
  setShowVolumeControl,
}) => {
  return (
    <ClickAwayListener onClickAway={() => showVolumeControl && setShowVolumeControl(false)}>
      <Box
        sx={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: showVolumeControl ? '16px 8px' : '8px',
          borderRadius: showVolumeControl ? '9999px' : '50%',
          zIndex: 1000,
          transition: 'all 0.3s',
        }}
      >
        <IconButton
          onClick={() => setShowVolumeControl((prev) => !prev)}
          sx={{ color: '#fff' }}
        >
          {volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
        <Collapse in={showVolumeControl} orientation="vertical" timeout={300}>
          <Slider
            value={volume * 100}
            onChange={(e, newValue) => setVolume(newValue / 100)}
            aria-labelledby="volume-slider"
            orientation="vertical"
            sx={{
              height: 100,
              color: '#fff',
              mb: 2,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                color: '#fff',
              },
              '& .MuiSlider-rail': {
                color: '#bfbfbf',
              },
              '& .MuiSlider-track': {
                color: '#fff',
              },
            }}
          />
        </Collapse>
      </Box>
    </ClickAwayListener>
  );
};

export default VolumeControl;
