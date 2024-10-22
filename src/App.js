// src/App.js
import React, { useEffect, useMemo, useState, useRef } from 'react';
import './App.css';
import { Howl, Howler } from 'howler';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import MainMenu from './components/MainMenu';
import LoadingScreen from './components/LoadingScreen';
import Countdown from './components/Countdown';
import GameScreen from './components/GameScreen';
import FinishedScreen from './components/FinishedScreen';
import WaitingRoomScreen from './components/WatingRoomScreen.jsx';
import VolumeControl from './components/VolumeControl';
import { mezclarCartas } from './utils';
import cartas from './cartas.js';

function App() {
  // Estados y referencias
  const [currentScreen, setCurrentScreen] = useState('mainMenu'); // 'mainMenu', 'waitingRoom', 'game'
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  

  // Estados del juego
  const [intervalo, setIntervalo] = useState(1000);
  const [indiceCarta, setIndiceCarta] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [terminado, setTerminado] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [dificultad, setDificultad] = useState('dificil');
  const [volume, setVolume] = useState(1);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [contador, setContador] = useState(null);
  const [cartasMezcladas, setCartasMezcladas] = useState([]);


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

  const stompClientRef = useRef(null);

  // Efecto para establecer la conexión WebSocket una sola vez
  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/createConnection');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Conectado al WebSocket');

        stompClientRef.current = client;

        // Suscripciones que no dependen de roomCode
        client.subscribe('/user/queue/roomCreated', (message) => {
          const response = JSON.parse(message.body);
          setRoomCode(response.roomCode);
          setPlayers(response.players || []);
          setCurrentScreen('waitingRoom');
        });

        client.subscribe('/user/queue/joinedRoom', (message) => {
          const response = JSON.parse(message.body);
          setRoomName(response.roomName);
          setPlayers(response.players || []);
          setCurrentScreen('waitingRoom');
        });

        client.subscribe('/user/queue/error', (message) => {
          const error = message.body;
          console.error('Error:', error);
          // Manejar el error, mostrar mensaje al usuario, etc.
        });
      },
      onDisconnect: () => {
        console.log('Desconectado del WebSocket');
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, []); // Ejecutar solo una vez al montar el componente

  // Efecto para manejar las suscripciones que dependen de roomCode y currentScreen
  useEffect(() => {
    const client = stompClientRef.current;
    if (!client || !client.connected) return;
  
    let roomSubscription;
  
    if (currentScreen === 'waitingRoom' && roomCode) {
      roomSubscription = client.subscribe('/topic/room/' + roomCode, (message) => {
        const response = JSON.parse(message.body);
        setPlayers(response.players || []);
        
        // Actualizar la dificultad si está presente en el mensaje
        if (response.difficulty) {
          setDificultad(response.difficulty);
        }
        
        if (response.startGame) {
          // Establecer el mazo mezclado recibido del servidor
          setCartasMezcladas(response.shuffledDeck);
          setCurrentScreen('game');
          handleIniciar(); // Iniciar el juego al recibir la señal
        }
      });
    }
  
    return () => {
      // Desuscribirse del canal cuando cambien las dependencias o el componente se desmonte
      if (roomSubscription) {
        roomSubscription.unsubscribe();
      }
    };
  }, [currentScreen, roomCode]);

  // Función para manejar la creación de salas
  const handleCreateRoom = (name) => {
    setRoomName(name);
    setIsHost(true);

    const client = stompClientRef.current;

    if (client && client.connected) {
      client.publish({
        destination: '/app/createRoom',
        body: JSON.stringify({ roomName: name }),
      });
    } else {
      // Esperar a que el WebSocket esté conectado antes de publicar
      const interval = setInterval(() => {
        if (client && client.connected) {
          client.publish({
            destination: '/app/createRoom',
            body: JSON.stringify({ roomName: name }),
          });
          clearInterval(interval);
        }
      }, 100);
    }
  };

  // Función para manejar la unión a salas
  const handleJoinRoom = (code) => {
    console.log('Intentando unirse a la sala con código:', code);
    setRoomCode(code);
    setIsHost(false);

    const client = stompClientRef.current;

    if (client && client.connected) {
      client.publish({
        destination: '/app/joinRoom',
        body: JSON.stringify({ roomCode: code }),
      });
    } else {
      // Esperar a que el WebSocket esté conectado antes de publicar
      const interval = setInterval(() => {
        if (client && client.connected) {
          client.publish({
            destination: '/app/joinRoom',
            body: JSON.stringify({ roomCode: code }),
          });
          clearInterval(interval);
        }
      }, 100);
    }
  };

  const handleStartGame = () => {
    const client = stompClientRef.current;
  
    // Mezclar las cartas y obtener el mazo mezclado
    const shuffledDeck = mezclarCartas([...cartas]);
  
    // Enviar el mazo mezclado al servidor
    if (client && client.connected) {
      client.publish({
        destination: '/app/startGame',
        body: JSON.stringify({ roomCode, shuffledDeck }),
      });
    } else {
      console.error('stompClient no está conectado');
    }
  };

  // Función para cancelar y volver al menú principal
  const handleCancel = () => {
    const stompClient = stompClientRef.current;
    stompClient.publish({
      destination: '/app/leaveRoom',
      body: JSON.stringify({ roomCode }),
    });
    // Resetear estados
    setCurrentScreen('mainMenu');
    setRoomName('');
    setRoomCode('');
    setPlayers([]);
    setIsHost(false);
  };

  // Lógica del juego
  // Memoizar cartas mezcladas
  // const cartasMezcladas = useMemo(() => {
  //   if (!iniciado) return [];
  //   return mezclarCartas([...cartas]);
  // }, [iniciado]);

  // Pre-cargar sonidos solo una vez
