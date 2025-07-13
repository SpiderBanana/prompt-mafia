import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import CardGallery from "./components/CardGallery";
import ChatBox from "./components/ChatBox";
import PlayerSidebar from "./components/PlayerSidebar";
import Timer from "./components/Timer";
import VoteZone from "./components/VoteZone";

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
  
  // États pour le système multi-round
  const [round, setRound] = useState(1);
  const [roundResult, setRoundResult] = useState(null);
  const [revealedCards, setRevealedCards] = useState([]);

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
        setPhase("PROMPT");
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
      setCurrentPlayerId(turnOrder && turnOrder[currentTurn] ? turnOrder[currentTurn] : null);
      
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
  };

  // Écran de connexion
  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
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
          className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl flex flex-col gap-6 w-[500px] p-16 border border-white/20"
        >
          <h1 className="text-5xl font-bold text-center mb-8 text-purple-400">
            Subterfuge
          </h1>
          
          {connectionError && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 mb-4">
              <p className="text-red-300 text-center">{connectionError}</p>
            </div>
          )}

          <input 
            className="border-2 border-white/20 bg-white/10 backdrop-blur rounded-xl p-4 text-white placeholder-gray-300 focus:border-blue-400 focus:outline-none text-lg" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Votre pseudo" 
            maxLength={20}
            required
          />
          
          <input 
            className="border-2 border-white/20 bg-white/10 backdrop-blur rounded-xl p-4 text-white placeholder-gray-300 focus:border-blue-400 focus:outline-none text-lg" 
            value={roomId} 
            onChange={e => setRoomId(e.target.value)} 
            placeholder="Nom de la room" 
            required
          />
          
          <button className="bg-white/10 backdrop-blur-lg border-2 border-white/20 hover:bg-white/20 hover:border-blue-400/40 text-white font-bold rounded-xl py-4 px-8 text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105">
            Rejoindre la partie
          </button>
        </form>
      </div>
    );
  }
  // Interface principale du jeu
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      <div className="min-h-screen flex">
        <div className="w-[20%] fixed left-4 top-4 bottom-4 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20 flex flex-col">
          <PlayerSidebar 
            players={players}
            currentPlayerId={currentPlayerId}
            myWord={myWord}
            eliminatedPlayers={eliminatedPlayers}
          />
        </div>
        
        <div className="flex-1 flex flex-col ml-[calc(20%+2rem)] mr-[calc(20%+2rem)] p-4">
          {/* Phase d'attente */}
          {phase === "WAITING" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-12 text-center border border-white/20 w-full max-w-4xl">                <h1 className="text-5xl font-bold mb-8 text-purple-400">
                  Subterfuge
                </h1>
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-2 text-white">
                    Joueurs connectés ({players.length})
                  </h2>
                  <p className="text-sm text-gray-300 mb-6">
                    {isHost ? "Vous êtes l'hôte de cette room" : "En attente de l'hôte..."}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center mb-8">
                    {players.map((player) => (
                      <span 
                        key={player.id} 
                        className={`backdrop-blur px-6 py-3 rounded-full font-medium border ${
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
                        className="bg-white/10 backdrop-blur-lg border-2 border-white/20 hover:bg-white/20 hover:border-blue-400/40 text-white font-bold py-4 px-12 rounded-2xl text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                      >
                        Démarrer la partie
                      </button>
                    ) : (
                      <p className="text-gray-300 text-xl">
                        Attendez que l'hôte démarre la partie...
                      </p>
                    )
                  ) : (
                    <p className="text-gray-300 text-xl">
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
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">                <h1 className="text-3xl font-bold text-center mb-4 text-purple-400">
                  Subterfuge
                </h1>
                
                {/* Notification du tour actuel */}
                {phase === "PROMPT" && currentPlayerId && (
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 p-4 rounded-xl">
                    <div className="flex items-center justify-center">
                      <div className="flex-shrink-0">
                        <span className="text-3xl"></span>
                      </div>
                      <div className="ml-3 text-center">
                        <p className="text-xl font-medium text-blue-200">
                          {currentPlayerId === socket.id ? (
                            "C'est votre tour ! Créez votre prompt."
                          ) : (
                            <>C'est au tour de <span className="font-bold text-blue-300">{players.find(p => p.id === currentPlayerId)?.username}</span> de créer son prompt...</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Contenu principal scrollable */}
              <div className="flex-1 overflow-y-auto">
                <CardGallery 
                  cards={cards} 
                  votes={votes} 
                  currentUserId={socket.id}
                  players={players}
                  currentPlayerId={currentPlayerId}
                  eliminatedPlayers={eliminatedPlayers}
                />
                
                {/* Formulaire de prompt */}
                {phase === "PROMPT" && currentPlayerId === socket.id && (
                  <PromptForm 
                    onSubmit={prompt => {
                      socket.emit("submit_prompt", { roomId, prompt });
                      setIsPromptSubmitted(true);
                    }}
                    isSubmitted={isPromptSubmitted}
                    myWord={myWord}
                  />
                )}
                
                {/* Phase de discussion et vote */}
                {phase === "DISCUSSION" && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
                    <h2 className="text-3xl font-bold text-center mb-6 text-white">Phase de Discussion</h2>
                    <Timer duration={60} onEnd={() => {
                      socket.emit("force_vote_end", { roomId });
                    }} />
                    <div className="mt-8">
                      <h3 className="text-2xl font-semibold mb-6 text-center text-white">Votez pour l'intrus :</h3>                      <VoteZone
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
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 text-center border border-white/20">
                    <h2 className="text-4xl font-bold mb-6 text-white">
                      {result.intruderFound
                        ? "L'intrus a été découvert !"
                        : "L'intrus est passé inaperçu..."}
                    </h2>
                    <div className="text-2xl mt-6 text-white">
                      L'intrus était : <span className="font-bold text-red-400">{result.intruder.username}</span>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold mb-4 text-white">Récapitulatif des votes :</h3>
                      <div className="space-y-2">
                        {Object.entries(result.voteCount || {}).map(([playerId, count]) => {
                          const player = players.find(p => p.id === playerId);
                          return (
                            <div key={playerId} className="text-lg text-gray-200">
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
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 text-center border border-white/20">
                    <h2 className="text-3xl font-bold mb-4 text-white">Résultat du Round {round - 1}</h2>
                    <p className="text-xl mb-4 text-gray-200">{roundResult.message}</p>
                    
                    {roundResult.eliminatedPlayer && (
                      <div className="mb-4">
                        <span className="text-lg text-white">
                          <span className="font-bold text-red-600">{roundResult.eliminatedPlayer.username}</span>
                          {roundResult.eliminatedPlayer.isIntruder ? " (L'INTRUS)" : " (Innocent)"}
                          {" "}a été éliminé !
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2 text-white">Votes de ce round :</h3>
                      {Object.entries(roundResult.voteCount || {}).map(([playerId, count]) => {
                        const player = [...players, ...eliminatedPlayers].find(p => p.id === playerId);
                        return (
                          <div key={playerId} className="text-sm text-gray-300">
                            {player?.username} : {count} vote(s)
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 text-sm text-gray-400">
                      Joueurs restants : {roundResult.remainingPlayers}
                      {roundResult.remainingNonIntruders !== undefined && 
                        ` (${roundResult.remainingNonIntruders} innocents)`
                      }
                    </div>
                    
                    <div className="mt-6 text-gray-500">
                      Nouveau round dans 5 secondes...
                    </div>
                  </div>
                )}

                {/* Fin de jeu */}
                {phase === "GAME_OVER" && result && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 text-center border border-white/20">
                    <h2 className="text-4xl font-bold mb-6 text-white">
                      {result.winner === "non-intruders" 
                        ? "Les Innocents ont gagné !" 
                        : "L'Intrus a gagné !"}
                    </h2>
                    
                    {result.eliminatedPlayer && (
                      <div className="mb-6">
                        <p className="text-xl text-white">
                          <span className="font-bold text-red-600">{result.eliminatedPlayer.username}</span>
                          {result.eliminatedPlayer.isIntruder ? " (L'INTRUS)" : " (Innocent)"}
                          {" "}a été éliminé en dernier !
                        </p>
                      </div>
                    )}
                    
                    <div className="text-xl mt-4 mb-6 text-white">
                      L'intrus était : <span className="font-bold text-red-600">{result.intruder.username}</span>
                    </div>
                    
                    {result.winner === "intruder" && (
                      <p className="text-lg text-gray-300 mb-4">
                        L'intrus a survécu jusqu'à ce qu'il ne reste qu'un innocent !
                      </p>
                    )}
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2 text-white">Votes finaux :</h3>
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
                    <div className="mt-10">
                      <button
                        onClick={restartGame}
                        className="bg-white/10 backdrop-blur-lg border-2 border-white/20 hover:bg-white/20 hover:border-blue-400/40 text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
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
        
        {/* Sidebar droite - Chat */}
        <div className="w-[20%] fixed right-4 top-4 bottom-4 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden">
          <h3 className="font-bold text-2xl mb-4 text-center text-purple-300 px-6 pt-6">Chat</h3>
          <div className="flex-1 px-6 pb-6 overflow-hidden">
            <ChatBox 
              messages={chat} 
              onSend={msg => socket.emit("chat_message", { roomId, username, message: msg })} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant formulaire de prompt
function PromptForm({ onSubmit, isSubmitted, myWord }) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  
  // Vérifier si le mot-clé est présent dans le prompt
  const checkForForbiddenWord = (text) => {
    if (!myWord) return false;
    
    // Nettoyer le texte et le mot pour une comparaison insensible à la casse
    const cleanText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanWord = myWord.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Vérifier si le mot exact ou ses variantes sont présents
    const wordVariations = [
      cleanWord,
      cleanWord + 's', 
      cleanWord + 'e', 
      cleanWord + 'es', 
    ];
    
    return wordVariations.some(variation => 
      cleanText.includes(variation) || 
      cleanText.split(/\W+/).includes(variation)
    );
  };
  
  const handlePromptChange = (e) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    
    if (checkForForbiddenWord(newPrompt)) {
      setError(`⚠️ Vous ne pouvez pas utiliser le mot "${myWord}" dans votre prompt !`);
    } else {
      setError("");
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !checkForForbiddenWord(prompt)) {
      onSubmit(prompt);
      setPrompt("");
      setError("");
    }
  };
  
  const isValid = prompt.trim() && !checkForForbiddenWord(prompt);
  
  if (isSubmitted) {
    return (
      <div className="bg-green-500/10 backdrop-blur-lg border border-green-400/30 rounded-2xl shadow-xl p-8 mb-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-green-300 mb-4">Prompt envoyé !</h2>
          <p className="text-green-200 text-lg">
            Votre prompt a été envoyé avec succès. L'image est en cours de génération...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-6 border border-white/20">
      <h2 className="text-3xl font-bold text-center mb-6 text-white"> À votre tour !</h2>
      <form
        className="flex flex-col gap-6"
        onSubmit={handleSubmit}
      >
        <div>
          <textarea
            className="border-2 border-white/20 bg-white/10 backdrop-blur rounded-xl p-6 text-white placeholder-gray-300 focus:border-blue-400 focus:outline-none resize-none text-lg w-full"
            rows={5}
            value={prompt}
            onChange={handlePromptChange}
            placeholder={`Décrivez une scène en rapport avec votre mot-clé... Soyez créatif ! (Ne mentionnez pas "${myWord}")`}
            required
          />
          {error && (
            <div className="mt-2 p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
        <button 
          className={`backdrop-blur-lg border-2 font-bold rounded-xl py-4 px-8 text-xl transition-all duration-300 shadow-xl transform ${
            isValid 
              ? 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-blue-400/40 text-white hover:shadow-2xl hover:scale-105' 
              : 'bg-gray-500/10 border-gray-500/20 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!isValid}
        >
          Envoyer mon prompt
        </button>
      </form>
    </div>
  );
}
