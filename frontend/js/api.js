const API_BASE = window.MECHVERSE_API_BASE || 'http://localhost:4000/api';

// ---- Guest preview mode ---------------------------------------------------
// The four feature pages (Resource Hub, Grade Planner, Lab Companion, SGPA
// Calculator) can be OPENED without logging in, but the moment a guest
// clicks / taps / focuses anything, they're sent to the sign-in page.
const GUEST_PREVIEW_PAGES = /(?:^|\/)(dashboard|grade-planner|lab-companion|sgpa-calculator)(?:\.html)?\/?$/;
let IS_GUEST = false;

// Stand-in for API data while browsing as a guest: any field a page
// destructures (subjects, courses, labs, ...) comes back as an empty list.
function guestEmptyData() {
  return new Proxy({}, {
    get: (_t, key) => (typeof key === 'symbol' || key === 'then' ? undefined : []),
  });
}

function goToLogin() {
  // assign(), not replace(), so the browser's Back button returns to the preview.
  window.location.assign('index.html');
}

function enableGuestRedirect() {
  const bounce = (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    goToLogin();
  };
  // capture phase = runs before any of the page's own handlers
  document.addEventListener('click', bounce, true);
  document.addEventListener('auxclick', bounce, true);
  document.addEventListener('touchstart', bounce, { capture: true, passive: false });
  // keyboard users: tabbing into a field or pressing a key also counts as interacting
  document.addEventListener('focusin', (e) => {
    if (e.target.matches && e.target.matches('input, select, textarea, button, [contenteditable]')) bounce(e);
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') bounce(e);
  }, true);
}

async function api(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  const opts = {
    method,
    credentials: 'include',
    headers: isForm ? headers : { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = isForm ? body : JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, opts);
  } catch (e) {
    if (IS_GUEST) return guestEmptyData();
    throw e;
  }
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }

  if (!res.ok) {
    // Guests aren't logged in, so the API will 401 -- show empty sections instead of breaking.
    if (IS_GUEST && res.status === 401) return guestEmptyData();
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
    // Not logged in. On the four feature pages, let the guest look around
    // (any interaction sends them to sign-in). Everywhere else, redirect as before.
    if (GUEST_PREVIEW_PAGES.test(window.location.pathname)) {
      IS_GUEST = true;
      enableGuestRedirect();
      return { guest: true, name: 'Guest', email: '', role: 'guest', semester: 1 };
    }
    // replace(), not href= -- this removes the protected page from browser
    // history instead of leaving it sitting there, so hitting "back" from
    // the sign-in page skips straight past it to wherever came before.
    window.location.replace('index.html');
    return null;
  }
}

// Safety net for browsers that restore a protected page from bfcache
// (back/forward cache) without re-running its scripts -- this forces a
// real reload in that case, so requireSession() always gets a chance to
// re-check auth instead of showing a frozen, empty page.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload();
});

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