"use client";

import { useEffect, useRef, useState } from "react";

const FALLBACK_SECONDS = 90;
const STORAGE_KEY = "restTimerDefaultSeconds";
const PRESETS = [30, 60, 90, 120, 150, 180];

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// A single shared rest timer for the whole workout — resets every time
// `resetSignal` changes (bump it whenever any set is logged).
export default function RestTimer({ resetSignal }: { resetSignal: number }) {
  const [defaultSeconds, setDefaultSeconds] = useState(FALLBACK_SECONDS);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setDefaultSeconds(Number(stored));
    } catch {}
  }, []);

  function chooseDefault(seconds: number) {
    setDefaultSeconds(seconds);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(seconds));
    } catch {}
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSecondsLeft(defaultSeconds);
    setRunning(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [running, secondsLeft]);

  function presetRow(onPick: (seconds: number) => void) {
    return (
      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto border-t border-violet/20 pt-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium active:scale-95 ${
              p === defaultSeconds ? "bg-violet text-violet-on" : "bg-surface text-text-muted"
            }`}
          >
            {formatTime(p)}
          </button>
        ))}
      </div>
    );
  }

  if (secondsLeft <= 0) {
    return (
      <div className="rounded-2xl border border-violet/20 bg-violet-soft/60 px-4 py-3">
        <span className="text-sm font-medium text-violet-strong/80">Descanso por defecto</span>
        {presetRow(chooseDefault)}
      </div>
    );
  }

  return (
    <div className="sticky top-2 z-10 rounded-2xl border border-violet/30 bg-violet-soft px-4 py-3.5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold tabular-nums text-violet-strong">{formatTime(secondsLeft)}</span>
        <span className="text-sm text-violet-strong/80">Descanso</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="rounded-lg bg-surface px-2.5 py-1.5 text-xs font-medium text-text-muted active:scale-95"
          >
            {running ? "Pausar" : "Seguir"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSecondsLeft(0);
              setRunning(false);
            }}
            className="rounded-lg bg-surface px-2.5 py-1.5 text-xs font-medium text-text-muted active:scale-95"
          >
            Saltar
          </button>
        </div>
      </div>
    </div>
  );
}
