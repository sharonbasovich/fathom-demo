// Procedural "bathymetric chart" tile art: fbm heightfield → contour lines + hypsometric tint. No stock imagery.
function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function makeNoise(rand) {
  const p = new Uint8Array(512); const perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h, x, y) => { const u = h & 1 ? -x : x, v = h & 2 ? -y : y; return u + v; };
  return (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const a = p[p[X] + Y], b = p[p[X + 1] + Y], c = p[p[X] + Y + 1], d = p[p[X + 1] + Y + 1];
    const l = (s, t, w) => s + w * (t - s);
    return l(l(grad(a, x, y), grad(b, x - 1, y), u), l(grad(c, x, y - 1), grad(d, x - 1, y - 1), u), v);
  };
}
export function paintBathymetry(canvas, seed) {
  const ctx = canvas.getContext("2d"); const W = canvas.width, H = canvas.height;
  const rand = mulberry(seed); const noise = makeNoise(rand);
  const img = ctx.createImageData(W, H); const d = img.data;
  const scale = 2.6 + rand() * 1.4, ox = rand() * 100, oy = rand() * 100;
  const h = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let f = 0, amp = 0.5, fr = 1; const nx = (x / W) * scale + ox, ny = (y / H) * scale + oy;
    for (let o = 0; o < 5; o++) { f += amp * noise(nx * fr, ny * fr); amp *= 0.5; fr *= 2.05; }
    h[y * W + x] = f * 0.5 + 0.5;
  }
  // hypsometric tint: deep (dark blue-black) → shelf (pale slate), with 14 contour levels drawn as thin light lines
  const levels = 14;
  for (let i = 0; i < W * H; i++) {
    const v = h[i];
    const t = Math.pow(v, 1.3);
    let r = 10 + t * 150, g = 22 + t * 165, b = 42 + t * 175;
    const band = v * levels; const frac = band - Math.floor(band);
    const x = i % W, y = (i / W) | 0;
    const gx = h[Math.min(W - 1, x + 1) + y * W] - v, gy = h[x + Math.min(H - 1, y + 1) * W] - v;
    const slope = Math.hypot(gx, gy) * levels;
    const line = Math.max(0, 1 - frac / Math.max(0.03, slope * 0.9));
    if (line > 0) { r += line * 120; g += line * 120; b += line * 110; }
    d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // survey track: a dotted transect with a station mark, in the accent
  ctx.strokeStyle = "rgba(255,138,61,0.95)"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 7]);
  ctx.beginPath(); const y0 = H * (0.25 + rand() * 0.5); ctx.moveTo(W * 0.08, y0); ctx.bezierCurveTo(W * 0.4, y0 - 80 + rand() * 160, W * 0.6, y0 + 80 - rand() * 160, W * 0.92, H * (0.25 + rand() * 0.5)); ctx.stroke();
  ctx.setLineDash([]); ctx.fillStyle = "rgba(255,138,61,1)"; const sx = W * (0.3 + rand() * 0.4), sy = H * (0.3 + rand() * 0.4);
  ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(sx, sy, 11, 0, Math.PI * 2); ctx.stroke();
}
