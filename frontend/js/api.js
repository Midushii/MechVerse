
const API_BASE = window.MECHVERSE_API_BASE || 'http://localhost:4000/api';

async function api(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  const opts = {
    method,
    credentials: 'include',
    headers: isForm ? headers : { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = isForm ? body : JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

async function requireSession() {
  try {
    const { user } = await api('/auth/me');
    return user;
  } catch (e) {
    window.location.href = 'index.html';
    return null;
  }
}

function showError(el, message) {
  el.textContent = message;
  el.classList.remove('hidden');
}

function goToPage(page, storageKey, id) {
  sessionStorage.setItem(storageKey, id);
  window.location.assign(`${page}?id=${id}`);
}

function getPageId(storageKey) {
  const fromUrl = new URLSearchParams(location.search).get('id');
  if (fromUrl) return fromUrl;
  return sessionStorage.getItem(storageKey);
}

// Uploaded files (notes/PYQs/lab files) are stored as paths like
// "/uploads/xyz.pdf" -- relative to the BACKEND, not the frontend. Used
// directly in an href, the browser resolves that against whatever page
// you're on (the frontend, port 5173), which has no /uploads route and
// 404s. This rewrites it to an absolute URL on the backend's own origin.
// External links (YouTube, etc.) are left untouched.
function resolveFileUrl(url) {
  if (!url) return url;
  if (!url.startsWith('/uploads/')) return url; // already a full external URL
  const backendOrigin = API_BASE.replace(/\/api\/?$/, '');
  return backendOrigin + url;
}