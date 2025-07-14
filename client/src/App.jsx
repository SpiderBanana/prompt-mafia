import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import CardGallery from "./components/CardGallery";
import ChatBox from "./components/ChatBox";
import PlayerSidebar from "./components/PlayerSidebar";
import Timer from "./components/Timer";
import VoteZone from "./components/VoteZone";
import { checkForForbiddenWord } from "./utils/wordDetection";

// Configuration dynamique de l'URL du serveur
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
  (import.meta.env.DEV ? "http://localhost:4000" : window.location.origin);

const socket = io(SERVER_URL);

export default function App() {
  // États principaux
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  const [players, setPlayers] = useState([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [myWord, setMyWord] = useState("");
  const [order, setOrder] = useState([]);
  const [cards, setCards] = useState([]);
  const [chat, setChat] = useState([]);
  const [phase, setPhase] = useState("WAITING");  const [votes, setVotes] = useState([]);
  const [voteSelected, setVoteSelected] = useState(null);
  const [voteConfirmed, setVoteConfirmed] = useState(false);  const [result, setResult] = useState(null);
  const [isPromptSubmitted, setIsPromptSubmitted] = useState(false);
  const [eliminatedPlayers, setEliminatedPlayers] = useState([]);
  const [promptError, setPromptError] = useState(""); // Nouvel état pour les erreurs de prompt
  const [isFullscreen, setIsFullscreen] = useState(false); // État pour le plein écran
  
  // États pour le système multi-round
  const [round, setRound] = useState(1);
  const [roundResult, setRoundResult] = useState(null);
  const [revealedCards, setRevealedCards] = useState([]);

  // Fonction pour gérer le plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Entrer en plein écran
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error(`Erreur lors de l'activation du plein écran: ${err.message}`);
      });
    } else {
      // Sortir du plein écran
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error(`Erreur lors de la désactivation du plein écran: ${err.message}`);
      });
    }
  };

  // Écouter les changements de plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Handlers Socket.IO
  useEffect(() => {
    socket.on("update_players", (updatedPlayers) => {
      setPlayers(updatedPlayers);
      // Vérifier si le joueur actuel est l'hôte
      const currentPlayer = updatedPlayers.find(p => p.id === socket.id);
      if (currentPlayer) {
        setIsHost(currentPlayer.isHost || false);
      }
    });
    socket.on("assign_roles", (roles) => {
      const me = roles.find(r => r.id === socket.id);
      if (me) {
        setMyWord(me.word);
        // Ne changer la phase que si ce n'est pas déjà en cours de jeu
        if (phase === "WAITING") {
          setPhase("PROMPT");
        }
      }
    });    socket.on("start_turn", ({ currentPlayerId, order }) => {
      setCurrentPlayerId(currentPlayerId);
      setOrder(order);
      setIsPromptSubmitted(false); 
      setPhase("PROMPT"); 
    });
    socket.on("new_image_broadcast", (card) => setCards((prev) => [...prev, card]));
    socket.on("start_discussion", () => {
      setPhase("DISCUSSION");
      setVoteSelected(null);
      setVoteConfirmed(false);
    });
    socket.on("chat_message", (msg) => setChat((prev) => [...prev, msg]));    socket.on("update_votes", setVotes);
    socket.on("reveal_result", (res) => {
      setResult(res);
      setPhase("RESULT");
    });
    
   
    socket.on("round_result", (res) => {
      setRoundResult(res);
      setRevealedCards(res.revealedCards || []);
      setPhase("ROUND_RESULT");
    });
    
    socket.on("game_over", (res) => {
      setResult(res);
      setRevealedCards(res.revealedCards || []);
      setPhase("GAME_OVER");
    });
    
    socket.on("new_round", (data) => {
      setRound(data.round);
      setEliminatedPlayers(data.eliminatedPlayers);
      setCards([]);
      setVotes([]);
      setVoteSelected(null);
      setVoteConfirmed(false);
      setRoundResult(null);
      setIsPromptSubmitted(false); 
      setPhase("PROMPT"); 
    });

    socket.on("rejoin_game", ({ status, round, eliminatedPlayers, cards, votes, turnOrder, currentTurn }) => {
      console.log("Rejoignant une partie en cours:", { status, round });
      setPhase(status);
      setRound(round);
      setEliminatedPlayers(eliminatedPlayers || []);
      setCards(cards || []);
      setVotes(votes || []);
      setOrder(turnOrder || []);
      
      
      const currentPlayerInTurn = turnOrder && typeof currentTurn === 'number' && turnOrder[currentTurn] 
        ? turnOrder[currentTurn] 
        : null;
      setCurrentPlayerId(currentPlayerInTurn);
      
      const currentPlayerCard = cards?.find(card => card.playerId === socket.id);
      if (currentPlayerCard) {
        setIsPromptSubmitted(true);
      }
      
      const currentPlayerVote = votes?.find(vote => vote.voterId === socket.id);
      if (currentPlayerVote) {
        setVoteSelected(currentPlayerVote.votedPlayerId);
        setVoteConfirmed(true);
      }
    });

    // Nouvel événement pour gérer les prompts rejetés
    socket.on("prompt_rejected", ({ error, originalPrompt }) => {
      console.log("Prompt rejeté:", error);
      setPromptError(error);
      setIsPromptSubmitted(false); // Permettre une nouvelle soumission
    });
      return () => {
      socket.off("update_players");
      socket.off("assign_roles");
      socket.off("start_turn");
      socket.off("new_image_broadcast");
      socket.off("start_discussion");
      socket.off("chat_message");
      socket.off("update_votes");
      socket.off("reveal_result");
      socket.off("round_result");
      socket.off("game_over");
      socket.off("new_round");
      socket.off("rejoin_game");
      socket.off("prompt_rejected");
    };
  }, []);  
  const restartGame = () => {
    setCurrentPlayerId(null);
    setMyWord("");
    setOrder([]);
    setCards([]);
    setPhase("WAITING");
    setVotes([]);
    setVoteSelected(null);
    setVoteConfirmed(false);
    setResult(null);
    setIsPromptSubmitted(false);
    setEliminatedPlayers([]);
    setRound(1);
    setRoundResult(null);
    setRevealedCards([]);
    setPromptError(""); // Réinitialiser les erreurs de prompt
  };

  // Écran de connexion
  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center p-4 relative">
        {/* Bouton plein écran sur l'écran de connexion */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 p-2 lg:p-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-xl transition-all duration-200 text-white group z-10"
          title={isFullscreen ? "Quitter le plein écran" : "Mode plein écran"}
        >
          {isFullscreen ? (
            <svg className="w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
        
        <form
          onSubmit={e => {
            e.preventDefault();
            if (roomId && username) {
              setConnectionError("");
              socket.emit("join_room", { roomId, username }, (response) => {
                if (response.error) {
                  setConnectionError(response.error);
                } else {
                  setJoined(true);
                  setIsHost(response.isHost || false);
                }
              });
            }
          }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl flex flex-col gap-4 lg:gap-6 w-full max-w-md lg:max-w-lg p-8 lg:p-16 border border-white/20"
        >
          <h1 className="text-3xl lg:text-5xl font-bold text-center mb-6 lg:mb-8 text-purple-400">
            Subterfuge
          </h1>
          
          {connectionError && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-3 lg:p-4 mb-3 lg:mb-4">
              <p className="text-red-300 text-center text-sm lg:text-base">{connectionError}</p>
            </div>
          )}

          <input 
            className="border-2 border-white/20 bg-white/10 backdrop-blur rounded-xl p-3 lg:p-4 text-white placeholder-gray-300 focus:border-blue-400 focus:outline-none text-base lg:text-lg" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Votre pseudo" 
            maxLength={20}
            required
          />
          
          <input 
            className="border-2 border-white/20 bg-white/10 backdrop-blur rounded-xl p-3 lg:p-4 text-white placeholder-gray-300 focus:border-blue-400 focus:outline-none text-base lg:text-lg" 
            value={roomId} 
            onChange={e => setRoomId(e.target.value)} 
            placeholder="Nom de la room" 
            required
          />
          
          <button className="bg-white/10 backdrop-blur-lg border-2 border-white/20 hover:bg-white/20 hover:border-blue-400/40 text-white font-bold rounded-xl py-3 lg:py-4 px-6 lg:px-8 text-lg lg:text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105">
            Rejoindre la partie
          </button>
        </form>
      </div>
    );
  }
  // Interface principale du jeu
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Sidebar gauche - Joueurs (responsive) */}
        <div className="lg:w-[20%] lg:fixed lg:left-4 lg:top-4 lg:bottom-4 w-full lg:bg-white/10 lg:backdrop-blur-lg lg:rounded-2xl lg:shadow-2xl lg:border lg:border-white/20 flex flex-col lg:p-6 p-4">
          <div className="lg:hidden bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-4 mb-4 border border-white/20">
            <PlayerSidebar 
              players={players}
              currentPlayerId={currentPlayerId}
              myWord={myWord}
              eliminatedPlayers={eliminatedPlayers}
              isMobile={true}
            />
          </div>
          
          {/* Panneau lobby mobile - en dessous du menu des joueurs */}
          {phase === "WAITING" && (
            <div className="lg:hidden bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-4 mb-4 border border-white/20 relative">
              {/* Bouton plein écran sur le panneau lobby mobile */}
              <button
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-xl transition-all duration-200 text-white group"
                title={isFullscreen ? "Quitter le plein écran" : "Mode plein écran"}
              >
                {isFullscreen ? (
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
              
              <h1 className="text-2xl font-bold mb-4 text-purple-400 text-center">
                Subterfuge
              </h1>
              
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2 text-white">
                  Joueurs connectés ({players.length})
                </h2>
                <p className="text-xs text-gray-300 mb-4">
                  {isHost ? "Vous êtes l'hôte de cette room" : "En attente de l'hôte..."}
                </p>
                
                {players.length >= 3 ? (
                  isHost ? (
                    <button
                      onClick={() => socket.emit("start_game", { roomId })}
                      className="bg-white/10 backdrop-blur-lg border-2 border-white/20 hover:bg-white/20 hover:border-blue-400/40 text-white font-bold py-3 px-6 rounded-2xl text-base transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 w-full"
                    >
                      Démarrer la partie
                    </button>
                  ) : (
                    <p className="text-gray-300 text-base">
                      Attendez que l'hôte démarre la partie...
                    </p>
                  )
                ) : (
                  <p className="text-gray-300 text-base">
                    Attendez au moins 3 joueurs pour commencer... ({players.length}/3)
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="hidden lg:flex lg:flex-col lg:h-full">
            <PlayerSidebar 
              players={players}
              currentPlayerId={currentPlayerId}
              myWord={myWord}
              eliminatedPlayers={eliminatedPlayers}
              isMobile={false}
            />
          </div>
        </div>
        
        {/* Contenu principal */}
        <div className={`flex-1 flex flex-col lg:ml-[calc(20%+2rem)] lg:mr-[calc(20%+2rem)] p-4 lg:p-4 pb-20 lg:pb-4 ${phase === "WAITING" ? "lg:justify-center" : ""}`}>
          {/* Phase d'attente */}
          {phase === "WAITING" && (
            <div className="hidden lg:flex flex-1 items-center justify-center">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 lg:p-12 text-center border border-white/20 w-full max-w-4xl relative">
                {/* Bouton plein écran sur l'écran d'attente */}
                <button
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 p-2 lg:p-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-xl transition-all duration-200 text-white group"
                  title={isFullscreen ? "Quitter le plein écran" : "Mode plein écran"}
                >
                  {isFullscreen ? (
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
                
                <h1 className="text-3xl lg:text-5xl font-bold mb-6 lg:mb-8 text-purple-400">
                  Subterfuge
                </h1>
                <div className="mb-6 lg:mb-8">
                  <h2 className="text-xl lg:text-2xl font-semibold mb-2 text-white">
                    Joueurs connectés ({players.length})
                  </h2>
                  <p className="text-xs lg:text-sm text-gray-300 mb-4 lg:mb-6">
                    {isHost ? "Vous êtes l'hôte de cette room" : "En attente de l'hôte..."}
                  </p>
                  <div className="flex flex-wrap gap-2 lg:gap-3 justify-center mb-6 lg:mb-8">
                    {players.map((player) => (
                      <span 
                        key={player.id} 
                        className={`backdrop-blur px-3 lg:px-6 py-2 lg:py-3 rounded-full font-medium border text-sm lg:text-base ${
                          player.isHost 
                            ? 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30' 
                            : 'bg-blue-500/20 text-blue-200 border-blue-400/30'
                        }`}
                      >
                        {player.username}
                        {player.isHost && ' (hôte)'}
                      </span>
                    ))}
                  </div>
                  {players.length >= 3 ? (
                    isHost ? (
                      <button
                        onClick={() => socket.emit("start_game", { roomId })}
                        className="bg-white/10 backdrop-blur-lg border-2 border-white/20 hover:bg-white/20 hover:border-blue-400/40 text-white font-bold py-3 lg:py-4 px-6 lg:px-12 rounded-2xl text-lg lg:text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 w-full lg:w-auto"
                      >
                        Démarrer la partie
                      </button>
                    ) : (
                      <p className="text-gray-300 text-lg lg:text-xl">
                        Attendez que l'hôte démarre la partie...
                      </p>
                    )
                  ) : (
                    <p className="text-gray-300 text-lg lg:text-xl">
                      Attendez au moins 3 joueurs pour commencer... ({players.length}/3)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Phases de jeu */}
          {phase !== "WAITING" && (
            <div className="flex-1 flex flex-col">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-4 lg:p-6 mb-4 lg:mb-6 border border-white/20">
                <div className="flex items-center justify-between mb-2 lg:mb-4">
                  <h1 className="text-2xl lg:text-3xl font-bold text-purple-400">
                    Subterfuge
                  </h1>
                  
                  {/* Bouton plein écran */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 lg:p-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-xl transition-all duration-200 text-white group"
                    title={isFullscreen ? "Quitter le plein écran" : "Mode plein écran"}
                  >
                    {isFullscreen ? (
                      // Icône réduire
                      <svg className="w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      // Icône agrandir
                      <svg className="w-4 h-4 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Notification du tour actuel */}
                {phase === "PROMPT" && currentPlayerId && (
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 p-3 lg:p-4 rounded-xl">
                    <div className="flex items-center justify-center">
                      <div className="flex-shrink-0">
                        <span className="text-2xl lg:text-3xl"></span>
                      </div>
                      <div className="ml-3 text-center">
                        <p className="text-lg lg:text-xl font-medium text-blue-200">
                          {currentPlayerId === socket.id ? (
                            "C'est votre tour ! Créez votre prompt."
                          ) : (
                            (() => {
                              const currentPlayer = players.find(p => p.id === currentPlayerId);
                              const isDisconnected = currentPlayer?.isDisconnected;
                              return (
                                <>
                                  C'est au tour de <span className="font-bold text-blue-300">{currentPlayer?.username}</span> de créer son prompt...
                                  {isDisconnected && (
                                    <div className="mt-2 text-sm text-orange-300">
                                      ⚠️ Le joueur est déconnecté, attente de son retour...
                                    </div>
                                  )}
                                </>
                              );
                            })()
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Contenu principal scrollable */}
              <div className="flex-1 overflow-y-auto">
                {phase === "PROMPT" && currentPlayerId === socket.id && !isPromptSubmitted && (
                  <PromptForm 
                    onSubmit={prompt => {
                      socket.emit("submit_prompt", { roomId, prompt });
                      setIsPromptSubmitted(true);
                      setPromptError(""); 
                    }}
                    isSubmitted={false}
                    myWord={myWord}
                    promptError={promptError}
                    onErrorClear={() => setPromptError("")}
                  />
                )}
                
                {/* Message de confirmation d'envoi */}
                {phase === "PROMPT" && currentPlayerId === socket.id && isPromptSubmitted && (
                  <div className="bg-green-500/10 backdrop-blur-lg border border-green-400/30 rounded-2xl shadow-xl p-6 lg:p-8 mb-4 lg:mb-6">
                    <div className="text-center">
                      <h2 className="text-2xl lg:text-3xl font-bold text-green-300 mb-2 lg:mb-4">Prompt envoyé !</h2>
                      <p className="text-green-200 text-base lg:text-lg">
                        Votre prompt a été envoyé avec succès. L'image est en cours de génération...
                      </p>
                    </div>
                  </div>
                )}
                
                <CardGallery 
                  cards={cards} 
                  votes={votes} 
                  currentUserId={socket.id}
                  players={players}
                  currentPlayerId={currentPlayerId}
                  eliminatedPlayers={eliminatedPlayers}
                />
                
                {/* Phase de discussion et vote */}
                {phase === "DISCUSSION" && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-4 lg:p-6 mb-4 lg:mb-6 border border-white/20">
                    <h2 className="text-2xl lg:text-3xl font-bold text-center mb-4 lg:mb-6 text-white">Phase de Discussion</h2>
                    <Timer duration={60} onEnd={() => {
                      socket.emit("force_vote_end", { roomId });
                    }} />
                    <div className="mt-6 lg:mt-8">
                      <h3 className="text-xl lg:text-2xl font-semibold mb-4 lg:mb-6 text-center text-white">Votez pour l'intrus :</h3>
                      <VoteZone
                        players={players}
                        votes={votes}
                        cards={cards}
                        eliminatedPlayers={eliminatedPlayers}
                        onVote={pid => {
                          if (!voteConfirmed) {
                            setVoteSelected(pid);
                          }
                        }}
                        onConfirm={pid => {
                          setVoteConfirmed(true);
                          socket.emit("submit_vote", { roomId, votedPlayerId: pid });
                        }}
                        selected={voteSelected}
                        disabled={false}
                        hasConfirmed={voteConfirmed}
                      />
                    </div>
                  </div>
                )}
                
                {/* Résultats */}
                {phase === "RESULT" && result && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 lg:p-8 text-center border border-white/20">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4 lg:mb-6 text-white">
                      {result.intruderFound
                        ? "L'intrus a été découvert !"
                        : "L'intrus est passé inaperçu..."}
                    </h2>
                    <div className="text-xl lg:text-2xl mt-4 lg:mt-6 text-white">
                      L'intrus était : <span className="font-bold text-red-400">{result.intruder.username}</span>
                    </div>
                    <div className="mt-6 lg:mt-8">
                      <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-white">Récapitulatif des votes :</h3>
                      <div className="space-y-2">
                        {Object.entries(result.voteCount || {}).map(([playerId, count]) => {
                          const player = players.find(p => p.id === playerId);
                          return (
                            <div key={playerId} className="text-base lg:text-lg text-gray-200">
                              {player?.username} : {count} vote(s)
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Résultats de round */}
                {phase === "ROUND_RESULT" && roundResult && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 lg:p-8 text-center border border-white/20">
                    <h2 className="text-2xl lg:text-3xl font-bold mb-3 lg:mb-4 text-white">Résultat du Round {round - 1}</h2>
                    <p className="text-lg lg:text-xl mb-3 lg:mb-4 text-gray-200">{roundResult.message}</p>
                    
                    {roundResult.eliminatedPlayer && (
                      <div className="mb-3 lg:mb-4">
                        <span className="text-base lg:text-lg text-white">
                          <span className="font-bold text-red-600">{roundResult.eliminatedPlayer.username}</span>
                          {roundResult.eliminatedPlayer.isIntruder ? " (L'INTRUS)" : " (Innocent)"}
                          {" "}a été éliminé !
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-4 lg:mt-6">
                      <h3 className="text-base lg:text-lg font-semibold mb-2 text-white">Votes de ce round :</h3>
                      {Object.entries(roundResult.voteCount || {}).map(([playerId, count]) => {
                        const player = [...players, ...eliminatedPlayers].find(p => p.id === playerId);
                        return (
                          <div key={playerId} className="text-sm text-gray-300">
                            {player?.username} : {count} vote(s)
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-3 lg:mt-4 text-sm text-gray-400">
                      Joueurs restants : {roundResult.remainingPlayers}
                      {roundResult.remainingNonIntruders !== undefined && 
                        ` (${roundResult.remainingNonIntruders} innocents)`
                      }
                    </div>
                    
                    <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                      <p className="text-blue-200 text-sm">
                       Nouveaux mots distribués pour le round {round} !
                      </p>
                      <p className="text-blue-100 text-xs mt-1">
                        L'intrus garde son rôle mais avec un nouveau mot différent.
                      </p>
                    </div>
                    
                    <div className="mt-3 lg:mt-4 text-gray-500">
                      Nouveau round dans 5 secondes...
                    </div>
                  </div>
                )}

                {/* Fin de jeu */}
                {phase === "GAME_OVER" && result && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 lg:p-8 text-center border border-white/20">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4 lg:mb-6 text-white">
                      {result.winner === "non-intruders" 
                        ? "Les Innocents ont gagné !" 
                        : "L'Intrus a gagné !"}
                    </h2>
                    
                    {result.eliminatedPlayer && (
                      <div className="mb-4 lg:mb-6">
                        <p className="text-lg lg:text-xl text-white">
                          <span className="font-bold text-red-600">{result.eliminatedPlayer.username}</span>
                          {result.eliminatedPlayer.isIntruder ? " (L'INTRUS)" : " (Innocent)"}
                          {" "}a été éliminé en dernier !
                        </p>
                      </div>
                    )}
                    
                    <div className="text-lg lg:text-xl mt-3 lg:mt-4 mb-4 lg:mb-6 text-white">
                      L'intrus était : <span className="font-bold text-red-600">{result.intruder.username}</span>
                    </div>
                    
                    {result.winner === "intruder" && (
                      <p className="text-base lg:text-lg text-gray-300 mb-3 lg:mb-4">
                        L'intrus a survécu jusqu'à ce qu'il ne reste qu'un innocent !
                      </p>
                    )}
                    
                    <div className="mt-4 lg:mt-6">
                      <h3 className="text-base lg:text-lg font-semibold mb-2 text-white">Votes finaux :</h3>
                      {Object.entries(result.voteCount || {}).map(([playerId, count]) => {
                        const player = [...players, ...eliminatedPlayers].find(p => p.id === playerId);
                        return (
                          <div key={playerId} className="text-sm text-gray-300">
                            {player?.username} : {count} vote(s)
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Bouton pour retourner à l'écran d'attente */}
                    <div className="mt-8 lg:mt-10">
                      <button
                        onClick={restartGame}
                        className="bg-white/10 backdrop-blur-lg border-2 border-white/20 hover:bg-white/20 hover:border-blue-400/40 text-white font-bold py-3 lg:py-4 px-6 lg:px-8 rounded-2xl text-lg lg:text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 w-full lg:w-auto"
                      >
                        Retour au lobby
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Chat responsive */}
        <div className="lg:w-[20%] lg:fixed lg:right-4 lg:top-4 lg:bottom-4 w-full lg:bg-white/10 lg:backdrop-blur-lg lg:rounded-2xl lg:shadow-2xl lg:border lg:border-white/20 flex flex-col lg:overflow-hidden">
          {/* Chat sur mobile - position fixed en bas */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-t border-white/20 p-4 z-50">
            <ChatBox 
              messages={chat} 
              onSend={msg => socket.emit("chat_message", { roomId, username, message: msg })} 
              isMobile={true}
            />
          </div>
          
          {/* Chat sur desktop */}
          <div className="hidden lg:flex lg:flex-col lg:h-full">
            <h3 className="font-bold text-2xl mb-4 text-center text-purple-300 px-6 pt-6">Chat</h3>
            <div className="flex-1 px-6 pb-6 overflow-hidden">
              <ChatBox 
                messages={chat} 
                onSend={msg => socket.emit("chat_message", { roomId, username, message: msg })} 
                isMobile={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant formulaire de prompt
function PromptForm({ onSubmit, myWord, promptError = "", onErrorClear }) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  
  const handlePromptChange = (e) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    
    // Effacer l'erreur du serveur quand l'utilisateur tape
    if (promptError && onErrorClear) {
      onErrorClear();
    }
    
    if (checkForForbiddenWord(newPrompt, myWord)) {
      setError(`⚠️ Votre prompt contient un mot trop similaire à "${myWord}" ! Soyez plus créatif.`);
    } else {
      setError("");
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !checkForForbiddenWord(prompt, myWord)) {
      onSubmit(prompt);
      setPrompt("");
      setError("");
    }
  };
  
  const isValid = prompt.trim() && !checkForForbiddenWord(prompt, myWord);
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 lg:p-8 mb-4 lg:mb-6 border border-white/20">
      <h2 className="text-2xl lg:text-3xl font-bold text-center mb-4 lg:mb-6 text-white">À votre tour !</h2>
      
      {/* Affichage de l'erreur du serveur (prompt rejeté) */}
      {promptError && (
        <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-red-500/10 border border-red-400/30 rounded-xl">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base lg:text-lg font-medium text-red-300 mb-1">Prompt rejeté</h3>
              <p className="text-red-200 text-sm">{promptError}</p>
              <p className="text-red-100 text-xs mt-2">Veuillez modifier votre prompt et réessayer.</p>
            </div>
          </div>
        </div>
      )}
      
      <form
        className="flex flex-col gap-4 lg:gap-6"
        onSubmit={handleSubmit}
      >
        <div>
          <textarea
            className="border-2 border-white/20 bg-white/10 backdrop-blur rounded-xl p-4 lg:p-6 text-white placeholder-gray-300 focus:border-blue-400 focus:outline-none resize-none text-base lg:text-lg w-full"
            rows={4}
            value={prompt}
            onChange={handlePromptChange}
            placeholder={`Décrivez une scène en rapport avec votre mot-clé... Soyez créatif ! (Ne mentionnez pas "${myWord}")`}
            required
          />
          {error && (
            <div className="mt-2 p-2 lg:p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
        <button 
          className={`backdrop-blur-lg border-2 font-bold rounded-xl py-3 lg:py-4 px-6 lg:px-8 text-lg lg:text-xl transition-all duration-300 shadow-xl transform w-full ${
            isValid 
              ? 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-blue-400/40 text-white hover:shadow-2xl hover:scale-105' 
              : 'bg-gray-500/10 border-gray-500/20 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!isValid}
        >
          {promptError ? 'Renvoyer le prompt' : 'Envoyer mon prompt'}
        </button>
      </form>
    </div>
  );
}
