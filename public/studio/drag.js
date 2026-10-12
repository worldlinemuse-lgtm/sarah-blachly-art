/* Arrange mode — hang the gallery like a physical one.
   Drag cards to reorder; drop on another category to move them there. */
import { readFile } from './store.js';
import { setFmField } from './fm.js';
import * as store from './store.js';
import { toast, refreshToolbar } from './studio.js';

let index = null; // slug -> { file, series, order, title }
let active = false;
let dragState = null;

function loadIndex() {
  const tag = document.getElementById('studio-artwork-index');
  if (!tag) return null;
  const arr = JSON.parse(tag.textContent);
  const map = new Map();
  for (const a of arr) map.set(a.slug, a);
  return map;
}

export function enter() {
  index = loadIndex();
  if (!index) {
    toast('Arrange works on the Work page.');
    return;
  }
  active = true;
  document.querySelectorAll('[data-studio-card]').forEach((card) => {
    card.addEventListener('pointerdown', onPointerDown);
    card.addEventListener('click', killClick, true);
  });
  toast('Drag artworks to rearrange. Drop on a category title to move them.');
}

export function exit() {
  active = false;
  document.querySelectorAll('[data-studio-card]').forEach((card) => {
    card.removeEventListener('pointerdown', onPointerDown);
    card.removeEventListener('click', killClick, true);
  });
  cancelDrag();
}

function killClick(e) {
  // In arrange mode, cards don't navigate — they drag.
  e.preventDefault();
  e.stopPropagation();
}

function onPointerDown(e) {
  if (!active) return;
  if (e.button !== undefined && e.button !== 0) return;
  const card = e.currentTarget;
  const startX = e.clientX, startY = e.clientY;
  let dragging = false;

  const move = (ev) => {
    if (!dragging) {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 8) return;
      dragging = true;
      startDrag(card, ev);
    }
    moveDrag(ev);
  };
  const up = (ev) => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    if (dragging) finishDrag(ev);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

function startDrag(card, e) {
  const rect = card.getBoundingClientRect();
  const ghost = card.cloneNode(true);
  ghost.className = 'studio-dragging';
  ghost.style.position = 'fixed';
  ghost.style.left = rect.left + 'px';
  ghost.style.top = rect.top + 'px';
  ghost.style.width = rect.width + 'px';
  ghost.style.margin = '0';
  document.body.appendChild(ghost);
  card.style.opacity = '0.25';
  dragState = {
    card,
    ghost,
    slug: card.dataset.studioCard,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
    target: null, // { type: 'before'|'after'|'series', el, series }
  };
  document.body.style.userSelect = 'none';
}

function moveDrag(e) {
  const s = dragState;
  if (!s) return;
  s.ghost.style.left = e.clientX - s.offsetX + 'px';
  s.ghost.style.top = e.clientY - s.offsetY + 'px';

  // What are we hovering?
  s.ghost.style.display = 'none';
  const under = document.elementFromPoint(e.clientX, e.clientY);
  s.ghost.style.display = '';
  clearTargets();

  const cardUnder = under && under.closest ? under.closest('[data-studio-card]') : null;
  const seriesTitle = under && under.closest ? under.closest('[data-studio-series-title]') : null;

  if (cardUnder && cardUnder !== s.card) {
    const r = cardUnder.getBoundingClientRect();
    const before = e.clientY < r.top + r.height / 2;
    cardUnder.classList.add('studio-drop-target');
    s.target = { type: before ? 'before' : 'after', el: cardUnder };
  } else if (seriesTitle) {
    seriesTitle.classList.add('studio-drop-target');
    const section = seriesTitle.closest('[data-studio-series]');
    s.target = { type: 'series', el: seriesTitle, series: section.dataset.studioSeries };
  } else {
    s.target = null;
  }
}

function clearTargets() {
  document.querySelectorAll('.studio-drop-target').forEach((el) => el.classList.remove('studio-drop-target'));
}

function cancelDrag() {
  if (!dragState) return;
  dragState.ghost.remove();
  dragState.card.style.opacity = '';
  document.body.style.userSelect = '';
  clearTargets();
  dragState = null;
}

async function finishDrag(e) {
  const s = dragState;
  const target = s.target;
  // snapshot before cleanup
  const card = s.card, slug = s.slug;
  cancelDrag();
  if (!target) return;

  try {
    if (target.type === 'series') {
      await moveToSeries(slug, target.series);
      toast('Moved. Publish to make it live.');
    } else {
      await reorder(card, slug, target);
      toast('Rearranged. Publish to make it live.');
    }
    refreshToolbar();
  } catch (err) {
    console.error(err);
    toast('Couldn\u2019t save that move: ' + err.message);
  }
}

async function moveToSeries(slug, newSeries) {
  const info = index.get(slug);
  if (!info || info.series === newSeries) return;
  const oldSeries = info.series;
  await setFmField(store, info.file, 'series', newSeries);
  info.series = newSeries;
  // Move the DOM card into the new section's gallery
  const card = document.querySelector(`[data-studio-card="${slug}"]`);
  const gallery = document.querySelector(`[data-studio-series="${newSeries}"] [data-gallery]`);
  if (card && gallery) {
    gallery.appendChild(card);
    await renumberSeries(newSeries);
    await renumberSeries(oldSeries);
  }
}

async function reorder(card, slug, target) {
  // Insert the DOM node at the drop position first
  const targetCard = target.el;
  if (target.type === 'before') targetCard.parentNode.insertBefore(card, targetCard);
  else targetCard.parentNode.insertBefore(card, targetCard.nextSibling);

  // Figure out which series this gallery belongs to
  const section = card.closest('[data-studio-series]');
  const series = section ? section.dataset.studioSeries : (index.get(slug) || {}).series;

  // If it crossed into another gallery, update series too
  const info = index.get(slug);
  const oldSeries = info ? info.series : null;
  if (info && info.series !== series) {
    await setFmField(store, info.file, 'series', series);
    info.series = series;
  }
  await renumberSeries(series);
  if (oldSeries && oldSeries !== series) await renumberSeries(oldSeries);
}

async function renumberSeries(series) {
  const section = document.querySelector(`[data-studio-series="${series}"]`);
  if (!section) return;
  const cards = [...section.querySelectorAll('[data-studio-card]')];
  for (let i = 0; i < cards.length; i++) {
    const slug = cards[i].dataset.studioCard;
    const info = index.get(slug);
    if (!info) continue;
    if (info.order !== i) {
      await setFmField(store, info.file, 'order', i);
      info.order = i;
    }
  }
}
