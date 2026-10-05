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

type WakeLockSentinel = { release: () => Promise<void> };

// A single shared rest timer for the whole workout — resets every time
// `resetSignal` changes (bump it whenever any set is logged).
//
// The countdown is driven off an absolute `endTime` timestamp rather than
// decrementing a counter every tick, so it reads correctly even after the
// tab was backgrounded/throttled for a while (mobile browsers suspend
// setInterval but Date.now() keeps ticking). While it's actively running we
// also request a screen Wake Lock so the phone doesn't lock to a black
// screen mid-rest — it's released as soon as the timer is paused, finishes,
// or the component unmounts.
export default function RestTimer({ resetSignal }: { resetSignal: number }) {
  const [defaultSeconds, setDefaultSeconds] = useState(FALLBACK_SECONDS);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const firstRender = useRef(true);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

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
    setEndTime(Date.now() + defaultSeconds * 1000);
    setSecondsLeft(defaultSeconds);
    setRunning(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  // Recompute remaining time from the absolute end timestamp, not from the
  // previous tick — this is what keeps the number correct across a
  // background/throttle gap instead of just freezing or drifting.
  useEffect(() => {
    if (!running || endTime === null) return;

    function tick() {
      const remaining = Math.max(0, Math.round(((endTime as number) - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) setRunning(false);
    }

    tick();
    const id = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [running, endTime]);

  // Keep the screen awake for the duration of the rest countdown so it
  // doesn't lock mid-rest; re-acquire on visibility change since the OS
  // releases the lock automatically when the tab is hidden.
  useEffect(() => {
    const active = running && secondsLeft > 0;
    const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> } };

    async function acquire() {
      if (!active || wakeLockRef.current || !nav.wakeLock) return;
      try {
        wakeLockRef.current = await nav.wakeLock.request("screen");
      } catch {}
    }

    async function release() {
      try {
        await wakeLockRef.current?.release();
      } catch {}
      wakeLockRef.current = null;
    }

    if (active) acquire();
    else release();

    function onVisible() {
      if (document.visibilityState === "visible") acquire();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      release();
    };
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
            onClick={() => {
              if (running) {
                setEndTime(null);
                setRunning(false);
              } else {
                setEndTime(Date.now() + secondsLeft * 1000);
                setRunning(true);
              }
            }}
            className="rounded-lg bg-surface px-2.5 py-1.5 text-xs font-medium text-text-muted active:scale-95"
          >
            {running ? "Pausar" : "Seguir"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEndTime(null);
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
