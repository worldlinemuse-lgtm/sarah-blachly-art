/* Studio store — every edit lands here first, then Publish sends them all at once. */
import { getFile } from './github.js';

const cache = new Map(); // path -> content string (or null if new file)
const dirty = new Map(); // path -> { path, content, encoding }

export async function readFile(path) {
  if (!cache.has(path)) {
    const f = await getFile(path);
    cache.set(path, f ? f.content : null);
  }
  return cache.get(path);
}

/** Stage a text change. */
export function writeText(path, content) {
  cache.set(path, content);
  dirty.set(path, { path, content, encoding: 'utf8' });
}

/** Stage a binary change (base64, no data: prefix). */
export function writeBinary(path, base64) {
  dirty.set(path, { path, content: base64, encoding: 'base64' });
}

export function pendingChanges() {
  return [...dirty.values()];
}

export function changeCount() {
  return dirty.size;
}

export function hasChanges() {
  return dirty.size > 0;
}

export function discardChanges() {
  dirty.clear();
}

/** Human summary for the Publish confirmation. */
export function summarize() {
  const lines = [];
  for (const { path } of dirty.values()) {
    if (path.includes('/artworks/')) lines.push('Artwork updated: ' + fileLabel(path));
    else if (path.includes('site.json')) lines.push('Site wording & colors updated');
    else if (path.includes('about.md')) lines.push('About page updated');
    else if (path.includes('background.png')) lines.push('Background repainted');
    else if (path.includes('signature.png')) lines.push('Signature updated');
    else lines.push('Updated: ' + path);
  }
  return lines;
}

function fileLabel(path) {
  const m = path.match(/([^/]+)\.md$/);
  return m ? m[1].replace(/-/g, ' ') : path;
}
