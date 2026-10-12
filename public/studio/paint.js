/* Paint mode — Sarah paints directly onto her site's background.
   Her brushstrokes become a PNG layer saved to the repo. */
import { writeBinary } from './store.js';
import { toast, refreshToolbar } from './studio.js';

let canvas = null, ctx = null;
let bar = null;
let painting = false;
let last = null;
let brush = 'glow';
let color = '#ffb46e';
let size = 60;

const PALETTE = [
  ['Ember red', '#ff7850'],
  ['Orange', '#ffb46e'],
  ['Gold', '#ffd28c'],
  ['Pale yellow', '#ffe6aa'],
  ['Leaf green', '#aaffbe'],
  ['Deep green', '#8ce6aa'],
  ['Star white', '#ffffff'],
  ['Ice blue', '#96b4ff'],
];

export function enter() {
  buildCanvas();
  buildBar();
  ensureBgLayer();
  toast('Paint on the background. Your strokes become part of the site.');
}

export function exit() {
  if (bar) { bar.remove(); bar = null; }
  if (canvas) { canvas.remove(); canvas = null; ctx = null; }
  painting = false;
}

function buildCanvas() {
  canvas = document.createElement('canvas');
  canvas.className = 'studio-paint-canvas';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  document.body.appendChild(canvas);

  canvas.addEventListener('pointerdown', (e) => {
    painting = true;
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

function pos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function dot(x, y) {
  if (brush === 'star') return star(x, y, size / 2);
  const g = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
  const alpha = brush === 'wisp' ? 0.12 : 0.5;
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

function buildBar() {
  bar = document.createElement('div');
  bar.className = 'studio-paintbar';
  const brushes = [['glow', 'Glow'], ['wisp', 'Wisp'], ['star', 'Star']];
  for (const [id, label] of brushes) {
    const b = document.createElement('button');
    b.className = 'studio-tool' + (id === brush ? ' active' : '');
    b.textContent = label;
    b.onclick = () => {
      brush = id;
      bar.querySelectorAll('.studio-tool').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
    };
    bar.appendChild(b);
  }
  for (const [name, hex] of PALETTE) {
    const s = document.createElement('button');
    s.className = 'studio-swatch' + (hex === color ? ' active' : '');
    s.style.background = hex;
    s.title = name;
    s.setAttribute('aria-label', name);
    s.onclick = () => {
      color = hex;
      bar.querySelectorAll('.studio-swatch').forEach((x) => x.classList.remove('active'));
      s.classList.add('active');
    };
    bar.appendChild(s);
  }
  const sizeInput = document.createElement('input');
  sizeInput.type = 'range';
  sizeInput.min = '10';
  sizeInput.max = '160';
  sizeInput.value = String(size);
  sizeInput.title = 'Brush size';
  sizeInput.oninput = () => { size = parseInt(sizeInput.value, 10); };
  bar.appendChild(sizeInput);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'studio-tool';
  saveBtn.textContent = 'Keep painting';
  saveBtn.onclick = savePainting;
  bar.appendChild(saveBtn);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'studio-tool';
  clearBtn.textContent = 'Clear';
  clearBtn.onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    toast('Canvas cleared.');
  };
  bar.appendChild(clearBtn);

  document.body.appendChild(bar);
}

function ensureBgLayer() {
  let layer = document.querySelector('.studio-painted-bg');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'studio-painted-bg';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  return layer;
}

function savePainting() {
  canvas.toBlob((blob) => {
    if (!blob) { toast('Nothing to keep yet — paint something first.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(',')[1];
      writeBinary('public/images/studio/background.png', base64);
      // Live preview behind the content
      const layer = ensureBgLayer();
      layer.style.backgroundImage = `url(${reader.result})`;
      layer.style.backgroundSize = 'cover';
      layer.style.backgroundPosition = 'center';
      toast('Painting kept. Publish to make it live.');
      refreshToolbar();
    };
    reader.readAsDataURL(blob);
  }, 'image/png');
}
