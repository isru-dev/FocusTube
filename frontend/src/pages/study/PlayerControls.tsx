import { useCallback, useEffect, useState } from "react";
import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";

import { formatTime, secondaryClass, type YouTubePlayer } from "./Types";

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
const SPEED_KEY = "focustube:speed";
const SKIP_SECONDS = 5;

function readSpeed(): number {
  try {
    const value = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(value) ? value : 1;
  } catch {
    return 1;
  }
}

interface Props {
  player: YouTubePlayer | null;
  resumedFrom: number;
}

export function PlayerControls({ player, resumedFrom }: Props) {
  const [speed, setSpeed] = useState(readSpeed);

  // Apply the remembered speed whenever a (new) player is ready.
  useEffect(() => {
    if (!player) return;

    try {
      player.setPlaybackRate(speed);
    } catch (error) {
      console.error("Could not set playback speed:", error);
    }
  }, [player, speed]);

  const skip = useCallback(
    (delta: number) => {
      if (!player) return;
      player.seekTo(Math.max(0, player.getCurrentTime() + delta), true);
    },
    [player],
  );

  const togglePlay = useCallback(() => {
    if (!player) return;

    if (player.getPlayerState() === 1) player.pauseVideo();
    else player.playVideo();
  }, [player]);

  // Alt+J / Alt+K / Alt+L work even while you are typing in the editor.
  // `code` is used (not `key`) so they also work with the Mac Option key.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!event.altKey || event.ctrlKey || event.metaKey) return;

      if (event.code === "KeyJ") {
        event.preventDefault();
        skip(-SKIP_SECONDS);
      } else if (event.code === "KeyL") {
        event.preventDefault();
        skip(SKIP_SECONDS);
      } else if (event.code === "KeyK") {
        event.preventDefault();
        togglePlay();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [skip, togglePlay]);

  function changeSpeed(value: number) {
    setSpeed(value);

    try {
      localStorage.setItem(SPEED_KEY, String(value));
    } catch {
      // ignore
    }
  }

  return (
    <div className="border-t border-zinc-800 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => skip(-SKIP_SECONDS)}
          disabled={!player}
          title={`Back ${SKIP_SECONDS}s (Alt+J)`}
          className={`${secondaryClass} !px-2.5 !py-1.5`}
        >
          <RotateCcw size={14} /> {SKIP_SECONDS}s
        </button>

        <button
          type="button"
          onClick={togglePlay}
          disabled={!player}
          title="Play / pause (Alt+K)"
          className={`${secondaryClass} !px-2.5 !py-1.5`}
        >
          <Play size={14} />
          <Pause size={14} />
        </button>

        <button
          type="button"
          onClick={() => skip(SKIP_SECONDS)}
          disabled={!player}
          title={`Forward ${SKIP_SECONDS}s (Alt+L)`}
          className={`${secondaryClass} !px-2.5 !py-1.5`}
        >
          {SKIP_SECONDS}s <RotateCw size={14} />
        </button>

        <label className="ml-0 flex items-center gap-2 text-xs text-zinc-400 sm:ml-auto">
          Speed
          <select
            value={speed}
            onChange={(event) => changeSpeed(Number(event.target.value))}
            disabled={!player}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200"
          >
            {SPEEDS.map((value) => (
              <option key={value} value={value}>
                {value}x
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-2 text-[11px] text-zinc-600">
        Alt+T adds a timestamp to your note · Alt+J / K / L = back, play-pause,
        forward
        {resumedFrom > 0 && player && (
          <>
            {" "}
            · Resumed at {formatTime(resumedFrom)} ·{" "}
            <button
              type="button"
              onClick={() => player.seekTo(0, true)}
              className="text-sky-400 underline"
            >
              Start over
            </button>
          </>
        )}
      </p>
    </div>
  );
}
