/* Write mode — click any marked text and type. It saves back to the source file. */
import { readFile, writeText } from './store.js';
import { toast, refreshToolbar } from './studio.js';

let active = false;
const originals = new Map();

export function enter() {
  active = true;
  document.querySelectorAll('[data-studio-editable]').forEach((el) => {
    originals.set(el, el.innerHTML);
    el.contentEditable = 'true';
    el.spellcheck = true;
    el.addEventListener('blur', onBlur);
    el.addEventListener('keydown', onKey);
  });
  toast('Click any glowing text and type. Click away when done.');
}

export function exit() {
  active = false;
  document.querySelectorAll('[data-studio-editable]').forEach((el) => {
    el.contentEditable = 'false';
    el.removeEventListener('blur', onBlur);
    el.removeEventListener('keydown', onKey);
  });
  originals.clear();
}

function onKey(e) {
  if (e.key === 'Escape') e.target.blur();
}

async function onBlur(e) {
  const el = e.target;
  const before = originals.get(el);
  const after = el.innerHTML;
  if (before === after) return;
  originals.set(el, after);
  try {
    await saveEdit(el, after);
    toast('Saved. Publish to make it live.');
    refreshToolbar();
  } catch (err) {
    console.error(err);
    toast('Couldn\u2019t save that text: ' + err.message);
    el.innerHTML = before;
    originals.set(el, before);
  }
}

async function saveEdit(el, html) {
  const target = el.dataset.studioTarget; // "site.json:key" or "about.md:body"
  if (!target) throw new Error('Nothing to save to.');
  const [file, ...rest] = target.split(':');
  const what = rest.join(':');

  if (file.endsWith('.json')) {
    const path = `src/content/settings/${file}`;
    const text = await readFile(path);
    if (text == null) throw new Error('Could not read settings.');
    const obj = JSON.parse(text);
    obj[what] = htmlToText(html);
    writeText(path, JSON.stringify(obj, null, 2));
  } else if (file.endsWith('.md') && what === 'body') {
    const path = `src/content/pages/${file}`;
    const text = await readFile(path);
    if (text == null) throw new Error('Could not read page.');
    writeText(path, htmlToMarkdown(html));
  } else {
    throw new Error('Unknown edit target.');
  }
}

/** contenteditable HTML -> plain text (for single-line fields). */
function htmlToText(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent || '').trim().replace(/\s+/g, ' ');
}

/** contenteditable HTML -> simple markdown (for page bodies). */
function htmlToMarkdown(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  let out = '';
  for (const node of d.childNodes) {
    if (node.nodeType === 3) {
      const t = node.textContent.trim();
      if (t) out += t + '\n\n';
    } else if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      const t = (node.textContent || '').trim();
      if (!t) continue;
      if (tag === 'h2' || tag === 'h3') out += `## ${t}\n\n`;
      else if (tag === 'li') out += `- ${t}\n`;
      else out += `${t}\n\n`;
    }
  }
  return out.trim() + '\n';
}
