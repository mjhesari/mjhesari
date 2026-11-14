// Generates the animated 3D SVG assets used by the profile README.
// Run: node scripts/build-assets.mjs   (from the profile repo root)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(OUT, { recursive: true });

const SANS = "'Segoe UI',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif";
const MONO = "ui-monospace,'SF Mono',SFMono-Regular,Menlo,Consolas,monospace";
const C = { bg0: '#060913', bg1: '#0b1020', mid: '#1b3a7a', blue: '#4c8dff', light: '#9cc0ff', dim: '#8b98b8' };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r = (n) => Math.round(n * 10) / 10;
const pts = (a) => a.map(([x, y]) => `${r(x)},${r(y)}`).join(' ');
const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">\n${body}\n</svg>\n`;

// seeded PRNG so output is stable between runs
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/** Isometric cube; (cx, cy) is the centre vertex where the three faces meet. */
function cube(cx, cy, s, { top = '#7fb0ff', left = '#2f63dc', right = '#16327a', stroke = '#b9d2ff', wire = false } = {}) {
  const w = s * 0.866;
  const T = [[cx, cy - s], [cx + w, cy - s / 2], [cx, cy], [cx - w, cy - s / 2]];
  const L = [[cx - w, cy - s / 2], [cx, cy], [cx, cy + s], [cx - w, cy + s / 2]];
  const R = [[cx + w, cy - s / 2], [cx, cy], [cx, cy + s], [cx + w, cy + s / 2]];
  const st = `stroke="${stroke}" stroke-opacity="${wire ? 0.8 : 0.35}" stroke-width="1" stroke-linejoin="round"`;
  if (wire) return [T, L, R].map((p) => `<polygon points="${pts(p)}" fill="${C.blue}" fill-opacity="0.06" ${st}/>`).join('');
  return `<polygon points="${pts(L)}" fill="${left}" ${st}/><polygon points="${pts(R)}" fill="${right}" ${st}/><polygon points="${pts(T)}" fill="${top}" ${st}/>`;
}

const bob = (dy, dur, begin = 0) =>
  `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${-dy};0 0" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>`;

/** Text with a stacked extrusion behind it. */
function text3d(id, str, x, y, size, { depth = 10, anchor = 'start', weight = 900, spacing = 0, face = '#fff', from = [27, 58, 122], to = [8, 14, 36] } = {}) {
  const attrs = `x="${x}" y="${y}" font-family="${SANS}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${spacing}"`;
  let out = `<defs><text id="${id}" ${attrs}>${esc(str)}</text></defs>`;
  for (let i = depth; i >= 1; i--) {
    const t = i / depth;
    const col = from.map((c, k) => Math.round(c + (to[k] - c) * t));
    out += `<use xlink:href="#${id}" href="#${id}" transform="translate(${r(i * 0.9)} ${r(i * 0.9)})" fill="rgb(${col})"/>`;
  }
  return out + `<use xlink:href="#${id}" href="#${id}" fill="${face}"/>`;
}

