

const THEME_STORAGE_KEY = 'mechverse-theme';
const CREATOR_BG_KEY = 'mechverse-creator-bg';
const CREATOR_ACCENT_KEY = 'mechverse-creator-accent';
const CREATOR_DEFAULT_BG = '#eef1f4';
const CREATOR_DEFAULT_ACCENT = '#2f8f7a';

const THEME_LABELS = {
  clean: 'Clean Girl Era ✨',
  soft: 'Soft Girl Era 🎀',
  baddie: 'Baddie Era 🖤',
  creator: 'Creator Era 🎨',
};

// Full token sets per fixed theme, used both to actually apply the theme
// AND to render the 3-color preview strip + power the hover-preview.
const THEME_TOKENS = {
  clean: {
    '--bg': '#eef1f4', '--surface': '#ffffff', '--surface-2': '#f4f6f8', '--border': '#d7dce2',
    '--ink': '#1b2430', '--ink-soft': '#545f6e',
    '--primary': '#2f8f7a', '--primary-dark': '#1f6b5a', '--primary-tint': '#dff3ee',
    '--accent': '#ff4f82', '--accent-tint': '#ffe1ea',
    '--nav-bg': '#ffffff', '--nav-ink': '#1b2430', '--nav-ink-soft': '#545f6e', '--nav-border': '#d7dce2',
    '--page-ink': '#1b2430', '--page-ink-soft': '#545f6e',
    '--panel-ink': '#ffffff', '--panel-ink-soft': 'rgba(255,255,255,0.75)',
  },
  soft: {
    '--bg': '#f7aecb', '--surface': '#fdeef3', '--surface-2': '#fbdce8', '--border': '#f6c9dc',
    '--ink': '#3a1626', '--ink-soft': '#8a4d68',
    '--primary': '#e63e86', '--primary-dark': '#b82868', '--primary-tint': '#fbdce8',
    '--accent': '#e63e86', '--accent-tint': '#fbdce8',
    '--nav-bg': '#f7aecb', '--nav-ink': '#3a1626', '--nav-ink-soft': '#8a4d68', '--nav-border': '#f2a0c2',
    '--page-ink': '#3a1626', '--page-ink-soft': '#8a4d68',
    '--panel-ink': '#ffffff', '--panel-ink-soft': 'rgba(255,255,255,0.8)',
  },
  baddie: {
    '--bg': '#0e0e11', '--surface': '#fbe3ec', '--surface-2': '#f6c9d6', '--border': '#f3b9cb',
    '--ink': '#33111f', '--ink-soft': '#8a5068',
    '--primary': '#ff1f6b', '--primary-dark': '#c81760', '--primary-tint': '#f6c9d6',
    '--accent': '#ff1f6b', '--accent-tint': '#f6c9d6',
    '--nav-bg': '#0e0e11', '--nav-ink': '#ffffff', '--nav-ink-soft': '#e8a0bf', '--nav-border': '#26262b',
    '--page-ink': '#ffffff', '--page-ink-soft': '#e8a0bf',
    '--panel-ink': '#ffffff', '--panel-ink-soft': 'rgba(255,255,255,0.75)',
  },
};

// ---- small color-math helpers (no external library needed) ----
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function mix(hexA, hexB, weightAtoB) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return rgbToHex(
    a.r + (b.r - a.r) * weightAtoB,
    a.g + (b.g - a.g) * weightAtoB,
    a.b + (b.b - a.b) * weightAtoB
  );
}
function darken(hex, amount) {
  return mix(hex, '#000000', amount);
}
function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h, s; const l = (max + min) / 2;
  if (max === min) { h = 0; s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      default: h = (rn - gn) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return rgbToHex(r * 255, g * 255, b * 255);
}
function complementary(hex) {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h + 180, s, l);
}
function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const [rl, gl, bl] = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}
function readableTextColor(bgHex) {
  return luminance(bgHex) > 0.5 ? '#1b2430' : '#ffffff';
}

