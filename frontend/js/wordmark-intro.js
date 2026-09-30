

const MECHVERSE_GLYPH_PATHS = [
  { x: 0, d: "M66 0V700H311L432 90H450L571 700H816V0H688V603H670L550 0H332L212 603H194V0Z" },
  { x: 882, d: "M296 -14Q222 -14 165.5 17.5Q109 49 77.5 106.5Q46 164 46 242V254Q46 332 77.0 389.5Q108 447 164.0 478.5Q220 510 294 510Q367 510 421.0 477.5Q475 445 505.0 387.5Q535 330 535 254V211H174Q176 160 212.0 128.0Q248 96 300 96Q353 96 378.0 119.0Q403 142 416 170L519 116Q505 90 478.5 59.5Q452 29 408.0 7.5Q364 -14 296 -14ZM175 305H407Q403 348 372.5 374.0Q342 400 293 400Q242 400 212.0 374.0Q182 348 175 305Z" },
  { x: 1459, d: "M303 -14Q231 -14 172.5 16.0Q114 46 80.0 103.0Q46 160 46 241V255Q46 336 80.0 393.0Q114 450 172.5 480.0Q231 510 303 510Q374 510 425.0 485.0Q476 460 507.5 416.5Q539 373 549 318L427 292Q423 322 409.0 346.0Q395 370 369.5 384.0Q344 398 306 398Q268 398 237.5 381.5Q207 365 189.5 332.5Q172 300 172 253V243Q172 196 189.5 163.5Q207 131 237.5 114.5Q268 98 306 98Q363 98 392.5 127.5Q422 157 430 205L552 176Q539 123 507.5 79.5Q476 36 425.0 11.0Q374 -14 303 -14Z" },
  { x: 2045, d: "M70 0V700H196V435H214Q222 451 239.0 467.0Q256 483 284.5 493.5Q313 504 357 504Q415 504 458.5 477.5Q502 451 526.0 404.5Q550 358 550 296V0H424V286Q424 342 396.5 370.0Q369 398 318 398Q260 398 228.0 359.5Q196 321 196 252V0Z" },
  { x: 2661, d: "M196 0 18 700H154L302 85H316L464 700H600L422 0Z" },
  { x: 3279, d: "M296 -14Q222 -14 165.5 17.5Q109 49 77.5 106.5Q46 164 46 242V254Q46 332 77.0 389.5Q108 447 164.0 478.5Q220 510 294 510Q367 510 421.0 477.5Q475 445 505.0 387.5Q535 330 535 254V211H174Q176 160 212.0 128.0Q248 96 300 96Q353 96 378.0 119.0Q403 142 416 170L519 116Q505 90 478.5 59.5Q452 29 408.0 7.5Q364 -14 296 -14ZM175 305H407Q403 348 372.5 374.0Q342 400 293 400Q242 400 212.0 374.0Q182 348 175 305Z" },
  { x: 3856, d: "M70 0V496H194V440H212Q223 470 248.5 484.0Q274 498 308 498H368V386H306Q258 386 227.0 360.5Q196 335 196 282V0Z" },
  { x: 4252, d: "M276 -14Q179 -14 117.0 28.0Q55 70 42 148L158 178Q165 143 181.5 123.0Q198 103 222.5 94.5Q247 86 276 86Q320 86 341.0 101.5Q362 117 362 140Q362 163 342.0 175.5Q322 188 278 196L250 201Q198 211 155.0 228.5Q112 246 86.0 277.0Q60 308 60 357Q60 431 114.0 470.5Q168 510 256 510Q339 510 394.0 473.0Q449 436 466 376L349 340Q341 378 316.5 394.0Q292 410 256 410Q220 410 201.0 397.5Q182 385 182 363Q182 339 202.0 327.5Q222 316 256 310L284 305Q340 295 385.5 278.5Q431 262 457.5 231.5Q484 201 484 149Q484 71 427.5 28.5Q371 -14 276 -14Z" },
  { x: 4776, d: "M296 -14Q222 -14 165.5 17.5Q109 49 77.5 106.5Q46 164 46 242V254Q46 332 77.0 389.5Q108 447 164.0 478.5Q220 510 294 510Q367 510 421.0 477.5Q475 445 505.0 387.5Q535 330 535 254V211H174Q176 160 212.0 128.0Q248 96 300 96Q353 96 378.0 119.0Q403 142 416 170L519 116Q505 90 478.5 59.5Q452 29 408.0 7.5Q364 -14 296 -14ZM175 305H407Q403 348 372.5 374.0Q342 400 293 400Q242 400 212.0 374.0Q182 348 175 305Z" },
];