/* ------------------------------------------------------------------ HERO */
function hero() {
  const W = 1200, H = 460, HZ = 285, VX = 600;
  let stars = '';
  for (let i = 0; i < 70; i++) {
    const x = r(rnd() * W), y = r(rnd() * (HZ - 20)), rad = r(0.5 + rnd() * 1.3), d = r(2 + rnd() * 4), b = r(rnd() * 4);
    stars += `<circle cx="${x}" cy="${y}" r="${rad}" fill="#cfe0ff" opacity="0.15"><animate attributeName="opacity" values="0.15;0.9;0.15" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></circle>`;
  }
  let grid = '';
  for (let i = -16; i <= 16; i++) grid += `<line x1="${VX}" y1="${HZ}" x2="${VX + i * 120}" y2="${H}"/>`;
  const depth = H - HZ;
  for (let k = 1; k <= 12; k++) {
    const vals = [];
    for (let s = 0; s <= 8; s++) vals.push(`0 ${r(HZ + depth / (k + 1 - s / 8))}`);
    grid += `<line x1="0" y1="0" x2="${W}" y2="0"><animateTransform attributeName="transform" type="translate" values="${vals.join(';')}" dur="1.6s" repeatCount="indefinite"/></line>`;
  }
  const cubes = [
    [150, 150, 46, {}, 14, 6, 0], [262, 84, 20, { wire: true }, 9, 4.5, 1], [86, 318, 26, { wire: true }, 8, 5, 0.5],
    [1052, 142, 52, {}, 16, 7, 0.8], [940, 78, 18, {}, 8, 4, 0.2], [1118, 300, 28, { wire: true }, 10, 5.5, 1.4],
    [176, 262, 14, {}, 6, 3.8, 0.6], [1016, 258, 14, { wire: true }, 6, 4.2, 1.1],
  ].map(([x, y, s, o, dy, dur, b]) => `<g>${bob(dy, dur, b)}${cube(x, y, s, o)}</g>`).join('');

  return svg(W, H, `<defs>
  <clipPath id="clip"><rect width="${W}" height="${H}" rx="26"/></clipPath>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.bg0}"/><stop offset="0.62" stop-color="#0c1530"/><stop offset="1" stop-color="${C.bg0}"/></linearGradient>
  <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${C.blue}" stop-opacity="0.75"/><stop offset="0.45" stop-color="${C.mid}" stop-opacity="0.35"/><stop offset="1" stop-color="${C.mid}" stop-opacity="0"/></radialGradient>
  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.75"/><stop offset="1" stop-color="#fff"/></linearGradient>
  <mask id="floor"><rect x="0" y="${HZ}" width="${W}" height="${depth}" fill="url(#fade)"/></mask>
  <linearGradient id="face" gradientUnits="userSpaceOnUse" x1="200" y1="0" x2="1000" y2="0">
    <stop offset="0" stop-color="#a9c8ff"/><stop offset="0.42" stop-color="#e4eeff"/><stop offset="0.5" stop-color="#ffffff"/><stop offset="0.58" stop-color="#e4eeff"/><stop offset="1" stop-color="#a9c8ff"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="-520 0;520 0;-520 0" dur="7s" repeatCount="indefinite"/>
  </linearGradient>
  <filter id="glow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<g clip-path="url(#clip)">
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars}
  <ellipse cx="${VX}" cy="${HZ}" rx="520" ry="150" fill="url(#sun)"><animate attributeName="ry" values="150;170;150" dur="6s" repeatCount="indefinite"/></ellipse>
  <g mask="url(#floor)" stroke="${C.blue}" stroke-width="1.4" stroke-opacity="0.75">${grid}</g>
  <line x1="0" y1="${HZ}" x2="${W}" y2="${HZ}" stroke="${C.light}" stroke-opacity="0.55" stroke-width="1.5"/>
  ${cubes}
  <text x="${VX}" y="74" text-anchor="middle" font-family="${MONO}" font-size="17" fill="${C.blue}" letter-spacing="5">&lt;hello world /&gt;</text>
  <g filter="url(#glow)" opacity="0.55"><text x="${VX}" y="196" text-anchor="middle" font-family="${SANS}" font-size="118" font-weight="900" letter-spacing="4" fill="${C.blue}">MJ HESARI</text></g>
  ${text3d('name', 'MJ HESARI', VX, 196, 118, { depth: 16, anchor: 'middle', spacing: 4, face: 'url(#face)' })}
  <text x="${VX}" y="252" text-anchor="middle" font-family="${MONO}" font-size="19" font-weight="600" fill="#dbe7ff" letter-spacing="6">FULL STACK DEVELOPER · NEXT.JS · TYPESCRIPT</text>
</g>
<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="26" fill="none" stroke="${C.blue}" stroke-opacity="0.35" stroke-width="1.5"/>`);
}