function computeCreatorTokens(bgHex, accentHex) {
  const surface = mix(bgHex, '#ffffff', 0.85);
  const ink = readableTextColor(surface) === '#ffffff' ? '#f3f3f5' : '#1b2430';
  const inkSoft = mix(ink, surface, 0.4);
  const navInk = readableTextColor(bgHex);
  const navInkSoft = mix(navInk, bgHex, 0.45);
  return {
    '--bg': bgHex,
    '--surface': surface,
    '--surface-2': mix(surface, ink, 0.06),
    '--border': mix(surface, ink, 0.15),
    '--ink': ink,
    '--ink-soft': inkSoft,
    '--primary': accentHex,
    '--primary-dark': darken(accentHex, 0.22),
    '--primary-tint': mix(accentHex, '#ffffff', 0.85),
    '--accent': accentHex,
    '--accent-tint': mix(accentHex, '#ffffff', 0.85),
    '--nav-bg': bgHex,
    '--nav-ink': navInk,
    '--nav-ink-soft': navInkSoft,
    '--nav-border': mix(bgHex, navInk, 0.15),
    '--page-ink': navInk,
    '--page-ink-soft': navInkSoft,
    '--panel-ink': readableTextColor(darken(accentHex, 0.22)),
    '--panel-ink-soft': readableTextColor(darken(accentHex, 0.22)) === '#ffffff' ? 'rgba(255,255,255,0.75)' : 'rgba(27,36,48,0.7)',
    '--scroll-hover': complementary(accentHex),
  };
}

const ALL_TOKEN_KEYS = ['--bg','--surface','--surface-2','--border','--ink','--ink-soft',
  '--primary','--primary-dark','--primary-tint','--accent','--accent-tint',
  '--nav-bg','--nav-ink','--nav-ink-soft','--nav-border','--page-ink','--page-ink-soft',
  '--panel-ink','--panel-ink-soft','--scroll-hover'];

function clearInlineVars() {
  ALL_TOKEN_KEYS.forEach(k => document.documentElement.style.removeProperty(k));
}

function applyTokenSet(tokens) {
  ALL_TOKEN_KEYS.forEach(k => document.documentElement.style.removeProperty(k));
  Object.entries(tokens).forEach(([key, val]) => {
    document.documentElement.style.setProperty(key, val);
  });
}

function applyCreatorColors(bgHex, accentHex) {
  applyTokenSet(computeCreatorTokens(bgHex, accentHex));
}

// ---- apply + persist (a REAL, committed choice) ----
function applyTheme(name) {
  clearInlineVars();
  document.documentElement.setAttribute('data-theme', name);
  localStorage.setItem(THEME_STORAGE_KEY, name);
  if (name === 'creator') {
    const bg = localStorage.getItem(CREATOR_BG_KEY) || CREATOR_DEFAULT_BG;
    const accent = localStorage.getItem(CREATOR_ACCENT_KEY) || CREATOR_DEFAULT_ACCENT;
    applyCreatorColors(bg, accent);
  }
}

function initSavedTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) || 'clean';
  applyTheme(saved);
}
initSavedTheme();

const THEME_SWATCHES = {
  clean: '#2f8f7a',
  soft: '#e63e86',
  baddie: '#ff1f6b',
  creator: 'linear-gradient(135deg, #ff4f82, #2f8f7a, #ffb84f)',
};

// Emoji shown on the theme button on phones/foldables (<=900px), where the
// swatch + label are hidden. Desktop never shows this.
const THEME_ICONS = {
  clean: '🪄',
  soft: '🎀',
  baddie: '🖤',
  creator: '🎨',
};

// Builds the little 3-dot bg/primary/accent strip shown per menu option.
function swatchStripHTML(key) {
  if (key === 'creator') {
    return `<span class="swatch-strip" id="creatorSwatchStrip">
      <span class="dot" style="background:#eef1f4;"></span>
      <span class="dot" style="background:#2f8f7a;"></span>
      <span class="dot" style="background:#ff4f82;"></span>
    </span>`;
  }
  const t = THEME_TOKENS[key];
  return `<span class="swatch-strip">
    <span class="dot" style="background:${t['--bg']};"></span>
    <span class="dot" style="background:${t['--primary']};"></span>
    <span class="dot" style="background:${t['--accent']};"></span>
  </span>`;
}

