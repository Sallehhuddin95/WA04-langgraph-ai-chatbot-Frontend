import { describe, expect, it } from "vitest";
import { parseBlocks, parseInline } from "@/features/chat/components/FormattedMessageText";

describe("parseInline", () => {
  it("parses bold markers", () => {
    const nodes = parseInline("Hello **First Seat** end");
    expect(nodes.some((node) => node.kind === "bold" && node.value === "First Seat")).toBe(true);
  });

  it("parses code spans", () => {
    const nodes = parseInline("Run `npm test` now");
    expect(nodes.some((node) => node.kind === "code" && node.value === "npm test")).toBe(true);
  });
});

describe("parseBlocks", () => {
  it("groups dash lines into a bullet list", () => {
    const blocks = parseBlocks("Intro\n- one\n- two");
    expect(blocks[0]?.type).toBe("paragraph");
    expect(blocks[1]).toEqual({ type: "bullet", items: ["one", "two"] });
  });

  it("groups numbered lines into an ordered list", () => {
    const blocks = parseBlocks("1. First\n2. Second");
    expect(blocks).toEqual([{ type: "ordered", items: ["First", "Second"] }]);
  });

  it("keeps single line breaks inside a paragraph", () => {
    const blocks = parseBlocks("line one\nline two");
    expect(blocks).toEqual([{ type: "paragraph", lines: ["line one", "line two"] }]);
  });

  it("splits blank lines into paragraphs", () => {
    const blocks = parseBlocks("one\n\ntwo");
    expect(blocks).toEqual([
      { type: "paragraph", lines: ["one"] },
      { type: "paragraph", lines: ["two"] },
    ]);
  });
});
