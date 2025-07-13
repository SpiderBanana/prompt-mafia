import React, { useState, useEffect } from "react";

const GIPHY_API_KEY = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65"; 

export default function GifPicker({ onSelectGif, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendingGifs, setTrendingGifs] = useState([]);

  useEffect(() => {
    fetchTrendingGifs();
  }, []);

  const fetchTrendingGifs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
      );
      const data = await response.json();
      setTrendingGifs(data.data || []);
      setGifs(data.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des GIFs trending:", error);
    }
    setLoading(false);
  };

  const searchGifs = async (query) => {
    if (!query.trim()) {
      setGifs(trendingGifs);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error("Erreur lors de la recherche de GIFs:", error);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchGifs(searchTerm);
  };

  const handleGifSelect = (gif) => {
    console.log('GIF sélectionné:', gif); 
    

    let gifUrl = gif.images.fixed_height.webp || gif.images.fixed_height.url || gif.images.original.url;
    

    if (gifUrl.startsWith('//')) {
      gifUrl = 'https:' + gifUrl;
    } else if (!gifUrl.startsWith('http')) {
      gifUrl = 'https://' + gifUrl;
    }
    
    console.log('URL finale du GIF:', gifUrl); 
    
    onSelectGif({
      url: gifUrl,
      title: gif.title || "GIF",
      id: gif.id
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800/95 backdrop-blur-lg rounded-2xl p-6 w-[600px] h-[500px] flex flex-col border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Choisir un GIF</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Barre de recherche */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher des GIFs..."
              className="w-full border-2 border-white/20 bg-white/10 backdrop-blur rounded-xl p-3 pr-12 text-white placeholder-gray-300 focus:border-blue-400 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Grille de GIFs */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {gifs.map((gif) => {
                let previewUrl = gif.images.fixed_height_small.url;
                if (previewUrl.startsWith('//')) {
                  previewUrl = 'https:' + previewUrl;
                } else if (!previewUrl.startsWith('http')) {
                  previewUrl = 'https://' + previewUrl;
                }
                
                return (
                  <div
                    key={gif.id}
                    className="aspect-square cursor-pointer rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all group"
                    onClick={() => handleGifSelect(gif)}
                  >
                    <img
                      src={previewUrl}
                      alt={gif.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        console.log('Erreur de chargement image:', e.target.src);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
          
          {!loading && gifs.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400">
              Aucun GIF trouvé
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">Powered by GIPHY</p>
        </div>
      </div>
    </div>
  );
}