/* --------------------------------------------------------------- HEADERS */
function header(num, title, tag) {
  const W = 1200, H = 84;
  return svg(W, H, `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d1630"/><stop offset="0.6" stop-color="${C.bg1}"/><stop offset="1" stop-color="${C.bg0}"/></linearGradient>
  <linearGradient id="sweep" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="360" y2="0"><stop offset="0" stop-color="${C.blue}" stop-opacity="0"/><stop offset="0.5" stop-color="#cfe0ff"/><stop offset="1" stop-color="${C.blue}" stop-opacity="0"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="-360 0;1200 0" dur="4.5s" repeatCount="indefinite"/></linearGradient>
  <clipPath id="c"><rect width="${W}" height="${H}" rx="18"/></clipPath>
</defs>
<g clip-path="url(#c)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect y="${H - 3}" width="${W}" height="3" fill="${C.mid}" opacity="0.6"/>
  <rect y="${H - 3}" width="${W}" height="3" fill="url(#sweep)"/>
</g>
<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="18" fill="none" stroke="${C.blue}" stroke-opacity="0.28" stroke-width="1.5"/>
<g>${bob(5, 3.6)}${cube(52, 42, 19)}</g>
<text x="92" y="50" font-family="${MONO}" font-size="17" font-weight="700" fill="${C.blue}">${num}</text>
${text3d('t', title, 128, 54, 34, { depth: 6, weight: 800, spacing: 0.5, from: [44, 92, 200], to: [14, 28, 70] })}
<text x="${W - 34}" y="49" text-anchor="end" font-family="${MONO}" font-size="14" fill="${C.dim}" letter-spacing="1">${esc(tag)}</text>`);
}

/* ----------------------------------------------------------------- STATS */
function stats() {
  const W = 1200, H = 236, cw = 250, ch = 128;
  const items = [['+4', 'Years experience'], ['+20', 'Projects shipped'], ['Next.js', 'Core focus'], ['SEO · PWA', 'Specialty']];
  const cards = items.map(([v, l], i) => {
    const x = 42 + i * 290;
    let ext = '';
    for (let k = 14; k >= 1; k--) ext += `<rect x="${k}" y="${k}" width="${cw}" height="${ch}" rx="18" fill="rgb(${Math.round(27 - k)},${Math.round(58 - k * 2.6)},${Math.round(122 - k * 5)})"/>`;
    return `<g>${bob(9, 4.4 + i * 0.5, i * 0.45)}
  <ellipse cx="${x + cw / 2 + 10}" cy="212" rx="105" ry="9" fill="${C.blue}" opacity="0.22" filter="url(#blur)"/>
  <g transform="translate(${x} 50) skewY(-4)">
    ${ext}
    <rect width="${cw}" height="${ch}" rx="18" fill="url(#card)" stroke="${C.blue}" stroke-opacity="0.7" stroke-width="1.5"/>
    <rect x="1.5" y="1.5" width="${cw - 3}" height="${ch / 2}" rx="17" fill="url(#gloss)"/>
    <text x="${cw / 2}" y="68" text-anchor="middle" font-family="${SANS}" font-size="${v.length > 5 ? 36 : 46}" font-weight="900" fill="url(#val)">${esc(v)}</text>
    <text x="${cw / 2}" y="100" text-anchor="middle" font-family="${MONO}" font-size="13.5" fill="#a9b8d8" letter-spacing="1.2">${esc(l.toUpperCase())}</text>
  </g></g>`;
  }).join('\n');
  return svg(W, H, `<defs>
  <linearGradient id="card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16264f"/><stop offset="1" stop-color="${C.bg1}"/></linearGradient>
  <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.10"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="val" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#8fb6ff"/></linearGradient>
  <filter id="blur" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="7"/></filter>
</defs>
${cards}`);
}

