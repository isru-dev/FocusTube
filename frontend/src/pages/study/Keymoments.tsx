import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Clock3, LoaderCircle, Trash2 } from "lucide-react";

import { supabase } from "../../lib/supabaseClient";
import {
  formatTime,
  inputClass,
  primaryClass,
  type NoteTimestamp,
  type YouTubePlayer,
} from "./Types";

interface Props {
  noteId: string;
  userId: string;
  player: YouTubePlayer | null;
  onSeek: (seconds: number) => void;
}

export function KeyMoments({ noteId, userId, player, onSeek }: Props) {
  const [timestamps, setTimestamps] = useState<NoteTimestamp[]>([]);
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from("note_timestamps")
        .select("id, note_id, seconds, label")
        .eq("note_id", noteId)
        .eq("user_id", userId)
        .order("seconds", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Failed to load timestamps:", error);
        toast.error("Could not load timestamps.");
        setTimestamps([]);
        return;
      }

      setTimestamps((data ?? []) as NoteTimestamp[]);
    }

    setTimestamps([]);
    void load();

    return () => {
      active = false;
    };
  }, [noteId, userId]);

  async function addTimestamp() {
    if (!player) {
      toast.error("Wait for the video player to load.");
      return;
    }

    setAdding(true);

    try {
      const seconds = Math.floor(player.getCurrentTime());

      const { data, error } = await supabase
        .from("note_timestamps")
        .insert({
          note_id: noteId,
          user_id: userId,
          seconds,
          label: label.trim(),
        })
        .select("id, note_id, seconds, label")
        .single();

      if (error) throw error;

      setTimestamps((current) =>
        [...current, data as NoteTimestamp].sort((a, b) => a.seconds - b.seconds),
      );
      setLabel("");
      toast.success(`Timestamp ${formatTime(seconds)} added.`);
    } catch (error) {
      console.error("Failed to add timestamp:", error);
      toast.error(
        error instanceof Error
          ? `Could not add timestamp: ${error.message}`
          : "Could not add timestamp.",
      );
    } finally {
      setAdding(false);
    }
  }

  async function deleteTimestamp(id: string) {
    const { error } = await supabase
      .from("note_timestamps")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to delete timestamp:", error);
      toast.error("Could not delete timestamp.");
      return;
    }

    setTimestamps((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock3 size={18} className="text-violet-300" />
          <h2 className="font-semibold">Key moments</h2>
        </div>
        <span className="text-xs text-zinc-500">{timestamps.length} saved</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void addTimestamp();
            }
          }}
          placeholder="Label this moment (optional)"
          maxLength={200}
          className={`${inputClass} min-w-0 flex-1`}
        />

        <button
          type="button"
          onClick={() => void addTimestamp()}
          disabled={!player || adding}
          className={primaryClass}
        >
          {adding ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Clock3 size={16} />
          )}
          Add current time
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {timestamps.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
          >
            <button
              type="button"
              onClick={() => onSeek(item.seconds)}
              className="rounded-lg bg-sky-500/10 px-3 py-2 font-mono text-sm font-bold text-sky-300"
            >
              {formatTime(item.seconds)}
            </button>

            <span className="min-w-0 flex-1 break-words text-sm text-zinc-300">
              {item.label || "Important moment"}
            </span>

            <button
              type="button"
              onClick={() => void deleteTimestamp(item.id)}
              className="rounded-lg p-2 text-zinc-500 hover:text-red-300"
              aria-label="Delete timestamp"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>

      {timestamps.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-700 p-4 text-center text-sm text-zinc-500">
          Add a timestamp while watching to save an important moment.
        </p>
      )}
    </section>
  );
}
