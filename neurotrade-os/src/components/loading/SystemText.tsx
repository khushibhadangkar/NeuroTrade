"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  text: string;
  delay: number;
}

interface SystemTextProps {
  messages: Message[];
  phase: "loading" | "complete" | "exit";
}

/**
 * Typewriter-style system initialization messages.
 * Each message appears after its delay, types character by character,
 * then fades to make room for the next.
 */
export function SystemText({ messages, phase }: SystemTextProps) {
  const [activeIdx, setActiveIdx] = useState(-1);
  const [displayText, setDisplayText] = useState("");
  const [cursor, setCursor] = useState(true);

  // Trigger messages based on their delays
  useEffect(() => {
    const timers = messages.map((msg, i) =>
      setTimeout(() => setActiveIdx(i), msg.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [messages]);

  // Typewriter effect
  useEffect(() => {
    if (activeIdx < 0 || activeIdx >= messages.length) return;

    const fullText = messages[activeIdx].text;
    let charIdx = 0;
    setDisplayText("");

    const interval = setInterval(() => {
      charIdx++;
      setDisplayText(fullText.slice(0, charIdx));
      if (charIdx >= fullText.length) clearInterval(interval);
    }, 30);

    return () => clearInterval(interval);
  }, [activeIdx, messages]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setCursor((c) => !c), 500);
    return () => clearInterval(interval);
  }, []);

  const isComplete = phase === "complete";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Current message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-1"
        >
          <span
            className={`font-mono text-xs tracking-[0.15em] sm:text-sm ${
              isComplete ? "text-accent-mint" : "text-accent-amber"
            }`}
          >
            {isComplete ? "✓ " : "> "}
            {displayText}
          </span>
          {!isComplete && (
            <span
              className={`inline-block h-4 w-0.5 bg-accent-amber transition-opacity ${
                cursor ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Previous messages (faded) */}
      <div className="flex flex-col items-center gap-0.5">
        {messages.slice(0, Math.max(0, activeIdx)).map((msg, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="font-mono text-[10px] tracking-wider text-muted"
          >
            ✓ {msg.text}
          </motion.span>
        ))}
      </div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="text-[10px] uppercase tracking-[0.25em] text-muted"
      >
        {isComplete ? "Initialization complete" : "Neural engine v1.0.0"}
      </motion.p>
    </div>
  );
}
