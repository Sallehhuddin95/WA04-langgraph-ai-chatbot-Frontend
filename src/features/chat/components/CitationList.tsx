import type { ChatCitation } from "@/features/chat/types/chat";

export interface CitationListProps {
  citations: ChatCitation[];
  turnId: string;
}

function shortId(value: string): string {
  if (value.length <= 8) return value;
  return value.slice(0, 8);
}

export function CitationList({ citations, turnId }: CitationListProps): React.JSX.Element {
  if (citations.length === 0) {
    return (
      <p className="text-[13px] text-slate-500 dark:text-slate-400">
        Sources were not returned for this reply.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-2" aria-label="Sources">
      {citations.map((citation, index) => (
        <li
          key={`${citation.chunk_id}-${index}`}
          id={`cite-${turnId}-${index + 1}`}
          className="rounded-xl border border-slate-200 bg-blue-50 px-3 py-2 text-[13px] scroll-mt-24 dark:border-blue-900 dark:bg-blue-950"
        >
          <span className="font-medium text-blue-700 dark:text-blue-300">
            [{index + 1}]
          </span>{" "}
          <span className="text-slate-900 dark:text-slate-100">{citation.quote}</span>{" "}
          <span className="block text-slate-500 dark:text-slate-400">
            Source {shortId(citation.document_id)}
          </span>
        </li>
      ))}
    </ol>
  );
}
