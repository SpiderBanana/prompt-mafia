import { motion } from "framer-motion";

export default function VoteZone({ players, votes = [], onVote, selected, disabled, onConfirm, hasConfirmed }) {
  // Compter les votes pour chaque joueur
  const getVoteCount = (playerId) => {
    return votes.filter(vote => vote.votedPlayerId === playerId).length;
  };

  return (
    <div className="space-y-6">
      {/* Zone de sélection des joueurs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {players.map((p, index) => {
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
              <div className="p-3 text-center">
                {/* Nom du joueur */}
                <div className={`font-medium text-sm mb-2 ${isSelected ? 'text-red-200' : 'text-white'}`}>
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
              
              {/* Indicateur de sélection */}
              {isSelected && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg"
                >
                  ✓
                </motion.div>
              )}
            </motion.label>
          );
        })}
        
        {/* Option "Passer le tour" */}
        <motion.label
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: players.length * 0.1 }}
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
          
          <div className="p-3 text-center">
            {/* Icône et texte */}
            <div className={`text-lg mb-1 ${selected === "skip" ? 'text-blue-200' : 'text-white'}`}>
              &gt;&gt;
            </div>
            
            <div className={`font-medium text-xs ${selected === "skip" ? 'text-blue-200' : 'text-white'}`}>
              Passer
            </div>
          </div>
          
          {/* Indicateur de sélection */}
          {selected === "skip" && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg"
            >
              ✓
            </motion.div>
          )}
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
            Confirmer mon vote
          </button>
          <p className="text-sm text-yellow-500 mt-3">
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
