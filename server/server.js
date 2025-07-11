const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const { createGame, addPlayerToGame, assignWordsAndRoles, nextTurn, recordPrompt, recordVote, getResults, prepareNewRound, resetGame } = require("./gameLogic");
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
    }
    const player = addPlayerToGame(games[roomId], socket.id, username);
    socket.join(roomId);
    io.to(roomId).emit("update_players", games[roomId].players);
    cb(player);
  });

  socket.on("start_game", ({ roomId }, cb) => {
    if (games[roomId].status !== "WAITING") {
      resetGame(games[roomId]);
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
    
    player.hasSubmittedPrompt = true;
    
    console.log(`${player.username} a soumis un prompt: ${prompt}`);
    
    let imageUrl;
    let card;
    
    try {
      imageUrl = await generateImageWithDelay(prompt);
      console.log(`Image générée avec succès pour ${player.username}: ${imageUrl}`);
      
    } catch (error) {
      console.error('Erreur lors de la génération d\'image:', error);
      imageUrl = `https://picsum.photos/400/400?random=${Date.now()}-${socket.id}`;
      console.log(`Utilisation d'une image placeholder: ${imageUrl}`);
    }
    
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
    Object.values(games).forEach(game => {
      game.players = game.players.filter(p => p.id != socket.id);
    });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
