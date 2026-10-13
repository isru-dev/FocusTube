import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { supabase } from "../../lib/supabaseClient";
import {
  NOTE_COLUMNS,
  type NotePatch,
  type StudyNote,
  type VideoRef,
} from "./Types";

export function useStudyNotes() {
  const [userId, setUserId] = useState("");
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          toast.error("Please sign in to use Study Notes.");
          return;
        }

        const { data, error } = await supabase
          .from("video_notes")
          .select(NOTE_COLUMNS)
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (active) {
          setUserId(user.id);
          setNotes((data ?? []) as StudyNote[]);
        }
      } catch (error) {
        console.error("Failed to load notes:", error);
        toast.error(
          error instanceof Error
            ? `Could not load notes: ${error.message}`
            : "Could not load notes.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const createNote = useCallback(
    async (video: VideoRef | null): Promise<StudyNote | null> => {
      if (!userId) {
        toast.error("Please sign in to create notes.");
        return null;
      }

      try {
        const { data, error } = await supabase
          .from("video_notes")
          .insert({
            user_id: userId,
            video_id: video?.id ?? null,
            video_title: video?.title ?? null,
            video_url: video
              ? `https://www.youtube.com/watch?v=${video.id}`
              : null,
            title: "Untitled",
            content: "",
            content_json: null,
          })
          .select(NOTE_COLUMNS)
          .single();

        if (error) throw error;

        const created = data as StudyNote;
        setNotes((current) => [...current, created]);
        return created;
      } catch (error) {
        console.error("Failed to create note:", error);
        toast.error(
          error instanceof Error
            ? `Could not create note: ${error.message}`
            : "Could not create note.",
        );
        return null;
      }
    },
    [userId],
  );

  // Only the editor-owned fields are sent, so saving never touches the
  // note's video link.
  const updateNote = useCallback(
    async (id: string, patch: NotePatch): Promise<boolean> => {
      const updatedAt = new Date().toISOString();

      const { error } = await supabase
        .from("video_notes")
        .update({ ...patch, updated_at: updatedAt })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to save note:", error);
        toast.error(`Could not save note: ${error.message}`);
        return false;
      }

      setNotes((current) =>
        current.map((note) =>
          note.id === id ? { ...note, ...patch, updated_at: updatedAt } : note,
        ),
      );
      return true;
    },
    [userId],
  );

  const deleteNote = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase
        .from("video_notes")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to delete note:", error);
        toast.error(`Could not delete note: ${error.message}`);
        return false;
      }

      setNotes((current) => current.filter((note) => note.id !== id));
      return true;
    },
    [userId],
  );

  return { userId, notes, loading, createNote, updateNote, deleteNote };
}