/* Add mode — a new artwork, start to finish, without leaving the gallery. */
import { writeText, writeBinary, readFile } from './store.js';
import { toast, refreshToolbar, publishNow } from './studio.js';

let overlay = null;

/* The canonical categories — always the full list, on every page. */
const CATEGORIES = [
  ['dragons', 'Dragons'],
  ['abstract', 'Abstract'],
  ['characters-ocs', 'Characters & OCs'],
  ['painting', 'Painting'],
  ['miscellaneous', 'Miscellaneous'],
];

export function enter() {
  const options = CATEGORIES
    .map(([v, l]) => `<option value="${v}">${l}</option>`)
    .join('');

  overlay = document.createElement('div');
  overlay.className = 'studio-overlay';
  overlay.innerHTML = `
    <div class="studio-card" style="max-width:480px; max-height:90vh; overflow:auto;">
      <h2>Add an artwork</h2>
      <div class="studio-form">
        <label>Photo of the artwork
          <input type="file" accept="image/*" data-f="image" />
          <img class="studio-preview" hidden />
        </label>
        <label>Title <input type="text" data-f="title" placeholder="e.g. Night Dragon" /></label>
        <label>Year <input type="number" data-f="year" value="${new Date().getFullYear()}" /></label>
        <label>Category <select data-f="series">${options}</select></label>
        <label>Medium <input type="text" data-f="medium" placeholder="e.g. Acrylic on canvas" /></label>
        <label>Dimensions <input type="text" data-f="dimensions" placeholder="e.g. 24 x 36 in" /></label>
        <label>Description <textarea data-f="description" rows="3" placeholder="Anything you'd like to say about it"></textarea></label>
        <label>Alt text <input type="text" data-f="alt" placeholder="Describe it for screen readers" /></label>
      </div>
      <div class="studio-card-actions">
        <button class="studio-btn studio-btn-primary" data-act="save">Add it</button>
        <button class="studio-btn" data-act="close">Cancel</button>
      </div>
      <p class="studio-error" hidden></p>
    </div>`;
  document.body.appendChild(overlay);

  const fileInput = overlay.querySelector('[data-f="image"]');
  const preview = overlay.querySelector('.studio-preview');
  let imageData = null, imageExt = 'jpg';

  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    if (!f) return;
    // SVG can carry scripts — only raster photos are safe to publish.
    const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!okTypes.includes(f.type) || ['svg', 'svgz'].includes(ext)) {
      fileInput.value = '';
      toast('Please choose a photo (JPG or PNG) — not an SVG file.');
      return;
    }
    imageExt = ext === 'jpeg' ? 'jpg' : (ext || 'jpg');
    const reader = new FileReader();
    reader.onload = () => {
      imageData = String(reader.result).split(',')[1];
      preview.src = reader.result;
      preview.hidden = false;
    };
    reader.readAsDataURL(f);
  });

  const err = overlay.querySelector('.studio-error');
  overlay.querySelector('[data-act="close"]').onclick = exit;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) exit();
  });
  overlay.querySelector('[data-act="save"]').onclick = async () => {
    err.hidden = true;
    const v = (name) => overlay.querySelector(`[data-f="${name}"]`).value.trim();
    const title = v('title');
    if (!title) return fail('Give it a title first.');
    if (!imageData) return fail('Choose a photo of the artwork first.');

    const slug = slugify(title);
    const year = parseInt(v('year'), 10) || new Date().getFullYear();
    try {
      // 1. the image
      const imgPath = `src/assets/uploads/${slug}.${imageExt}`;
      writeBinary(imgPath, imageData);
      // 2. the artwork file
      const fm = [
        '---',
        `title: ${q(title)}`,
        `year: ${year}`,
        v('medium') ? `medium: ${q(v('medium'))}` : null,
        v('dimensions') ? `dimensions: ${q(v('dimensions'))}` : null,
        `series: ${v('series')}`,
        `featured: false`,
        `order: 999`,
        `image: ../../assets/uploads/${slug}.${imageExt}`,
        v('description') ? `description: ${q(v('description'))}` : null,
        `alt: ${q(v('alt') || title)}`,
        '---',
        '',
        v('description') || '',
        '',
      ].filter((l) => l !== null).join('\n');
      writeText(`src/content/artworks/${slug}.md`, fm);
      refreshToolbar();
      exit();
      showAdded(title);
    } catch (e) {
      console.error(e);
      fail('Couldn\u2019t add it: ' + e.message);
    }
    function fail(m) { err.hidden = false; err.textContent = m; }
  };
}

/* After adding: offer Publish right here, so she never hunts for it. */
function showAdded(title) {
  const card = document.createElement('div');
  card.className = 'studio-overlay';
  card.innerHTML = `
    <div class="studio-card" style="max-width:420px; text-align:center;">
      <h2>“${escapeHtml(title)}” is ready</h2>
      <p>It's saved in your Studio. Publish now to put it on your site,<br/>or keep editing and publish everything later.</p>
      <div class="studio-card-actions" style="justify-content:center;">
        <button class="studio-btn studio-btn-primary" data-act="pub">Publish now</button>
        <button class="studio-btn" data-act="later">Keep editing</button>
      </div>
    </div>`;
  document.body.appendChild(card);
  card.querySelector('[data-act="later"]').onclick = () => card.remove();
  card.querySelector('[data-act="pub"]').onclick = async () => {
    card.remove();
    await publishNow();
  };
  card.addEventListener('click', (e) => {
    if (e.target === card) card.remove();
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function exit() {
  if (overlay) { overlay.remove(); overlay = null; }
}

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';
}

function q(s) {
  return JSON.stringify(s);
}
