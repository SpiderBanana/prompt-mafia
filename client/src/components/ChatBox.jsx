import React, { useState } from "react";

export default function ChatBox({ messages, onSend }) {
  const [input, setInput] = useState("");
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="text-white">
            <span className="font-bold text-white">{msg.username}:</span>{" "}
            <span className="text-white">{msg.message}</span>
          </div>
        ))}
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