function renderWordmarkIntro(containerId, onComplete) {
  const container = document.getElementById(containerId);
  if (!container) { if (onComplete) onComplete(); return; }

  container.innerHTML = `
    <div style="position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <div id="wmGlow" style="position:absolute; width:60%; height:70%; border-radius:50%; background:radial-gradient(circle, color-mix(in srgb, var(--primary) 55%, transparent), transparent 70%); opacity:0; filter:blur(6px);"></div>
      <div id="wmWrap" style="position:relative; transform:scale(1); width:clamp(280px, 85vw, 1400px);">
        <svg id="wmSvg" width="100%" viewBox="0 0 5353 760">
          <defs>
            <linearGradient id="wmGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="var(--primary-tint)"/>
              <stop offset="55%" stop-color="var(--primary)"/>
              <stop offset="100%" stop-color="var(--primary-dark)"/>
            </linearGradient>
          </defs>
          <g id="wmGroup" transform="translate(0,700) scale(1,-1)" fill="none" stroke="var(--primary)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
            ${MECHVERSE_GLYPH_PATHS.map(g => `<path class="wm-glyph" transform="translate(${g.x},0)" d="${g.d}"/>`).join('')}
          </g>
          <circle id="wmDot" r="16" fill="var(--primary)" opacity="0"/>
        </svg>
        <div id="wmShimmer" style="position:absolute; top:0; left:-40%; width:35%; height:100%; background:linear-gradient(100deg, transparent, rgba(255,255,255,0.75), transparent); opacity:0; pointer-events:none;"></div>
      </div>
      <div id="wmLoading" style="margin-top:28px; display:flex; align-items:center; gap:8px; opacity:0; transition:opacity .4s ease;">
        <span style="width:8px; height:8px; border-radius:50%; background:var(--primary); animation:wmPulse 1s ease-in-out infinite;"></span>
        <span style="font-size:13px; color:var(--page-ink-soft);">Setting up your workspace…</span>
      </div>
    </div>
    <style>@keyframes wmPulse { 0%,100% { opacity:.3; transform:scale(0.8); } 50% { opacity:1; transform:scale(1.1); } }</style>`;

  const glyphs = Array.from(container.querySelectorAll('.wm-glyph'));
  const dot = container.querySelector('#wmDot');
  const wrap = container.querySelector('#wmWrap');
  const glow = container.querySelector('#wmGlow');
  const shimmer = container.querySelector('#wmShimmer');
  const group = container.querySelector('#wmGroup');
  const loading = container.querySelector('#wmLoading');

  const perGlyphMs = 230;
  const lens = glyphs.map(g => g.getTotalLength());
  glyphs.forEach((g, i) => { g.style.strokeDasharray = lens[i]; g.style.strokeDashoffset = lens[i]; });

   const totalMs = glyphs.length * perGlyphMs;
  const start = performance.now() + 150;

  // Position the dot at the start of the first glyph before showing it,
  // so it doesn't flash at the default (0,0) origin on the left.
  const firstPt = glyphs[0].getPointAtLength(0);
  dot.setAttribute('cx', firstPt.x + MECHVERSE_GLYPH_PATHS[0].x);
  dot.setAttribute('cy', 700 - firstPt.y);
  dot.setAttribute('opacity', '1');

  function frame(now) {
    let t = now - start;
    if (t < 0) { requestAnimationFrame(frame); return; }
    if (t > totalMs) t = totalMs;
    const idx = Math.min(glyphs.length - 1, Math.floor(t / perGlyphMs));
    const localT = Math.min(1, (t - idx * perGlyphMs) / perGlyphMs);
    for (let i = 0; i < glyphs.length; i++) {
      if (i < idx) glyphs[i].style.strokeDashoffset = 0;
      else if (i === idx) glyphs[i].style.strokeDashoffset = lens[i] * (1 - localT);
      else glyphs[i].style.strokeDashoffset = lens[i];
    }
    const pt = glyphs[idx].getPointAtLength(lens[idx] * localT);
    const glyphX = MECHVERSE_GLYPH_PATHS[idx].x;
    dot.setAttribute('cx', pt.x + glyphX);
    dot.setAttribute('cy', 700 - pt.y);

    if (t < totalMs) {
      requestAnimationFrame(frame);
    } else {
      onDrawComplete();
    }
  }
  requestAnimationFrame(frame);

  function onDrawComplete() {
    dot.style.transition = 'opacity .3s ease';
    dot.setAttribute('opacity', '0');
    group.style.transition = 'fill .35s ease';
    group.style.fill = 'url(#wmGrad)';

    glow.style.transition = 'opacity .5s ease, transform .5s ease';
    glow.style.opacity = '1';
    glow.style.transform = 'scale(1.1)';
    setTimeout(() => { glow.style.opacity = '0'; glow.style.transform = 'scale(1)'; }, 550);

    wrap.style.transition = 'transform .45s cubic-bezier(.34,1.6,.64,1)';
    wrap.style.transform = 'scale(1.06)';
    setTimeout(() => { wrap.style.transform = 'scale(1)'; }, 220);

    setTimeout(() => {
      shimmer.style.transition = 'left 1.1s ease, opacity .3s ease';
      shimmer.style.opacity = '1';
      shimmer.style.left = '120%';
      setTimeout(() => { shimmer.style.opacity = '0'; }, 900);
    }, 350);

    setTimeout(() => { loading.style.opacity = '1'; }, 500);
    setTimeout(() => { if (onComplete) onComplete(); }, 1400);
  }
}