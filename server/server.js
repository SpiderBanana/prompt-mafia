const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const { createGame, addPlayerToGame, assignWordsAndRoles, nextTurn, recordPrompt, recordVote, getResults, prepareNewRound, resetGame, canPlayerRejoinGame, updatePlayerDisconnection } = require("./gameLogic");
const { generateImageWithDelay } = require("./openaiService");
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

const games = {};

io.on("connection", (socket) => {
  console.log("Nouvelle connexion:", socket.id);

  socket.on("join_room", ({ roomId, username }, cb) => {
    if (!games[roomId]) {
      games[roomId] = createGame(roomId);
      console.log(`Nouvelle room créée: ${roomId}`);
    }
    
    const canRejoin = canPlayerRejoinGame(games[roomId], username);
    
    if (games[roomId].status !== "WAITING" && !canRejoin) {
      cb({ error: "Une partie est déjà en cours dans cette room et vous n'avez pas encore participé" });
      return;
    }
    
    // Vérifier si le joueur est déjà connecté
    const existingPlayer = games[roomId].players.find(p => p.username === username);
    if (existingPlayer) {
      cb({ error: "Un joueur avec ce pseudo est déjà connecté" });
      return;
    }
    
    console.log(`${username} ${canRejoin ? 'revient dans' : 'rejoint'} la room ${roomId}. Joueurs actuels: ${games[roomId].players.length}`);
    
    const player = addPlayerToGame(games[roomId], socket.id, username);
    
    // Gestion de l'hôte
    if (games[roomId].players.length === 1 && !games[roomId].hostId) {
      games[roomId].hostId = socket.id;
      player.isHost = true;
      console.log(`${username} est devenu l'hôte de la room ${roomId}`);
    }
    
    socket.join(roomId);
    
    if (canRejoin && games[roomId].status !== "WAITING") {
      socket.emit("assign_roles", [{ id: player.id, word: player.word }]);
      socket.emit("rejoin_game", {
        status: games[roomId].status,
        round: games[roomId].round,
        eliminatedPlayers: games[roomId].eliminatedPlayers,
        cards: games[roomId].cards,
        votes: games[roomId].votes,
        turnOrder: games[roomId].turnOrder,
        currentTurn: games[roomId].currentTurn
      });
    }
    
    console.log(`Émission update_players pour la room ${roomId}:`, games[roomId].players.map(p => ({name: p.username, isHost: p.isHost})));
    io.to(roomId).emit("update_players", games[roomId].players);
    cb(player);
  });

  socket.on("start_game", ({ roomId }, cb) => {
    const game = games[roomId];
    if (!game) {
      cb({ error: "Room non trouvée" });
      return;
    }
    
    if (game.hostId !== socket.id) {
      cb({ error: "Seul l'hôte peut démarrer la partie" });
      return;
    }
    
    if (game.status !== "WAITING") {
      resetGame(game);
    }
    
    assignWordsAndRoles(games[roomId]);
    games[roomId].status = "PROMPT";
    io.to(roomId).emit("assign_roles", games[roomId].players.map(p => ({
      id: p.id, word: p.word
    })));
    io.to(roomId).emit("start_turn", {
      currentPlayerId: games[roomId].turnOrder[0],
      order: games[roomId].turnOrder
    });
    if (cb) cb();
  });

  socket.on("submit_prompt", async ({ roomId, prompt }, cb) => {
    const game = games[roomId];
    const player = game.players.find(p => p.id === socket.id);
    
    if (player.isEliminated) {
      console.log(`Tentative de prompt par un joueur éliminé: ${player.username}`);
      if (cb) cb({ error: "Vous êtes éliminé et ne pouvez plus soumettre de prompts" });
      return;
    }
    
    console.log(`${player.username} a soumis un prompt: ${prompt}`);
    
    let imageUrl;
    let card;
    
    try {
      imageUrl = await generateImageWithDelay(prompt);
      console.log(`Image générée avec succès pour ${player.username}: ${imageUrl}`);
      
      // Marquer le joueur comme ayant soumis avec succès
      player.hasSubmittedPrompt = true;
      
      card = {
        playerId: socket.id,
        username: player.username,
        prompt: prompt, 
        imageUrl: imageUrl
      };
      
      game.cards.push(card);

      // Diffuser la nouvelle image (sans le prompt pour garder le secret)
      const cardForBroadcast = {
        playerId: socket.id,
        username: player.username,
        imageUrl: imageUrl
      };
      io.to(roomId).emit("new_image_broadcast", cardForBroadcast);
      
    } catch (error) {
      console.error('Erreur lors de la génération d\'image:', error);
      
      // Ne pas marquer le joueur comme ayant soumis - permettre une nouvelle tentative
      player.hasSubmittedPrompt = false;
      
      // Envoyer un événement d'erreur au joueur spécifiquement
      socket.emit("prompt_rejected", { 
        error: "Votre prompt n'est pas conforme aux règles d'OpenAI. Veuillez reformuler votre demande en évitant tout contenu inapproprié.", 
        originalPrompt: prompt 
      });
      
      if (cb) cb({ error: "Prompt rejeté, veuillez reformuler" });
      return;
    }

    // Vérifier si tous les joueurs actifs ont soumis leur prompt
    const activePlayers = game.players.filter(p => !p.isEliminated);
    if (game.cards.length < activePlayers.length) {
      nextTurn(game);
      io.to(roomId).emit("start_turn", {
        currentPlayerId: game.turnOrder[game.currentTurn],
        order: game.turnOrder
      });
    } else {
      game.status = "DISCUSSION";
      io.to(roomId).emit("start_discussion", {});
    }
    
    if (cb) cb();
  });

  socket.on("chat_message", ({ roomId, username, message }) => {
    io.to(roomId).emit("chat_message", { username, message });
  });

  socket.on("submit_vote", ({ roomId, votedPlayerId }, cb) => {
    const game = games[roomId];
    const voter = game.players.find(p => p.id === socket.id);
    
    // Vérifier si le joueur existe et s'il est éliminé
    if (!voter) {
      console.log(`Joueur non trouvé pour le vote: ${socket.id}`);
      if (cb) cb({ error: "Joueur non trouvé" });
      return;
    }
    
    if (voter.isEliminated) {
      console.log(`Tentative de vote par un joueur éliminé: ${voter.username}`);
      if (cb) cb({ error: "Vous êtes éliminé et ne pouvez plus voter" });
      return;
    }
    
    recordVote(games[roomId], socket.id, votedPlayerId);
    io.to(roomId).emit("update_votes", games[roomId].votes);

    const activePlayers = games[roomId].players.filter(p => !p.isEliminated);
    if (games[roomId].votes.length === activePlayers.length) {
      const results = getResults(games[roomId]);
      
      if (results.isGameOver) {
        io.to(roomId).emit("game_over", results);
        games[roomId].status = "END";
      } else {
        // Envoyer le résultat du round (égalité, skip, ou élimination)
        let message = "Égalité ! Personne n'est éliminé ce round.";
        if (results.skipped) {
          message = "Les joueurs ont décidé de passer le tour. Personne n'est éliminé.";
        } else if (results.eliminatedPlayer) {
          message = `${results.eliminatedPlayer.username} a été éliminé !`;
        }
        
        io.to(roomId).emit("round_result", { ...results, message });
        
        // Nouveau round après 5 secondes
        setTimeout(() => {
          prepareNewRound(games[roomId]);
          games[roomId].status = "PROMPT";
          
          // Envoyer les nouveaux rôles avec les nouveaux mots
          io.to(roomId).emit("assign_roles", games[roomId].players.map(p => ({
            id: p.id, word: p.word
          })));
          
          io.to(roomId).emit("new_round", {
            round: games[roomId].round,
            eliminatedPlayers: games[roomId].eliminatedPlayers
          });
          
          io.to(roomId).emit("start_turn", {
            currentPlayerId: games[roomId].turnOrder[0],
            order: games[roomId].turnOrder
          });
        }, 5000);
      }
    }
    if (cb) cb();
  });

  socket.on("force_vote_end", ({ roomId }, cb) => {
    const game = games[roomId];
    if (!game || game.status !== "DISCUSSION") {
      if (cb) cb({ error: "Aucun vote en cours" });
      return;
    }
    
    const results = getResults(game);
    
    if (results.isGameOver) {
      io.to(roomId).emit("game_over", results);
      game.status = "END";
    } else {
      // Message selon le type de résultat
      let message = "Temps écoulé ! Égalité, personne n'est éliminé ce round.";
      if (results.skipped) {
        message = "Temps écoulé ! Les joueurs ont décidé de passer le tour.";
      } else if (results.eliminatedPlayer) {
        message = `Temps écoulé ! ${results.eliminatedPlayer.username} a été éliminé !`;
      }
      
      io.to(roomId).emit("round_result", { ...results, message });
      
      // Nouveau round après 5 secondes
      setTimeout(() => {
        prepareNewRound(game);
        game.status = "PROMPT";
        
        // Envoyer les nouveaux rôles avec les nouveaux mots
        io.to(roomId).emit("assign_roles", game.players.map(p => ({
          id: p.id, word: p.word
        })));
        
        io.to(roomId).emit("new_round", {
          round: game.round,
          eliminatedPlayers: game.eliminatedPlayers
        });
        
        io.to(roomId).emit("start_turn", {
          currentPlayerId: game.turnOrder[0],
          order: game.turnOrder
        });
      }, 5000);
    }
    
    if (cb) cb();
  });

  socket.on("disconnect", () => {
    console.log("Déconnexion:", socket.id);
    
    Object.values(games).forEach(game => {
      const player = game.players.find(p => p.id === socket.id);
      const wasHost = game.hostId === socket.id;
      
      if (player) {
        updatePlayerDisconnection(game, socket.id);
        console.log(`${player.username} s'est déconnecté de la room ${game.roomId}`);
      }
      
      game.players = game.players.filter(p => p.id !== socket.id);
      
      // Si l'hôte se déconnecte et qu'il reste des joueurs, transférer le statut d'hôte
      if (wasHost && game.players.length > 0) {
        const newHost = game.players[0];
        game.hostId = newHost.id;
        newHost.isHost = true;
        
        const hostRecord = game.allPlayersEverJoined.find(p => p.username === newHost.username);
        if (hostRecord) {
          hostRecord.isHost = true;
        }
        
        console.log(`Nouveau hôte pour la room ${game.roomId}: ${newHost.username}`);
        
        // Notifier tous les joueurs du changement d'hôte
        io.to(game.roomId).emit("update_players", game.players);
      } else if (game.players.length === 0) {
        // Si plus de joueurs connectés, garder la room pendant 5 minutes
        setTimeout(() => {
          if (games[game.roomId] && games[game.roomId].players.length === 0) {
            delete games[game.roomId];
            console.log(`Room ${game.roomId} supprimée (vide pendant 5 minutes)`);
          }
        }, 300000);
      } else {
        io.to(game.roomId).emit("update_players", game.players);
      }
    });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
