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
  ['beginnings', 'Beginnings'],
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

      <h3 style="margin-top:1.2rem;">Categories</h3>
      <p style="font-size:0.9rem;">The short line under each category name on your Work page.</p>
      <div data-cats>Loading…</div>
      <div style="margin:0.4rem 0 0.2rem; text-align:right;">
        <button class="studio-btn studio-btn-primary" data-save-cats>Save categories</button>
      </div>

      <h3 style="margin-top:1.2rem;">Visitor traces (Memory garden)</h3>
      <p style="font-size:0.9rem;">Words visitors leave behind. Nothing appears on the site until <em>you</em> approve it here and publish.</p>
      <div data-traces style="display:flex; flex-direction:column; gap:0.35rem;">Loading…</div>
      <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
        <input type="text" data-trace-add placeholder="Approve a word…" style="flex:1;" maxlength="40" />
        <button class="studio-btn" data-trace-addbtn>Add</button>
      </div>
      <div style="margin:0.4rem 0 0.2rem; text-align:right;">
        <button class="studio-btn studio-btn-primary" data-save-traces>Save traces</button>
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
      const body = bioArea.value.trim() + '\n';
      // Auto-reveal About sections Sarah has actually filled in. A section
      // becomes visible on the public page once its placeholder text is
      // gone; the flags are re-derived on every save so they always tell
      // the truth. She never manages them by hand.
      data.bio_ready = !body.includes('Your bio goes here');
      data.statement_ready = !body.includes('Your artist statement goes here');
      data.cv_ready = !body.includes('will be listed here as they come');
      writeText(ABOUT_PATH, stringifyFM(data, body, order));
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
    const text = stringifyFM(data, body, order);
    writeText(`${ART_DIR}/${it.name}`, text);
    it.raw = text;
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

  // ---- Categories (series descriptions) ----
  const SERIES_DIR = 'src/content/series';
  const catsBox = overlay.querySelector('[data-cats]');
  const catItems = [];
  try {
    for (const [value, label] of CATEGORIES) {
      const path = `${SERIES_DIR}/${value}.md`;
      let desc = '', raw = null, data = {}, order = [];
      try {
        raw = await readFile(path);
        if (raw != null) {
          const parsed = parseFM(raw);
          data = parsed.data; order = parsed.order;
          desc = data.description == null ? '' : String(data.description);
        }
      } catch { /* leave blank; save will create it */ }
      catItems.push({ value, label, path, desc, raw, data, order });
    }
    catsBox.innerHTML = catItems.map((c, i) => `
      <label style="display:block; margin-bottom:0.6rem; font-weight:normal;">
        <strong>${escapeHtml(c.label)}</strong>
        <textarea data-cat="${i}" rows="2" style="width:100%;" placeholder="A line about this category…">${escapeHtml(c.desc)}</textarea>
      </label>`).join('');
  } catch (e) { catsBox.innerHTML = '<p>Could not load categories.</p>'; }
  overlay.querySelector('[data-save-cats]').onclick = () => {
    err.hidden = true;
    let changed = 0;
    catsBox.querySelectorAll('[data-cat]').forEach((ta) => {
      const c = catItems[parseInt(ta.dataset.cat, 10)];
      const v = ta.value.trim();
      if (v === c.desc) return; // untouched — don't dirty the file
      c.data.description = v;
      if (!c.data.title) c.data.title = c.label;
      const text = stringifyFM(c.data, '', c.order);
      writeText(c.path, text);
      c.desc = v;
      changed++;
    });
    toast(changed ? 'Categories saved. Publish to make them live.' : 'No category changes.');
    refreshToolbar();
  };

  // ---- Visitor traces (Memory garden approvals) ----
  const TRACES_PATH = 'public/traces.json';
  let traces = [];
  const tracesBox = overlay.querySelector('[data-traces]');
  const renderTraces = () => {
    tracesBox.innerHTML = traces.length
      ? traces.map((t, i) => `
        <label style="display:flex; gap:0.5rem; align-items:center; font-weight:normal;">
          <input type="checkbox" data-trace="${i}" checked />
          ${escapeHtml(t)}
        </label>`).join('')
      : '<p>No traces yet. Visitor submissions arrive by email — tick nothing, just add the ones you approve below.</p>';
  };
  try {
    const raw = await readFile(TRACES_PATH);
    const parsed = raw == null ? [] : JSON.parse(raw);
    traces = Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : [];
  } catch { traces = []; }
  renderTraces();
  overlay.querySelector('[data-trace-addbtn]').onclick = () => {
    const input = overlay.querySelector('[data-trace-add]');
    const v = input.value.trim().slice(0, 40);
    if (!v) return;
    if (!traces.includes(v)) traces.push(v);
    input.value = '';
    renderTraces();
  };
  overlay.querySelector('[data-save-traces]').onclick = () => {
    err.hidden = true;
    const kept = [];
    tracesBox.querySelectorAll('[data-trace]').forEach((cb) => {
      if (cb.checked) kept.push(traces[parseInt(cb.dataset.trace, 10)]);
    });
    traces = kept;
    writeText(TRACES_PATH, JSON.stringify(traces, null, 2) + '\n');
    renderTraces();
    toast('Traces saved. Publish to make them live.');
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