useEffect(() => {
  if (iniciado && !sonidosPreCargadosRef.current && cartasMezcladas.length > 0) {
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

  // Memoizar imágenes precargadas
const imagenesPreCargadas = useMemo(() => {
  const imagenes = {};
  cartasMezcladas.forEach((carta) => {
    const img = new Image();
    img.src = carta.imagen;
    imagenes[carta.nombre] = img.src;
  });
  return imagenes;
}, [cartasMezcladas]);

  // Función para manejar el inicio
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
      // Iniciar contador regresivo
      setContador(3);
    }, 1000);
  };

  // Efecto para el contador regresivo
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceCarta, iniciado, terminado]);

  // Efecto para actualizar el tiempo transcurrido usando requestAnimationFrame
  useEffect(() => {
    let animationFrameId;

    const updateProgress = () => {
      if (!startTimeRef.current) return;

      const tiempoActual = Date.now();
      let tiempoTranscurridoActual = tiempoActual - startTimeRef.current;

      // Si está en el intervalo después del audio
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

  // Función para pausar audio y temporizador
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

    // Guardar el tiempo transcurrido al pausar
    pauseTimeRef.current = Date.now() - startTimeRef.current;
  };

  // Función para reanudar audio y temporizador
  const resumeAudioAndTimer = () => {
    const sonido = soundRef.current;
    if (sonido) {
      if (!isSoundEnded) {
        sonido.play();
      } else {
        if (intervalRemainingRef.current <= 0) {
          // Avanzar inmediatamente a la siguiente carta
          setIsSoundEnded(false);
          if (indiceCarta >= cartasMezcladas.length - 1) {
            setTerminado(true);
          } else {
            setIndiceCarta((prev) => prev + 1);
          }
        } else {
          // Reanudar intervalo
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

    // Restablecer el tiempo de pausa
    startTimeRef.current = Date.now() - pauseTimeRef.current;
    pauseTimeRef.current = null;
  };

  // Manejador para el botón de pausa/reanudar
  const handlePauseResume = () => {
    if (!pausado) {
      pauseAudioAndTimer();
    } else {
      resumeAudioAndTimer();
    }
    setPausado(!pausado);
  };

  // Función para actualizar la dificultad
  const updateDifficulty = (newDifficulty) => {
    setDificultad(newDifficulty);
  
    if (isHost) {
      const client = stompClientRef.current;
  
      if (client && client.connected) {
        client.publish({
          destination: '/app/updateDifficulty',
          body: JSON.stringify({ roomCode, difficulty: newDifficulty }),
        });
      } else {
        console.error('stompClient no está conectado');
      }
    }
  };

  // Función para reiniciar la aplicación
  const handleReiniciar = () => {
    // Limpiar sonido
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current = null;
    }

    // Limpiar temporizador
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
    setCurrentScreen('mainMenu');
    setRoomName('');
    setRoomCode('');
    setPlayers([]);
    setIsHost(false);
  };

  return (
    <>
      {currentScreen === 'mainMenu' && (
        <MainMenu
          handleCreateRoom={handleCreateRoom}
          handleJoinRoom={handleJoinRoom}
        />
      )}
      {currentScreen === 'waitingRoom' && (
        <WaitingRoomScreen
          roomName={roomName}
          roomCode={roomCode}
          players={players}
          isHost={isHost}
          handleStartGame={handleStartGame}
          handleCancel={handleCancel}
          setDifficulty={updateDifficulty}
        />
      )}
      {currentScreen === 'game' && (
        <>
          {contador !== null ? (
            <Countdown contador={contador} />
          ) : cargando ? (
            <LoadingScreen />
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
        </>
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
