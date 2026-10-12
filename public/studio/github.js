/* Studio GitHub pipeline — saves Sarah's edits straight to her repo.
   All in the browser. The token is hers, stored in her browser only. */

export const REPO = {
  owner: 'worldlinemuse-lgtm',
  repo: 'sarah-blachly-art',
  branch: 'main',
};

const TOKEN_KEY = 'sarah-studio-token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  if (!token) throw new Error('Not signed in to the Studio.');
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub said no (${res.status}): ${err.message || res.statusText}`);
  }
  return res.json();
}

/** Check the token works and can see her repo. */
export async function verifyToken() {
  await api(`/repos/${REPO.owner}/${REPO.repo}`);
  return true;
}

/** Read a text file from the repo. Returns {content, sha} or null. */
export async function getFile(path) {
  try {
    const data = await api(
      `/repos/${REPO.owner}/${REPO.repo}/contents/${path}?ref=${REPO.branch}`
    );
    if (data.type !== 'file') throw new Error('Not a file: ' + path);
    return { content: b64ToUtf8(data.content), sha: data.sha };
  } catch (e) {
    if (e.message.includes('(404)')) return null;
    throw e;
  }
}

export function b64ToUtf8(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function utf8ToB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

/**
 * Commit several files at once as a single commit.
 * files: [{ path, content, encoding: 'utf8' | 'base64' }]
 */
export async function commitFiles(files, message) {
  if (!files.length) throw new Error('Nothing to save.');

  // 1. Where are we starting from?
  const ref = await api(`/repos/${REPO.owner}/${REPO.repo}/git/ref/heads/${REPO.branch}`);
  const baseCommitSha = ref.object.sha;
  const baseCommit = await api(`/repos/${REPO.owner}/${REPO.repo}/git/commits/${baseCommitSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  // 2. Turn each file into a blob
  const tree = [];
  for (const f of files) {
    const blob = await api(`/repos/${REPO.owner}/${REPO.repo}/git/blobs`, {
      method: 'POST',
      body: {
        content: f.encoding === 'base64' ? f.content : utf8ToB64(f.content),
        encoding: 'base64',
      },
    });
    tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  // 3. Make a new tree, 4. commit it, 5. point the branch at it
  const newTree = await api(`/repos/${REPO.owner}/${REPO.repo}/git/trees`, {
    method: 'POST',
    body: { base_tree: baseTreeSha, tree },
  });
  const commit = await api(`/repos/${REPO.owner}/${REPO.repo}/git/commits`, {
    method: 'POST',
    body: {
      message,
      tree: newTree.sha,
      parents: [baseCommitSha],
    },
  });
  await api(`/repos/${REPO.owner}/${REPO.repo}/git/ref/heads/${REPO.branch}`, {
    method: 'PATCH',
    body: { sha: commit.sha },
  });
  return commit.sha;
}
