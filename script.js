// ---------- GSAP + ScrollTrigger ----------
gsap.registerPlugin(ScrollTrigger);

// ---------- THREE.JS PARTICLES ----------
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  canvas.appendChild(renderer.domElement);

  const geometry = new THREE.BufferGeometry();
  const count = 800;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    const c = new THREE.Color().setHSL(0.10 + Math.random() * 0.05, 0.9, 0.5 + Math.random() * 0.3);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  camera.position.z = 12;

  let mouseX = 0,
    mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  function animate() {
    requestAnimationFrame(animate);
    points.rotation.y += 0.0006;
    points.rotation.x += 0.0003;
    points.rotation.x += (mouseY * 0.02 - points.rotation.x) * 0.01;
    points.rotation.y += (mouseX * 0.02 - points.rotation.y) * 0.01;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

// ---------- HEADER SCROLL EFFECT ----------
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
});

// ---------- MOBILE MENU ----------
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('active');
});
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('navLinks').classList.remove('active');
  });
});

// ---------- TYPED TEXT ----------
const phrases = ['Decentralized Future', 'Community Power', 'Limitless Growth', 'Financial Freedom'];
let idx = 0,
  charIdx = 0,
  isDeleting = false;
const typedEl = document.getElementById('typed-text');

function typeLoop() {
  const current = phrases[idx];
  if (!isDeleting) {
    typedEl.textContent = current.substring(0, charIdx + 1);
    charIdx++;
    if (charIdx === current.length) {
      isDeleting = true;
      setTimeout(typeLoop, 2000);
      return;
    }
    setTimeout(typeLoop, 100);
  } else {
    typedEl.textContent = current.substring(0, charIdx - 1);
    charIdx--;
    if (charIdx === 0) {
      isDeleting = false;
      idx = (idx + 1) % phrases.length;
      setTimeout(typeLoop, 400);
      return;
    }
    setTimeout(typeLoop, 50);
  }
}
typeLoop();

// ---------- 3D TILT ON WHY CARDS (mouse move) ----------
document.querySelectorAll('.why-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 12;
    const rotateX = ((centerY - y) / centerY) * 12;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    card.style.boxShadow = '0 20px 50px rgba(249,184,58,0.12)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
    card.style.boxShadow = 'none';
  });
});

// ---------- GSAP ANIMATIONS ----------
// Hero
gsap.from('.hero h1', { duration: 1.2, y: 60, opacity: 0, ease: 'power3.out', delay: 0.2 });
gsap.from('.hero .subhead', { duration: 1, y: 40, opacity: 0, ease: 'power3.out', delay: 0.5 });
gsap.from('.hero-btns .btn', { duration: 0.8, y: 30, opacity: 0, stagger: 0.15, ease: 'power3.out', delay: 0.8 });
gsap.from('#typed-text', { duration: 0.6, opacity: 0, delay: 1.2 });

// Why cards (stagger on scroll)
gsap.from('.why-card', {
  scrollTrigger: { trigger: '#why', start: 'top 75%' },
  duration: 0.8,
  y: 50,
  opacity: 0,
  stagger: 0.12,
  ease: 'power2.out'
});

// Tokenomics chart
gsap.from('#tokenChart', {
  scrollTrigger: { trigger: '#tokenomics', start: 'top 70%' },
  duration: 1.2,
  scale: 0.6,
  opacity: 0,
  rotate: 360,
  ease: 'power2.out'
});
gsap.from('.token-item', {
  scrollTrigger: { trigger: '#tokenomics', start: 'top 70%' },
  duration: 0.6,
  x: -30,
  opacity: 0,
  stagger: 0.08,
  ease: 'power2.out'
});

// Roadmap items (appear from sides)
document.querySelectorAll('.roadmap-item').forEach((item, i) => {
  const fromX = i % 2 === 0 ? -60 : 60;
  gsap.from(item, {
    scrollTrigger: { trigger: item, start: 'top 85%', toggleActions: 'play none none none' },
    duration: 0.9,
    x: fromX,
    opacity: 0,
    ease: 'power2.out'
  });
});

// Security box
gsap.from('.security-box', {
  scrollTrigger: { trigger: '#security', start: 'top 70%' },
  duration: 1,
  y: 40,
  opacity: 0,
  ease: 'power2.out'
});

// Community cards
gsap.from('.community-card', {
  scrollTrigger: { trigger: '#community', start: 'top 75%' },
  duration: 0.7,
  y: 40,
  opacity: 0,
  stagger: 0.12,
  ease: 'power2.out'
});

// News items
gsap.from('.news-item', {
  scrollTrigger: { trigger: '.news-list', start: 'top 80%' },
  duration: 0.6,
  x: -30,
  opacity: 0,
  stagger: 0.1,
  ease: 'power2.out'
});

// App buttons
gsap.from('.app-buttons .btn', {
  scrollTrigger: { trigger: '.app-section', start: 'top 75%' },
  duration: 0.7,
  y: 30,
  opacity: 0,
  stagger: 0.15,
  ease: 'power2.out'
});

// Final CTA
gsap.from('.final-cta h2', {
  scrollTrigger: { trigger: '.final-cta', start: 'top 75%' },
  duration: 0.9,
  y: 40,
  opacity: 0,
  ease: 'power2.out'
});
gsap.from('.final-cta .btn', {
  scrollTrigger: { trigger: '.final-cta', start: 'top 75%' },
  duration: 0.7,
  y: 30,
  opacity: 0,
  delay: 0.2,
  ease: 'power2.out'
});

// ---------- ECOSYSTEM SLIDER (auto scroll) ----------
const slider = document.getElementById('ecosystemSlider');
let scrollPos = 0;
setInterval(() => {
  scrollPos += 1.2;
  if (scrollPos > slider.scrollWidth - slider.clientWidth) scrollPos = 0;
  slider.scrollTo({ left: scrollPos, behavior: 'smooth' });
}, 3000);
