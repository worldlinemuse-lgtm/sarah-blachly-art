/* Content mode — Sarah edits her own words, directly.
   Bio page, artwork details, and which pieces are featured up front.
   No hunting for glowing text: everything is a plain form. */
import { readFile, writeText } from './store.js';
import { listDir } from './github.js';
import { toast, refreshToolbar } from './studio.js';

let overlay = null;

const CATEGORIES = [
  ['dragons', 'Dragons'],
  ['abstract', 'Abstract'],
  ['characters-ocs', 'Characters & OCs'],
  ['painting', 'Painting'],
  ['miscellaneous', 'Miscellaneous'],
];
const ART_DIR = 'src/content/artworks';
const ABOUT_PATH = 'src/content/pages/about.md';

export async function enter() {
  overlay = document.createElement('div');
  overlay.className = 'studio-overlay';
  overlay.innerHTML = `
    <div class="studio-card" style="max-width:560px; max-height:92vh; overflow:auto;">
      <h2>Your content</h2>
      <p>Edit your words directly. Nothing goes live until you publish.</p>

      <h3 style="margin-top:1.2rem;">Bio page</h3>
      <textarea data-bio rows="8" style="width:100%;" placeholder="Loading your bio…"></textarea>
      <div style="margin:0.4rem 0 0.2rem; text-align:right;">
        <button class="studio-btn studio-btn-primary" data-save-bio>Save bio</button>
      </div>

      <h3 style="margin-top:1.2rem;">Artwork details</h3>
      <label>Choose a piece
        <select data-artpick><option>Loading…</option></select>
      </label>
      <div data-artform hidden>
        <label>Title <input type="text" data-af="title" /></label>
        <label>Category <select data-af="series"></select></label>
        <label>Medium <input type="text" data-af="medium" placeholder="e.g. Acrylic on canvas" /></label>
        <label>Dimensions <input type="text" data-af="dimensions" placeholder="e.g. 24 x 36 in" /></label>
        <label>Description <textarea data-af="description" rows="3"></textarea></label>
        <div style="margin:0.4rem 0 0.2rem; text-align:right;">
          <button class="studio-btn studio-btn-primary" data-save-art>Save details</button>
        </div>
      </div>

      <h3 style="margin-top:1.2rem;">Featured on the front page</h3>
      <p style="font-size:0.9rem;">Tick the pieces you want visitors to see first.</p>
      <div data-featured style="display:flex; flex-direction:column; gap:0.35rem;">Loading…</div>
      <div style="margin:0.4rem 0 0.2rem; text-align:right;">
        <button class="studio-btn studio-btn-primary" data-save-featured>Save featured</button>
      </div>

      <div class="studio-card-actions" style="margin-top:1rem;">
        <button class="studio-btn" data-act="close">Close</button>
      </div>
      <p class="studio-error" hidden></p>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('[data-act="close"]').onclick = exit;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) exit(); });

  const err = overlay.querySelector('.studio-error');
  const fail = (m) => { err.hidden = false; err.textContent = m; };

  // ---- Bio ----
  const bioArea = overlay.querySelector('[data-bio]');
  try {
    const raw = await readFile(ABOUT_PATH);
    bioArea.value = raw == null ? '' : parseFM(raw).body.trim();
  } catch (e) { fail('Could not load your bio: ' + e.message); }
  overlay.querySelector('[data-save-bio]').onclick = async () => {
    err.hidden = true;
    try {
      const raw = await readFile(ABOUT_PATH);
      const { data, order } = raw == null ? { data: {}, order: [] } : parseFM(raw);
      writeText(ABOUT_PATH, stringifyFM(data, bioArea.value.trim() + '\n', order));
      toast('Bio saved. Publish to make it live.');
      refreshToolbar();
    } catch (e) { fail('Could not save your bio: ' + e.message); }
  };

  // ---- Artworks ----
  let files = [];
  try {
    files = (await listDir(ART_DIR)).filter((f) => f.name.endsWith('.md'));
  } catch (e) { fail('Could not list your artworks: ' + e.message); return; }

  const pick = overlay.querySelector('[data-artpick]');
  const form = overlay.querySelector('[data-artform]');
  const seriesSel = overlay.querySelector('[data-af="series"]');
  seriesSel.innerHTML = CATEGORIES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');

  const items = [];
  for (const f of files) {
    try {
      const raw = await readFile(`${ART_DIR}/${f.name}`);
      const { data } = parseFM(raw || '');
      items.push({ name: f.name, title: data.title || f.name.replace(/\.md$/, '').replace(/-/g, ' '), data, raw: raw || '' });
    } catch { /* skip unreadable */ }
  }
  items.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  pick.innerHTML = items.map((it, i) => `<option value="${i}">${escapeHtml(it.title)}</option>`).join('');

  const featBox = overlay.querySelector('[data-featured]');
  featBox.innerHTML = items.map((it, i) => `
    <label style="display:flex; gap:0.5rem; align-items:center; font-weight:normal;">
      <input type="checkbox" data-feat="${i}" ${it.data.featured ? 'checked' : ''} />
      ${escapeHtml(it.title)}
    </label>`).join('') || '<p>No artworks yet.</p>';

  const loadArt = () => {
    const it = items[parseInt(pick.value, 10)];
    if (!it) { form.hidden = true; return; }
    form.hidden = false;
    const v = (k) => (it.data[k] == null ? '' : String(it.data[k]));
    overlay.querySelector('[data-af="title"]').value = v('title');
    seriesSel.value = v('series') || 'miscellaneous';
    overlay.querySelector('[data-af="medium"]').value = v('medium');
    overlay.querySelector('[data-af="dimensions"]').value = v('dimensions');
    overlay.querySelector('[data-af="description"]').value = v('description');
  };
  pick.onchange = loadArt;
  loadArt();

  overlay.querySelector('[data-save-art]').onclick = async () => {
    err.hidden = true;
    const it = items[parseInt(pick.value, 10)];
    if (!it) return;
    const g = (k) => overlay.querySelector(`[data-af="${k}"]`).value.trim();
    const title = g('title');
    if (!title) return fail('Give it a title first.');
    const { data, body, order } = parseFM(it.raw);
    data.title = title;
    data.series = seriesSel.value;
    data.medium = g('medium');
    data.dimensions = g('dimensions');
    data.description = g('description');
    writeText(`${ART_DIR}/${it.name}`, stringifyFM(data, body, order));
    it.data = data;
    toast('Details saved. Publish to make it live.');
    refreshToolbar();
  };

  overlay.querySelector('[data-save-featured]').onclick = () => {
    err.hidden = true;
    featBox.querySelectorAll('[data-feat]').forEach((cb) => {
      const it = items[parseInt(cb.dataset.feat, 10)];
      const { data, body, order } = parseFM(it.raw);
      data.featured = cb.checked;
      const text = stringifyFM(data, body, order);
      writeText(`${ART_DIR}/${it.name}`, text);
      it.raw = text;
      it.data = data;
    });
    toast('Featured picks saved. Publish to make it live.');
    refreshToolbar();
  };
}

export function exit() {
  if (overlay) { overlay.remove(); overlay = null; }
}

/* Minimal frontmatter parse/stringify — our files are simple `key: value` maps. */
function parseFM(text) {
  const m = String(text).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: String(text), order: [] };
  const data = {}, order = [];
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    if (!k || k in data) continue;
    let v = line.slice(i + 1).trim();
    try { v = JSON.parse(v); }
    catch {
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    }
    data[k] = v;
    order.push(k);
  }
  return { data, body: m[2], order };
}

function stringifyFM(data, body, order = []) {
  const keys = [...order.filter((k) => k in data), ...Object.keys(data).filter((k) => !order.includes(k))];
  const head = keys.map((k) => `${k}: ${JSON.stringify(data[k])}`).join('\n');
  return `---\n${head}\n---\n\n${body}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
