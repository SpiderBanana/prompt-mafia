import { motion } from "framer-motion";

export default function VoteZone({ players, votes = [], onVote, selected, disabled, onConfirm, hasConfirmed, cards = [], eliminatedPlayers = [] }) {
  // Compter les votes pour chaque joueur
  const getVoteCount = (playerId) => {
    return votes.filter(vote => vote.votedPlayerId === playerId).length;
  };

  const createOrderedPlayers = () => {
    const ghostCards = players
      .filter(player => 
        !cards.some(card => card.playerId === player.id) && 
        !eliminatedPlayers.some(p => p.id === player.id)
      )
      .map(player => ({
        playerId: player.id,
        username: player.username,
        isGhost: true
      }));

    const allCards = [...cards, ...ghostCards];
    
  
    return allCards
      .filter(card => !eliminatedPlayers.some(p => p.id === card.playerId))
      .map(card => players.find(p => p.id === card.playerId))
      .filter(Boolean); 
  };

  const orderedPlayers = createOrderedPlayers();

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Zone de sélection des joueurs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
        {orderedPlayers.map((p, index) => {
          const voteCount = getVoteCount(p.id);
          const isSelected = selected === p.id;
          
          return (
            <motion.label
              key={p.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`cursor-pointer group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                isSelected 
                  ? "border-red-400/60 bg-red-500/20 backdrop-blur-lg shadow-lg shadow-red-500/25" 
                  : "border-white/20 bg-white/10 backdrop-blur-lg hover:border-red-300/40 hover:bg-white/20"
              } ${disabled && !isSelected && "opacity-50 cursor-not-allowed"}
                ${hasConfirmed && "opacity-60 cursor-not-allowed"}
              `}
              whileHover={!disabled && !hasConfirmed ? { scale: 1.05 } : {}}
              whileTap={!disabled && !hasConfirmed ? { scale: 0.95 } : {}}
            >
              <input
                type="radio"
                name="vote"
                value={p.id}
                checked={isSelected}
                disabled={disabled || hasConfirmed}
                onChange={() => !disabled && !hasConfirmed && onVote(p.id)}
                className="sr-only"
              />
              <div className="p-2 lg:p-3 text-center">
                {/* Nom du joueur */}
                <div className={`font-medium text-xs lg:text-sm mb-1 lg:mb-2 ${isSelected ? 'text-red-200' : 'text-white'}`}>
                  {p.username}
                </div>
                
                {/* Compteur de votes */}
                <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                  voteCount > 0 
                    ? 'bg-red-400/30 text-red-200 font-medium backdrop-blur' 
                    : 'bg-white/20 text-gray-300 backdrop-blur'
                }`}>
                  {voteCount > 0 ? `${voteCount}` : '0'}
                </div>
              </div>
              
            </motion.label>
          );
        })}
        
        {/* Option "Passer le tour" */}
        <motion.label
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: orderedPlayers.length * 0.1 }}
          className={`cursor-pointer group relative overflow-hidden rounded-xl border transition-all duration-300 ${
            selected === "skip" 
              ? "border-blue-400/60 bg-blue-500/20 backdrop-blur-lg shadow-lg shadow-blue-500/25" 
              : "border-white/20 bg-white/10 backdrop-blur-lg hover:border-blue-300/40 hover:bg-white/20"
          } ${disabled && selected !== "skip" && "opacity-50 cursor-not-allowed"}
            ${hasConfirmed && "opacity-60 cursor-not-allowed"}
          `}
          whileHover={!disabled && !hasConfirmed ? { scale: 1.05 } : {}}
          whileTap={!disabled && !hasConfirmed ? { scale: 0.95 } : {}}
        >
          <input
            type="radio"
            name="vote"
            value="skip"
            checked={selected === "skip"}
            disabled={disabled || hasConfirmed}
            onChange={() => !disabled && !hasConfirmed && onVote("skip")}
            className="sr-only"
          />
          
          <div className="p-2 lg:p-3 text-center flex items-center justify-center h-full">
            <div className={`font-medium text-xs lg:text-sm ${selected === "skip" ? 'text-blue-200' : 'text-white'}`}>
              Passer
            </div>
          </div>
        </motion.label>
      </div>
      
      {/* Bouton de confirmation */}
      {selected && !hasConfirmed && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button
            onClick={() => onConfirm && onConfirm(selected)}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 lg:py-4 px-6 lg:px-8 rounded-2xl transition-all duration-300 text-base lg:text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 w-full lg:w-auto"
          >
            Confirmer mon vote
          </button>
          <p className="text-xs lg:text-sm text-yellow-500 mt-2 lg:mt-3">
            ⚠️ Attention : une fois confirmé, vous ne pourrez plus changer votre vote !
          </p>
        </motion.div>
      )}
      
      {/* Message de confirmation */}
      {hasConfirmed && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="bg-white/10 backdrop-blur-lg border border-green-400/30 text-green-300 px-4 lg:px-6 py-3 lg:py-4 rounded-2xl inline-block shadow-lg">
            <div className="flex items-center space-x-2">
              <div>
                <span className="font-bold text-base lg:text-lg">Vote confirmé !</span>
                {selected && selected !== "skip" && (
                  <div className="text-xs lg:text-sm mt-1 text-green-200">
                    Vous avez voté pour <span className="font-semibold text-green-100">{orderedPlayers.find(p => p.id === selected)?.username}</span>
                  </div>
                )}
                {selected === "skip" && (
                  <div className="text-xs lg:text-sm mt-1 text-green-200">
                    Vous avez choisi de <span className="font-semibold text-green-100">passer le tour</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
