"use client";

import * as React from "react";

type InlineNode =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "code"; value: string };

export function parseInline(text: string): InlineNode[] {
  const out: InlineNode[] = [];
  const pattern = /(\*\*.+?\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const start = match.index;
    if (start > last) out.push({ kind: "text", value: text.slice(last, start) });
    const token = match[1] ?? "";
    if (token.startsWith("**") && token.endsWith("**")) {
      out.push({ kind: "bold", value: token.slice(2, -2) });
    } else if (token.startsWith("`") && token.endsWith("`")) {
      out.push({ kind: "code", value: token.slice(1, -1) });
    } else {
      out.push({ kind: "text", value: token });
    }
    last = start + token.length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  if (out.length === 0) out.push({ kind: "text", value: text });
  return out;
}

export type MessageBlock =
  | { type: "paragraph"; lines: string[] }
  | { type: "bullet"; items: string[] }
  | { type: "ordered"; items: string[] };

const BULLET_PATTERN = /^\s*[-*]\s+(.*)$/;
const ORDERED_PATTERN = /^\s*\d+[.)]\s+(.*)$/;

export function parseBlocks(text: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  const paragraph: string[] = [];
  let list: string[] | null = null;
  let listType: "bullet" | "ordered" | null = null;

  function flushParagraph(): void {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", lines: [...paragraph] });
      paragraph.length = 0;
    }
  }

  function flushList(): void {
    if (list !== null && listType !== null && list.length > 0) {
      blocks.push({ type: listType, items: [...list] });
    }
    list = null;
    listType = null;
  }

  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\s+$/, "");
    if (line.trim().length === 0) {
      flushParagraph();
      flushList();
      continue;
    }
    const bullet = BULLET_PATTERN.exec(line);
    if (bullet !== null) {
      if (listType !== "bullet") {
        flushParagraph();
        flushList();
        list = [];
        listType = "bullet";
      }
      list?.push(bullet[1] ?? "");
      continue;
    }
    const ordered = ORDERED_PATTERN.exec(line);
    if (ordered !== null) {
      if (listType !== "ordered") {
        flushParagraph();
        flushList();
        list = [];
        listType = "ordered";
      }
      list?.push(ordered[1] ?? "");
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

function InlineNodes({ nodes }: { nodes: InlineNode[] }): React.JSX.Element {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.kind === "bold") {
          return (
            <strong key={index} className="font-semibold">
              {node.value}
            </strong>
          );
        }
        if (node.kind === "code") {
          return (
            <code
              key={index}
              className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[13px] dark:bg-slate-800"
            >
              {node.value}
            </code>
          );
        }
        return <React.Fragment key={index}>{node.value}</React.Fragment>;
      })}
    </>
  );
}

export function FormattedMessageText({ text }: { text: string }): React.JSX.Element {
  const blocks = React.useMemo(() => parseBlocks(text), [text]);
  return (
    <span className="block whitespace-pre-wrap break-words">
      {blocks.map((block, index) => {
        if (block.type === "bullet") {
          return (
            <ul key={index} className="my-1.5 list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="leading-relaxed">
                  <InlineNodes nodes={parseInline(item)} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ordered") {
          return (
            <ol key={index} className="my-1.5 list-decimal space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="leading-relaxed">
                  <InlineNodes nodes={parseInline(item)} />
                </li>
              ))}
            </ol>
          );
        }
        return (
          <span key={index} className="my-1 block leading-relaxed first:mt-0 last:mb-0">
            {block.lines.map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                <InlineNodes nodes={parseInline(line)} />
              </React.Fragment>
            ))}
          </span>
        );
      })}
    </span>
  );
}
