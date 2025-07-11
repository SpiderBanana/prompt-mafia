import React from "react";
import { motion } from "framer-motion";

export default function CardGallery({ cards, votes, currentUserId, players = [], currentPlayerId, eliminatedPlayers = [] }) {
  // Créer des cartes fantômes pour les joueurs qui n'ont pas encore généré d'image
  const ghostCards = players
    .filter(player => 
      !cards.some(card => card.playerId === player.id) && 
      !eliminatedPlayers.some(p => p.id === player.id)
    )
    .map(player => ({
      playerId: player.id,
      username: player.username,
      isGhost: true,
      isCurrentPlayer: player.id === currentPlayerId
    }));

  const allCards = [...cards, ...ghostCards];

  // Fonction pour vérifier si une image est une image de backup
  const isBackupImage = (imageUrl) => {
    return imageUrl && imageUrl.includes('picsum.photos');
  };

  // Fonction pour vérifier si un joueur est éliminé
  const isPlayerEliminated = (playerId) => {
    return eliminatedPlayers.some(p => p.id === playerId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 p-6">
      {allCards.map((card, idx) => {
        const isEliminated = isPlayerEliminated(card.playerId);
        
        return (
        <motion.div
          key={card.playerId}
          className={`
            relative backdrop-blur-lg rounded-2xl shadow-2xl border overflow-hidden
            ${isEliminated 
              ? 'bg-red-900/50 border-red-500/50 opacity-60' 
              : 'bg-white/10 border-white/20'
            }
            ${card.isCurrentPlayer && card.isGhost ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''}
          `}
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            delay: idx * 0.1, 
            duration: 0.5,
            type: "spring",
            stiffness: 100
          }}
          whileHover={{ scale: 1.05, y: -5 }}
        >
          {/* Image ou zone de chargement */}
          <div className="aspect-square relative">
            {isEliminated ? (
              <div className="w-full h-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 flex flex-col items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-2xl font-bold mb-2">💀</div>
                  <p className="text-gray-300 text-lg font-bold">
                    JOUEUR ÉLIMINÉ
                  </p>
                </div>
              </div>
            ) : card.isGhost ? (
              // Carte fantôme avec animation de chargement
              <div className="w-full h-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex flex-col items-center justify-center">
                {card.isCurrentPlayer ? (
                  <>
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mb-4"></div>
                    <p className="text-yellow-300 text-sm font-medium animate-pulse">
                      Génération en cours...
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm">
                      En attente...
                    </p>
                  </>
                )}
              </div>
            ) : isBackupImage(card.imageUrl) ? (
              // Image censurée (fallback)
              <div className="w-full h-full bg-gradient-to-br from-red-900/30 to-red-800/30 flex flex-col items-center justify-center relative">
                <div className="relative z-10 text-center">
                  <div className="text-red-400 text-2xl font-bold mb-2">⚠️</div>
                  <p className="text-red-300 text-lg font-bold">
                    CENSURÉ
                  </p>
                  <p className="text-red-200 text-xs mt-1">
                    Contenu non généré
                  </p>
                </div>
              </div>
            ) : (
              // Image réelle
              <img
                src={card.imageUrl}
                alt="Image générée"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            
            {/* Badge du nom du joueur */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${isEliminated
                      ? 'bg-red-500 text-white'
                      : card.playerId === currentUserId 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-600 text-gray-200'
                    }
                  `}>
                    {card.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className={`font-semibold text-sm ${
                      isEliminated ? 'text-red-300 line-through' : 'text-white'
                    }`}>
                      {card.username}
                    </span>
                    {isEliminated && (
                      <p className="text-xs text-red-400">Éliminé</p>
                    )}
                  </div>
                </div>
                
                {card.isCurrentPlayer && card.isGhost && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-yellow-300 text-xs font-medium">
                      Son tour
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Effet de brillance pour les cartes en cours de génération */}
          {card.isCurrentPlayer && card.isGhost && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent animate-shimmer"></div>
          )}
        </motion.div>
        );
      })}
    </div>
  );
}
