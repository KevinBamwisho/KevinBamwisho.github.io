// Theme toggle. The inline script in <head> applies the stored choice before paint.
document.querySelector('[data-theme-toggle]').addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark');
  try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
});

// Slow flames licking off the headshot's edge. Reduced motion means no animation at all.
const canvas = document.getElementById('flames');
if (canvas && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const ctx = canvas.getContext('2d');
  const size = canvas.clientWidth;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.height = size * dpr;
  ctx.filter = `blur(${2 * dpr}px)`; // soft edges; browsers without canvas filter just draw them crisp

  const c = size / 2;
  const photoR = size / 3.6; // canvas is 1.8x the photo
  const k = photoR / 80;     // sizes were tuned on a 160px photo
  const flames = [];
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);

  // A flame is a few tongues side by side, each flickering on its own phase.
  function spawn(now) {
    const n = Math.floor(rand(2, 5));
    flames.push({
      a: rand(0, Math.PI * 2),
      h: rand(35, 55) * k,
      tongues: Array.from({ length: n }, (_, i) => ({
        y: (i - (n - 1) / 2) * 7 * k,
        h: i === Math.floor(n / 2) ? 1 : rand(0.45, 0.8),
        w: rand(9, 14) * k,
        ph: rand(0, 100),
      })),
      born: now,
      life: rand(2500, 4000),
    });
  }

  let next = 800;
  function frame(now) {
    if (now >= next) {
      spawn(now);
      next = now + rand(1500, 4000);
    }
    ctx.clearRect(0, 0, size, size);
    const rgb = getComputedStyle(document.documentElement).getPropertyValue('--flame').trim();
    for (let i = flames.length - 1; i >= 0; i--) {
      const f = flames[i];
      const p = (now - f.born) / f.life;
      if (p >= 1) { flames.splice(i, 1); continue; }
      if (p < 0) continue;
      const env = Math.sin(Math.PI * p); // grows in, then dies out

      // Local frame: x points out from the photo, base tucked under its edge.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(c, c);
      ctx.rotate(f.a);
      ctx.translate(photoR - 8, 0);
      for (const t of f.tongues) {
        const h = f.h * t.h * env * (1 + 0.12 * Math.sin(now / 110 + t.ph) + 0.07 * Math.sin(now / 47 + t.ph * 2));
        const s1 = Math.sin(now / 300 + t.ph) * t.w * 0.6;       // body sway
        const s2 = Math.sin(now / 220 + t.ph * 1.7) * t.w * 1.1; // tip curl
        const g = ctx.createLinearGradient(0, 0, h, 0);
        g.addColorStop(0, `rgb(${rgb} / ${0.8 * env})`);
        g.addColorStop(1, `rgb(${rgb} / 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, t.y - t.w / 2);
        ctx.bezierCurveTo(h * 0.3, t.y - t.w * 0.8 + s1 * 0.3, h * 0.7, t.y - t.w * 0.2 + s1, h, t.y + s2);
        ctx.bezierCurveTo(h * 0.7, t.y + t.w * 0.2 + s1, h * 0.3, t.y + t.w * 0.8 + s1 * 0.3, 0, t.y + t.w / 2);
        ctx.fill();
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Hardwood Vault slideshow. Crossfades every 5 seconds, with dots to jump to a
// photo and a play/pause button (the button is what keeps auto-rotation
// acceptable under WCAG 2.2.2). Starts paused under reduced motion. The button
// is the only thing that pauses it, so it always shows the true state; the clock
// also holds, unseen, while the photos are scrolled out of view.
const carousel = document.querySelector('.carousel');
if (carousel) {
  const DELAY = 5000;
  const stage = carousel.querySelector('.carousel-stage');
  const slides = [...stage.querySelectorAll('img')];
  const controls = carousel.querySelector('.carousel-controls');
  const toggle = carousel.querySelector('.carousel-toggle');
  const [pauseIcon, playIcon] = toggle.querySelectorAll('svg');

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show photo ${i + 1} of ${slides.length}`);
    dot.addEventListener('click', () => show(i));
    return dot;
  });
  carousel.querySelector('.carousel-dots').append(...dots);
  controls.hidden = false;

  let current = 0;
  let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let inView = false;
  let timer;

  function schedule() {
    clearTimeout(timer);
    if (playing && inView) timer = setTimeout(() => show(current + 1), DELAY);
  }

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === current);
      slide.setAttribute('aria-hidden', String(i !== current));
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
    schedule();
  }

  function setPlaying(on) {
    playing = on;
    toggle.setAttribute('aria-label', on ? 'Pause slideshow' : 'Play slideshow');
    // SVG has no .hidden property, so set the attribute itself.
    pauseIcon.toggleAttribute('hidden', !on);
    playIcon.toggleAttribute('hidden', on);
    // Announce photo changes only when the visitor is driving.
    stage.setAttribute('aria-live', on ? 'off' : 'polite');
    schedule();
  }

  toggle.addEventListener('click', () => setPlaying(!playing));
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    schedule();
  }).observe(stage);

  show(0);
  setPlaying(playing);
}
