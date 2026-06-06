// Generates simple app icons (solid teal square with a white "PL" block) as
// real PNG files, with no image libraries — just Node's built-in zlib.
// Run with:  node scripts/generate-icons.js
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');
mkdirSync(PUBLIC, { recursive: true });

// Luxury palette: warm ink frame (#1c1b19) with a champagne-gold tile (#b08d57).
const INK = [28, 27, 25];
const GOLD = [176, 141, 87];

function makePng(size, filename) {
  // Build raw RGBA pixels.
  const bytesPerPixel = 4;
  const rowLen = size * bytesPerPixel + 1; // +1 for the per-row filter byte
  const raw = Buffer.alloc(rowLen * size);

  // Draw a centered white rounded-ish block to look like a simple logo.
  const margin = Math.floor(size * 0.28);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filter type 0 (none)
    for (let x = 0; x < size; x++) {
      const inBlock =
        x >= margin && x < size - margin && y >= margin && y < size - margin;
      const [r, g, b] = inBlock ? GOLD : INK;
      const off = y * rowLen + 1 + x * bytesPerPixel;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = 255;
    }
  }

  const png = encodePng(size, size, raw);
  writeFileSync(join(PUBLIC, filename), png);
  console.log('wrote', filename);
}

// Minimal PNG encoder (8-bit RGBA).
function encodePng(width, height, raw) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6 = RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// CRC32 used by the PNG format.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

makePng(192, 'icon-192.png');
makePng(512, 'icon-512.png');
console.log('Icons generated in /public');
