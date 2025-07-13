const wordsList = require("./words.json");

function createGame(roomId) {
  return {
    roomId,
    players: [],
    cards: [],
    votes: [],
    turnOrder: [],
    currentTurn: 0,
    status: "WAITING",
    round: 1,
    eliminatedPlayers: [],
    hostId: null,
    allPlayersEverJoined: [] 
  };
}

function addPlayerToGame(game, id, username) {
  const existingPlayerRecord = game.allPlayersEverJoined.find(p => p.username === username);
  
  if (existingPlayerRecord) {
    const player = {
      id, 
      username,
      word: existingPlayerRecord.word,
      isIntruder: existingPlayerRecord.isIntruder,
      isEliminated: existingPlayerRecord.isEliminated,
      hasSubmittedPrompt: false, // Reset pour le round actuel
      hasVoted: false, // Reset pour le round actuel
      vote: null,
      isHost: existingPlayerRecord.isHost,
      isReturning: true // Marquer comme joueur qui revient
    };
    game.players.push(player);
    return player;
  } else {
    // Nouveau joueur
    const player = {
      id, 
      username,
      word: null,
      isIntruder: false,
      isEliminated: false,
      hasSubmittedPrompt: false,
      hasVoted: false,
      vote: null,
      isHost: false,
      isReturning: false
    };
    game.players.push(player);
    
    // Ajouter à la liste de tous les joueurs ayant rejoint
    game.allPlayersEverJoined.push({
      username,
      word: null,
      isIntruder: false,
      isEliminated: false,
      isHost: false
    });
    
    return player;
  }
}

function assignWordsAndRoles(game) {
  const theme = wordsList[Math.floor(Math.random() * wordsList.length)];
  const mainWord = theme.word;
  const intruderWord = theme.intruder;
  const intruderIdx = Math.floor(Math.random() * game.players.length);
  game.players.forEach((p, idx) => {
    p.word = idx === intruderIdx ? intruderWord : mainWord;
    p.isIntruder = idx === intruderIdx;
    p.hasSubmittedPrompt = false;
    p.hasVoted = false;
    p.vote = null;
  });
  
  // Mettre à jour le registre de tous les joueurs
  game.players.forEach(player => {
    const record = game.allPlayersEverJoined.find(p => p.username === player.username);
    if (record) {
      record.word = player.word;
      record.isIntruder = player.isIntruder;
      record.isEliminated = player.isEliminated;
      record.isHost = player.isHost;
    }
  });
  
  game.turnOrder = shuffle(game.players.map(p => p.id));
  game.currentTurn = 0;
}

function nextTurn(game) {
  game.currentTurn += 1;
}

function recordPrompt(game, playerId, prompt, imageUrl) {
  game.cards.push({
    playerId,
    prompt,
    imageUrl
  });
}

function recordVote(game, voterId, votedPlayerId) {
  // Vérifier que le votant n'est pas éliminé
  const voter = game.players.find(p => p.id === voterId);
  if (voter && voter.isEliminated) return;
  
  // Vérifier que le vote n'existe pas déjà
  if (game.votes.find(v => v.voterId === voterId)) return;
  
  game.votes.push({ voterId, votedPlayerId });
}

