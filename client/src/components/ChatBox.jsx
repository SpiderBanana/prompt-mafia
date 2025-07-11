import React, { useState } from "react";

export default function ChatBox({ messages, onSend }) {
  const [input, setInput] = useState("");
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2">
        {messages.map((msg, i) => (
          <div key={i} className="mb-1">
            <b>{msg.username}:</b> {msg.message}
          </div>
        ))}
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          onSend(input);
          setInput("");
        }}>
        <input
          className="w-full border rounded p-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Message..."
        />
      </form>
    </div>
  );
}
