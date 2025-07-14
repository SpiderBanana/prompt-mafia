import { motion } from "framer-motion";

export default function PlayerSidebar({ players, currentPlayerId, myWord, eliminatedPlayers = [], isMobile = false }) {
  if (isMobile) {
    return (
      <div className="text-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-purple-400">
            Joueurs ({players.length - eliminatedPlayers.length}/{players.length})
          </h2>
          {myWord && (
            <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-lg border border-white/30">
              <span className="text-xs text-gray-200">Ton mot: </span>
              <span className="text-sm font-bold text-blue-300">{myWord}</span>
            </div>
          )}
        </div>

        {/* Liste horizontale des joueurs pour mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {players.map((player, index) => {
            const isCurrentPlayer = player.id === currentPlayerId;
            const isEliminated = eliminatedPlayers.some(p => p.id === player.id);
            const isDisconnected = player.isDisconnected;
            
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex-shrink-0 p-2 rounded-lg border transition-all duration-300 min-w-[80px] text-center ${
                  isEliminated 
                    ? 'bg-red-900/50 backdrop-blur border-red-500/50 opacity-60' 
                    : isDisconnected
                    ? 'bg-gray-900/50 backdrop-blur border-gray-500/50 opacity-70'
                    : isCurrentPlayer
                    ? 'bg-gradient-to-r from-yellow-500/80 to-orange-500/80 backdrop-blur border-yellow-400/60 shadow-lg shadow-yellow-500/20'
                    : 'bg-white/10 backdrop-blur border-white/20'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                  isEliminated 
                    ? 'bg-red-500' 
                    : isDisconnected
                    ? 'bg-gray-500'
                    : isCurrentPlayer 
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-green-400'
                }`} />
                <p className={`text-xs font-medium truncate ${
                  isEliminated ? 'text-red-300 line-through' 
                  : isDisconnected ? 'text-gray-400' 
                  : 'text-white'
                }`}>
                  {player.username}
                </p>
                {isDisconnected && !isEliminated && (
                  <p className="text-xs text-gray-500">Déco</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col text-white">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-purple-400">
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
      <div className="space-y-3 flex-1 overflow-y-auto">
        {players.map((player, index) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          const isEliminated = eliminatedPlayers.some(p => p.id === player.id);
          const isDisconnected = player.isDisconnected;
          
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-xl border transition-all duration-300 ${
                isEliminated 
                  ? 'bg-red-900/50 backdrop-blur border-red-500/50 opacity-60' 
                  : isDisconnected
                  ? 'bg-gray-900/50 backdrop-blur border-gray-500/50 opacity-70'
                  : isCurrentPlayer
                  ? 'bg-gradient-to-r from-yellow-500/80 to-orange-500/80 backdrop-blur border-yellow-400/60 shadow-lg shadow-yellow-500/20'
                  : 'bg-white/10 backdrop-blur border-white/20 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  isEliminated 
                    ? 'bg-red-500' 
                    : isDisconnected
                    ? 'bg-gray-500'
                    : isCurrentPlayer 
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-green-400'
                }`} />
                <div className="flex-1">
                  <p className={`font-medium ${
                    isEliminated ? 'text-red-300 line-through' 
                    : isDisconnected ? 'text-gray-400' 
                    : 'text-white'
                  }`}>
                    {player.username}
                  </p>
                  {isCurrentPlayer && !isEliminated && !isDisconnected && (
                    <p className="text-xs text-yellow-200">En train de jouer...</p>
                  )}
                  {isCurrentPlayer && isDisconnected && !isEliminated && (
                    <p className="text-xs text-orange-300">C'est son tour - Déconnecté</p>
                  )}
                  {isEliminated && (
                    <p className="text-xs text-red-400">Éliminé</p>
                  )}
                  {isDisconnected && !isEliminated && !isCurrentPlayer && (
                    <p className="text-xs text-gray-500">Déconnecté</p>
                  )}
                </div>
                {isCurrentPlayer && !isEliminated && !isDisconnected && (
                  <div className="text-yellow-400">
                    <svg className="w-4 h-4 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {isCurrentPlayer && isDisconnected && !isEliminated && (
                  <div className="text-orange-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
