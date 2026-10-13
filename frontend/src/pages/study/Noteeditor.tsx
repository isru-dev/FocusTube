import { useCallback, useEffect, useRef, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { filterSuggestionItems } from "@blocknote/core/extensions";
import toast from "react-hot-toast";
import { Check, Clock3, LoaderCircle, Trash2 } from "lucide-react";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { studySchema, type StudyPartialBlock } from "./schema";
import {
  formatTime,
  inputClass,
  primaryClass,
  secondaryClass,
  type NotePatch,
  type StudyNote,
  type YouTubePlayer,
} from "./Types";

interface Props {
  note: StudyNote;
  player: YouTubePlayer | null;
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
  type?: string;
  text?: string;
  props?: { seconds?: number };
  content?: unknown;
}

function inlineToText(content: unknown): string {
  if (!Array.isArray(content)) return "";

  return (content as LooseInline[])
    .map((item) => {
      // Timestamp chips become "[02:35]" so they stay searchable.
      if (item.type === "timestamp") {
        return `[${formatTime(item.props?.seconds ?? 0)}]`;
      }

      return item.text ?? inlineToText(item.content);
    })
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

function getInitialContent(note: StudyNote): StudyPartialBlock[] | undefined {
  if (Array.isArray(note.content_json) && note.content_json.length > 0) {
    return note.content_json as StudyPartialBlock[];
  }

  // Notes written before the block editor existed only have plain text.
  if (note.content.trim()) {
    return note.content
      .split("\n")
      .map((line): StudyPartialBlock => ({ type: "paragraph", content: line }));
  }

  return undefined;
}

export function NoteEditor({ note, player, deleting, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(note.title);
  const [status, setStatus] = useState<SaveStatus>("saved");

  const editor = useCreateBlockNote({
    schema: studySchema,
    initialContent: getInitialContent(note),
  });

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

  // Drops a clickable timestamp chip for the video's current time at the
  // cursor. Used by the button, the "/" menu and the Alt+T shortcut.
  const insertTimestamp = useCallback(() => {
    if (!player) {
      toast.error("This page has no video player to take a time from.");
      return;
    }

    const seconds = Math.floor(player.getCurrentTime());

    editor.insertInlineContent([{ type: "timestamp", props: { seconds } }, " "]);
    editor.focus();
  }, [editor, player]);

  const insertRef = useRef(insertTimestamp);

  useEffect(() => {
    insertRef.current = insertTimestamp;
  }, [insertTimestamp]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.code === "KeyT"
      ) {
        event.preventDefault();
        insertRef.current();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={insertTimestamp}
            disabled={!player}
            title="Insert the current video time (Alt+T)"
            className={`${primaryClass} !px-3 !py-2`}
          >
            <Clock3 size={15} />
            Insert time
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className={`${secondaryClass} !py-2`}
          >
            <Trash2 size={15} />
            {deleting ? "Deleting…" : "Delete page"}
          </button>
        </div>
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
            slashMenu={false}
          >
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={async (query) =>
                filterSuggestionItems(
                  [
                    ...(player
                      ? [
                          {
                            title: "Timestamp",
                            subtext: "Insert the video's current time",
                            aliases: ["time", "timestamp", "now", "clock"],
                            group: "Study",
                            icon: <Clock3 size={18} />,
                            onItemClick: insertTimestamp,
                          },
                        ]
                      : []),
                    ...getDefaultReactSlashMenuItems(editor),
                  ],
                  query,
                )
              }
            />
          </BlockNoteView>
        </div>

        <p className="text-xs text-zinc-600">
          Type “/” for headings, lists, to-dos and code, or “/time” to drop in
          the current video time. Changes save automatically.
        </p>
      </div>
    </section>
  );
}
