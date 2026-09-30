function emptyStateHTML(icon, title, message, ctaLabel, ctaHref) {
  const icons = {
    books: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    star: '<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/>',
    flask: '<path d="M9 2v6l-6 12a1 1 0 0 0 1 1.5h16a1 1 0 0 0 1-1.5L15 8V2"/><path d="M9 2h6"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  };
  const svg = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${icons[icon] || icons.inbox}</svg>`;
  return `<div class="empty-state">
    <div style="color:var(--border); margin-bottom:10px; display:flex; justify-content:center;">${svg}</div>
    <h3 style="margin-bottom:4px;">${title}</h3>
    <p class="muted" style="margin:0 auto 12px; max-width:340px;">${message}</p>
    ${ctaHref ? `<a class="btn btn-outline" href="${ctaHref}">${ctaLabel}</a>` : ''}
  </div>`;
}

function showToast(message, type) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type || 'default'}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 200);
  }, 2600);
}

// items: [{ label, href }] — the last item is rendered as plain text (current page)
function renderBreadcrumbs(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map((item, i) => {
    const isLast = i === items.length - 1;
    const node = isLast
      ? `<span class="current">${item.label}</span>`
      : `<a href="${item.href}">${item.label}</a>`;
    return i === 0 ? node : `<span class="sep"></span>${node}`;
  }).join('');
}

// Shared 3D tilt-on-hover for any .subject-card-style card, used across
// Resource Hub, Grade Planner, and Lab Companion so the hover feel is
// consistent everywhere instead of being duplicated per page.
function wireCardTilt(card) {
  const maxTilt = 6;
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateX(${(-y * maxTilt).toFixed(2)}deg) rotateY(${(x * maxTilt).toFixed(2)}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
}