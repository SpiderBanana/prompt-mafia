import React, { useState, useEffect, useRef } from "react";

export default function ChatBox({ messages, onSend }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

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
        className="flex-1 overflow-y-auto p-4 space-y-2 max-h-96 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
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
          if (input.trim()) {
            onSend(input);
            setInput("");
          }
        }}
        className="mt-4"
      >
        <input
          className="w-full border-2 border-white/20 bg-white/10 backdrop-blur rounded-xl p-3 text-white placeholder-gray-300 focus:border-blue-400 focus:outline-none"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Tapez votre message..."
        />
      </form>
    </div>
  );
}
