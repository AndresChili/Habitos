"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_SECONDS = 90;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// A single shared rest timer for the whole workout — resets every time
// `resetSignal` changes (bump it whenever any set is logged).
export default function RestTimer({ resetSignal }: { resetSignal: number }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSecondsLeft(DEFAULT_SECONDS);
    setRunning(true);
  }, [resetSignal]);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [running, secondsLeft]);

  if (secondsLeft <= 0) return null;

  return (
    <div className="sticky top-2 z-10 flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-2.5 shadow-sm shadow-black/[0.04]">
      <span className="text-sm font-semibold tabular-nums text-accent-strong">{formatTime(secondsLeft)}</span>
      <span className="text-xs text-accent-strong/80">Descanso</span>
      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSecondsLeft((s) => Math.max(0, s - 15))}
          className="rounded-lg bg-surface px-2 py-1 text-xs font-medium text-text-muted active:scale-95"
        >
          -15
        </button>
        <button
          type="button"
          onClick={() => setSecondsLeft((s) => s + 15)}
          className="rounded-lg bg-surface px-2 py-1 text-xs font-medium text-text-muted active:scale-95"
        >
          +15
        </button>
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="rounded-lg bg-surface px-2 py-1 text-xs font-medium text-text-muted active:scale-95"
        >
          {running ? "Pausar" : "Seguir"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSecondsLeft(0);
            setRunning(false);
          }}
          className="rounded-lg bg-surface px-2 py-1 text-xs font-medium text-text-muted active:scale-95"
        >
          Saltar
        </button>
      </div>
    </div>
  );
}
