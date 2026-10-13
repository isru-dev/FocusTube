import { useCallback, useEffect, useRef, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import {
  createReactInlineContentSpec,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import {
  BlockNoteSchema,
  defaultInlineContentSpecs,
  type PartialBlock,
} from "@blocknote/core";
import { Check, Clock3, LoaderCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import {
  inputClass,
  secondaryClass,
  formatTime,
  type NotePatch,
  type StudyNote,
} from "./Types";

interface Props {
  note: StudyNote;
  deleting: boolean;
  onSave: (id: string, patch: NotePatch) => Promise<boolean>;
  onDelete: () => void;
  getCurrentTime: () => number | null;
  onSeek: (seconds: number) => void;
}

type SaveStatus = "saved" | "unsaved" | "saving";

interface LooseBlock {
  content?: unknown;
  children?: LooseBlock[];
}

interface LooseInline {
  type?: string;
  text?: string;
  content?: unknown;
  props?: { seconds?: number };
}

const timestampChip = createReactInlineContentSpec(
  {
    type: "timestamp",
    propSchema: { seconds: { default: 0, type: "number" } },
    content: "none",
  },
  {
    render: ({ inlineContent }) => {
      const seconds = inlineContent.props.seconds;
      return (
        <button
          type="button"
          contentEditable={false}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            window.dispatchEvent(
              new CustomEvent("focustube:seek", { detail: seconds }),
            );
          }}
          className="mx-0.5 inline-flex rounded-md bg-sky-500/15 px-1.5 py-0.5 font-mono text-sm font-semibold text-sky-300 hover:bg-sky-500/25"
        >
          [{formatTime(seconds)}]
        </button>
      );
    },
  },
);

const editorSchema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    timestamp: timestampChip,
  },
});

function inlineToText(content: unknown): string {
  if (!Array.isArray(content)) return "";

  return (content as LooseInline[])
    .map((item) =>
      item.type === "timestamp"
        ? `[${formatTime(item.props?.seconds ?? 0)}]`
        : item.text ?? inlineToText(item.content),
    )
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

export function NoteEditor({
  note,
  deleting,
  onSave,
  onDelete,
  getCurrentTime,
  onSeek,
}: Props) {
  const [title, setTitle] = useState(note.title);
  const [status, setStatus] = useState<SaveStatus>("saved");

  const editor = useCreateBlockNote({
    schema: editorSchema,
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

  useEffect(() => {
    function handleSeek(event: Event) {
      const seconds = (event as CustomEvent<number>).detail;
      if (typeof seconds === "number") onSeek(seconds);
    }

    window.addEventListener("focustube:seek", handleSeek);
    return () => window.removeEventListener("focustube:seek", handleSeek);
  }, [onSeek]);

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

  const insertTimestamp = useCallback(() => {
    const seconds = getCurrentTime();
    if (seconds === null) return;
    editor.insertInlineContent([{ type: "timestamp", props: { seconds } }]);
    scheduleSave();
    toast.success(`Timestamp [${formatTime(seconds)}] inserted. Click it to jump.`);
  }, [editor, getCurrentTime, scheduleSave]);

  const getSlashMenuItems = useCallback(
    async (query: string) => {
      const timestampItem = {
        key: "heading" as const,
        title: "Timestamp",
        subtext: "Insert the current video time",
        aliases: ["time", "timestamp"],
        group: "Video",
        icon: <Clock3 size={18} />,
        onItemClick: insertTimestamp,
      };
      const items = [...getDefaultReactSlashMenuItems(editor), timestampItem];
      const normalizedQuery = query.toLowerCase();

      return items.filter((item) =>
        [item.title, ...(item.aliases ?? [])].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        ),
      );
    },
    [editor, insertTimestamp],
  );

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
          onClick={insertTimestamp}
          className={secondaryClass}
          title="Insert the video's current time into your note"
        >
          <Clock3 size={15} />
          Add video time
        </button>

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
          >
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={getSlashMenuItems}
            />
          </BlockNoteView>
        </div>

        <p className="text-xs text-zinc-600">
          Type “/” for headings, lists, to-dos and code. Changes save
          automatically.
        </p>
      </div>
    </section>
  );
}
