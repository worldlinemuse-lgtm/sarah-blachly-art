/* Sign mode — Sarah signs with her finger or mouse.
   Her signature lands on her artwork pages, like signing a canvas.
   After drawing, she picks exactly where it sits on the artwork. */
import { writeBinary, writeText, readFile } from './store.js';
import { toast, refreshToolbar } from './studio.js';

let overlay = null, pad = null, pctx = null;
let drawing = false, last = null;
let hasInk = false;
let sigDataUrl = null;

const POSITIONS = [
  ['top-left', 'Top left'], ['top-center', 'Top center'], ['top-right', 'Top right'],
  ['middle-left', 'Middle left'], ['center', 'Center'], ['middle-right', 'Middle right'],
  ['bottom-left', 'Bottom left'], ['bottom-center', 'Bottom center'], ['bottom-right', 'Bottom right'],
];

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
  sigDataUrl = trimmed.toDataURL('image/png');
  trimmed.toBlob((blob) => {
    const reader = new FileReader();
    reader.onload = () => {
      sigDataUrl = String(reader.result);
      showPlacement(sigDataUrl);
    };
    reader.readAsDataURL(blob);
  }, 'image/png');
}

/* Step 2: she puts the signature exactly where she wants it on the artwork. */
function showPlacement(dataUrl) {
  overlay.remove();
  const base64 = dataUrl.split(',')[1];
  let position = 'bottom-right';
  let size = 160;

  overlay = document.createElement('div');
  overlay.className = 'studio-overlay';
  overlay.innerHTML = `
    <div class="studio-card" style="max-width:560px;">
      <h2>Place your signature</h2>
      <p>Tap where it should sit on your artwork. Drag the slider for size.</p>
      <div data-stage style="position:relative; border-radius:12px; overflow:hidden; margin:0.75rem 0;
           background:linear-gradient(160deg,#1a2440 0%,#243b2e 60%,#101a14 100%); aspect-ratio:4/3;">
        <img data-sig src="${dataUrl}" alt="Your signature"
             style="position:absolute; max-width:${size}px; opacity:0.95; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.6)); pointer-events:none;" />
      </div>
      <div data-grid style="display:grid; grid-template-columns:repeat(3, 52px); gap:6px; justify-content:center; margin-bottom:0.75rem;"></div>
      <label style="display:flex; gap:0.75rem; align-items:center; justify-content:center;">
        Size <input data-size type="range" min="80" max="320" value="160" style="width:180px;" />
      </label>
      <div class="studio-card-actions" style="margin-top:1rem;">
        <button class="studio-btn" data-act="back">Back</button>
        <button class="studio-btn studio-btn-primary" data-act="done">Keep it here</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const stage = overlay.querySelector('[data-stage]');
  const sig = overlay.querySelector('[data-sig]');
  const grid = overlay.querySelector('[data-grid]');

  const POS_CSS = {
    'top-left':      { top: '6%', left: '5%' },
    'top-center':    { top: '6%', left: '50%', transform: 'translateX(-50%)' },
    'top-right':     { top: '6%', right: '5%' },
    'middle-left':   { top: '50%', left: '5%', transform: 'translateY(-50%)' },
    'center':        { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' },
    'middle-right':  { top: '50%', right: '5%', transform: 'translateY(-50%)' },
    'bottom-left':   { bottom: '6%', left: '5%' },
    'bottom-center': { bottom: '6%', left: '50%', transform: 'translateX(-50%)' },
    'bottom-right':  { bottom: '6%', right: '5%' },
  };

  const place = () => {
    const css = POS_CSS[position];
    sig.style.top = css.top || 'auto';
    sig.style.bottom = css.bottom || 'auto';
    sig.style.left = css.left || 'auto';
    sig.style.right = css.right || 'auto';
    sig.style.transform = css.transform || 'none';
  };

  for (const [id, label] of POSITIONS) {
    const b = document.createElement('button');
    b.className = 'studio-tool' + (id === position ? ' active' : '');
    b.textContent = '·';
    b.title = label;
    b.setAttribute('aria-label', label);
    b.style.cssText = 'width:52px;height:40px;font-size:1.4rem;line-height:1;';
    b.onclick = () => {
      position = id;
      grid.querySelectorAll('.studio-tool').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      place();
    };
    grid.appendChild(b);
  }
  overlay.querySelector('[data-size]').oninput = (e) => {
    size = parseInt(e.target.value, 10);
    sig.style.maxWidth = size + 'px';
  };
  overlay.querySelector('[data-act="back"]').onclick = () => { overlay.remove(); overlay = null; enter(); };
  overlay.querySelector('[data-act="done"]').onclick = async () => {
    try {
      writeBinary('public/images/studio/signature.png', base64);
      const raw = await readFile('src/content/settings/site.json');
      const settings = raw ? JSON.parse(raw) : {};
      settings.signature = { position, size };
      writeText('src/content/settings/site.json', JSON.stringify(settings, null, 2));
      toast('Signature placed. Publish to make it live.');
      refreshToolbar();
      overlay.remove();
      overlay = null;
    } catch (e) {
      console.error(e);
      toast('Could not keep it: ' + e.message);
    }
  };
  place();
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
