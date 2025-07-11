import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import CardGallery from "./components/CardGallery";
import ChatBox from "./components/ChatBox";
import PlayerSidebar from "./components/PlayerSidebar";
import Timer from "./components/Timer";
import VoteZone from "./components/VoteZone";

const socket = io("http://localhost:4000");

export default function App() {
  // États principaux
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);

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
    socket.on("update_players", setPlayers);
    socket.on("assign_roles", (roles) => {
      const me = roles.find(r => r.id === socket.id);
      if (me) {
        setMyWord(me.word);
        setPhase("PROMPT");
      }
    });    socket.on("start_turn", ({ currentPlayerId, order }) => {
      setCurrentPlayerId(currentPlayerId);
      setOrder(order);
      setIsPromptSubmitted(false); // Réinitialiser l'état de soumission pour le nouveau tour
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
    
    // Nouveaux gestionnaires pour le système multi-round
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
    };
  }, []);  // Fonction pour redémarrer une nouvelle partie
  const restartGame = () => {
    // Réinitialiser tous les états du jeu
    setCurrentPlayerId(null);
    setMyWord("");
    setOrder([]);
    setCards([]);
    setPhase("WAITING");    setVotes([]);
    setVoteSelected(null);
    setVoteConfirmed(false);    setResult(null);
    setIsPromptSubmitted(false);
    setEliminatedPlayers([]);
    setRound(1);
    setRoundResult(null);
    setRevealedCards([]);
    
    // Démarrer une nouvelle partie
    socket.emit("start_game", { roomId });
  };

  // Vérifier si le joueur actuel est éliminé
  const isCurrentPlayerEliminated = eliminatedPlayers.some(p => p.id === socket.id);

  // Écran de connexion
  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (roomId && username) {
              socket.emit("join_room", { roomId, username }, (player) => {
                if (player) setJoined(true);
              });
            }
          }}
          className="bg-white p-8 rounded-xl shadow-2xl flex flex-col gap-6 w-96"
        >
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">🎯 Prompt Mafia</h1>
          <input 
            className="border-2 border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:outline-none" 
            value={roomId} 
            onChange={e => setRoomId(e.target.value)} 
            placeholder="Nom de la room..." 
            required
          />
          <input 
            className="border-2 border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:outline-none" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Votre pseudo..." 
            required
          />
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg p-3 transition-colors">
            🚀 Rejoindre la partie
          </button>
        </form>
      </div>
    );
  }
  // Interface principale du jeu
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      <div className="container mx-auto p-4 h-screen flex gap-6">
        {/* Sidebar gauche - Joueurs */}        <PlayerSidebar 
          players={players}
          currentPlayerId={currentPlayerId}
          myWord={myWord}
          eliminatedPlayers={eliminatedPlayers}
        />
        
        {/* Zone centrale - Jeu */}
        <div className="flex-1 flex flex-col">
          {/* Phase d'attente */}
          {phase === "WAITING" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-12 text-center border border-white/20">
                <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  🎯 Prompt Mafia
                </h1>
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-6 text-white">
                    Joueurs connectés ({players.length})
                  </h2>
                  <div className="flex flex-wrap gap-3 justify-center mb-8">
                    {players.map((player) => (
                      <span 
                        key={player.id} 
                        className="bg-blue-500/20 backdrop-blur text-blue-200 px-6 py-3 rounded-full font-medium border border-blue-400/30"
                      >
                        {player.username}
                      </span>
                    ))}
                  </div>
                  {players.length >= 3 ? (
                    <button
                      onClick={() => socket.emit("start_game", { roomId })}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-12 rounded-2xl text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                    >
                      🚀 Démarrer la partie
                    </button>
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
              {/* Header de jeu */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
                <h1 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  🎯 Prompt Mafia
                </h1>
                
                {/* Notification du tour actuel */}
                {phase === "PROMPT" && currentPlayerId && (
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 p-4 rounded-xl">
                    <div className="flex items-center justify-center">
                      <div className="flex-shrink-0">
                        <span className="text-3xl">🎯</span>
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
                />
                
                {/* Formulaire de prompt */}
                {phase === "PROMPT" && currentPlayerId === socket.id && (
                  <PromptForm 
                    onSubmit={prompt => {
                      socket.emit("submit_prompt", { roomId, prompt });
                      setIsPromptSubmitted(true);
                    }}
                    isSubmitted={isPromptSubmitted}
                  />
                )}
                
                {/* Phase de discussion et vote */}
                {phase === "DISCUSSION" && (                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
                    <h2 className="text-3xl font-bold text-center mb-6 text-white">💬 Phase de Discussion</h2>
                    <Timer duration={60} onEnd={() => {
                      // Forcer la fin du vote quand le timer se termine
                      socket.emit("force_vote_end", { roomId });
                    }} />
                    <div className="mt-8">
                      <h3 className="text-2xl font-semibold mb-6 text-center text-white">🗳️ Votez pour l'intrus :</h3>                      <VoteZone
                        players={players}
                        votes={votes}
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
                        ? "🎉 L'intrus a été découvert !"
                        : "😈 L'intrus est passé inaperçu..."}
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
                    
                    {/* Bouton pour relancer une partie */}
                    <div className="mt-10">
                      <button
                        onClick={restartGame}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                      >
                        🔄 Nouvelle partie
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Résultats de round */}
                {phase === "ROUND_RESULT" && roundResult && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 text-center border border-white/20">
                    <h2 className="text-3xl font-bold mb-4 text-white">📊 Résultat du Round {round - 1}</h2>
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
                        ? "🎉 Les Innocents ont gagné !" 
                        : "😈 L'Intrus a gagné !"}
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
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2 text-white">Joueurs éliminés par round :</h3>
                      {eliminatedPlayers.map((player, index) => (
                        <div key={player.id} className="text-sm text-gray-300">
                          Round {index + 1}: {player.username} {player.isIntruder ? "(Intrus)" : "(Innocent)"}
                        </div>
                      ))}
                    </div>
                    
                    {/* Bouton pour relancer une partie */}
                    <div className="mt-10">
                      <button
                        onClick={restartGame}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                      >
                        🔄 Nouvelle partie
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar droite - Chat */}
        <div className="w-80 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20 flex flex-col">
          <h3 className="font-bold text-2xl mb-4 text-center text-white">💬 Chat</h3>
          <div className="flex-1">
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
function PromptForm({ onSubmit, isSubmitted }) {
  const [prompt, setPrompt] = useState("");
  
  if (isSubmitted) {
    return (
      <div className="bg-green-500/10 backdrop-blur-lg border border-green-400/30 rounded-2xl shadow-xl p-8 mb-6">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-green-300 mb-3">Prompt envoyé !</h2>
          <p className="text-green-200 text-lg">
            Votre prompt a été envoyé avec succès. L'image est en cours de génération...
          </p>
          <div className="mt-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-400"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-6 border border-white/20">
      <h2 className="text-3xl font-bold text-center mb-6 text-white">✨ À votre tour !</h2>
      <form
        className="flex flex-col gap-6"
        onSubmit={e => { 
          e.preventDefault(); 
          if (prompt.trim()) {
            onSubmit(prompt); 
            setPrompt(""); 
          }
        }}
      >
        <textarea
          className="border-2 border-white/20 bg-white/10 backdrop-blur rounded-xl p-6 text-white placeholder-gray-300 focus:border-blue-400 focus:outline-none resize-none text-lg"
          rows={5}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Décrivez une scène en rapport avec votre mot-clé... Soyez créatif !"
          required
        />
        <button 
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl py-4 px-8 text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          disabled={!prompt.trim()}
        >
          🎨 Envoyer mon prompt
        </button>
      </form>
    </div>
  );
}
