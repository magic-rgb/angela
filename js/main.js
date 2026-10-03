/**
 * ANGELA — Core interactions (loader, header, cursor, carousel, reveal, newsletter)
 * Static marketing site: no user-generated HTML, no eval, no remote script injection.
 */
(function () {
  'use strict';

  var CARDS = [
    { num: '01', title: 'VISION', icon: 'eye' },
    { num: '02', title: 'ECOSYSTEM', icon: 'globe' },
    { num: '03', title: 'AI CORE', icon: 'cpu' },
    { num: '04', title: 'WALLET', icon: 'wallet' },
    { num: '05', title: 'ROADMAP', icon: 'path' },
    { num: '06', title: 'TOKENOMICS', icon: 'chart' },
    { num: '07', title: 'SECURITY', icon: 'shield' },
    { num: '08', title: 'STAKING', icon: 'layers' },
    { num: '09', title: 'COMMUNITY', icon: 'users' },
    { num: '10', title: 'FUTURE', icon: 'star' }
  ];

  var ICONS = {
    eye: ['circle', { cx: 12, cy: 12, r: 3 }, 'path', { d: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z' }],
    globe: ['circle', { cx: 12, cy: 12, r: 10 }, 'path', { d: 'M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' }],
    cpu: ['rect', { x: 4, y: 4, width: 16, height: 16, rx: 2 }, 'rect', { x: 9, y: 9, width: 6, height: 6 }, 'path', { d: 'M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3' }],
    wallet: ['rect', { x: 2, y: 6, width: 20, height: 14, rx: 2 }, 'path', { d: 'M2 10h20' }],
    path: ['path', { d: 'M4 18V6l6 6 6-8 4 4' }],
    chart: ['path', { d: 'M4 20V10M10 20V4M16 20v-8M22 20V8' }],
    shield: ['path', { d: 'M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z' }],
    layers: ['path', { d: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' }],
    users: ['path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }, 'circle', { cx: 9, cy: 7, r: 4 }, 'path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' }],
    star: ['path', { d: 'M12 2l3 7h7l-5.5 4.5L19 21l-7-4.5L5 21l2.5-7.5L2 9h7l3-7z' }]
  };

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'className') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (children) children.forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function svgIcon(name) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    var data = ICONS[name] || ICONS.star;
    for (var i = 0; i < data.length; i += 2) {
      var shape = document.createElementNS(SVG_NS, data[i]);
      var props = data[i + 1] || {};
      Object.keys(props).forEach(function (k) { shape.setAttribute(k, String(props[k])); });
      svg.appendChild(shape);
    }
    return svg;
  }

  /* Loader */
  var loader = document.getElementById('loader');
  function hideLoader() {
    if (loader) loader.classList.add('hidden');
  }
  if (document.readyState === 'complete') setTimeout(hideLoader, 500);
  else window.addEventListener('load', function () { setTimeout(hideLoader, 600); });
  setTimeout(hideLoader, 2000);

  /* Header */
  var header = document.getElementById('header');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 36);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Cursor — desktop only */
  if (!isTouch && !prefersReduced) {
    var cursor = document.getElementById('cursor');
    var trail = document.getElementById('cursorTrail');
    if (cursor && trail) {
      cursor.hidden = false;
      trail.hidden = false;
      document.body.classList.add('has-cursor');
      var mx = 0, my = 0, tx = 0, ty = 0;
      document.addEventListener('mousemove', function (e) {
        mx = e.clientX;
        my = e.clientY;
        cursor.style.left = mx + 'px';
        cursor.style.top = my + 'px';
      }, { passive: true });
      (function loop() {
        tx += (mx - tx) * 0.18;
        ty += (my - ty) * 0.18;
        trail.style.left = tx + 'px';
        trail.style.top = ty + 'px';
        requestAnimationFrame(loop);
      })();
    }
  }

  /* Carousel — DOM-only, no innerHTML */
  var active = 4;
  var track = document.getElementById('carouselTrack');
  var dotsEl = document.getElementById('carouselDots');
  var prevBtn = document.getElementById('carouselPrev');
  var nextBtn = document.getElementById('carouselNext');
  var carouselEl = document.getElementById('carousel');

  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function buildCarousel() {
    if (!track || !dotsEl) return;
    clearNode(track);
    clearNode(dotsEl);

    CARDS.forEach(function (c, i) {
      var card = el('div', {
        className: 'carousel-card',
        role: 'button',
        tabindex: '0',
        'aria-label': c.num + ' ' + c.title
      });
      card.appendChild(el('span', { className: 'card-num', text: c.num }));
      var iconWrap = el('div', { className: 'card-icon' });
      iconWrap.appendChild(svgIcon(c.icon));
      card.appendChild(iconWrap);
      card.appendChild(el('span', { className: 'card-title', text: c.title }));
      card.addEventListener('click', function () { goTo(i); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goTo(i);
        }
      });
      track.appendChild(card);

      var dot = el('button', {
        type: 'button',
        className: 'carousel-dot',
        'aria-label': 'Go to ' + c.title
      });
      dot.addEventListener('click', function () { goTo(i); });
      dotsEl.appendChild(dot);
    });
    updateCarousel();
  }

  function updateCarousel() {
    if (!track) return;
    var cards = track.children, dots = dotsEl ? dotsEl.children : [], total = cards.length;
    var cw = carouselEl.clientWidth, small = cw < 700, gap = 10;
    var aw = small ? 150 : 220;
    var sw = small ? 84 : Math.min(120, Math.max(80, (cw - aw) / 8 - gap));
    carouselEl.style.setProperty('--aw', aw + 'px');
    carouselEl.style.setProperty('--sw', sw + 'px');
    for (var i = 0; i < total; i++) {
      var offset = i - active;
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;
      var abs = Math.abs(offset), isActive = offset === 0;
      var x = isActive ? 0 : (offset < 0 ? -1 : 1) * (aw / 2 + gap + sw / 2 + (abs - 1) * (sw + gap));
      var card = cards[i];
      card.style.transform = 'translateX(' + x + 'px) translateZ(' + (isActive ? 60 : 0) + 'px) rotateY(' + (offset * -5) + 'deg)';
      card.style.opacity = String(abs > 4 ? 0 : 1 - abs * 0.1);
      card.style.zIndex = String(isActive ? 20 : 10 - abs);
      card.classList.toggle('active', isActive);
      if (dots[i]) dots[i].classList.toggle('active', isActive);
    }
  }
  window.addEventListener('resize', updateCarousel);

  function goTo(i) {
    var n = CARDS.length;
    active = ((i % n) + n) % n;
    updateCarousel();
  }
  function next() { goTo(active + 1); }
  function prev() { goTo(active - 1); }

  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);
  document.addEventListener('keydown', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  if (carouselEl) {
    var dragging = false, startX = 0, curX = 0;
    function down(e) {
      dragging = true;
      startX = (e.clientX != null) ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      curX = startX;
    }
    function move(e) {
      if (!dragging) return;
      curX = (e.clientX != null) ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      var d = curX - startX;
      if (Math.abs(d) > 48) {
        if (d < 0) next(); else prev();
      }
    }
    carouselEl.addEventListener('mousedown', down);
    carouselEl.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('mousemove', move, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
  }

  buildCarousel();

  var nf=document.getElementById('newsForm');
  if(nf)nf.addEventListener('submit',function(e){e.preventDefault();document.getElementById('newsMsg').textContent='Newsletter opens soon.';});

  /* Scroll reveal — targets real sections; class removed after the entrance so hover transforms keep working */
  if (!prefersReduced && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll('.about-copy,.metrics-row,.roadmap-content,.tech-card,.team-panel,.comm-panel,.member');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target;
        t.classList.add('visible');
        io.unobserve(t);
        setTimeout(function () { t.classList.remove('reveal', 'visible'); }, 1400);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (t, i) {
      t.classList.add('reveal');
      t.style.setProperty('--d', (i % 3) * 90 + 'ms');
      io.observe(t);
    });
  }
})();

/* Technology + Solana cards: text colour follows the pointer */
(function () {
  var cards = document.querySelectorAll('.tech-stack, .tech-solana');
  if (!cards.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  cards.forEach(function (card) {
    var spots = card.querySelectorAll('.tech-title, .sol-head h3, .sol-feats b, .sol-foot b, .tech-stack li');
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mxp', ((e.clientX - r.left) / r.width).toFixed(3));
      card.style.setProperty('--myp', ((e.clientY - r.top) / r.height).toFixed(3));
      spots.forEach(function (el) {
        var b = el.getBoundingClientRect();
        el.style.setProperty('--tx', (e.clientX - b.left) + 'px');
        el.style.setProperty('--ty', (e.clientY - b.top) + 'px');
      });
    });
    card.addEventListener('pointerleave', function () {
      ['--mxp', '--myp'].forEach(function (p) { card.style.removeProperty(p); });
      spots.forEach(function (el) { el.style.removeProperty('--tx'); el.style.removeProperty('--ty'); });
    });
  });
})();