// ---- theme switcher UI, injected into the top bar by nav.js ----
function renderThemeSwitcher(container) {
  let current = localStorage.getItem(THEME_STORAGE_KEY) || 'clean';
  let previewing = false;
  const wrap = document.createElement('div');
  wrap.className = 'theme-switcher';
  wrap.innerHTML = `
    <button type="button" class="theme-trigger" id="themeTrigger" aria-haspopup="true" aria-expanded="false">
      <span class="theme-trigger-icon" id="themeTriggerIcon"></span>
      <span class="swatch" id="themeTriggerSwatch"></span>
      <span id="themeTriggerLabel"></span>
    </button>
    <div class="theme-menu" id="themeMenu">
      ${Object.entries(THEME_LABELS).map(([key, label]) => key === 'creator' ? `
        <button type="button" class="theme-option" data-theme-key="creator">
          ${swatchStripHTML('creator')}
          Creator Era <span class="creator-icon">🎨</span>
          <span class="creator-tooltip" id="creatorTooltip">Design your own palette</span>
        </button>` : `
        <button type="button" class="theme-option" data-theme-key="${key}">
          ${swatchStripHTML(key)}
          ${label}
        </button>`).join('')}
    </div>
    <div id="creatorPanel" class="card bracket hidden" style="position:absolute; top:calc(100% + 8px); right:0; width:240px; z-index:20;">
      <div style="font-weight:700; margin-bottom:4px;">Creator Era ✨</div>
      <div class="muted" style="margin-bottom:12px;">Make MechVerse yours</div>
      <div class="field">
        <label>Background</label>
        <input type="color" id="creatorBgInput" style="height:38px; padding:4px;" />
      </div>
      <div class="field">
        <label>Accent</label>
        <input type="color" id="creatorAccentInput" style="height:38px; padding:4px;" />
      </div>
      <button class="btn btn-ghost-sm btn-block" id="creatorResetBtn" type="button">Reset to Creator Defaults</button>
      <button class="btn btn-primary btn-block" id="creatorDoneBtn" type="button" style="margin-top:8px;">Done</button>
    </div>`;
  container.appendChild(wrap);

  const trigger = wrap.querySelector('#themeTrigger');
  const triggerIcon = wrap.querySelector('#themeTriggerIcon');
  const triggerSwatch = wrap.querySelector('#themeTriggerSwatch');
  const triggerLabel = wrap.querySelector('#themeTriggerLabel');
  const menu = wrap.querySelector('#themeMenu');
  const panel = wrap.querySelector('#creatorPanel');
  const bgInput = wrap.querySelector('#creatorBgInput');
  const accentInput = wrap.querySelector('#creatorAccentInput');

  function refreshTrigger() {
    triggerIcon.textContent = THEME_ICONS[current];
    triggerSwatch.style.background = THEME_SWATCHES[current];
    triggerLabel.textContent = THEME_LABELS[current];
    wrap.querySelectorAll('.theme-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.themeKey === current);
    });
  }
  function refreshCreatorInputs() {
    bgInput.value = localStorage.getItem(CREATOR_BG_KEY) || CREATOR_DEFAULT_BG;
    accentInput.value = localStorage.getItem(CREATOR_ACCENT_KEY) || CREATOR_DEFAULT_ACCENT;
  }
  function toggleMenu(show) {
    menu.classList.toggle('open', show);
    trigger.setAttribute('aria-expanded', String(show));
    if (!show && previewing) { restoreCommitted(); }
  }
  function togglePanel(show) {
    panel.classList.toggle('hidden', !show);
  }

  // ---- live hover-preview: temporarily applies a theme's tokens while
  // hovering a menu option, without touching localStorage or data-theme.
  // Moving away (or closing the menu without clicking) restores whatever
  // was actually committed before the preview started.
  function previewTheme(key) {
    previewing = true;
    if (key === 'creator') {
      const bg = localStorage.getItem(CREATOR_BG_KEY) || CREATOR_DEFAULT_BG;
      const accent = localStorage.getItem(CREATOR_ACCENT_KEY) || CREATOR_DEFAULT_ACCENT;
      applyCreatorColors(bg, accent);
    } else {
      applyTokenSet(THEME_TOKENS[key]);
    }
  }
  function restoreCommitted() {
    previewing = false;
    clearInlineVars();
    if (current === 'creator') {
      const bg = localStorage.getItem(CREATOR_BG_KEY) || CREATOR_DEFAULT_BG;
      const accent = localStorage.getItem(CREATOR_ACCENT_KEY) || CREATOR_DEFAULT_ACCENT;
      applyCreatorColors(bg, accent);
    }
  }

  refreshTrigger();
  refreshCreatorInputs();
  togglePanel(false);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu(!menu.classList.contains('open'));
  });

  wrap.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (btn.dataset.themeKey !== 'creator') previewTheme(btn.dataset.themeKey);
    });
    btn.addEventListener('focus', () => {
      if (btn.dataset.themeKey !== 'creator') previewTheme(btn.dataset.themeKey);
    });
    btn.addEventListener('click', () => {
      current = btn.dataset.themeKey;
      previewing = false;
      applyTheme(current);
      refreshTrigger();
      toggleMenu(false);
      togglePanel(current === 'creator');
    });
  });
  menu.addEventListener('mouseleave', () => { if (previewing) restoreCommitted(); });

  // ---- Creator Era hover flourish (instead of a misleading full-page
  // preview): icon wiggle + tooltip always; the swatch dots either reveal
  // the user's real saved palette (if they've customized before) or do a
  // playful wave pulse (first-timers) to hint "pick anything."
  const creatorBtn = wrap.querySelector('.theme-option[data-theme-key="creator"]');
  const creatorStrip = wrap.querySelector('#creatorSwatchStrip');
  const creatorTooltip = wrap.querySelector('#creatorTooltip');
  const creatorDefaultDots = creatorStrip ? [...creatorStrip.querySelectorAll('.dot')].map(d => d.style.background) : [];
  function hasCustomCreatorColors() {
    return !!(localStorage.getItem(CREATOR_BG_KEY) && localStorage.getItem(CREATOR_ACCENT_KEY));
  }
  if (creatorBtn) {
    creatorBtn.addEventListener('mouseenter', () => {
      if (previewing) restoreCommitted(); // clear whatever theme was mid-preview
      if (hasCustomCreatorColors()) {
        const bg = localStorage.getItem(CREATOR_BG_KEY);
        const accent = localStorage.getItem(CREATOR_ACCENT_KEY);
        const dots = creatorStrip.querySelectorAll('.dot');
        dots[0].style.background = bg;
        dots[1].style.background = accent;
        dots[2].style.background = darken(accent, 0.25);
        creatorTooltip.textContent = 'Your custom palette 🎨';
      } else {
        creatorStrip.classList.add('wave');
        creatorTooltip.textContent = 'Design your own palette 🎨';
      }
    });
    creatorBtn.addEventListener('mouseleave', () => {
      creatorStrip.classList.remove('wave');
      const dots = creatorStrip.querySelectorAll('.dot');
      dots.forEach((d, i) => { d.style.background = creatorDefaultDots[i]; });
    });
  }

  bgInput.addEventListener('input', () => {
    localStorage.setItem(CREATOR_BG_KEY, bgInput.value);
    applyCreatorColors(bgInput.value, accentInput.value);
  });
  accentInput.addEventListener('input', () => {
    localStorage.setItem(CREATOR_ACCENT_KEY, accentInput.value);
    applyCreatorColors(bgInput.value, accentInput.value);
  });
  wrap.querySelector('#creatorResetBtn').onclick = () => {
    localStorage.setItem(CREATOR_BG_KEY, CREATOR_DEFAULT_BG);
    localStorage.setItem(CREATOR_ACCENT_KEY, CREATOR_DEFAULT_ACCENT);
    refreshCreatorInputs();
    applyCreatorColors(CREATOR_DEFAULT_BG, CREATOR_DEFAULT_ACCENT);
  };
  wrap.querySelector('#creatorDoneBtn').onclick = () => togglePanel(false);

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) {
      toggleMenu(false);
      if (current === 'creator') togglePanel(false);
    }
  });
}