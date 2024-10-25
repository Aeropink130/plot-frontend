// src/App.js
import React, { useEffect, useMemo, useState, useRef } from "react";
import "./App.css";
import { Howl, Howler } from "howler";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { v4 as uuidv4 } from "uuid";

import MainMenu from "./components/MainMenu";
import LoadingScreen from "./components/LoadingScreen";
import Countdown from "./components/Countdown";
import GameScreen from "./components/GameScreen";
import FinishedScreen from "./components/FinishedScreen";
import WaitingRoomScreen from "./components/WatingRoomScreen.jsx";
import VolumeControl from "./components/VolumeControl";
import { mezclarCartas } from "./utils";
import cartas from "./cartas.js";

function App() {
  // Estados y referencias
  const [currentScreen, setCurrentScreen] = useState("mainMenu");
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [difficulty, setDifficulty] = useState("dificil");
  // eslint-disable-next-line no-unused-vars
  const [playerId, setPlayerId] = useState(uuidv4());

  // Estados del juego
  const [intervalo, setIntervalo] = useState(1000);
  const [indiceCarta, setIndiceCarta] = useState(0);
  const [iniciado, setIniciado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [contador, setContador] = useState(null);
  const [cartasMezcladas, setCartasMezcladas] = useState([]);
  const [playerTemplate, setPlayerTemplate] = useState([]);
  const [ganador, setGanador] = useState(null);

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
  const clientIdRef = useRef(null);

  // Efecto para establecer la conexión WebSocket una sola vez
  useEffect(() => {
    console.log("playerId:", playerId);
    const socket = new SockJS(
      "https://plot-backend.onrender.com/createConnection"
    );
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Conectado al WebSocket");

        stompClientRef.current = client;
        clientIdRef.current = client.webSocket._transport.url.split("/").pop();

        // Suscripciones que no dependen de roomCode
        client.subscribe("/user/queue/roomCreated", (message) => {
          const response = JSON.parse(message.body);
          setRoomCode(response.roomCode);
          setPlayers(response.players || []);
          setPlayerTemplate(response.template || []); // Guardar la plantilla recibida
          setCurrentScreen("waitingRoom");
        });

        client.subscribe("/user/queue/joinedRoom", (message) => {
          const response = JSON.parse(message.body);
          setRoomName(response.roomName);
          setPlayers(response.players || []);
          setPlayerTemplate(response.template || []);
          setCurrentScreen("waitingRoom");
        });

        client.subscribe("/user/queue/error", (message) => {
          const error = message.body;
          console.error("Error:", error);
          // Manejar el error, mostrar mensaje al usuario, etc.
        });
      },
      onDisconnect: () => {
        console.log("Desconectado del WebSocket");
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efecto para manejar las suscripciones que dependen de roomCode y currentScreen
  useEffect(() => {
    const client = stompClientRef.current;
    if (!client || !client.connected || !roomCode) return;

    let roomSubscription;

    roomSubscription = client.subscribe(
      "/topic/room/" + roomCode,
      (message) => {
        const response = JSON.parse(message.body);
        console.log("RoomUpdate recibido:", response); // Agrega este log
        setPlayers(response.players || []);

        // Actualizar la dificultad si está presente en el mensaje
        if (response.difficulty) {
          console.log("Actualizando dificultad a:", response.difficulty); // Agrega este log
          setDifficulty(response.difficulty);
        }

        // Verificar si hay un ganador
        if (response.winnerId) {
          setGanador(response.winnerId);
          setTerminado(true);
          setCurrentScreen("finished");
        }

        if (response.startGame) {
          // Establecer el mazo mezclado recibido del servidor
          setCartasMezcladas(response.shuffledDeck);
          setCurrentScreen("game");
          handleIniciar(); // Iniciar el juego al recibir la señal
        }
      }
    );

    return () => {
      if (roomSubscription) {
        roomSubscription.unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // Función para manejar la creación de salas
  const handleCreateRoom = (name, playerName) => {
    setRoomName(name);
    setIsHost(true);

    const client = stompClientRef.current;

    if (client && client.connected) {
      client.publish({
        destination: "/app/createRoom",
        body: JSON.stringify({ roomName: name, playerId, playerName }), // Incluir playerName
      });
    } else {
      // Esperar a que el WebSocket esté conectado antes de publicar
      const interval = setInterval(() => {
        if (client && client.connected) {
          client.publish({
            destination: "/app/createRoom",
            body: JSON.stringify({ roomName: name, playerId, playerName }), // Incluir playerName
          });
          clearInterval(interval);
        }
      }, 100);
    }
  };

  // Función para manejar la unión a salas
  const handleJoinRoom = (code, playerName) => {
    console.log("Intentando unirse a la sala con código:", code);
    setRoomCode(code);
    setIsHost(false);

    const client = stompClientRef.current;

    if (client && client.connected) {
      client.publish({
        destination: "/app/joinRoom",
        body: JSON.stringify({
          roomCode: code,
          playerId: playerId,
          playerName,
        }), // Incluir playerName
      });
    } else {
      // Esperar a que el WebSocket esté conectado antes de publicar
      const interval = setInterval(() => {
        if (client && client.connected) {
          client.publish({
            destination: "/app/joinRoom",
            body: JSON.stringify({
              roomCode: code,
              playerId: playerId,
              playerName,
            }), // Incluir playerName
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
        destination: "/app/startGame",
        body: JSON.stringify({ roomCode, shuffledDeck }),
      });
    } else {
      console.error("stompClient no está conectado");
    }
  };

  // Función para cancelar y volver al menú principal
  const handleCancel = () => {
    const stompClient = stompClientRef.current;
    stompClient.publish({
      destination: "/app/leaveRoom",
      body: JSON.stringify({ roomCode }),
    });
    // Resetear estados
    setCurrentScreen("mainMenu");
    setRoomName("");
    setRoomCode("");
    setPlayers([]);
    setIsHost(false);
  };

  // Pre-cargar sonidos solo una vez
  useEffect(() => {
    if (
      iniciado &&
      !sonidosPreCargadosRef.current &&
      cartasMezcladas.length > 0
    ) {
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
    // Pre-cargar imágenes de la plantilla del jugador
    playerTemplate.forEach((carta) => {
      const img = new Image();
      img.src = carta.imagen;
      imagenes[carta.nombre] = img.src;
    });
    return imagenes;
  }, [cartasMezcladas, playerTemplate]);

  // Función para manejar el inicio
  const handleIniciar = () => {
    setCargando(true);

    let intervaloSeleccionado;
    switch (difficulty) {
      case "facil":
        intervaloSeleccionado = 10000;
        break;
      case "medio":
        intervaloSeleccionado = 2500;
        break;
      case "dificil":
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
          if (terminado) return;
          setIsSoundEnded(false);
          if (indiceCarta >= cartasMezcladas.length - 1) {
            setTerminado(true);
            setCurrentScreen("finished");
          } else {
            setIndiceCarta((prev) => prev + 1);
          }
        }, intervalo);
      };

      sonido.once("end", handleEnd);

      return () => {
        sonido.off("end", handleEnd);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [indiceCarta, iniciado, terminado, intervalo, cartasMezcladas]);

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

    if (iniciado && !terminado) {
      startTimeRef.current = Date.now() - (pauseTimeRef.current || 0);
      animationFrameId = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [iniciado, terminado, tiempoTotal, isSoundEnded]);

  // Función para manejar el "¡Gané!"
  const handleGane = (markedCards) => {
    const client = stompClientRef.current;

    console.log("Enviando solicitud de victoria con playerId:", playerId);

    if (client && client.connected) {
      client.publish({
        destination: "/app/checkWin",
        body: JSON.stringify({
          roomCode,
          playerId,
          markedCards,
          currentCardIndex: indiceCarta,
        }),
      });
    } else {
      console.error("stompClient no está conectado");
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
    setTerminado(false);
    setIniciado(false);
    setIsSoundEnded(false);
    intervalRemainingRef.current = intervalo;
    setTiempoTranscurrido(0);
    setTiempoTotal(0);
    setContador(null);
    setCurrentScreen("mainMenu");
    setRoomName("");
    setRoomCode("");
    setPlayers([]);
    setIsHost(false);
    setPlayerTemplate([]);
    setGanador(null);
  };

  const updateDifficulty = (newDifficulty) => {
    setDifficulty(newDifficulty);

    if (isHost) {
      const client = stompClientRef.current;

      if (client && client.connected) {
        client.publish({
          destination: "/app/updateDifficulty",
          body: JSON.stringify({ roomCode, difficulty: newDifficulty }),
        });
      } else {
        console.error("stompClient no está conectado");
      }
    }
  };

  return (
    <>
      {currentScreen === "mainMenu" && (
        <MainMenu
          handleCreateRoom={handleCreateRoom}
          handleJoinRoom={handleJoinRoom}
        />
      )}
      {currentScreen === "waitingRoom" && (
        <WaitingRoomScreen
          roomName={roomName}
          roomCode={roomCode}
          players={players}
          isHost={isHost}
          handleStartGame={handleStartGame}
          handleCancel={handleCancel}
          difficulty={difficulty}
          setDifficulty={updateDifficulty}
        />
      )}
      {currentScreen === "game" && (
        <>
          {contador !== null && !iniciado && !terminado ? (
            <Countdown contador={contador} />
          ) : cargando ? (
            <LoadingScreen />
          ) : terminado ? (
            <FinishedScreen
              handleReiniciar={handleReiniciar}
              ganador={ganador}
              players={players}
            />
          ) : (
            <GameScreen
              cartasMezcladas={cartasMezcladas}
              indiceCarta={indiceCarta}
              imagenesPreCargadas={imagenesPreCargadas}
              tiempoTranscurrido={tiempoTranscurrido}
              tiempoTotal={tiempoTotal}
              playerTemplate={playerTemplate}
              handleGane={handleGane}
            />
          )}
        </>
      )}
      {currentScreen === "finished" && (
        <FinishedScreen
          handleReiniciar={handleReiniciar}
          ganador={ganador}
          players={players}
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