function getResults(game) {
  const voteCount = {};
  const activePlayers = game.players.filter(p => !p.isEliminated);
  
  // Compter les votes
  for (const v of game.votes) {
    voteCount[v.votedPlayerId] = (voteCount[v.votedPlayerId] || 0) + 1;
  }
  
  // Si personne n'a voté ou tous ont voté "skip"
  if (Object.keys(voteCount).length === 0 || (Object.keys(voteCount).length === 1 && voteCount['skip'])) {
    return {
      votes: game.votes,
      voteCount,
      eliminatedPlayer: null,
      intruder: game.players.find(p => p.isIntruder),
      isGameOver: false,
      winner: null,
      skipped: true
    };
  }
  
  // Trouver le joueur avec le plus de votes
  const maxVotes = Math.max(...Object.values(voteCount));
  
  // Si "skip" a le plus de votes, personne n'est éliminé
  if (voteCount['skip'] === maxVotes) {
    return {
      votes: game.votes,
      voteCount,
      eliminatedPlayer: null,
      intruder: game.players.find(p => p.isIntruder),
      isGameOver: false,
      winner: null,
      skipped: true
    };
  }
  
  // Trouver les suspects (excluant "skip")
  const suspects = Object.entries(voteCount)
    .filter(([id, votes]) => id !== 'skip' && votes === maxVotes)
    .map(([playerId]) => playerId);
  
  const intruder = game.players.find(p => p.isIntruder);
  
  // Si égalité entre joueurs, personne n'est éliminé
  if (suspects.length > 1) {
    return {
      votes: game.votes,
      voteCount,
      eliminatedPlayer: null,
      intruder: { id: intruder.id, username: intruder.username },
      isGameOver: false,
      winner: null,
      tie: true
    };
  }
  
  // Si aucun suspect (tous les votes sont pour "skip")
  if (suspects.length === 0) {
    return {
      votes: game.votes,
      voteCount,
      eliminatedPlayer: null,
      intruder: { id: intruder.id, username: intruder.username },
      isGameOver: false,
      winner: null,
      skipped: true
    };
  }
  
  // Éliminer le joueur avec le plus de votes
  const eliminatedPlayerId = suspects[0];
  const eliminatedPlayer = game.players.find(p => p.id === eliminatedPlayerId);
  eliminatedPlayer.isEliminated = true;
  game.eliminatedPlayers.push(eliminatedPlayer);
  
  // Vérifier les conditions de victoire
  const remainingPlayers = game.players.filter(p => !p.isEliminated);
  const remainingNonIntruders = remainingPlayers.filter(p => !p.isIntruder);
  
  let isGameOver = false;
  let winner = null;
  
  if (eliminatedPlayer.isIntruder) {
    // L'intrus a été éliminé, les non-intrus gagnent
    isGameOver = true;
    winner = "non-intruders";
  } else if (remainingNonIntruders.length <= 1) {
    // Il ne reste qu'un non-intrus ou moins, l'intrus gagne
    isGameOver = true;
    winner = "intruder";
  }
  
  return {
    votes: game.votes,
    voteCount,
    eliminatedPlayer: {
      id: eliminatedPlayer.id,
      username: eliminatedPlayer.username,
      isIntruder: eliminatedPlayer.isIntruder
    },
    intruder: { id: intruder.id, username: intruder.username },
    isGameOver,
    winner,
    remainingPlayers: remainingPlayers.length,
    remainingNonIntruders: remainingNonIntruders.length
  };
}

function prepareNewRound(game) {
  // Réinitialiser pour le nouveau round
  game.round += 1;
  game.votes = [];
  game.cards = [];
  game.currentTurn = 0;
  
  // Réinitialiser les statuts des joueurs non éliminés
  game.players.forEach(player => {
    if (!player.isEliminated) {
      player.hasSubmittedPrompt = false;
      player.hasVoted = false;
      player.vote = null;
    }
  });
  
  // Nouveau turnOrder avec seulement les joueurs actifs
  const activePlayers = game.players.filter(p => !p.isEliminated);
  game.turnOrder = shuffle(activePlayers.map(p => p.id));
}

function resetGame(game) {
  // Réinitialiser les propriétés du jeu tout en gardant les joueurs
  game.cards = [];
  game.votes = [];
  game.turnOrder = [];
  game.currentTurn = 0;
  game.status = "WAITING";
  game.round = 1;
  game.eliminatedPlayers = [];
  
  // Réinitialiser les propriétés des joueurs
  game.players.forEach(player => {
    player.word = null;
    player.isIntruder = false;
    player.isEliminated = false;
    player.hasSubmitted = false;
  });
  
  // Réinitialiser aussi le registre des joueurs
  game.allPlayersEverJoined.forEach(player => {
    player.word = null;
    player.isIntruder = false;
    player.isEliminated = false;
  });
  
  return game;
}

function canPlayerRejoinGame(game, username) {
  // Vérifier si le joueur a déjà participé à cette room
  const playerRecord = game.allPlayersEverJoined.find(p => p.username === username);
  return playerRecord !== undefined;
}

function updatePlayerDisconnection(game, playerId) {
  // Marquer la déconnexion mais garder le record du joueur
  const player = game.players.find(p => p.id === playerId);
  if (player) {
    const record = game.allPlayersEverJoined.find(p => p.username === player.username);
    if (record) {
      // Mettre à jour le record avec l'état actuel du joueur
      record.word = player.word;
      record.isIntruder = player.isIntruder;
      record.isEliminated = player.isEliminated;
      record.isHost = player.isHost;
    }
  }
}

function shuffle(arr) {
  return arr
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

module.exports = {
  createGame,
  addPlayerToGame,
  assignWordsAndRoles,
  nextTurn,
  recordPrompt,
  recordVote,
  getResults,
  prepareNewRound,
  resetGame,
  canPlayerRejoinGame,
  updatePlayerDisconnection
};
