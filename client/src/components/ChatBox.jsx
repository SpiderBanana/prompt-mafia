import React, { useState, useEffect, useRef } from "react";
import GifPicker from "./GifPicker";

export default function ChatBox({ messages, onSend, isMobile = false }) {
  const [input, setInput] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const MAX_CHARS = 200; 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGifSelect = (gif) => {
    const cleanTitle = gif.title.replace(/\|/g, '-');
    onSend(`[GIF|||${gif.url}|||${cleanTitle}]`);
    setShowGifPicker(false);
  };

  const renderMessage = (msg) => {
    // Vérifier si le message est un GIF avec le nouveau format
    const gifMatch = msg.message.match(/^\[GIF\|\|\|(.*?)\|\|\|(.*?)\]$/);
    
    if (gifMatch) {
      const [, gifUrl, gifTitle] = gifMatch;
      
      let cleanGifUrl = gifUrl;
      if (cleanGifUrl.startsWith('//')) {
        cleanGifUrl = 'https:' + cleanGifUrl;
      } else if (!cleanGifUrl.startsWith('http')) {
        cleanGifUrl = 'https://' + cleanGifUrl;
      }
      
      if (!cleanGifUrl.includes('giphy.com') && !cleanGifUrl.includes('.gif') && !cleanGifUrl.includes('.webp')) {
        return (
          <div className="text-white break-words">
            <span className="font-bold text-blue-300">{msg.username}:</span>{" "}
            <span className="text-red-300 italic">URL de GIF invalide</span>
          </div>
        );
      }
      
      console.log('Affichage GIF:', cleanGifUrl, gifTitle);
      
      return (
        <div className="text-white break-words">
          <span className="font-bold text-blue-300">{msg.username}:</span>
          <div className="mt-1">
            <img
              src={cleanGifUrl}
              alt={gifTitle}
              className={`rounded-lg border border-white/20 ${
                isMobile ? 'max-w-[120px] max-h-[90px]' : 'max-w-[200px] max-h-[150px]'
              }`}
              loading="lazy"
              onLoad={() => console.log('GIF chargé avec succès:', cleanGifUrl)}
              onError={(e) => {
                console.log('Erreur de chargement GIF:', cleanGifUrl);
                console.log('Erreur détaillée:', e);
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `<span class="text-red-300 italic">❌ GIF non disponible: ${gifTitle}</span>`;
              }}
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-white break-words">
        <span className="font-bold text-blue-300">{msg.username}:</span>{" "}
        <span className="text-gray-200">{msg.message}</span>
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="flex flex-col">
        {/* En-tête du chat mobile avec bouton d'expansion */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-purple-300">Chat</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all"
          >
            <svg 
              className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Messages complets (collapsibles sur mobile) */}
        {isExpanded && (
          <div 
            ref={messagesContainerRef}
            className="max-h-32 overflow-y-auto mb-2 p-2 bg-black/20 rounded-lg border border-white/10"
          >
            {messages.slice(-5).map((msg, i) => (
              <div key={i} className="mb-1 text-sm">
                {renderMessage(msg)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Formulaire de chat compact (seulement quand étendu) */}
        {isExpanded && (
          <form
            onSubmit={e => {
              e.preventDefault();
              if (input.trim() && input.length <= MAX_CHARS) {
                onSend(input);
                setInput("");
              }
            }}
            className="flex gap-2"
          >
            <input
              className="flex-1 border border-white/20 bg-white/10 backdrop-blur rounded-lg p-2 text-white placeholder-gray-300 focus:border-blue-400 focus:outline-none text-sm"
              value={input}
              onChange={e => {
                if (e.target.value.length <= MAX_CHARS) {
                  setInput(e.target.value);
                }
              }}
              placeholder="Message..."
              maxLength={MAX_CHARS}
            />
            <button
              type="button"
              onClick={() => setShowGifPicker(true)}
              className="p-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-400/30 text-purple-300 rounded-lg transition-all duration-200 flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </form>
        )}

        {/* GIF Picker Modal */}
        {showGifPicker && (
          <GifPicker
            onSelectGif={handleGifSelect}
            onClose={() => setShowGifPicker(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-hidden p-4 space-y-2 min-h-0 flex flex-col justify-end"
      >
        {messages.map((msg, i) => (
          <div key={i}>
            {renderMessage(msg)}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          if (input.trim() && input.length <= MAX_CHARS) {
            onSend(input);
            setInput("");
          }
        }}
        className="mt-4"
      >
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              className="w-full border-2 border-white/20 bg-white/10 backdrop-blur rounded-xl p-3 pr-16 text-white placeholder-gray-300 focus:border-blue-400 focus:outline-none"
              value={input}
              onChange={e => {
                if (e.target.value.length <= MAX_CHARS) {
                  setInput(e.target.value);
                }
              }}
              placeholder="Tapez votre message..."
              maxLength={MAX_CHARS}
            />
            <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium pointer-events-none ${
              input.length > MAX_CHARS * 0.9 
                ? input.length === MAX_CHARS 
                  ? 'text-red-400' 
                  : 'text-yellow-400'
                : 'text-gray-400'
            }`}>
              {input.length}/{MAX_CHARS}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGifPicker(true)}
            className="px-3 py-3 bg-purple-600/20 hover:bg-purple-600/40 border-2 border-purple-400/30 hover:border-purple-400/60 text-purple-300 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0"
            title="Ajouter un GIF"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="ml-1 text-xs font-medium hidden sm:inline">GIF</span>
          </button>
        </div>
      </form>

      {/* GIF Picker Modal */}
      {showGifPicker && (
        <GifPicker
          onSelectGif={handleGifSelect}
          onClose={() => setShowGifPicker(false)}
        />
      )}
    </div>
  );
}
