/* Minimal frontmatter read/write — handles the simple key: value files we use. */

export function parseFm(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      try { v = JSON.parse(v); } catch { v = v.slice(1, -1); }
    } else if (/^-?\d+$/.test(v)) v = parseInt(v, 10);
    else if (/^-?\d*\.\d+$/.test(v)) v = parseFloat(v);
    else if (v === 'true') v = true;
    else if (v === 'false') v = false;
    data[k] = v;
  }
  return { data, body: m[2] || '' };
}

export function stringifyFm(data, body) {
  const lines = Object.entries(data).map(([k, v]) => {
    let s;
    if (typeof v === 'string') {
      s = /[:#\n]|^\s|\s$/.test(v) ? JSON.stringify(v) : v;
      if (s === '') s = '""';
    } else {
      s = String(v);
    }
    return `${k}: ${s}`;
  });
  return `---\n${lines.join('\n')}\n---\n${body}`;
}

/** Update one frontmatter field of a cached file, staging the change. */
export async function setFmField(store, path, field, value) {
  const text = await store.readFile(path);
  if (text == null) throw new Error('Could not read ' + path);
  const { data, body } = parseFm(text);
  data[field] = value;
  store.writeText(path, stringifyFm(data, body));
}
