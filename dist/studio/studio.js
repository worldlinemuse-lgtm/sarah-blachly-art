/* The Studio — Sarah's editing world. The site becomes her studio wall. */
import { getToken, setToken, verifyToken, commitFiles } from './github.js';
import { pendingChanges, hasChanges, discardChanges, summarize, changeCount } from './store.js';

const modes = new Map(); // id -> { label, enter, exit }
let activeMode = null;
let studioOn = false;

export function registerMode(id, def) {
  modes.set(id, def);
}

export function isStudioOn() {
  return studioOn;
}

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

/* ---------- login ---------- */

async function ensureLogin() {
  if (getToken()) {
    try {
      await verifyToken();
      return true;
    } catch {
      // token dead — ask again
    }
  }
  return promptForToken();
}

function promptForToken() {
  return new Promise((resolve) => {
    const overlay = el(`
      <div class="studio-overlay">
        <div class="studio-card">
          <h2>Welcome to your Studio</h2>
          <p>Paste your studio code below. You only do this once —<br/>your browser remembers it after that.</p>
          <input type="password" class="studio-token-input" placeholder="Paste your studio code here" autocomplete="off" />
          <div class="studio-card-actions">
            <button class="studio-btn studio-btn-primary">Enter Studio</button>
            <button class="studio-btn">Not now</button>
          </div>
          <p class="studio-error" hidden></p>
        </div>
      </div>`);
    document.body.appendChild(overlay);
    const input = overlay.querySelector('input');
    const err = overlay.querySelector('.studio-error');
    const [enterBtn, cancelBtn] = overlay.querySelectorAll('button');
    input.focus();

    const done = (ok) => {
      overlay.remove();
      resolve(ok);
    };
    cancelBtn.onclick = () => done(false);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) done(false);
    });
    const submit = async () => {
      const t = input.value.trim();
      if (!t) {
        err.hidden = false;
        err.textContent = 'Please paste your studio code first.';
        input.focus();
        return;
      }
      enterBtn.disabled = true;
      enterBtn.textContent = 'Checking…';
      setToken(t);
      try {
        await verifyToken();
        done(true);
      } catch (e) {
        err.hidden = false;
        err.textContent = 'That code didn\u2019t work — check it and try again.';
        enterBtn.disabled = false;
        enterBtn.textContent = 'Enter Studio';
      }
    };
    enterBtn.onclick = submit;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
  });
}

/* ---------- toolbar ---------- */

function buildToolbar() {
  const bar = el(`<div class="studio-toolbar" hidden></div>`);
  const buttons = [
    ['arrange', 'Arrange'],
    ['paint', 'Paint'],
    ['write', 'Write'],
    ['sign', 'Sign'],
    ['add', 'Add art'],
  ];
  for (const [id, label] of buttons) {
    const b = el(`<button class="studio-tool" data-mode="${id}">${label}</button>`);
    b.onclick = () => setMode(activeMode === id ? null : id);
    bar.appendChild(b);
  }
  const pub = el(`<button class="studio-tool studio-publish" disabled>Publish</button>`);
  pub.onclick = publish;
  bar.appendChild(pub);
  const exit = el(`<button class="studio-tool studio-exit">Done</button>`);
  exit.onclick = exitStudio;
  bar.appendChild(exit);
  document.body.appendChild(bar);
  return bar;
}

let toolbar = null;

export function refreshToolbar() {
  if (!toolbar) return;
  toolbar.querySelectorAll('[data-mode]').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === activeMode);
  });
  const pub = toolbar.querySelector('.studio-publish');
  const n = changeCount();
  pub.disabled = n === 0;
  pub.textContent = n === 0 ? 'Publish' : `Publish (${n})`;
}

export function setMode(id) {
  if (activeMode && modes.has(activeMode)) {
    try { modes.get(activeMode).exit(); } catch (e) { console.warn(e); }
  }
  activeMode = id;
  document.body.dataset.studioMode = id || '';
  if (id && modes.has(id)) {
    try { modes.get(id).enter(); } catch (e) { console.warn(e); toast('Something went wrong entering that tool.'); }
  }
  refreshToolbar();
}

/* ---------- publish ---------- */

async function publish() {
  if (!hasChanges()) return;
  const lines = summarize();
  const ok = await confirmDialog(
    'Publish your changes?',
    lines.map((l) => `<li>${escapeHtml(l)}</li>`).join(''),
    'Your site rebuilds and goes live in about a minute.'
  );
  if (!ok) return;
  toast('Publishing…');
  try {
    await commitFiles(pendingChanges(), 'Studio: Sarah\u2019s edits');
    discardChanges();
    refreshToolbar();
    setMode(null);
    toast('Published! Your site will update in about a minute.');
  } catch (e) {
    console.error(e);
    toast('Publish failed: ' + e.message);
  }
}

function confirmDialog(title, listHtml, sub, yesLabel = 'Publish', noLabel = 'Keep editing') {
  return new Promise((resolve) => {
    const overlay = el(`
      <div class="studio-overlay">
        <div class="studio-card">
          <h2>${escapeHtml(title)}</h2>
          <ul class="studio-changes">${listHtml}</ul>
          <p>${escapeHtml(sub)}</p>
          <div class="studio-card-actions">
            <button class="studio-btn studio-btn-primary">${escapeHtml(yesLabel)}</button>
            <button class="studio-btn">${escapeHtml(noLabel)}</button>
          </div>
        </div>
      </div>`);
    document.body.appendChild(overlay);
    const [yes, no] = overlay.querySelectorAll('button');
    yes.onclick = () => { overlay.remove(); resolve(true); };
    no.onclick = () => { overlay.remove(); resolve(false); };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); resolve(false); }
    });
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function toast(msg) {
  let t = document.querySelector('.studio-toast');
  if (!t) {
    t = el(`<div class="studio-toast"></div>`);
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ---------- entry / exit ---------- */

export async function enterStudio() {
  const ok = await ensureLogin();
  if (!ok) return;
  studioOn = true;
  document.body.classList.add('studio-on');
  if (!toolbar) toolbar = buildToolbar();
  toolbar.hidden = false;
  refreshToolbar();
  toast('Studio on — pick a tool below.');
}

export function exitStudio() {
  if (hasChanges()) {
    confirmDialog(
      'Leave the Studio?',
      `<li>You have ${changeCount()} unpublished change(s).</li>`,
      'Publish them now, or leave — they\u2019ll stay here until you reload the page.',
      'Publish now',
      'Leave'
    ).then(async (ok) => {
      if (ok) {
        await publish();
        if (!hasChanges()) doExit();
      } else {
        doExit();
      }
    });
    return;
  }
  doExit();
}

function doExit() {
  setMode(null);
  studioOn = false;
  document.body.classList.remove('studio-on');
  if (toolbar) toolbar.hidden = true;
}

// Auto-wire the footer "Studio" link (module may load after DOMContentLoaded)
function wireEnter() {
  document.querySelectorAll('[data-studio-enter]').forEach((a) => {
    if (a._studioWired) return;
    a._studioWired = true;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      enterStudio();
    });
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireEnter);
} else {
  wireEnter();
}
