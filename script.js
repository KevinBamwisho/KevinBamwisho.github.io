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
