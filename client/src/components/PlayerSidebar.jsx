import { motion } from "framer-motion";

export default function PlayerSidebar({ players, currentPlayerId, myWord, eliminatedPlayers = [] }) {
  return (
    <div className="w-80 bg-white/10 backdrop-blur-lg text-white rounded-2xl shadow-2xl p-6 h-fit border border-white/20">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
           Joueurs
        </h2>
        {myWord && (
          <div className="mt-4 p-3 bg-white/20 backdrop-blur rounded-lg border border-white/30">
            <p className="text-sm text-gray-200">Ton mot :</p>
            <p className="text-lg font-bold text-blue-300">{myWord}</p>
          </div>
        )}
      </div>

      {/* Liste des joueurs */}
      <div className="space-y-3">
        {players.map((player, index) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          const isEliminated = eliminatedPlayers.some(p => p.id === player.id);
          
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-xl border transition-all duration-300 ${
                isEliminated 
                  ? 'bg-red-900/50 backdrop-blur border-red-500/50 opacity-60' 
                  : isCurrentPlayer
                  ? 'bg-gradient-to-r from-yellow-500/80 to-orange-500/80 backdrop-blur border-yellow-400/60 shadow-lg shadow-yellow-500/20'
                  : 'bg-white/10 backdrop-blur border-white/20 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  isEliminated 
                    ? 'bg-red-500' 
                    : isCurrentPlayer 
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-green-400'
                }`} />
                <div className="flex-1">
                  <p className={`font-medium ${
                    isEliminated ? 'text-red-300 line-through' : 'text-white'
                  }`}>
                    {player.username}
                  </p>
                  {isCurrentPlayer && !isEliminated && (
                    <p className="text-xs text-yellow-200">En train de jouer...</p>
                  )}
                  {isEliminated && (
                    <p className="text-xs text-red-400">Éliminé</p>
                  )}
                </div>
                {isCurrentPlayer && !isEliminated && (
                  <div className="text-yellow-400">
                    <svg className="w-4 h-4 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-6 pt-4 border-t border-white/30">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/20 backdrop-blur rounded-lg p-2 border border-white/30">
            <p className="text-xs text-gray-200">Actifs</p>
            <p className="text-lg font-bold text-green-400">
              {players.length - eliminatedPlayers.length}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-2 border border-white/30">
            <p className="text-xs text-gray-200">Éliminés</p>
            <p className="text-lg font-bold text-red-400">
              {eliminatedPlayers.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
