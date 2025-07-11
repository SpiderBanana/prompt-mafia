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

// Servir les fichiers statiques du client (si buildé)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

// Rooms en mémoire
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
    // Réinitialiser le jeu s'il existe déjà
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
    
    // Vérifier si le joueur est éliminé
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
      // Générer l'image avec OpenAI
      imageUrl = await generateImageWithDelay(prompt);
      console.log(`Image générée avec succès pour ${player.username}: ${imageUrl}`);
      
    } catch (error) {
      console.error('Erreur lors de la génération d\'image:', error);
      // En cas d'erreur, utiliser une image placeholder cohérente
      imageUrl = `https://picsum.photos/400/400?random=${Date.now()}-${socket.id}`;
      console.log(`Utilisation d'une image placeholder: ${imageUrl}`);
    }
    
    // Créer la carte avec l'image (soit générée, soit placeholder)
    card = {
      playerId: socket.id,
      username: player.username,
      prompt: prompt, // Le prompt reste stocké côté serveur
      imageUrl: imageUrl
    };
    
    game.cards.push(card);

    // Envoyer la carte SANS le prompt aux autres joueurs
    const cardForBroadcast = {
      playerId: socket.id,
      username: player.username,
      imageUrl: imageUrl
    };      io.to(roomId).emit("new_image_broadcast", cardForBroadcast);

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
      
      // Ajouter les prompts révélés dans les résultats
      results.revealedCards = games[roomId].cards.map(card => ({
        playerId: card.playerId,
        username: card.username,
        prompt: card.prompt,
        imageUrl: card.imageUrl
      }));
      
      if (results.isGameOver) {
        // Jeu terminé
        io.to(roomId).emit("game_over", results);
        games[roomId].status = "END";
      } else if (results.tie) {
        // Égalité, personne n'est éliminé
        io.to(roomId).emit("round_result", {
          ...results,
          message: "Égalité ! Personne n'est éliminé ce round."
        });
        
        // Préparer le nouveau round après un délai
        setTimeout(() => {
          prepareNewRound(games[roomId]);
          games[roomId].status = "PROMPT";
          
          // Envoyer les nouvelles informations de round
          io.to(roomId).emit("new_round", {
            round: games[roomId].round,
            activePlayers: games[roomId].players.filter(p => !p.isEliminated),
            eliminatedPlayers: games[roomId].eliminatedPlayers
          });
          
          io.to(roomId).emit("start_turn", {
            currentPlayerId: games[roomId].turnOrder[0],
            order: games[roomId].turnOrder
          });
        }, 5000);
      } else if (results.skipped) {
        // Les joueurs ont choisi de passer le tour
        io.to(roomId).emit("round_result", {
          ...results,
          message: "Les joueurs ont décidé de passer le tour. Personne n'est éliminé."
        });
        
        // Préparer le nouveau round après un délai
        setTimeout(() => {
          prepareNewRound(games[roomId]);
          games[roomId].status = "PROMPT";
          
          // Envoyer les nouvelles informations de round
          io.to(roomId).emit("new_round", {
            round: games[roomId].round,
            activePlayers: games[roomId].players.filter(p => !p.isEliminated),
            eliminatedPlayers: games[roomId].eliminatedPlayers
          });
          
          io.to(roomId).emit("start_turn", {
            currentPlayerId: games[roomId].turnOrder[0],
            order: games[roomId].turnOrder
          });
        }, 5000);
      } else {
        // Quelqu'un a été éliminé, mais le jeu continue
        io.to(roomId).emit("round_result", {
          ...results,
          message: `${results.eliminatedPlayer.username} a été éliminé !`
        });
        
        // Préparer le nouveau round après un délai
        setTimeout(() => {
          prepareNewRound(games[roomId]);
          games[roomId].status = "PROMPT";
          
          // Envoyer les nouvelles informations de round
          io.to(roomId).emit("new_round", {
            round: games[roomId].round,
            activePlayers: games[roomId].players.filter(p => !p.isEliminated),
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
    
    // Forcer la fin du vote même si tous les joueurs n'ont pas voté
    const results = getResults(game);
    
    // Ajouter les prompts révélés dans les résultats
    results.revealedCards = game.cards.map(card => ({
      playerId: card.playerId,
      username: card.username,
      prompt: card.prompt,
      imageUrl: card.imageUrl
    }));
    
    if (results.isGameOver) {
      // Jeu terminé
      io.to(roomId).emit("game_over", results);
      game.status = "END";
    } else if (results.tie) {
      // Égalité, personne n'est éliminé
      io.to(roomId).emit("round_result", {
        ...results,
        message: "Temps écoulé ! Égalité, personne n'est éliminé ce round."
      });
      
      // Préparer le nouveau round après un délai
      setTimeout(() => {
        prepareNewRound(game);
        game.status = "PROMPT";
        
        io.to(roomId).emit("new_round", {
          round: game.round,
          activePlayers: game.players.filter(p => !p.isEliminated),
          eliminatedPlayers: game.eliminatedPlayers
        });
        
        io.to(roomId).emit("start_turn", {
          currentPlayerId: game.turnOrder[0],
          order: game.turnOrder
        });
      }, 5000);
    } else if (results.skipped) {
      // Les joueurs ont choisi de passer le tour
      io.to(roomId).emit("round_result", {
        ...results,
        message: "Temps écoulé ! Les joueurs ont décidé de passer le tour."
      });
      
      // Préparer le nouveau round après un délai
      setTimeout(() => {
        prepareNewRound(game);
        game.status = "PROMPT";
        
        io.to(roomId).emit("new_round", {
          round: game.round,
          activePlayers: game.players.filter(p => !p.isEliminated),
          eliminatedPlayers: game.eliminatedPlayers
        });
        
        io.to(roomId).emit("start_turn", {
          currentPlayerId: game.turnOrder[0],
          order: game.turnOrder
        });
      }, 5000);
    } else {
      // Quelqu'un a été éliminé
      io.to(roomId).emit("round_result", {
        ...results,
        message: `Temps écoulé ! ${results.eliminatedPlayer.username} a été éliminé !`
      });
      
      // Préparer le nouveau round après un délai
      setTimeout(() => {
        prepareNewRound(game);
        game.status = "PROMPT";
        
        io.to(roomId).emit("new_round", {
          round: game.round,
          activePlayers: game.players.filter(p => !p.isEliminated),
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
