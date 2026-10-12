/* Sign mode — Sarah signs with her finger or mouse.
   Her signature lands on her artwork pages, like signing a canvas. */
import { writeBinary } from './store.js';
import { toast, refreshToolbar } from './studio.js';

let overlay = null, pad = null, pctx = null;
let drawing = false, last = null;
let hasInk = false;

export function enter() {
  overlay = document.createElement('div');
  overlay.className = 'studio-overlay';
  overlay.innerHTML = `
    <div class="studio-card" style="max-width:520px;">
      <h2>Sign your work</h2>
      <p>Sign in the box with your finger or mouse —<br/>it will appear on your artwork pages.</p>
      <canvas class="studio-sign-pad" style="margin-top:1rem;"></canvas>
      <div class="studio-card-actions">
        <button class="studio-btn" data-act="clear">Clear</button>
        <button class="studio-btn studio-btn-primary" data-act="keep">Keep signature</button>
        <button class="studio-btn" data-act="close">Close</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  pad = overlay.querySelector('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = pad.getBoundingClientRect();
  pad.width = Math.max(300, Math.floor(rect.width * dpr));
  pad.height = Math.floor(220 * dpr);
  pctx = pad.getContext('2d');
  pctx.scale(dpr, dpr);
  pctx.lineWidth = 2.5;
  pctx.lineCap = 'round';
  pctx.lineJoin = 'round';
  pctx.strokeStyle = '#f2ecff';

  pad.addEventListener('pointerdown', (e) => {
    drawing = true;
    hasInk = true;
    last = rel(e);
    pad.setPointerCapture(e.pointerId);
  });
  pad.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const p = rel(e);
    pctx.beginPath();
    pctx.moveTo(last.x, last.y);
    pctx.lineTo(p.x, p.y);
    pctx.stroke();
    last = p;
  });
  const stop = () => { drawing = false; };
  pad.addEventListener('pointerup', stop);
  pad.addEventListener('pointercancel', stop);

  overlay.querySelector('[data-act="clear"]').onclick = () => {
    pctx.clearRect(0, 0, pad.width, pad.height);
    hasInk = false;
  };
  overlay.querySelector('[data-act="keep"]').onclick = keep;
  overlay.querySelector('[data-act="close"]').onclick = exit;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) exit();
  });
}

export function exit() {
  if (overlay) { overlay.remove(); overlay = null; }
}

function rel(e) {
  const r = pad.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function keep() {
  if (!hasInk) { toast('Sign first, then keep it.'); return; }
  // Trim to the ink's bounding box so it sits neatly on the page
  const trimmed = trimCanvas(pad);
  trimmed.toBlob((blob) => {
    const reader = new FileReader();
    reader.onload = () => {
      writeBinary('public/images/studio/signature.png', String(reader.result).split(',')[1]);
      toast('Signature kept. Publish to make it live.');
      refreshToolbar();
      exit();
    };
    reader.readAsDataURL(blob);
  }, 'image/png');
}

function trimCanvas(src) {
  const w = src.width, h = src.height;
  const data = src.getContext('2d').getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const out = document.createElement('canvas');
  if (!found) { out.width = 10; out.height = 10; return out; }
  const padPx = 12;
  out.width = maxX - minX + padPx * 2;
  out.height = maxY - minY + padPx * 2;
  out.getContext('2d').drawImage(src, minX - padPx, minY - padPx, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}
