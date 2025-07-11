// filepath: c:\Users\Home\Downloads\prompt-mafia\client\src\components\VoteZone.jsx
import { motion } from "framer-motion";

export default function VoteZone({ players, votes = [], onVote, selected, disabled, onConfirm, hasConfirmed }) {
  // Compter les votes pour chaque joueur
  const getVoteCount = (playerId) => {
    return votes.filter(vote => vote.votedPlayerId === playerId).length;
  };

  return (
    <div className="space-y-6">
      {/* Zone de sélection des joueurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((p, index) => {
          const voteCount = getVoteCount(p.id);
          const isSelected = selected === p.id;
          
          return (
            <motion.label
              key={p.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`cursor-pointer group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                isSelected 
                  ? "border-red-500 bg-gradient-to-br from-red-50 to-red-100 shadow-lg shadow-red-500/25" 
                  : "border-gray-200 bg-white hover:border-red-300 hover:shadow-md"
              } ${disabled && !isSelected && "opacity-50 cursor-not-allowed"}
                ${hasConfirmed && "opacity-60 cursor-not-allowed"}
              `}
              whileHover={!disabled && !hasConfirmed ? { scale: 1.02, y: -2 } : {}}
              whileTap={!disabled && !hasConfirmed ? { scale: 0.98 } : {}}
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
                <div className="p-6 text-center">
                {/* Nom du joueur */}
                <div className={`font-bold text-xl mb-3 ${isSelected ? 'text-red-700' : 'text-gray-800'}`}>
                  {p.username}
                </div>
                
                {/* Compteur de votes */}
                <div className={`text-sm px-3 py-1 rounded-full inline-block ${
                  voteCount > 0 
                    ? 'bg-red-100 text-red-700 font-medium' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {voteCount > 0 ? `${voteCount} vote${voteCount > 1 ? 's' : ''}` : 'Aucun vote'}
                </div>
              </div>
              
              {/* Indicateur de sélection */}
              {isSelected && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg"
                >
                  ✓
                </motion.div>
              )}
              
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </motion.label>
          );
        })}
        
        {/* Option "Passer le tour" */}
        <motion.label
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: players.length * 0.1 }}
          className={`cursor-pointer group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
            selected === "skip" 
              ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg shadow-blue-500/25" 
              : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
          } ${disabled && selected !== "skip" && "opacity-50 cursor-not-allowed"}
            ${hasConfirmed && "opacity-60 cursor-not-allowed"}
          `}
          whileHover={!disabled && !hasConfirmed ? { scale: 1.02, y: -2 } : {}}
          whileTap={!disabled && !hasConfirmed ? { scale: 0.98 } : {}}
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
          
          <div className="p-6 text-center">
            {/* Icône */}
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl ${
              selected === "skip" 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
            }`}>
              ⏭️
            </div>
            
            {/* Texte */}
            <div className={`font-bold text-lg mb-2 ${selected === "skip" ? 'text-blue-700' : 'text-gray-800'}`}>
              Passer le tour
            </div>
            
            {/* Description */}
            <div className="text-xs text-gray-500">
              Ne pas éliminer
            </div>
          </div>
          
          {/* Indicateur de sélection */}
          {selected === "skip" && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg"
            >
              ✓
            </motion.div>
          )}
          
          {/* Effet de brillance */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
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
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            🗳️ Confirmer mon vote
          </button>
          <p className="text-sm text-gray-500 mt-3">
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
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-6 py-4 rounded-2xl inline-block shadow-lg">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">✅</span>
              <div>
                <span className="font-bold text-lg">Vote confirmé !</span>
                {selected && selected !== "skip" && (
                  <div className="text-sm mt-1">
                    Vous avez voté pour <span className="font-semibold">{players.find(p => p.id === selected)?.username}</span>
                  </div>
                )}
                {selected === "skip" && (
                  <div className="text-sm mt-1">
                    Vous avez choisi de <span className="font-semibold">passer le tour</span>
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
