// Generator ikon PWA tanpa dependensi — menggambar topi wisuda di atas
// latar gradien biru, lalu menyusun PNG dari buffer RGBA mentah.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = 0xffffffff;
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function makePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // scanline: setiap baris diawali filter byte 0
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function drawIcon(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);
  const s = size;
  const scale = maskable ? 0.82 : 1.0;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const u = (x / s - 0.5) / scale + 0.5;
      const v = (y / s - 0.5) / scale + 0.5;
      // latar gradien diagonal biru
      const t = (x / s + y / s) / 2;
      let r = Math.round(29 + (59 - 29) * t);
      let g = Math.round(78 + (130 - 78) * t);
      let b = Math.round(216 + (246 - 216) * t);
      // topi wisuda: papan (persegi dirotasi 45°)
      const dx = Math.abs(u - 0.5);
      const dy = Math.abs(v - 0.44);
      const onBoard = dx + dy <= 0.2 && v < 0.5;
      // dasar topi (trapesium)
      const onBase = v >= 0.5 && v <= 0.6 && dx <= 0.16 - (v - 0.5) * 0.1;
      // jumbai
      const onTassel = Math.abs(u - 0.5 - 0.2) <= 0.012 && v >= 0.44 && v <= 0.62;
      const onBall = Math.hypot(u - 0.7, v - 0.62) <= 0.022;
      if (onBoard || onBase || onTassel || onBall) {
        r = 255; g = 255; b = 255;
      }
      const i = (y * s + x) * 4;
      rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = 255;
    }
  }
  return makePng(s, s, rgba);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", drawIcon(192, false));
writeFileSync("public/icons/icon-512.png", drawIcon(512, false));
writeFileSync("public/icons/icon-maskable-512.png", drawIcon(512, true));
console.log("ikon PWA dibuat di public/icons/");
