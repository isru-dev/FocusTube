import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FilePlus2, FileText, Plus, Search } from "lucide-react";

import {
  inputClass,
  primaryClass,
  type StudyNote,
  type VideoRef,
} from "./Types";

interface Props {
  notes: StudyNote[];
  activeNoteId: string;
  creating: boolean;
  onSelect: (note: StudyNote) => void;
  onCreate: (video: VideoRef | null) => void;
}

interface Group {
  key: string;
  video: VideoRef | null;
  title: string;
  notes: StudyNote[];
  newest: number;
}

export function StudySidebar({
  notes,
  activeNoteId,
  creating,
  onSelect,
  onCreate,
}: Props) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const searching = search.trim().length > 0;

  const groups = useMemo<Group[]>(() => {
    const term = search.trim().toLowerCase();
    const visible = term
      ? notes.filter((note) =>
          `${note.title} ${note.content} ${note.video_title ?? ""}`
            .toLowerCase()
            .includes(term),
        )
      : notes;

    const byVideo = new Map<string, Group>();

    for (const note of visible) {
      const key = note.video_id ?? "personal";
      const created = new Date(note.created_at).getTime();
      const existing = byVideo.get(key);

      if (existing) {
        existing.notes.push(note);
        existing.newest = Math.max(existing.newest, created);
      } else {
        byVideo.set(key, {
          key,
          video: note.video_id
            ? { id: note.video_id, title: note.video_title ?? "Untitled video" }
            : null,
          title: note.video_id
            ? (note.video_title ?? "Untitled video")
            : "Personal notes",
          notes: [note],
          newest: created,
        });
      }
    }

    // Stable order: newest video first, pages in the order they were made.
    return [...byVideo.values()].sort((a, b) => b.newest - a.newest);
  }, [notes, search]);

  function toggleGroup(key: string) {
    setCollapsed((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }

  return (
    <aside className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
      <button
        type="button"
        onClick={() => onCreate(null)}
        disabled={creating}
        className={`${primaryClass} w-full`}
      >
        <FilePlus2 size={16} />
        {creating ? "Creating…" : "New personal note"}
      </button>

      <div className="relative my-3">
        <Search size={15} className="absolute left-3 top-3 text-zinc-500" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search your notes"
          className={`${inputClass} pl-9`}
        />
      </div>

      <div className="max-h-[50vh] space-y-3 overflow-y-auto lg:max-h-[calc(100vh-240px)]">
        {groups.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-zinc-500">
            {searching
              ? "No notes match your search."
              : "No notes yet. Open a video from your feed to start."}
          </p>
        ) : (
          groups.map((group) => {
            const isOpen = searching || !collapsed.includes(group.key);

            return (
              <div key={group.key}>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400 hover:bg-zinc-800"
                  >
                    {isOpen ? (
                      <ChevronDown size={14} className="shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="shrink-0" />
                    )}
                    <span className="truncate">{group.title}</span>
                    <span className="ml-auto shrink-0 text-zinc-600">
                      {group.notes.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCreate(group.video)}
                    disabled={creating}
                    aria-label={`Add a page to ${group.title}`}
                    title="Add a page"
                    className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-sky-300 disabled:opacity-50"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {isOpen && (
                  <ul className="mt-1 space-y-0.5">
                    {group.notes.map((note) => {
                      const isActive = note.id === activeNoteId;

                      return (
                        <li key={note.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(note)}
                            className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                              isActive
                                ? "bg-sky-500/10 text-sky-200"
                                : "text-zinc-300 hover:bg-zinc-800"
                            }`}
                          >
                            <FileText
                              size={15}
                              className={`shrink-0 ${
                                isActive ? "text-sky-300" : "text-zinc-500"
                              }`}
                            />
                            <span className="truncate">
                              {note.title || "Untitled"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}