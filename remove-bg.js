/**
 * remove-bg.js
 * Removes the near-uniform light background from player PNGs in public/players.
 * Usage:  node remove-bg.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DIR = path.join(__dirname, 'public', 'players');

// ---------- PNG reading (unfilter + decompress) ----------
function loadPNG(file) {
  const buf = fs.readFileSync(file);
  let off = 8;
  let w = 0, h = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    if (type === 'IHDR') {
      w = buf.readUInt32BE(off + 8);
      h = buf.readUInt32BE(off + 12);
    } else if (type === 'IDAT') {
      idat.push(buf.slice(off + 8, off + 8 + len));
    }
    off += 12 + len;
  }
  const filtered = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = w * bpp + 1;
  const out = Buffer.alloc(w * h * 4);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  const prev = Buffer.alloc(stride - 1 + 4);
  let src = 0;
  for (let y = 0; y < h; y++) {
    const f = filtered[src++];
    const cur = Buffer.alloc(stride - 1 + 4);
    for (let x = 0; x < stride - 1; x++) {
      const raw = filtered[src++];
      const left = x >= bpp ? cur[x - bpp] : 0;
      const up = prev[x];
      const ul = x >= bpp ? prev[x - bpp] : 0;
      let v = raw;
      if (f === 1) v = (v + left) & 255;
      else if (f === 2) v = (v + up) & 255;
      else if (f === 3) v = (v + Math.floor((left + up) / 2)) & 255;
      else if (f === 4) v = (v + paeth(left, up, ul)) & 255;
      cur[x] = v;
      out[y * w * bpp + x] = v;
    }
    prev.set(cur);
  }
  return { w, h, data: out };
}
// ---------- PNG writing (RGBA, no filter) ----------
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
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function writePNG(file, w, h, data) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = w * 4 + 1;
  const raw = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0;
    data.copy(raw, y * stride + 1, y * w * 4, y * w * 4 + w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const out = Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, out);
}

// ---------- colour distance ----------
function dist(c1, c2) {
  const dr = c1[0] - c2[0], dg = c1[1] - c2[1], db = c1[2] - c2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
// ---------- main ----------
function removeBackground(file) {
  const img = loadPNG(file);
  const { w, h, data } = img;
  const px = (x, y, i) => data[(y * w + x) * 4 + i];

  // 1. Estimate background colour = most frequent colour on the border.
  const hist = new Map();
  const add = (c) => {
    const k = c.join(',');
    hist.set(k, (hist.get(k) || 0) + 1);
  };
  for (let x = 0; x < w; x++) {
    add([px(x, 0, 0), px(x, 0, 1), px(x, 0, 2)]);
    add([px(x, h - 1, 0), px(x, h - 1, 1), px(x, h - 1, 2)]);
  }
  for (let y = 0; y < h; y++) {
    add([px(0, y, 0), px(0, y, 1), px(0, y, 2)]);
    add([px(w - 1, y, 0), px(w - 1, y, 1), px(w - 1, y, 2)]);
  }
  let bg = null, bgCount = 0;
  for (const [k, c] of hist) if (c > bgCount) { bgCount = c; bg = k.split(',').map(Number); }

  // 2. Contiguous flood fill from every border pixel within tolerance.
  const TOL = 42;  // base colour tolerance from background
  const GRAD = 38; // adaptive step tolerance (handles gentle gradient/vignette)
  const visited = new Uint8Array(w * h);
  const queue = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
      const d = dist([px(x, y, 0), px(x, y, 1), px(x, y, 2)], bg);
      if (d <= TOL) { visited[y * w + x] = 1; queue.push([x, y]); }
    }
  }
  const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
  let head = 0;
  while (head < queue.length) {
    const [x, y] = queue[head++];
    const here = [px(x, y, 0), px(x, y, 1), px(x, y, 2)];
    for (let k = 0; k < 4; k++) {
      const nx = x + dc[k], ny = y + dr[k];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const nidx = ny * w + nx;
      if (visited[nidx]) continue;
      const d = dist([px(nx, ny, 0), px(nx, ny, 1), px(nx, ny, 2)], here);
      if (d <= GRAD) { visited[nidx] = 1; queue.push([nx, ny]); }
    }
  }

  // 3. Set alpha for visited (background) pixels with a soft edge ramp.
  let removed = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (visited[y * w + x]) {
        const d = dist([px(x, y, 0), px(x, y, 1), px(x, y, 2)], bg);
        const idx = (y * w + x) * 4;
        let a;
        if (d <= TOL) a = 0;
        else {
          const t = Math.min(1, (d - TOL) / TOL);
          a = Math.round(255 * t);
        }
        data[idx + 3] = a;
        if (a === 0) removed++;
      }
    }
  }

  writePNG(file, w, h, data);
  return { w, h, removed, total: w * h };
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.png'));
for (const f of files) {
  if (f.startsWith('_')) continue;
  const r = removeBackground(path.join(DIR, f));
  const pct = ((r.removed / r.total) * 100).toFixed(1);
  console.log(`${f}: removed ${r.removed} px (${pct}% of ${r.total})`);
}
console.log('Done.');