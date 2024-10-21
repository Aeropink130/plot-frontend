// src/App.js
import React, { useEffect, useMemo, useState, useRef } from 'react';
import './App.css';
import { Howl, Howler } from 'howler'; // Importamos Howler
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import MainMenu from './components/MainMenu';
import LoadingScreen from './components/LoadingScreen';
import Countdown from './components/Countdown';
import GameScreen from './components/GameScreen';
import FinishedScreen from './components/FinishedScreen';
import VolumeControl from './components/VolumeControl';
import { mezclarCartas } from './utils';
import cartas from './cartas.js';

function App() {
  // Estados y referencias
  const [intervalo, setIntervalo] = useState(1000);
  const [indiceCarta, setIndiceCarta] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [dificultad, setDificultad] = useState('facil');
  const [volume, setVolume] = useState(1);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [contador, setContador] = useState(null);
  const [roomCode, setRoomCode] = useState('');

  const soundRef = useRef(null);
  const sonidosPreCargadosRef = useRef(null);
  const timeoutRef = useRef(null);
  const intervalStartTimeRef = useRef(0);
  const intervalRemainingRef = useRef(intervalo);
  const [isSoundEnded, setIsSoundEnded] = useState(false);
  const [tiempoTotal, setTiempoTotal] = useState(0);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);
  const startTimeRef = useRef(null);
  const pauseTimeRef = useRef(null);
  const sonidoDurationRef = useRef(0);
  const hasPlayedRef = useRef(false);

  // Efecto para establecer la conexión WebSocket (sin cambios)
  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/createConnection');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Conectado al WebSocket');

        // Suscribirse al canal donde el servidor envía el código de sala
        stompClient.subscribe('/topic/room', (message) => {
          const response = JSON.parse(message.body);
          setRoomCode(response.roomCode);
          console.log('Código de sala recibido:', response.roomCode);
        });

        // Enviar solicitud para crear la sala
        stompClient.publish({
          destination: '/app/createRoom',
          body: '',
        });
      },
      onDisconnect: () => {
        console.log('Desconectado del WebSocket');
      },
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  // Memoizar cartas mezcladas
  const cartasMezcladas = useMemo(() => {
    if (!iniciado) return [];
    return mezclarCartas([...cartas]);
  }, [iniciado]);

  // Memoizar sonidos precargados sin incluir 'volume' en las dependencias
  const sonidosPreCargados = useMemo(() => {
    const sonidos = {};
    cartasMezcladas.forEach((carta) => {
      sonidos[carta.nombre] = new Howl({
        src: [carta.audio],
      });
    });
    return sonidos;
  }, [cartasMezcladas]);

  // Pre-cargar sonidos solo una vez
  useEffect(() => {
    if (iniciado && !sonidosPreCargadosRef.current) {
      const sonidos = {};
      cartasMezcladas.forEach((carta) => {
        sonidos[carta.nombre] = new Howl({
          src: [carta.audio],
        });
      });
      sonidosPreCargadosRef.current = sonidos;
    }
  }, [iniciado, cartasMezcladas]);

  // Efecto para actualizar el volumen globalmente
  useEffect(() => {
    Howler.volume(volume);
  }, [volume]);

  // Memoizar imágenes precargadas (sin cambios)
  const imagenesPreCargadas = useMemo(() => {
    const imagenes = {};
    cartasMezcladas.forEach((carta) => {
      const img = new Image();
      img.src = carta.imagen;
      imagenes[carta.nombre] = img.src;
    });
    return imagenes;
  }, [cartasMezcladas]);

  // Función para manejar el inicio (sin cambios)
  const handleIniciar = () => {
    setCargando(true);

    let intervaloSeleccionado;
    switch (dificultad) {
      case 'facil':
        intervaloSeleccionado = 5000;
        break;
      case 'medio':
        intervaloSeleccionado = 2500;
        break;
      case 'dificil':
        intervaloSeleccionado = 1000;
        break;
      default:
        intervaloSeleccionado = 2500;
    }
    setIntervalo(intervaloSeleccionado);
    intervalRemainingRef.current = intervaloSeleccionado;

    setTimeout(() => {
      setCargando(false);
      setContador(3);
    }, 1000);
  };

  // Efecto para el contador regresivo (sin cambios)
  useEffect(() => {
    let contadorInterval;
    if (contador > 0) {
      contadorInterval = setInterval(() => {
        setContador((prev) => prev - 1);
      }, 1000);
    } else if (contador === 0) {
      setContador(null);
      setIniciado(true);
    }

    return () => {
      if (contadorInterval) {
        clearInterval(contadorInterval);
      }
    };
  }, [contador]);

  // Efecto para manejar la reproducción del audio y avanzar de carta
  useEffect(() => {
    console.log('Ejecutando useEffect de reproducción de audio');

    if (!iniciado || terminado || cartasMezcladas.length === 0) return;

    // Resetear la referencia cuando cambia la carta
    hasPlayedRef.current = false;

    const cartaActual = cartasMezcladas[indiceCarta];
    const sonido = sonidosPreCargadosRef.current[cartaActual.nombre];
    soundRef.current = sonido;
    setIsSoundEnded(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (sonido && !hasPlayedRef.current) {
      hasPlayedRef.current = true;

      const duracionAudio = sonido.duration() * 1000;
      setTiempoTotal(duracionAudio + intervalo);
      setTiempoTranscurrido(0);
      sonidoDurationRef.current = duracionAudio;
      startTimeRef.current = Date.now();
      pauseTimeRef.current = null;

      sonido.play();

      const handleEnd = () => {
        setIsSoundEnded(true);
        intervalStartTimeRef.current = Date.now();
        intervalRemainingRef.current = intervalo;

        timeoutRef.current = setTimeout(() => {
          if (pausado || terminado) return;
          setIsSoundEnded(false);
          if (indiceCarta >= cartasMezcladas.length - 1) {
            setTerminado(true);
          } else {
            setIndiceCarta((prev) => prev + 1);
          }
        }, intervalo);
      };

      sonido.once('end', handleEnd);

      return () => {
        sonido.off('end', handleEnd);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [cartasMezcladas, indiceCarta, iniciado, intervalo, pausado, terminado]);

  // Efecto para actualizar el tiempo transcurrido (sin cambios)
  useEffect(() => {
    let animationFrameId;

    const updateProgress = () => {
      if (!startTimeRef.current) return;

      const tiempoActual = Date.now();
      let tiempoTranscurridoActual = tiempoActual - startTimeRef.current;

      if (isSoundEnded) {
        tiempoTranscurridoActual += sonidoDurationRef.current;
      }

      if (tiempoTranscurridoActual >= tiempoTotal) {
        setTiempoTranscurrido(tiempoTotal);
      } else {
        setTiempoTranscurrido(tiempoTranscurridoActual);
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    if (iniciado && !terminado && !pausado) {
      startTimeRef.current = Date.now() - (pauseTimeRef.current || 0);
      animationFrameId = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [iniciado, terminado, pausado, tiempoTotal, isSoundEnded]);

  // Función para pausar audio y temporizador (sin cambios)
  const pauseAudioAndTimer = () => {
    const sonido = soundRef.current;
    if (sonido && sonido.playing()) {
      sonido.pause();
    }

    if (timeoutRef.current) {
      const elapsed = Date.now() - intervalStartTimeRef.current;
      intervalRemainingRef.current -= elapsed;
      if (intervalRemainingRef.current < 0) {
        intervalRemainingRef.current = 0;
      }
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    pauseTimeRef.current = Date.now() - startTimeRef.current;
  };

  // Función para reanudar audio y temporizador (sin cambios)
  const resumeAudioAndTimer = () => {
    const sonido = soundRef.current;
    if (sonido) {
      if (!isSoundEnded) {
        sonido.play();
      } else {
        if (intervalRemainingRef.current <= 0) {
          setIsSoundEnded(false);
          if (indiceCarta >= cartasMezcladas.length - 1) {
            setTerminado(true);
          } else {
            setIndiceCarta((prev) => prev + 1);
          }
        } else {
          intervalStartTimeRef.current = Date.now();
          timeoutRef.current = setTimeout(() => {
            if (pausado || terminado) return;
            setIsSoundEnded(false);
            if (indiceCarta >= cartasMezcladas.length - 1) {
              setTerminado(true);
            } else {
              setIndiceCarta((prev) => prev + 1);
            }
          }, intervalRemainingRef.current);
        }
      }
    }

    startTimeRef.current = Date.now() - pauseTimeRef.current;
    pauseTimeRef.current = null;
  };

  // Manejador para el botón de pausa/reanudar (sin cambios)
  const handlePauseResume = () => {
    if (!pausado) {
      pauseAudioAndTimer();
    } else {
      resumeAudioAndTimer();
    }
    setPausado(!pausado);
  };

  // Función para reiniciar la aplicación (sin cambios)
  const handleReiniciar = () => {
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIndiceCarta(0);
    setPausado(false);
    setTerminado(false);
    setIniciado(false);
    setIsSoundEnded(false);
    intervalRemainingRef.current = intervalo;
    setTiempoTranscurrido(0);
    setTiempoTotal(0);
    setContador(null);
  };

  return (
    <>
      {contador !== null ? (
        <Countdown contador={contador} />
      ) : cargando ? (
        <LoadingScreen />
      ) : !iniciado ? (
        <MainMenu
          dificultad={dificultad}
          setDificultad={setDificultad}
          handleIniciar={handleIniciar}
          roomCode={roomCode}
        />
      ) : terminado ? (
        <FinishedScreen handleReiniciar={handleReiniciar} />
      ) : (
        <GameScreen
          cartasMezcladas={cartasMezcladas}
          indiceCarta={indiceCarta}
          imagenesPreCargadas={imagenesPreCargadas}
          tiempoTranscurrido={tiempoTranscurrido}
          tiempoTotal={tiempoTotal}
          pausado={pausado}
          handlePauseResume={handlePauseResume}
          handleReiniciar={handleReiniciar}
        />
      )}

      <VolumeControl
        volume={volume}
        setVolume={setVolume}
        showVolumeControl={showVolumeControl}
        setShowVolumeControl={setShowVolumeControl}
      />
    </>
  );
}

export default App;
