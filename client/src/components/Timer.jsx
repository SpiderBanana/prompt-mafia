import React, { useEffect, useState } from "react";
export default function Timer({ duration, onEnd }) {
  const [time, setTime] = useState(duration);
  useEffect(() => {
    if (time === 0) { onEnd(); return; }
    const t = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(t);
  }, [time]);
  return (
    <div className="text-xl font-mono text-center">
      ⏳ {time}s
    </div>
  );
}
