/**
 * Escape an attribute value that was copied verbatim out of source HTML.
 *
 * The value is already entity-encoded, so a `&` that starts a valid entity is
 * left alone (re-escaping it would turn `&quot;` into `&amp;quot;`). Only a
 * bare `&`, a `"` (possible from a single-quoted source attribute) and `<` are
 * encoded, so the value can be re-emitted inside double quotes.
 */
export function escapeAttr(s: string): string {
  return s
    .replace(/&(?!(?:[a-z][a-z0-9]*|#[0-9]+|#x[0-9a-f]+);)/gi, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}
