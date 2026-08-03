/* =========================================================
   ANGELA WORLD — Main Application Script
   ---------------------------------------------------------
   Responsibilities:
   - Cinematic loader sequence
   - Header + mobile navigation
   - Canvas 2D particle network (background)
   - Three.js crystal / portal / energy scene
   - Ecosystem & hero module cards
   - Scroll animations (GSAP)
   - Metric counters
   ========================================================= */

(function () {
  'use strict';

  /* ---------- Helpers ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* =========================================================
     LOADER
     Progress bar + step checklist. Click or wait to enter.
     ========================================================= */
  const loader = $('#loader');
  const app = $('#app');
  const progressFill = $('#progressFill');
  const progressPct = $('#progressPct');
  const steps = $$('.step');

  let progress = 0;
  let finished = false;
  const DURATION = 2600; // total loader time (ms)
  const start = performance.now();

  /** Mark a checklist step as active or done */
  function setStep(i, state) {
    const el = steps[i];
    if (!el) return;
    el.classList.remove('is-active', 'is-done');
    if (state) el.classList.add(state);
  }

  /** Drive progress 0→100 and unlock steps in sequence */
  function tick(now) {
    if (finished) return;
    const t = Math.min(1, (now - start) / DURATION);
    progress = Math.floor(t * 100);
    progressFill.style.width = progress + '%';
    progressPct.textContent = progress + '%';
    loader.setAttribute('aria-valuenow', progress);

    // Step thresholds (approx. equal segments)
    if (progress >= 12) setStep(0, 'is-done');
    if (progress >= 12 && progress < 32) setStep(1, 'is-active');
    if (progress >= 32) setStep(1, 'is-done');
    if (progress >= 32 && progress < 52) setStep(2, 'is-active');
    if (progress >= 52) setStep(2, 'is-done');
    if (progress >= 52 && progress < 72) setStep(3, 'is-active');
    if (progress >= 72) setStep(3, 'is-done');
    if (progress >= 72 && progress < 94) setStep(4, 'is-active');
    if (progress >= 94) setStep(4, 'is-done');

    if (t < 1) requestAnimationFrame(tick);
    else finish();
  }

  /** Hide loader and reveal main app */
  function finish() {
    if (finished) return;
    finished = true;
    progress = 100;
    progressFill.style.width = '100%';
    progressPct.textContent = '100%';
    loader.setAttribute('aria-valuenow', 100);
    steps.forEach((_, i) => setStep(i, 'is-done'));

    setTimeout(() => {
      loader.classList.add('is-hidden');
      app.classList.remove('is-hidden');
      requestAnimationFrame(() => {
        app.classList.add('is-visible');
        init(); // boot interactive features
      });
    }, 320);
  }

  requestAnimationFrame(tick);
  loader.addEventListener('click', finish, { once: true });
  loader.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') finish();
  });

  /* =========================================================
     SITE BOOT
     ========================================================= */
  function init() {
    initHeader();
    initMobile();
    initHeroFX();
    initModules();
    initScroll();
    initCounters();
  }

  /* ---------- Sticky header on scroll ---------- */
  function initHeader() {
    const header = $('#header');
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', window.scrollY > 36);
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Mobile hamburger menu ---------- */
  function initMobile() {
    const toggle = $('#menuToggle');
    const nav = $('#mobileNav');
    if (!toggle || !nav) return;

    const close = () => {
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      nav.hidden = true;
    };
    const open = () => {
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      nav.hidden = false;
    };

    toggle.addEventListener('click', () => (nav.hidden ? open() : close()));
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !nav.hidden) close();
    });
  }

  /* =========================================================
     HERO EFFECTS
     Canvas particles + optional Three.js scene
     ========================================================= */
  function initHeroFX() {
    initParticles();
    if (typeof THREE !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try {
        initThree();
      } catch (e) {
        console.warn('Three.js fallback', e);
      }
    }
  }

  /* ---------- Canvas 2D particle network (optimized) ----------
     - Adaptive count for mobile / low-end
     - FPS cap (~30)
     - Squared-distance checks
     - Connection stride to cut O(n²) cost
     - Pauses when tab is hidden
     --------------------------------------------------------- */
  function initParticles() {
    const canvas = $('#heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let w = 0, h = 0, particles = [], rafId = 0;
    let lastTime = 0;
    const TARGET_FPS = 30;
    const FRAME_MS = 1000 / TARGET_FPS;

    const isMobile = innerWidth < 768 || ('ontouchstart' in window);
    const isLowEnd = devicePixelRatio < 1.5 || navigator.hardwareConcurrency <= 4;
    let COUNT;
    if (isMobile || isLowEnd) COUNT = 28;
    else COUNT = Math.min(55, Math.floor((innerWidth * innerHeight) / 28000));

    const maxDist = isMobile ? 70 : 95;
    const maxDistSq = maxDist * maxDist;
    const CONNECT_STRIDE = isMobile ? 2 : 1;

    function resize() {
      w = canvas.width = innerWidth;
      h = canvas.height = innerHeight;
    }
    resize();
    addEventListener('resize', resize, { passive: true });

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        a: Math.random() * 0.35 + 0.12
      });
    }

    let visible = true;
    document.addEventListener('visibilitychange', () => {
      visible = !document.hidden;
      if (visible && !rafId) rafId = requestAnimationFrame(draw);
    });

    function draw(now) {
      rafId = 0;
      if (!visible) return;
      if (now - lastTime < FRAME_MS) {
        rafId = requestAnimationFrame(draw);
        return;
      }
      lastTime = now;

      ctx.clearRect(0, 0, w, h);

      // Points
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        else if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283185307179586);
        ctx.fillStyle = 'rgba(245,197,66,' + p.a + ')';
        ctx.fill();
      }

      // Connections (reduced sampling)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < COUNT; i += CONNECT_STRIDE) {
        const a = particles[i];
        for (let j = i + 1; j < COUNT; j += CONNECT_STRIDE) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < maxDistSq) {
            const alpha = 0.08 * (1 - Math.sqrt(dSq) / maxDist);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = 'rgba(245,197,66,' + alpha + ')';
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);
  }

  /* =========================================================
     THREE.JS — Crystal, portal rings, energy particles
     Advanced WebGL: ACES tone mapping, PBR lights, adaptive DPR
     ========================================================= */
  function initThree() {
    const container = $('#threeContainer');
    const fallback = $('#crystalFallback');
    if (!container) return;

    // Device profiling for quality tiers
    const isMobile3 = innerWidth < 768 || ('ontouchstart' in window);
    const isLowEnd3 = (navigator.hardwareConcurrency || 8) <= 4;
    const pCount = isMobile3 ? 45 : (isLowEnd3 ? 70 : 100);
    const p2Count = isMobile3 ? 16 : (isLowEnd3 ? 24 : 36);
    const ringCount = isMobile3 ? 4 : 6;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 0.2, 6.2);

    // ----- Advanced WebGL Renderer -----
    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile3,          // MSAA is expensive on mobile
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: false,
      precision: isMobile3 ? 'mediump' : 'highp',
      preserveDrawingBuffer: false
    });

    const dprCap = isMobile3 ? 1.25 : Math.min(devicePixelRatio, 1.75);
    renderer.setPixelRatio(dprCap);
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Color space (r134 vs newer three)
    if ('outputColorSpace' in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace || 'srgb';
    } else if ('outputEncoding' in renderer) {
      renderer.outputEncoding = THREE.sRGBEncoding || 3001;
    }

    // Physically based lights
    if ('physicallyCorrectLights' in renderer) {
      renderer.physicallyCorrectLights = true;
    } else if ('useLegacyLights' in renderer) {
      renderer.useLegacyLights = false;
    }

    // Cinematic tone mapping
    renderer.toneMapping = THREE.ACESFilmicToneMapping || 4;
    renderer.toneMappingExposure = isMobile3 ? 1.05 : 1.15;
    renderer.shadowMap.enabled = false;
    renderer.sortObjects = true;

    container.appendChild(renderer.domElement);
    if (typeof window !== 'undefined') window.__angelaRenderer = renderer;

    const group = new THREE.Group();
    scene.add(group);

    // ===== Multi-layer crystal =====
    const crystalGroup = new THREE.Group();
    group.add(crystalGroup);

    // Outer translucent shell
    const outerGeo = new THREE.OctahedronGeometry(1.35, 0);
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: 0xF5C542,
      metalness: 0.92,
      roughness: 0.1,
      transparent: true,
      opacity: 0.52,
      emissive: 0xC9A227,
      emissiveIntensity: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      reflectivity: 0.95,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide
    });
    crystalGroup.add(new THREE.Mesh(outerGeo, outerMat));

    // Bright inner core
    const innerGeo = new THREE.OctahedronGeometry(0.72, 0);
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFE9A0,
      metalness: 0.75,
      roughness: 0.18,
      transparent: true,
      opacity: 0.92,
      emissive: 0xF5C542,
      emissiveIntensity: 0.5,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    crystalGroup.add(inner);

    // Wireframe accent
    const wireGeo = new THREE.OctahedronGeometry(1.42, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xFFE9A0,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    crystalGroup.add(wire);

    // ===== Portal rings (torus) =====
    const rings = [];
    for (let i = 0; i < ringCount; i++) {
      const radius = 1.9 + i * 0.38;
      const tube = 0.018 + (i % 2) * 0.008;
      const ringGeo = new THREE.TorusGeometry(radius, tube, 12, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xF5C542 : 0xFFE9A0,
        transparent: true,
        opacity: 0.35 - i * 0.04
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + (i % 3) * 0.08;
      ring.userData = {
        speed: 0.002 + i * 0.0008,
        tilt: (i % 2 === 0 ? 1 : -1) * (0.003 + i * 0.0005)
      };
      group.add(ring);
      rings.push(ring);
    }

    // ===== Gold energy particles =====
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);
    const velocities = [];
    for (let i = 0; i < pCount; i++) {
      const r = 2.2 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = r * Math.cos(phi);
      velocities.push({
        theta: (Math.random() - 0.5) * 0.008,
        phi: (Math.random() - 0.5) * 0.004
      });
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0xFFE9A0,
        size: 0.045,
        transparent: true,
        opacity: 0.75,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    group.add(points);

    // ===== Secondary cyan particles (depth / color variety) =====
    const p2Geo = new THREE.BufferGeometry();
    const pos2 = new Float32Array(p2Count * 3);
    for (let i = 0; i < p2Count; i++) {
      const r = 3.0 + Math.random() * 2.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos2[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos2[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos2[i * 3 + 2] = r * Math.cos(phi);
    }
    p2Geo.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
    const points2 = new THREE.Points(
      p2Geo,
      new THREE.PointsMaterial({
        color: 0x5eead4,
        size: 0.03,
        transparent: true,
        opacity: 0.45,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    group.add(points2);

    // ===== Lighting (PBR-friendly) =====
    const keyLight = new THREE.PointLight(0xF5C542, 2.2, 16, 2);
    keyLight.position.set(0, 1.8, 3.5);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0x5eead4, 0.55, 12, 2);
    fillLight.position.set(-2.2, -1, 2.5);
    scene.add(fillLight);
    const rimLight = new THREE.PointLight(0xFFE9A0, 0.4, 10, 2);
    rimLight.position.set(2, 0.5, -2);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight(0x2a2a38, 0.35));
    scene.add(new THREE.HemisphereLight(0x1a1a2e, 0x0a0a08, 0.25));

    // Energy beam under crystal
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.28, 3.5, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xF5C542,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = -2.1;
    group.add(beam);

    // Hide CSS fallback once WebGL is ready
    if (fallback) fallback.classList.add('is-hidden');

    // Mouse parallax targets
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / innerWidth - 0.5) * 2;
      mouseY = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });

    let frame = 0;
    let threeVisible = true;
    document.addEventListener('visibilitychange', () => {
      threeVisible = !document.hidden;
      if (threeVisible) requestAnimationFrame(animate);
    });

    function animate() {
      if (!threeVisible) return;
      frame++;
      const t = frame * 0.01;

      // Crystal rotation + float
      crystalGroup.rotation.y += 0.007;
      crystalGroup.rotation.x = Math.sin(t * 0.7) * 0.1;
      crystalGroup.position.y = Math.sin(t) * 0.12;
      inner.rotation.y -= 0.012;
      wire.rotation.y += 0.004;
      wire.rotation.z = Math.sin(t * 0.5) * 0.05;

      // Portal rings
      rings.forEach((ring, i) => {
        ring.rotation.z += ring.userData.speed;
        ring.rotation.x += ring.userData.tilt * 0.3;
        ring.material.opacity = 0.22 + Math.sin(t + i) * 0.08;
      });

      // Orbit gold particles around Y
      const posAttr = pGeo.attributes.position;
      for (let i = 0; i < pCount; i++) {
        const ix = i * 3;
        let x = posAttr.array[ix];
        let y = posAttr.array[ix + 1];
        let z = posAttr.array[ix + 2];
        const v = velocities[i];
        const cos = Math.cos(v.theta);
        const sin = Math.sin(v.theta);
        posAttr.array[ix] = x * cos - z * sin;
        posAttr.array[ix + 2] = x * sin + z * cos;
        posAttr.array[ix + 1] = y + Math.sin(t + i) * 0.002;
      }
      posAttr.needsUpdate = true;
      points.rotation.y += 0.0015;
      points2.rotation.y -= 0.002;

      // Beam pulse
      beam.material.opacity = 0.12 + Math.sin(t * 2) * 0.08;
      beam.scale.x = 1 + Math.sin(t * 1.5) * 0.15;
      beam.scale.z = beam.scale.x;

      keyLight.intensity = 1.4 + Math.sin(t * 1.2) * 0.3;

      // Smooth parallax
      targetX += (mouseX * 0.25 - targetX) * 0.04;
      targetY += (-mouseY * 0.15 - targetY) * 0.04;
      group.rotation.y = targetX * 0.3;
      group.rotation.x = targetY * 0.2;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    }, { passive: true });
  }

  /* =========================================================
     MODULE CARDS (hero strip + ecosystem grid)
     ========================================================= */
  function initModules() {
    const heroData = [
      { num: '01', title: 'VISION', icon: '◆' },
      { num: '02', title: 'ECOSYSTEM', icon: '◎' },
      { num: '03', title: 'AI CORE', icon: 'AI' },
      { num: '04', title: 'WALLET', icon: '▣' },
      { num: '05', title: 'ROADMAP', icon: '↗' },
      { num: '06', title: 'TOKENOMICS', icon: '◇' },
      { num: '07', title: 'SECURITY', icon: '🛡' },
      { num: '08', title: 'STAKING', icon: '⚡' },
      { num: '09', title: 'COMMUNITY', icon: '◈' },
      { num: '10', title: 'FUTURE', icon: '∞' }
    ];

    const heroWrap = $('#heroModules');
    if (heroWrap) {
      const frag = document.createDocumentFragment();
      heroData.forEach((c, i) => {
        const el = document.createElement('div');
        el.className = 'hm-card' + (i === 4 ? ' is-active' : '');
        el.setAttribute('role', 'listitem');
        el.setAttribute('tabindex', '0');
        el.innerHTML =
          '<div class="num">' + c.num + '</div>' +
          '<div class="icon" aria-hidden="true">' + c.icon + '</div>' +
          '<h3>' + c.title + '</h3>';
        const act = () => {
          heroWrap.querySelectorAll('.hm-card').forEach((x) => x.classList.remove('is-active'));
          el.classList.add('is-active');
        };
        el.addEventListener('click', act);
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            act();
          }
        });
        frag.appendChild(el);
      });
      heroWrap.appendChild(frag);
    }

    const ecoData = [
      { num: '01', title: 'VISION', desc: 'A clear vision of a limitless future.', icon: '◈' },
      { num: '02', title: 'ECOSYSTEM', desc: 'Builders, partners and communities.', icon: '◎' },
      { num: '03', title: 'AI CORE', desc: 'Intelligence that learns and adapts.', icon: 'AI' },
      { num: '04', title: 'WALLET', desc: 'Secure multi-chain ownership.', icon: '▣' },
      { num: '05', title: 'ROADMAP', desc: 'Path to a decentralized future.', icon: '↗' },
      { num: '06', title: 'TOKENOMICS', desc: 'Sustainable long-term value.', icon: '◇' },
      { num: '07', title: 'SECURITY', desc: 'Enterprise-grade protection.', icon: '🛡' },
      { num: '08', title: 'STAKING', desc: 'Stake, earn and grow.', icon: '⚡' },
      { num: '09', title: 'COMMUNITY', desc: 'One global family.', icon: '◈' },
      { num: '10', title: 'FUTURE', desc: 'Intelligent and limitless.', icon: '∞' }
    ];

    const ecoWrap = $('#ecoModules');
    if (ecoWrap) {
      const frag = document.createDocumentFragment();
      ecoData.forEach((c) => {
        const el = document.createElement('div');
        el.className = 'eco-mod';
        el.setAttribute('role', 'listitem');
        el.setAttribute('tabindex', '0');
        el.innerHTML =
          '<div class="num">' + c.num + '</div>' +
          '<div class="icon" aria-hidden="true">' + c.icon + '</div>' +
          '<h3>' + c.title + '</h3><p>' + c.desc + '</p>';
        const act = () => {
          ecoWrap.querySelectorAll('.eco-mod').forEach((x) => x.classList.remove('is-active'));
          el.classList.add('is-active');
        };
        el.addEventListener('click', act);
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            act();
          }
        });
        frag.appendChild(el);
      });
      ecoWrap.appendChild(frag);
    }
  }

  /* ---------- Animated metric counters (IntersectionObserver) ---------- */
  function initCounters() {
    const els = $$('[data-count]');
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        if (isNaN(target)) return;
        const suffix = el.textContent.replace(/[\d.]+/, '');
        const isFloat = String(el.dataset.count).includes('.');
        const duration = 1400;
        const t0 = performance.now();
        function step(now) {
          const t = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
          const val = target * eased;
          el.textContent = (isFloat ? val.toFixed(1) : Math.floor(val)) + suffix;
          if (t < 1) requestAnimationFrame(step);
          else el.textContent = (isFloat ? target.toFixed(1) : target) + suffix;
        }
        requestAnimationFrame(step);
        obs.unobserve(el);
      });
    }, { threshold: 0.4 });
    els.forEach((el) => obs.observe(el));
  }

  /* =========================================================
     ADVANCED SCROLLTRIGGER
     Patterns used:
     - batch() for card grids (fewer observers)
     - once: true (play once, free memory)
     - scrub parallax (desktop only via matchMedia)
     - roadmap progress-linked timeline
     - invalidateOnRefresh + refresh()
     - toggleClass for section active state
     ========================================================= */
  function initScroll() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'power3.out' });

    /* --- Hero intro (timeline, not scroll-linked) --- */
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .from('.hero-eyebrow', { y: 20, opacity: 0, duration: 0.55 }, 0)
      .from('.hero-title', { y: 36, opacity: 0, duration: 0.75 }, 0.08)
      .from('.hero-tagline', { y: 22, opacity: 0, duration: 0.6 }, 0.2)
      .from('.hero-desc', { y: 18, opacity: 0, duration: 0.55 }, 0.32)
      .from('.hero-ctas a', { y: 14, opacity: 0, duration: 0.45, stagger: 0.1 }, 0.45)
      .from('.live-panel', { x: 36, opacity: 0, duration: 0.7 }, 0.28)
      .from('.hm-card', { y: 28, opacity: 0, duration: 0.45, stagger: 0.04 }, 0.55)
      .from('.theme-bar', { opacity: 0, duration: 0.5 }, 0.75);

    /* --- Section headers (children stagger) --- */
    gsap.utils.toArray('.section-header').forEach((el) => {
      gsap.from(el.children, {
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
          once: true
        },
        y: 26,
        opacity: 0,
        duration: 0.65,
        stagger: 0.1
      });
    });

    /* --- Batch reveal for card-like elements (efficient) --- */
    ScrollTrigger.batch('.vision-card, .sec-card, .trust-block, .doc-card, .phase', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => {
        gsap.from(batch, {
          y: 36,
          opacity: 0,
          duration: 0.65,
          stagger: 0.08,
          ease: 'power3.out',
          overwrite: true
        });
      }
    });

    /* --- Ecosystem modules: from center --- */
    ScrollTrigger.batch('.eco-mod', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => {
        gsap.from(batch, {
          y: 32,
          opacity: 0,
          scale: 0.96,
          duration: 0.55,
          stagger: { each: 0.05, from: 'center' },
          ease: 'power3.out',
          overwrite: true
        });
      }
    });

    /* --- Metrics --- */
    ScrollTrigger.batch('.metric', {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => {
        gsap.from(batch, {
          y: 18,
          opacity: 0,
          duration: 0.45,
          stagger: 0.06,
          overwrite: true
        });
      }
    });

    /* --- Token panels --- */
    gsap.from('.token-utility, .token-dashboard', {
      scrollTrigger: {
        trigger: '.token-grid',
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true
      },
      y: 40,
      opacity: 0,
      duration: 0.7,
      stagger: 0.14
    });

    /* --- Section active state (toggleClass) --- */
    gsap.utils.toArray('main section[id]').forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 45%',
        end: 'bottom 45%',
        toggleClass: { targets: section, className: 'is-inview' }
      });
    });

    /* --- Roadmap: scrub-linked progress line (desktop) --- */
    const mm = gsap.matchMedia();

    mm.add('(min-width: 900px)', () => {
      // Parallax live panel
      if ($('.live-panel')) {
        gsap.to('.live-panel', {
          y: 70,
          ease: 'none',
          scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.1,
            invalidateOnRefresh: true
          }
        });
      }

      // Header titles soft parallax
      gsap.utils.toArray('.section-header h2').forEach((el) => {
        gsap.to(el, {
          y: -14,
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('.section') || el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.4,
            invalidateOnRefresh: true
          }
        });
      });

      // Roadmap phases sequential highlight via progress
      if ($('.roadmap-timeline')) {
        const phases = gsap.utils.toArray('.phase');
        ScrollTrigger.create({
          trigger: '.roadmap-timeline',
          start: 'top 70%',
          end: 'bottom 40%',
          scrub: true,
          onUpdate: (self) => {
            const idx = Math.min(phases.length - 1, Math.floor(self.progress * phases.length));
            phases.forEach((p, i) => {
              p.classList.toggle('is-active', i === idx);
              p.classList.toggle('is-passed', i < idx);
            });
          }
        });
      }

      return () => {
        // cleanup handled by matchMedia
      };
    });

    /* --- Hover (desktop pointer) --- */
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      $$('.btn-primary, .btn-enter').forEach((btn) => {
        btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.04, duration: 0.22, overwrite: 'auto' }));
        btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1, duration: 0.28, overwrite: 'auto' }));
      });
      $$('.eco-mod, .hm-card, .sec-card, .vision-card').forEach((card) => {
        card.addEventListener('mouseenter', () => gsap.to(card, { y: -6, duration: 0.3, overwrite: 'auto' }));
        card.addEventListener('mouseleave', () => gsap.to(card, { y: 0, duration: 0.35, overwrite: 'auto' }));
      });
    }

    /* --- Refresh after layout settles (fonts, images) --- */
    requestAnimationFrame(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }


})();
