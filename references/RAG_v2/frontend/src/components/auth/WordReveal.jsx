import { useEffect, useState } from "react";

function WordReveal({ text, speed = 300 }) {
  const words = text.split(" ");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);

    const interval = setInterval(() => {
      setIndex((prev) => {
        if (prev >= words.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <h1 className="text-4xl font-bold leading-tight">
      {words.map((word, i) => (
        <span
          key={i}
          className={`inline-block mr-2 ${
            i < index
              ? "animate-fadeUp"
              : "invisible"
          }`}
        >
          {word}
        </span>
      ))}
    </h1>
  );
}

export default WordReveal;