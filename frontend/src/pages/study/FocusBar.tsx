import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Flame,
  Pause,
  Play,
  Plus,
  SkipForward,
  Target,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import {
  addFocusSeconds,
  formatMinutes,
  readStreak,
  readTodaySeconds,
} from "./focusStats";
import { formatTime, inputClass, secondaryClass, type YouTubePlayer } from "./Types";

type Phase = "focus" | "short" | "long";

const PRESETS = [15, 25, 45, 60];
const SHORT_BREAK_MIN = 5;
const LONG_BREAK_MIN = 15;
const ROUNDS_PER_CYCLE = 4;

const LABEL: Record<Phase, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

// A short beep, made with the browser's audio API so no sound file is needed.
function chime() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
    osc.onended = () => void ctx.close();
  } catch {
    // Browsers may block audio; the toast still tells you.
  }
}

interface Props {
  player: YouTubePlayer | null;
  onExit: () => void;
}

// Pomodoro-style study session: focus rounds, automatic breaks, a longer
// break every fourth round. Time is measured against wall-clock end times, so
// it stays accurate even when the browser throttles a background tab.
export function FocusBar({ player, onExit }: Props) {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [phase, setPhase] = useState<Phase>("focus");
  const [total, setTotal] = useState(25 * 60_000);
  const [remaining, setRemaining] = useState(25 * 60_000);
  const [running, setRunning] = useState(true);
  const [rounds, setRounds] = useState(0);
  const [goal, setGoal] = useState("");
  const [sound, setSound] = useState(true);
  const [todaySeconds, setTodaySeconds] = useState(readTodaySeconds);
  const [streak, setStreak] = useState(readStreak);

  // Mutable copies so timer callbacks never read stale state.
  const phaseRef = useRef<Phase>("focus");
  const totalRef = useRef(25 * 60_000);
  const remainingRef = useRef(25 * 60_000);
  const runningRef = useRef(true);
  const endsAt = useRef(0);
  const creditedRef = useRef(0);
  const sessionMsRef = useRef(0);
  const roundsRef = useRef(0);
  const focusMinutesRef = useRef(25);
  const soundRef = useRef(true);
  const playerRef = useRef(player);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  const setLeft = useCallback((ms: number) => {
    remainingRef.current = ms;
    setRemaining(ms);
  }, []);

  const setRun = useCallback((value: boolean) => {
    runningRef.current = value;
    setRunning(value);
  }, []);

  // How much of the current phase has been used.
  const elapsedMs = useCallback(() => {
    const left = runningRef.current
      ? Math.max(0, endsAt.current - Date.now())
      : remainingRef.current;

    return totalRef.current - left;
  }, []);

  // Adds the not-yet-counted part of a focus phase to today's total.
  const creditFocus = useCallback((usedMs: number) => {
    if (phaseRef.current !== "focus") return;

    const delta = Math.max(0, usedMs - creditedRef.current);
    creditedRef.current += delta;
    sessionMsRef.current += delta;

    if (delta >= 1000) {
      setTodaySeconds(addFocusSeconds(delta / 1000));
      setStreak(readStreak());
    }
  }, []);

  const beginPhase = useCallback(
    (next: Phase, ms: number, run: boolean) => {
      phaseRef.current = next;
      totalRef.current = ms;
      creditedRef.current = 0;
      endsAt.current = Date.now() + ms;

      setPhase(next);
      setTotal(ms);
      setLeft(ms);
      setRun(run);
    },
    [setLeft, setRun],
  );

  const finishPhase = useCallback(() => {
    if (phaseRef.current === "focus") {
      creditFocus(totalRef.current);

      roundsRef.current += 1;
      setRounds(roundsRef.current);

      const isLong = roundsRef.current % ROUNDS_PER_CYCLE === 0;

      try {
        playerRef.current?.pauseVideo();
      } catch {
        // The player may be gone; the break still starts.
      }

      if (soundRef.current) chime();
      toast.success(
        isLong
          ? "Round complete. Time for a long break."
          : "Round complete. Time for a short break.",
      );

      beginPhase(
        isLong ? "long" : "short",
        (isLong ? LONG_BREAK_MIN : SHORT_BREAK_MIN) * 60_000,
        true,
      );
    } else {
      if (soundRef.current) chime();
      toast("Break over. Start the next round when you're ready.");

      // The next focus round waits for you to press Start.
      beginPhase("focus", focusMinutesRef.current * 60_000, false);
    }
  }, [beginPhase, creditFocus]);

  // The first focus round starts as soon as Focus mode opens.
  useEffect(() => {
    beginPhase("focus", 25 * 60_000, true);
  }, [beginPhase]);

  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      const left = Math.max(0, endsAt.current - Date.now());
      setLeft(left);

      if (left === 0) finishPhase();
    }, 500);

    return () => clearInterval(id);
  }, [running, finishPhase, setLeft]);

  // Count what you studied even if you navigate away without pressing Exit.
  useEffect(() => {
    return () => creditFocus(elapsedMs());
  }, [creditFocus, elapsedMs]);

  // Show the countdown in the browser tab, so you can see it from other tabs.
  useEffect(() => {
    const original = document.title;
    return () => {
      document.title = original;
    };
  }, []);

  useEffect(() => {
    document.title = `${formatTime(Math.ceil(remaining / 1000))} · ${LABEL[phase]}`;
  }, [remaining, phase]);

  function pause() {
    setLeft(Math.max(0, endsAt.current - Date.now()));
    setRun(false);
  }

  function resume() {
    endsAt.current = Date.now() + remainingRef.current;
    setRun(true);
  }

  function addFiveMinutes() {
    const extra = 5 * 60_000;

    totalRef.current += extra;
    setTotal(totalRef.current);

    if (runningRef.current) endsAt.current += extra;
    setLeft(
      runningRef.current
        ? Math.max(0, endsAt.current - Date.now())
        : remainingRef.current + extra,
    );
  }

  function changeFocusLength(minutes: number) {
    creditFocus(elapsedMs());

    focusMinutesRef.current = minutes;
    setFocusMinutes(minutes);

    if (phaseRef.current === "focus") {
      beginPhase("focus", minutes * 60_000, true);
    }
  }

  function skipBreak() {
    beginPhase("focus", focusMinutesRef.current * 60_000, true);
  }

  function exit() {
    creditFocus(elapsedMs());

    const seconds = Math.round(sessionMsRef.current / 1000);
    if (seconds >= 60) {
      toast(
        `You focused for ${formatMinutes(seconds)}` +
          (roundsRef.current > 0
            ? ` over ${roundsRef.current} round${roundsRef.current === 1 ? "" : "s"}.`
            : ".") +
          " Nice work!",
      );
    }

    onExit();
  }

  const isBreak = phase !== "focus";
  const fresh = remaining === total;
  const cycleDots =
    phase === "long" ? ROUNDS_PER_CYCLE : rounds % ROUNDS_PER_CYCLE;

  return (
    <section
      aria-label="Focus session"
      className={`sticky top-0 z-20 mb-5 space-y-3 rounded-2xl border bg-zinc-900/95 px-4 py-3 backdrop-blur ${
        isBreak ? "border-emerald-500/40" : "border-sky-500/30"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={`flex items-center gap-2 ${
            isBreak ? "text-emerald-300" : "text-sky-300"
          }`}
        >
          <Target size={18} />
          <span className="text-sm font-semibold">{LABEL[phase]}</span>
        </div>

        <div
          className="flex gap-1"
          role="img"
          aria-label={`${cycleDots} of ${ROUNDS_PER_CYCLE} rounds done`}
        >
          {Array.from({ length: ROUNDS_PER_CYCLE }, (_, index) => (
            <span
              key={index}
              className={`h-2 w-2 rounded-full ${
                index < cycleDots ? "bg-sky-400" : "bg-zinc-700"
              }`}
            />
          ))}
        </div>

        <span className="font-mono text-2xl font-bold tabular-nums text-zinc-100">
          {formatTime(Math.ceil(remaining / 1000))}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {running ? (
            <button
              type="button"
              onClick={pause}
              className={`${secondaryClass} !px-2.5 !py-1.5`}
            >
              <Pause size={14} /> Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={resume}
              className={`${secondaryClass} !px-2.5 !py-1.5`}
            >
              <Play size={14} /> {fresh ? "Start" : "Resume"}
            </button>
          )}

          {isBreak ? (
            <button
              type="button"
              onClick={skipBreak}
              className={`${secondaryClass} !px-2.5 !py-1.5`}
            >
              <SkipForward size={14} /> Skip break
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={addFiveMinutes}
                className={`${secondaryClass} !px-2.5 !py-1.5`}
              >
                <Plus size={14} /> 5 min
              </button>

              <select
                value={focusMinutes}
                onChange={(event) =>
                  changeFocusLength(Number(event.target.value))
                }
                aria-label="Focus round length"
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200"
              >
                {PRESETS.map((value) => (
                  <option key={value} value={value}>
                    {value} min
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={exit}
          className={`${secondaryClass} ml-auto !px-3 !py-1.5`}
        >
          <X size={14} /> Exit focus
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          maxLength={80}
          placeholder="What will you finish this session?"
          aria-label="Session goal"
          className={`${inputClass} min-w-0 flex-1 !py-1.5`}
        />

        <span className="text-xs text-zinc-400">
          Today: {formatMinutes(todaySeconds)}
        </span>

        {streak > 0 && (
          <span className="flex items-center gap-1 text-xs text-amber-300">
            <Flame size={13} /> {streak}-day streak
          </span>
        )}

        <button
          type="button"
          onClick={() => setSound((value) => !value)}
          aria-pressed={sound}
          title={sound ? "Mute the chime" : "Unmute the chime"}
          className="rounded-lg p-1.5 text-zinc-400 hover:text-sky-300"
        >
          {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </section>
  );
}
