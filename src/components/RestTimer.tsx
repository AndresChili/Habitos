"use client";

import { useEffect, useRef, useState } from "react";

const FALLBACK_SECONDS = 90;
const STORAGE_KEY = "restTimerDefaultSeconds";
const PRESETS = [30, 60, 90, 120, 150, 180];

type PersistedState = { endTime: number } | { pausedSecondsLeft: number };

function stateKey(sessionId: string) {
  return `restTimerState:${sessionId}`;
}

function loadState(sessionId: string): PersistedState | null {
  try {
    const raw = window.localStorage.getItem(stateKey(sessionId));
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

function saveState(sessionId: string, state: PersistedState | null) {
  try {
    if (state === null) window.localStorage.removeItem(stateKey(sessionId));
    else window.localStorage.setItem(stateKey(sessionId), JSON.stringify(state));
  } catch {}
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type WakeLockSentinel = { release: () => Promise<void> };

// Un único temporizador de descanso compartido para todo el entreno — se
// reinicia cada vez que cambia `resetSignal` (se incrementa cada vez que se registra una serie).
//
// La cuenta atrás se calcula a partir de una marca de tiempo absoluta
// `endTime`, en vez de ir decrementando un contador en cada tick, para que
// siga siendo correcta aunque la pestaña haya estado en segundo plano o
// limitada un rato (los navegadores móviles suspenden setInterval, pero
// Date.now() sigue avanzando). Esa misma marca absoluta se persiste en
// localStorage (indexada por sessionId) para que la cuenta atrás sobreviva a
// navegar a otra pantalla de la app y volver — este componente se desmonta
// en cada cambio de ruta, así que sin esta persistencia el temporizador se
// reiniciaría en silencio. Mientras está corriendo también se pide un Wake
// Lock de pantalla para que el móvil no se bloquee a mitad del descanso — se
// libera en cuanto el temporizador se pausa, termina, o el componente se desmonta.

// Lee cualquier cuenta atrás en curso de esta sesión desde localStorage para
// poder restaurar el temporizador en el primer render mediante un
// inicializador diferido de useState (evita un parpadeo de reinicio antes de
// que un efecto lo corrigiera).
function restoreCountdown(sessionId: string): { endTime: number | null; secondsLeft: number; running: boolean } {
  const stored = loadState(sessionId);
  if (!stored) return { endTime: null, secondsLeft: 0, running: false };
  if ("endTime" in stored) {
    const remaining = Math.max(0, Math.round((stored.endTime - Date.now()) / 1000));
    if (remaining > 0) return { endTime: stored.endTime, secondsLeft: remaining, running: true };
    saveState(sessionId, null);
    return { endTime: null, secondsLeft: 0, running: false };
  }
  return { endTime: null, secondsLeft: stored.pausedSecondsLeft, running: false };
}

function readDefaultSeconds(): number {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : FALLBACK_SECONDS;
  } catch {
    return FALLBACK_SECONDS;
  }
}

export default function RestTimer({ sessionId, resetSignal }: { sessionId: string; resetSignal: number }) {
  const [defaultSeconds, setDefaultSeconds] = useState(readDefaultSeconds);
  const [initial] = useState(() => restoreCountdown(sessionId));
  const [endTime, setEndTime] = useState<number | null>(initial.endTime);
  const [secondsLeft, setSecondsLeft] = useState(initial.secondsLeft);
  const [running, setRunning] = useState(initial.running);
  const firstRender = useRef(true);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

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
    const next = Date.now() + defaultSeconds * 1000;
    setEndTime(next);
    setSecondsLeft(defaultSeconds);
    setRunning(true);
    saveState(sessionId, { endTime: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  // Recalcula el tiempo restante a partir de la marca de tiempo absoluta de
  // fin, no del tick anterior — esto es lo que mantiene el número correcto
  // tras un hueco en segundo plano/limitación, en vez de quedarse congelado o desviarse.
  useEffect(() => {
    if (!running || endTime === null) return;

    function tick() {
      const remaining = Math.max(0, Math.round(((endTime as number) - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        setRunning(false);
        saveState(sessionId, null);
      }
    }

    tick();
    const id = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [running, endTime, sessionId]);

  // Mantiene la pantalla encendida mientras dura la cuenta atrás de descanso
  // para que no se bloquee a mitad; se vuelve a pedir en cada cambio de
  // visibilidad porque el sistema operativo libera el lock automáticamente
  // cuando la pestaña se oculta.
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
                saveState(sessionId, { pausedSecondsLeft: secondsLeft });
              } else {
                const next = Date.now() + secondsLeft * 1000;
                setEndTime(next);
                setRunning(true);
                saveState(sessionId, { endTime: next });
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
              saveState(sessionId, null);
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
