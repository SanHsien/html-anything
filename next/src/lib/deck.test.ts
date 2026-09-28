import { describe, expect, it } from "vitest";

import { parseDeck } from "./deck";

describe("parseDeck", () => {
  it("decodes only one layer of title entities", () => {
    const result = parseDeck(`
      <html>
        <head><title>&amp;lt;script&amp;gt;</title></head>
        <body><section class="slide"><p>Frame</p></section></body>
      </html>
    `);
    expect(result.title).toBe("&lt;script&gt;");
  });
});
