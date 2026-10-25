import { describe, expect, it } from "vitest";

import { escapeAttr } from "./html-attr";

describe("escapeAttr", () => {
  it("does not double-encode existing entities", () => {
    expect(escapeAttr("a&amp;b &quot;x&quot; &#39;y&#39; &#x27;z&#x27;")).toBe(
      "a&amp;b &quot;x&quot; &#39;y&#39; &#x27;z&#x27;",
    );
  });

  it("encodes a bare ampersand, quote and angle bracket", () => {
    expect(escapeAttr('a & b" <c')).toBe("a &amp; b&quot; &lt;c");
  });

  it("encodes an ampersand that does not terminate an entity", () => {
    expect(escapeAttr("x?a=1&b=2")).toBe("x?a=1&amp;b=2");
  });
});
