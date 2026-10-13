import { useCallback, useEffect, useRef, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import type { PartialBlock } from "@blocknote/core";
import { Check, LoaderCircle, Trash2 } from "lucide-react";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import {
  inputClass,
  secondaryClass,
  type NotePatch,
  type StudyNote,
} from "./Types ";

interface Props {
  note: StudyNote;
  deleting: boolean;
  onSave: (id: string, patch: NotePatch) => Promise<boolean>;
  onDelete: () => void;
}

type SaveStatus = "saved" | "unsaved" | "saving";

interface LooseBlock {
  content?: unknown;
  children?: LooseBlock[];
}

interface LooseInline {
  text?: string;
  content?: unknown;
}

function inlineToText(content: unknown): string {
  if (!Array.isArray(content)) return "";

  return (content as LooseInline[])
    .map((item) => item.text ?? inlineToText(item.content))
    .join("");
}

// Plain-text copy of the document, so the sidebar search keeps working.
function blocksToText(blocks: LooseBlock[]): string {
  return blocks
    .map((block) =>
      [inlineToText(block.content), blocksToText(block.children ?? [])]
        .filter(Boolean)
        .join("\n"),
    )
    .filter(Boolean)
    .join("\n");
}

function getInitialContent(note: StudyNote): PartialBlock[] | undefined {
  if (Array.isArray(note.content_json) && note.content_json.length > 0) {
    return note.content_json as PartialBlock[];
  }

  // Notes written before the block editor existed only have plain text.
  if (note.content.trim()) {
    return note.content.split("\n").map(
      (line): PartialBlock => ({ type: "paragraph", content: line }),
    );
  }

  return undefined;
}

export function NoteEditor({ note, deleting, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(note.title);
  const [status, setStatus] = useState<SaveStatus>("saved");

  const editor = useCreateBlockNote({ initialContent: getInitialContent(note) });

  const dirty = useRef(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(note.title);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    if (!dirty.current) return;

    dirty.current = false;
    if (mounted.current) setStatus("saving");

    const blocks = editor.document;
    const ok = await onSaveRef.current(note.id, {
      title: titleRef.current.trim() || "Untitled",
      content: blocksToText(blocks as LooseBlock[]),
      content_json: blocks,
    });

    if (!ok) dirty.current = true;
    if (mounted.current) setStatus(ok ? "saved" : "unsaved");
  }, [editor, note.id]);

  const scheduleSave = useCallback(() => {
    dirty.current = true;
    setStatus("unsaved");

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 1000);
  }, [flush]);

  // Switching notes or leaving the page unmounts this component, which
  // saves anything still waiting for the debounce.
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      void flush();
    };
  }, [flush]);

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (dirty.current) event.preventDefault();
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    titleRef.current = value;
    scheduleSave();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          {status === "saving" ? (
            <LoaderCircle size={13} className="animate-spin" />
          ) : (
            <Check
              size={13}
              className={
                status === "saved" ? "text-emerald-400" : "text-zinc-600"
              }
            />
          )}
          {status === "saving"
            ? "Saving…"
            : status === "unsaved"
              ? "Unsaved changes"
              : "Saved"}
        </span>

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className={`${secondaryClass} ml-auto`}
        >
          <Trash2 size={15} />
          {deleting ? "Deleting…" : "Delete page"}
        </button>
      </div>

      <div className="space-y-3 p-4">
        <input
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          maxLength={150}
          placeholder="Untitled"
          className={`${inputClass} border-transparent bg-transparent text-2xl font-bold focus:border-zinc-700`}
        />

        <div className="min-h-[420px] overflow-hidden rounded-xl">
          <BlockNoteView
            editor={editor}
            theme="dark"
            onChange={scheduleSave}
          />
        </div>

        <p className="text-xs text-zinc-600">
          Type “/” for headings, lists, to-dos and code. Changes save
          automatically.
        </p>
      </div>
    </section>
  );
}