/* Add mode — a new artwork, start to finish, without leaving the gallery. */
import { writeText, writeBinary, readFile } from './store.js';
import { toast, refreshToolbar } from './studio.js';

let overlay = null;

const FALLBACK_SERIES = [
  ['dragons', 'Dragons'],
  ['abstract', 'Abstract'],
  ['characters-ocs', 'Characters & OCs'],
  ['painting', 'Painting'],
  ['miscellaneous', 'Miscellaneous'],
];

export function enter() {
  const series = [...document.querySelectorAll('[data-studio-series]')].map((s) => {
    const key = s.dataset.studioSeries;
    const titleEl = s.querySelector('[data-studio-series-title]');
    return [key, titleEl ? titleEl.textContent.trim() : key];
  });
  const options = (series.length ? series : FALLBACK_SERIES)
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
    imageExt = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
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
      toast(`“${title}” added. Publish to make it live.`);
      refreshToolbar();
      exit();
    } catch (e) {
      console.error(e);
      fail('Couldn\u2019t add it: ' + e.message);
    }
    function fail(m) { err.hidden = false; err.textContent = m; }
  };
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
