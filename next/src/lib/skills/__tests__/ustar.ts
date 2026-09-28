import zlib from "node:zlib";

/**
 * Hand-rolled POSIX ustar so tests can emit symlink / hardlink / absolute
 * path entries that system `tar -czf` would refuse or normalise away.
 */

export type TarEntry = {
  name: string;
  size: number;
  typeFlag: string;
  linkName?: string;
  data?: Buffer;
};

function octal(n: number, width: number): Buffer {
  const s = n.toString(8).padStart(width - 1, "0");
  return Buffer.from(`${s}\0`, "binary");
}

function header(entry: TarEntry): Buffer {
  const h = Buffer.alloc(512);
  h.write(entry.name.slice(0, 100), 0, "utf8");
  octal(0o644, 8).copy(h, 100);
  octal(0, 8).copy(h, 108);
  octal(0, 8).copy(h, 116);
  octal(entry.size, 12).copy(h, 124);
  octal(0, 12).copy(h, 136);
  h.fill(0x20, 148, 156);
  h.write(entry.typeFlag, 156, "binary");
  if (entry.linkName) h.write(entry.linkName.slice(0, 100), 157, "utf8");
  h.write("ustar\0", 257, "binary");
  h.write("00", 263, "binary");
  let sum = 0;
  for (const b of h) sum += b;
  octal(sum, 7).copy(h, 148);
  h[155] = 0x20;
  return h;
}

export function buildGzipUstar(entries: TarEntry[]): Buffer {
  const blocks: Buffer[] = [];
  for (const e of entries) {
    blocks.push(header(e));
    if (e.data && e.data.length > 0) {
      blocks.push(e.data);
      const pad = (512 - (e.data.length % 512)) % 512;
      if (pad > 0) blocks.push(Buffer.alloc(pad));
    }
  }
  blocks.push(Buffer.alloc(512));
  blocks.push(Buffer.alloc(512));
  return zlib.gzipSync(Buffer.concat(blocks));
}