/* ----------------------------------------------------------------- STACK */
function stack() {
  const W = 1200, H = 580, cx = 290, hw = 160, hh = hw / 1.732, t = 22, gap = 94;
  const layers = [
    ['FRONTEND', 'EXPERT · +4 YRS', 'Next.js · React · TypeScript · Tailwind · Redux · Framer Motion', 'App Router · SSR · ISR · SEO · strict types', [76, 141, 255]],
    ['BACKEND', 'NODE EXPERT · +4 YRS', 'Node.js · NestJS · Express', 'REST · event loop · streams', [124, 92, 255]],
    ['DATABASE', 'ADVANCED · +2–3 YRS', 'PostgreSQL · MongoDB · Firebase', 'typed models · relational + document', [34, 211, 238]],
    ['DEVOPS', 'ADVANCED · +2–4 YRS', 'Git · GitHub · Docker · Cloudflare · Vercel', 'CI/CD · edge caching · containers', [52, 211, 153]],
  ];
  const shade = (c, f) => `rgb(${c.map((v) => Math.round(v * f))})`;
  let out = '';
  for (let i = layers.length - 1; i >= 0; i--) {
    const [name, level, tech, sub, col] = layers[i];
    const cy = 56 + i * gap;
    const top = [cx, cy], right = [cx + hw, cy + hh], bottom = [cx, cy + 2 * hh], left = [cx - hw, cy + hh];
    const P = (u, v) => [top[0] + u * (right[0] - top[0]) + v * (left[0] - top[0]), top[1] + u * (right[1] - top[1]) + v * (left[1] - top[1])];
    const dn = ([x, y]) => [x, y + t];
    let lines = '';
    for (let j = 1; j < 4; j++) {
      const a = P(j / 4, 0), b = P(j / 4, 1), c = P(0, j / 4), d = P(1, j / 4);
      lines += `<line x1="${r(a[0])}" y1="${r(a[1])}" x2="${r(b[0])}" y2="${r(b[1])}"/><line x1="${r(c[0])}" y1="${r(c[1])}" x2="${r(d[0])}" y2="${r(d[1])}"/>`;
    }
    let tiles = '';
    [[0, 1], [2, 0], [1, 2], [3, 3], [3, 1]].forEach(([a, b], k) => {
      const m = 0.035, q = [P(a / 4 + m, b / 4 + m), P((a + 1) / 4 - m, b / 4 + m), P((a + 1) / 4 - m, (b + 1) / 4 - m), P(a / 4 + m, (b + 1) / 4 - m)];
      tiles += `<polygon points="${pts(q)}" fill="#fff" opacity="0.08"><animate attributeName="opacity" values="0.06;0.55;0.06" dur="${3 + k * 0.7}s" begin="${r(k * 0.6 + i * 0.3)}s" repeatCount="indefinite"/></polygon>`;
    });
    const ly = cy + hh + t / 2;
    const hex = `rgb(${col})`;
    out += `<g>${bob(6, 5 + i * 0.4, i * 0.5)}
  <polygon points="${pts([left, bottom, dn(bottom), dn(left)])}" fill="${shade(col, 0.42)}"/>
  <polygon points="${pts([right, bottom, dn(bottom), dn(right)])}" fill="${shade(col, 0.24)}"/>
  <polygon points="${pts([top, right, bottom, left])}" fill="${shade(col, 0.62)}" fill-opacity="0.94" stroke="${hex}" stroke-width="1.5" stroke-linejoin="round"/>
  <g stroke="#fff" stroke-opacity="0.16" stroke-width="1">${lines}</g>
  ${tiles}
  <polyline points="${pts([dn(left), dn(bottom), dn(right)])}" fill="none" stroke="${hex}" stroke-opacity="0.9" stroke-width="2" stroke-linejoin="round" filter="url(#g)"/>
  <circle cx="${cx + hw}" cy="${r(ly)}" r="4.5" fill="${hex}"/>
  <path d="M${cx + hw} ${r(ly)} H${cx + hw + 58}" stroke="${hex}" stroke-width="1.5" stroke-dasharray="4 5" fill="none"><animate attributeName="stroke-dashoffset" values="18;0" dur="1.2s" repeatCount="indefinite"/></path>
  <text x="${cx + hw + 74}" y="${r(ly - 12)}" font-family="${SANS}" font-size="23" font-weight="800" fill="${hex}" letter-spacing="2">${name}</text>
  <text x="${W - 46}" y="${r(ly - 13)}" text-anchor="end" font-family="${MONO}" font-size="12.5" fill="${hex}" letter-spacing="1.5">${esc(level)}</text>
  <text x="${cx + hw + 74}" y="${r(ly + 13)}" font-family="${SANS}" font-size="17" font-weight="600" fill="#e6edf9">${esc(tech)}</text>
  <text x="${cx + hw + 74}" y="${r(ly + 35)}" font-family="${MONO}" font-size="13" fill="${C.dim}">${esc(sub)}</text>
</g>\n`;
  }
  return svg(W, H, `<defs>
  <radialGradient id="bg" cx="0.25" cy="0.5" r="0.9"><stop offset="0" stop-color="#101b3c"/><stop offset="0.6" stop-color="${C.bg1}"/><stop offset="1" stop-color="${C.bg0}"/></radialGradient>
  <filter id="g" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="${W}" height="${H}" rx="24" fill="url(#bg)"/>
<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="24" fill="none" stroke="${C.blue}" stroke-opacity="0.28" stroke-width="1.5"/>
${out}`);
}

