function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

function renderNav(active, user) {
  const root = document.getElementById('topbar-root');
  if (!root) return;
  const NAV_ICONS = {
    home: '<path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/>',
    resource: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    grade: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    lab: '<path d="M9 2v6l-6 12a1 1 0 0 0 1 1.5h16a1 1 0 0 0 1-1.5L15 8V2"/><path d="M9 2h6"/>',
    sgpa: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    admin: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/>',
  };
  const links = [
    ['home.html', 'Home', 'home'],
    ['dashboard.html', 'Resource Hub', 'resource'],
    ['grade-planner.html', 'Grade Planner', 'grade'],
    ['lab-companion.html', 'Lab Companion', 'lab'],
    ['sgpa-calculator.html', 'SGPA Calculator', 'sgpa'],
  ];
  if (user && user.role === 'admin') links.push(['admin.html', 'Admin', 'admin']);

  // Guest preview: simple bar with brand + Sign In (same look as the landing page).
  if (user && user.guest) {
    root.innerHTML = `
      <div class="topbar" id="topbarEl">
        <a class="brand" href="home.html">
          <span class="logo-circle" style="width:36px; height:36px; border:1px solid var(--border);"><img src="assets/logo.png" alt="MechVerse" /></span>
          <span class="wordmark">MechVerse</span>
        </a>
        <a class="btn btn-primary" href="index.html">Sign In</a>
      </div>`;
    const bar = document.getElementById('topbarEl');
    const sync = () => document.documentElement.style.setProperty('--topbar-h', `${bar.offsetHeight}px`);
    sync();
    window.addEventListener('resize', sync);
    return;
  }

  root.innerHTML = `
    <div class="topbar" id="topbarEl">
      <div class="scroll-progress" id="scrollProgress"></div>
      <a class="brand" href="home.html">
        <span class="logo-circle" style="width:36px; height:36px; border:1px solid var(--border);"><img src="assets/logo.png" alt="MechVerse" /></span>
        <span class="wordmark">MechVerse</span>
      </a>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <nav class="nav-links" id="navLinks">
        ${links.map(([href, label, key]) => `<a href="${href}" class="${active === key ? 'active' : ''}" data-key="${key}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${NAV_ICONS[key] || ''}</svg>${label}</a>`).join('')}
      </nav>
      <div class="nav-user" id="navUser">
        <span class="nav-greeting" id="navGreeting"></span>
        <div id="themeSwitcherRoot"></div>
        <div class="nav-bell-wrap" id="navBellWrap">
          <button class="nav-bell-btn" id="bellBtn" aria-haspopup="true" aria-expanded="false" title="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span class="bell-dot hidden" id="bellDot"></span>
          </button>
          <div class="nav-dropdown" id="bellDropdown">
            <div class="dd-name">Notifications</div>
            <div id="bellList" style="padding:4px 0;"></div>
          </div>
        </div>
        <button class="nav-avatar-btn" id="avatarBtn" aria-haspopup="true" aria-expanded="false">${initials(user?.name)}<span class="avatar-status"></span></button>
        <div class="nav-dropdown" id="navDropdown">
          <div class="dd-name">${user ? user.name : ''}</div>
          <div class="dd-email">${user ? user.email || '' : ''}</div>
          <button id="logoutBtn">Log out</button>
        </div>
      </div>
    </div>`;

const greetingEl = document.getElementById('navGreeting');
  if (greetingEl) {
    const h = new Date().getHours();
    const greeting = h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
    greetingEl.textContent = user?.name ? `${greeting}, ${user.name.split(' ')[0]}` : greeting;
  }

  document.getElementById('logoutBtn').onclick = async () => {
    await api('/auth/logout', { method: 'POST' });
    window.location.href = 'index.html';
  };
  renderThemeSwitcher(document.getElementById('themeSwitcherRoot'));

  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  toggle.onclick = () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  };

  // Avatar dropdown open/close
  const avatarBtn = document.getElementById('avatarBtn');
  const dropdown = document.getElementById('navDropdown');
  avatarBtn.onclick = (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('open');
    avatarBtn.setAttribute('aria-expanded', String(isOpen));
  };
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== avatarBtn) {
      dropdown.classList.remove('open');
      avatarBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Bell dropdown -- populated from local signals for now (streak status +
  // celebrated-subject count); swap buildNotifications() for a real API
  // call later without touching any of this wiring.
  function buildNotifications() {
    const items = [];
    try {
      items.push("Welcome to MechVerse!✨");
      const lastVisit = localStorage.getItem('mechverse-streak-last-visit');
      const today = new Date().toISOString().slice(0, 10);
      if (lastVisit && lastVisit !== today) items.push("🔥 Keep your streak alive — visit today!");
      const celebratedCount = Object.keys(localStorage).filter(k => k.startsWith('mv_celebrated_')).length;
      if (celebratedCount > 0) items.push(`🎉 You've completed ${celebratedCount} subject${celebratedCount > 1 ? 's' : ''} — nice work!`);
    } catch (e) {}
    return items;
  }
  const bellBtn = document.getElementById('bellBtn');
  const bellDropdown = document.getElementById('bellDropdown');
  const bellDot = document.getElementById('bellDot');
  const bellList = document.getElementById('bellList');
  const notifications = buildNotifications();
  // Red dot: shown until the bell has been opened once (welcome message seen),
  // and again whenever other notifications (streak, completed subjects) exist.
  let welcomeSeen = false;
  try { welcomeSeen = !!localStorage.getItem('mv_welcome_seen'); } catch (e) {}
  const otherCount = Math.max(notifications.length - 1, 0);
  bellDot.classList.toggle('hidden', welcomeSeen && otherCount === 0);
  bellList.innerHTML = notifications.length
    ? notifications.map(n => `<div class="bell-item">${n}</div>`).join('')
    : `<div class="bell-empty">You're all caught up!</div>`;
  bellBtn.onclick = (e) => {
    e.stopPropagation();
    const isOpen = bellDropdown.classList.toggle('open');
    bellBtn.setAttribute('aria-expanded', String(isOpen));
    dropdown.classList.remove('open'); // close avatar dropdown if open
    if (isOpen) {
      try { localStorage.setItem('mv_welcome_seen', '1'); } catch (e) {}
      if (otherCount === 0) bellDot.classList.add('hidden');
    }
  };
  document.addEventListener('click', (e) => {
    if (!bellDropdown.contains(e.target) && e.target !== bellBtn && !bellBtn.contains(e.target)) {
      bellDropdown.classList.remove('open');
      bellBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Glass effect once the page is scrolled + scroll progress bar
  const topbarEl = document.getElementById('topbarEl');
  const scrollProgress = document.getElementById('scrollProgress');
  function onScroll() {
    topbarEl.classList.toggle('scrolled', window.scrollY > 10);
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    if (scrollProgress) scrollProgress.style.width = `${pct}%`;
  }
  window.addEventListener('scroll', onScroll);
  onScroll();

  // Topbar is now position:fixed (so it never scrolls away) -- keep page
  // content pushed down by exactly its real height, which changes across
  // breakpoints (mobile has less padding than desktop).
  function syncTopbarHeight() {
    document.documentElement.style.setProperty('--topbar-h', `${topbarEl.offsetHeight}px`);
  }
  syncTopbarHeight();
  window.addEventListener('resize', syncTopbarHeight);

  const bottomLinks = links.slice(0, 4);
  const icons = NAV_ICONS;
  let bottomNav = document.getElementById('bottomNav');
  if (!bottomNav) {
    bottomNav = document.createElement('div');
    bottomNav.id = 'bottomNav';
    document.body.appendChild(bottomNav);
  }
  bottomNav.innerHTML = bottomLinks.map(([href, label, key]) => `
    <a href="${href}" class="${active === key ? 'active' : ''}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons[key] || icons.home}</svg>
      <span>${label.split(' ')[0]}</span>
    </a>`).join('');
}