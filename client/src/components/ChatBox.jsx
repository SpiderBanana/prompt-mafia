import React, { useState, useEffect, useRef } from "react";

export default function ChatBox({ messages, onSend }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const MAX_CHARS = 200; 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-hidden p-4 space-y-2 min-h-0 flex flex-col justify-end"
      >
        {messages.map((msg, i) => (
          <div key={i} className="text-white break-words">
            <span className="font-bold text-blue-300">{msg.username}:</span>{" "}
            <span className="text-gray-200">{msg.message}</span>
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
        <div className="relative">
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
          <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium ${
            input.length > MAX_CHARS * 0.9 
              ? input.length === MAX_CHARS 
                ? 'text-red-400' 
                : 'text-yellow-400'
              : 'text-gray-400'
          }`}>
            {input.length}/{MAX_CHARS}
          </div>
        </div>
      </form>
    </div>
  );
}
