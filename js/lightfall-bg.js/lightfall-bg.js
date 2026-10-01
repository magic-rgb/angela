/* ANGELA — Living background (WebGL lightfall, gold/blue palette) */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const isMobile = window.matchMedia('(max-width: 700px)').matches || 'ontouchstart' in window;

  const canvas = document.createElement('canvas');
  canvas.id = 'site-lightfall';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power'
  });
  if (!gl) {
    canvas.remove();
    return;
  }

  const VERT = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  // Simplified living field — gold + electric blue on deep space
  const FRAG = `
    precision mediump float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_mouseOn;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);

      float t = u_time * 0.12;

      // Deep base
      vec3 col = vec3(0.008, 0.02, 0.04);

      // Soft cosmic glow centers
      float g1 = exp(-dot(p - vec2(-0.35, 0.2), p - vec2(-0.35, 0.2)) * 2.2);
      float g2 = exp(-dot(p - vec2(0.45, -0.15), p - vec2(0.45, -0.15)) * 1.8);
      float g3 = exp(-dot(p - vec2(0.1, 0.55), p - vec2(0.1, 0.55)) * 3.0);

      vec3 gold = vec3(0.84, 0.68, 0.30);
      vec3 goldHi = vec3(0.96, 0.84, 0.49);
      vec3 blue = vec3(0.30, 0.66, 1.0);

      col += gold * g1 * 0.12;
      col += blue * g2 * 0.10;
      col += goldHi * g3 * 0.07;

      // Drifting energy streaks
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float speed = 0.15 + fi * 0.04;
        float xOff = sin(t * speed + fi * 1.7) * 0.55 + cos(t * 0.08 + fi) * 0.2;
        float y = fract(uv.y * 0.7 + t * (0.03 + fi * 0.01) + fi * 0.17);
        float dist = abs(uv.x - (0.5 + xOff * 0.35));
        float streak = smoothstep(0.04, 0.0, dist) * pow(1.0 - abs(y - 0.5) * 2.0, 2.0);
        streak *= 0.08 + 0.04 * sin(t * 2.0 + fi * 3.0);
        vec3 sc = mix(gold, blue, fi / 5.0);
        col += sc * streak * 0.55;
      }

      // Twinkling particles
      for (int j = 0; j < 12; j++) {
        float fj = float(j);
        vec2 sp = vec2(
          hash(vec2(fj, 1.3)),
          hash(vec2(fj * 2.1, 4.7))
        );
        sp.y = fract(sp.y + t * (0.02 + hash(vec2(fj, 9.0)) * 0.03));
        vec2 q = uv - sp;
        q.x *= u_res.x / u_res.y;
        float d = length(q);
        float tw = 0.5 + 0.5 * sin(t * 3.0 + fj * 6.0);
        float star = smoothstep(0.008, 0.0, d) * tw;
        col += mix(goldHi, blue, hash(vec2(fj, 2.2))) * star * 0.35;
      }

      // Subtle flowing noise veil
      float n = noise(uv * 3.0 + vec2(t * 0.15, -t * 0.1));
      col += mix(gold, blue, n) * n * 0.025;

      // Mouse soft attraction (desktop)
      if (u_mouseOn > 0.5) {
        vec2 m = u_mouse;
        float md = length(uv - m);
        float mg = exp(-md * md * 18.0);
        col += mix(gold, blue, 0.4) * mg * 0.12;
      }

      // Vignette
      float vig = smoothstep(1.2, 0.35, length(p));
      col *= mix(0.55, 1.0, vig);

      // Keep restrained so section images/content stay dominant
      col = clamp(col, 0.0, 1.0) * 0.85;

      gl_FragColor = vec4(col, 0.55);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) {
    canvas.remove();
    return;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    canvas.remove();
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');
  const uMouseOn = gl.getUniformLocation(prog, 'u_mouseOn');

  let mouse = [0.5, 0.5];
  let mouseOn = isMobile ? 0 : 1;
  let w = 0;
  let h = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75);

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  if (!isMobile) {
    window.addEventListener('pointermove', (e) => {
      mouse[0] = e.clientX / w;
      mouse[1] = 1.0 - e.clientY / h;
    }, { passive: true });
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let raf = 0;
  let start = performance.now();
  let visible = true;

  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
  });

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const t = (now - start) * 0.001;
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mouse[0], mouse[1]);
    gl.uniform1f(uMouseOn, mouseOn);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  raf = requestAnimationFrame(frame);
})();
