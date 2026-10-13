import { BlockNoteSchema, defaultInlineContentSpecs } from "@blocknote/core";
import { createReactInlineContentSpec } from "@blocknote/react";
import { Clock3 } from "lucide-react";

import { formatTime, SEEK_EVENT } from "./Types";

// A clickable "[02:35]" chip that lives inside the text of a note.
const Timestamp = createReactInlineContentSpec(
  {
    type: "timestamp",
    propSchema: { seconds: { default: 0 } },
    content: "none",
  },
  {
    render: ({ inlineContent }) => {
      const seconds = inlineContent.props.seconds;

      return (
        <button
          type="button"
          title="Jump to this moment"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent<number>(SEEK_EVENT, { detail: seconds }),
            )
          }
          className="mx-0.5 inline-flex cursor-pointer items-center gap-1 rounded-md bg-sky-500/15 px-1.5 py-0.5 align-baseline font-mono text-xs font-semibold text-sky-300 transition hover:bg-sky-500/30"
        >
          <Clock3 size={11} />
          {formatTime(seconds)}
        </button>
      );
    },
  },
);

export const studySchema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    timestamp: Timestamp,
  },
});

export type StudyPartialBlock = (typeof studySchema)["PartialBlock"];
