/* Whiteboard mode — Sarah's own doodle board.
   A quiet canvas of her own (not painted over the site). She draws or writes,
   hits "Post to site", and visitors see her board on the Whiteboard page. */
import { writeBinary, writeText, readFile } from './store.js';
import { toast, refreshToolbar, publishNow } from './studio.js';

let overlay = null, canvas = null, ctx = null;
let painting = false, last = null;
let brush = 'glow';
let color = '#cfe6ff';
let size = 28;
let hasInk = false; // true once she has actually drawn (backdrop alone isn't a post)

const PALETTE = [
  ['Moon white', '#f4f7ff'],
  ['Starlight', '#cfe6ff'],
  ['Prism blue', '#a8d8ff'],
  ['Fairy lilac', '#d8b8ff'],
  ['Mint glow', '#a8ffd8'],
  ['Gold dust', '#ffd28c'],
  ['Rose', '#ffb8d8'],
  ['Ember', '#ff9a6e'],
];

const BOARD_PATH = 'src/content/whiteboard.json';

export function enter() {
  overlay = document.createElement('div');
  overlay.className = 'studio-overlay';
  overlay.innerHTML = `
    <div class="studio-card" style="max-width:960px; width:94vw;">
      <h2>Whiteboard</h2>
      <p>Your own board — doodle, write, dream. Post it and visitors will see it.</p>
      <canvas class="studio-board" style="width:100%; height:52vh; border-radius:12px; border:1px solid rgba(168,216,255,0.25); cursor:crosshair; touch-action:none; display:block;"></canvas>
      <div class="studio-boardbar" style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; margin-top:0.75rem;">
        <div data-brushes style="display:flex; gap:0.4rem;"></div>
        <div data-swatches style="display:flex; gap:0.35rem;"></div>
        <input data-size type="range" min="6" max="120" value="28" title="Brush size" style="width:110px;" />
        <button class="studio-btn" data-act="clear">Clear</button>
        <span style="flex:1;"></span>
        <button class="studio-btn" data-act="close">Close</button>
        <button class="studio-btn studio-btn-primary" data-act="post">Post to site</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  canvas = overlay.querySelector('canvas');
  paintBackdrop();

  const brushes = overlay.querySelector('[data-brushes]');
  for (const [id, label] of [['glow', 'Glow'], ['wisp', 'Wisp'], ['star', 'Star']]) {
    const b = document.createElement('button');
    b.className = 'studio-tool' + (id === brush ? ' active' : '');
    b.textContent = label;
    b.onclick = () => {
      brush = id;
      brushes.querySelectorAll('.studio-tool').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
    };
    brushes.appendChild(b);
  }
  const sw = overlay.querySelector('[data-swatches]');
  for (const [name, hex] of PALETTE) {
    const s = document.createElement('button');
    s.className = 'studio-swatch' + (hex === color ? ' active' : '');
    s.style.background = hex;
    s.title = name;
    s.setAttribute('aria-label', name);
    s.onclick = () => {
      color = hex;
      sw.querySelectorAll('.studio-swatch').forEach((x) => x.classList.remove('active'));
      s.classList.add('active');
    };
    sw.appendChild(s);
  }
  overlay.querySelector('[data-size]').oninput = (e) => { size = parseInt(e.target.value, 10); };
  overlay.querySelector('[data-act="clear"]').onclick = () => { paintBackdrop(); hasInk = false; };
  overlay.querySelector('[data-act="close"]').onclick = exit;
  overlay.querySelector('[data-act="post"]').onclick = post;

  canvas.addEventListener('pointerdown', (e) => {
    painting = true;
    hasInk = true;
    last = pos(e);
    dot(last.x, last.y);
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!painting) return;
    const p = pos(e);
    stroke(last, p);
    last = p;
  });
  const stop = () => { painting = false; last = null; };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
}

export function exit() {
  if (overlay) { overlay.remove(); overlay = null; canvas = null; ctx = null; }
  painting = false;
  hasInk = false;
}

/* Deep night backdrop with a whisper of stars — her board, her mood. */
function paintBackdrop() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.max(300, Math.floor(r.width * dpr));
  canvas.height = Math.max(200, Math.floor(r.height * dpr));
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const g = ctx.createLinearGradient(0, 0, 0, r.height);
  g.addColorStop(0, '#0a1024');
  g.addColorStop(0.6, '#0c1a26');
  g.addColorStop(1, '#0e2018');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, r.width, r.height);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * r.width, y = Math.random() * r.height;
    ctx.fillStyle = `rgba(220,235,255,${0.12 + Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 1.4 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function pos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function dot(x, y) {
  if (brush === 'star') return star(x, y, size / 2);
  const g = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
  const alpha = brush === 'wisp' ? 0.1 : 0.45;
  g.addColorStop(0, withAlpha(color, alpha));
  g.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();
}

function stroke(a, b) {
  if (brush === 'star') {
    const steps = Math.max(1, Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / (size / 2)));
    for (let i = 0; i <= steps; i++) {
      star(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps, size / 3);
    }
    return;
  }
  const steps = Math.max(1, Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 4));
  for (let i = 0; i <= steps; i++) {
    dot(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps);
  }
}

function star(x, y, r) {
  ctx.strokeStyle = withAlpha(color, 0.85);
  ctx.lineWidth = Math.max(1.5, r / 6);
  ctx.beginPath();
  ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
  ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
  ctx.stroke();
  ctx.fillStyle = withAlpha('#ffffff', 0.9);
  ctx.beginPath();
  ctx.arc(x, y, Math.max(1, r / 5), 0, Math.PI * 2);
  ctx.fill();
}

function withAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

async function post() {
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1];
  // A board is "empty" if it's just the backdrop — check by size heuristic is
  // unreliable; instead require at least one stroke. We track via flag:
  if (!hasInk) { toast('Draw something first, then post it.'); return; }
  const stamp = Date.now();
  const imgPath = `public/images/studio/whiteboard/board-${stamp}.png`;
  writeBinary(imgPath, base64);
  let list = [];
  try {
    const raw = await readFile(BOARD_PATH);
    if (raw) list = JSON.parse(raw);
  } catch { list = []; }
  list.unshift({ image: `images/studio/whiteboard/board-${stamp}.png`, postedAt: new Date().toISOString().slice(0, 10) });
  writeText(BOARD_PATH, JSON.stringify(list.slice(0, 24), null, 2));
  refreshToolbar();
  exit();
  const card = document.createElement('div');
  card.className = 'studio-overlay';
  card.innerHTML = `
    <div class="studio-card" style="max-width:420px; text-align:center;">
      <h2>Posted to your whiteboard</h2>
      <p>Publish now and visitors will see it on your Whiteboard page.</p>
      <div class="studio-card-actions" style="justify-content:center;">
        <button class="studio-btn studio-btn-primary" data-act="pub">Publish now</button>
        <button class="studio-btn" data-act="later">Keep editing</button>
      </div>
    </div>`;
  document.body.appendChild(card);
  card.querySelector('[data-act="later"]').onclick = () => card.remove();
  card.querySelector('[data-act="pub"]').onclick = async () => { card.remove(); await publishNow(); };
  card.addEventListener('click', (e) => { if (e.target === card) card.remove(); });
}