/* -------------------------------------------------------------- PIPELINE */
function pipeline() {
  const W = 1200, H = 310, y = 128, n = 7, x0 = 108, dx = 164;
  const steps = [['IDEA', 'understand the problem'], ['PLANNING', 'break into tasks'], ['ARCHITECTURE', 'scalable · modular'], ['DEVELOPMENT', 'reusable code'], ['TESTING', 'quality · reliability'], ['DEPLOYMENT', 'CI/CD release'], ['MONITORING', 'analyze · optimize']];
  const total = 7;
  let nodes = '';
  steps.forEach(([name, sub], i) => {
    const x = x0 + i * dx, on = r(i / n), off = r(Math.min(1, (i + 0.9) / n));
    nodes += `<g>${bob(6, 3.8, i * 0.3)}
  ${cube(x, y, 30, { top: '#31476f', left: '#1b2a4d', right: '#111b36', stroke: '#6f8fc9' })}
  <g opacity="0">${cube(x, y, 30)}<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${on};${r(on + 0.02)};${off};${r(Math.min(1, off + 0.05))};1" dur="${total}s" repeatCount="indefinite"/></g>
  <text x="${x}" y="${y - 9}" text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="700" fill="#0b1020" opacity="0.75">0${i + 1}</text>
</g>
<text x="${x}" y="${y + 78}" text-anchor="middle" font-family="${SANS}" font-size="14.5" font-weight="800" fill="#e6edf9" letter-spacing="1.2">${name}</text>
<text x="${x}" y="${y + 98}" text-anchor="middle" font-family="${MONO}" font-size="11.5" fill="${C.dim}">${esc(sub)}</text>\n`;
  });
  const x1 = x0 + (n - 1) * dx, ly = y + 46;
  return svg(W, H, `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d1630"/><stop offset="1" stop-color="${C.bg0}"/></linearGradient>
  <filter id="g" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="${W}" height="${H}" rx="24" fill="url(#bg)"/>
<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="24" fill="none" stroke="${C.blue}" stroke-opacity="0.28" stroke-width="1.5"/>
<text x="40" y="42" font-family="${MONO}" font-size="14" fill="${C.blue}">$ process.log</text>
<line x1="${x0}" y1="${ly}" x2="${x1}" y2="${ly}" stroke="${C.mid}" stroke-width="3" stroke-linecap="round"/>
<line x1="${x0}" y1="${ly}" x2="${x1}" y2="${ly}" stroke="${C.blue}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${x1 - x0}" stroke-dashoffset="${x1 - x0}"><animate attributeName="stroke-dashoffset" values="${x1 - x0};0;0" keyTimes="0;${r((n - 1) / n)};1" dur="${total}s" repeatCount="indefinite"/></line>
<circle cy="${ly}" r="6" fill="#fff" filter="url(#g)"><animate attributeName="cx" values="${x0};${x1};${x1}" keyTimes="0;${r((n - 1) / n)};1" dur="${total}s" repeatCount="indefinite"/></circle>
${nodes}
<text x="${W / 2}" y="${H - 28}" text-anchor="middle" font-family="${MONO}" font-size="14" fill="#34d399">✓ build complete — Fast · Scalable · Maintainable · SEO Ready · Production Ready</text>`);
}

const files = {
  'hero.svg': hero(),
  'stats.svg': stats(),
  'stack.svg': stack(),
  'pipeline.svg': pipeline(),
  'h-about.svg': header('01', 'About Me', '// who is behind the code'),
  'h-skills.svg': header('02', 'Skills', '// what I build production systems with'),
  'h-experience.svg': header('03', 'Experience', '// four years, landing pages → team lead'),
  'h-work.svg': header('04', 'Selected Work', '// products, interfaces, systems'),
  'h-articles.svg': header('05', 'From the Articles', '// how shipped projects actually work'),
  'h-process.svg': header('06', 'From Idea to Production', '// the pipeline'),
  'h-stats.svg': header('07', 'Building in Public', '// commits don’t lie'),
  'h-contact.svg': header('08', 'Let’s Build Together', '// open for work'),
};
for (const [name, body] of Object.entries(files)) writeFileSync(join(OUT, name), body);
console.log(`wrote ${Object.keys(files).length} files to ${OUT}`);
