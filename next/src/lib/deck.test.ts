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

  it("keeps body attribute entities single-encoded in each standalone slide", () => {
    const result = parseDeck(`
      <html>
        <head><title>t</title></head>
        <body class="a&amp;b" style="font-family: &quot;Noto Sans&quot;; background: url(x?a=1&amp;b=2)">
          <section class="slide"><p>Frame</p></section>
        </body>
      </html>
    `);
    const html = result.slides[0].html;
    expect(html).toContain('class="a&amp;b"');
    expect(html).toContain('style="font-family: &quot;Noto Sans&quot;; background: url(x?a=1&amp;b=2)"');
    expect(html).not.toContain("&amp;quot;");
    expect(html).not.toContain("&amp;amp;");
  });

  it("still neutralises a quote or angle bracket from a single-quoted body attribute", () => {
    const result = parseDeck(
      `<html><head><title>t</title></head><body class='x" onload="alert(1)'><section class="slide"><p>F</p></section></body></html>`,
    );
    const html = result.slides[0].html;
    expect(html).not.toMatch(/<body[^>]*\sonload=/);
  });
});
