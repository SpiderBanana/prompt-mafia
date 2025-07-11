export default function PlayerOrder({ players, currentPlayerId, eliminatedPlayers = [] }) {
  const allPlayers = [...players];
  
  // Ajouter les joueurs éliminés à la fin s'ils ne sont pas déjà dans la liste
  eliminatedPlayers.forEach(eliminated => {
    if (!allPlayers.find(p => p.id === eliminated.id)) {
      allPlayers.push({ ...eliminated, isEliminated: true });
    }
  });

  return (
    <div className="flex gap-2 items-center py-2 flex-wrap justify-center">
      {allPlayers.map((p) => {
        const isEliminated = eliminatedPlayers.some(ep => ep.id === p.id);
        const isCurrent = p.id === currentPlayerId;
        
        return (
          <span
            key={p.id}
            className={`px-3 py-1 rounded-full text-xs ${
              isEliminated 
                ? 'bg-red-200 text-red-800 line-through opacity-60' 
                : isCurrent 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-800'
            }`}
          >
            {p.username} {isEliminated}
          </span>
        );
      })}
    </div>
  );
}
