/* Maestro — live equalizer, stage curtain on scroll, karaoke roulette */
(() => {
  'use strict';
  const M = window.Motion || { $: (s, r = document) => r.querySelector(s), $$: (s, r = document) => Array.from(r.querySelectorAll(s)), motion: false, fine: false, reduce: true, onScroll: [], toast() {} };
  const { $, $$ } = M;
  const clamp = (v) => Math.max(0, Math.min(1, v));

  /* Equalizer under the hero: bars dance, the pointer pumps the nearest ones */
  const eq = $('#eq');
  if (eq) {
    const n = Math.round(Math.max(28, Math.min(96, innerWidth / 14)));
    const bars = [];
    for (let i = 0; i < n; i++) { const b = document.createElement('i'); eq.append(b); bars.push(b); }
    const seed = bars.map(() => Math.random() * 6.28);
    if (!M.motion) bars.forEach((b, i) => b.style.setProperty('--h', (0.25 + 0.5 * Math.abs(Math.sin(i * 0.7))).toFixed(2)));
    else {
      let px = -1, boost = 0, visible = true, raf = 0;
      addEventListener('pointermove', (e) => { const r = eq.getBoundingClientRect(); px = (e.clientX - r.left) / r.width; boost = 1; }, { passive: true });
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(tick); }).observe(eq);
      let last = 0;
      function tick(now) {
        raf = 0;
        if (!visible) return;
        if (now - last > 70) {
          last = now;
          const t = now / 1000;
          const beat = Math.pow(Math.max(0, Math.sin(t * 4.2)), 6) * 0.35;
          bars.forEach((b, i) => {
            const x = i / n;
            let h = 0.18 + 0.32 * Math.abs(Math.sin(t * 2.1 + seed[i])) * (0.6 + 0.4 * Math.sin(x * 3.14)) + beat * (1 - Math.abs(x - 0.5));
            if (px >= 0) h += boost * 0.55 * Math.max(0, 1 - Math.abs(x - px) * 9);
            b.style.setProperty('--h', Math.min(1, h).toFixed(3));
          });
          boost *= 0.92;
        }
        raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }
  }

  /* Stage curtain opens as you scroll */
  const halls = $('#halls');
  const stage = $('.stage');
  if (halls && stage && M.motion) {
    const upd = () => {
      const r = halls.getBoundingClientRect();
      const span = halls.offsetHeight - innerHeight;
      const p = span > 0 ? clamp(-r.top / span) : 1;
      const cp = clamp((p - 0.05) / 0.55);
      const e = cp * cp * (3 - 2 * cp);
      stage.style.setProperty('--cp', e.toFixed(4));
      stage.style.setProperty('--sk', (Math.sin(Math.PI * e) * 6).toFixed(2) + 'deg');
    };
    if (M.onScroll) M.onScroll.push(upd);
    upd();
  }

  /* Karaoke roulette */
  const wheel = $('#wheel'), spin = $('#spin'), out = $('#ro-out');
  if (wheel && spin) {
    const items = ['Казахские хиты', 'Новинки', 'Миллениалы', 'Старые хиты', 'Дуэт', 'Имениннику'];
    const said = ['казахских хитов', 'свежих новинок', 'хитов для миллениалов', 'старых любимых песен', 'дуэта с другом', 'песни для именинника'];
    const colors = ['#6b1030', '#3a0d1f', '#8e1840', '#2a0b18', '#7a1338', '#451022'];
    const NS = 'http://www.w3.org/2000/svg';
    const seg = 360 / items.length;
    const pt = (a, r) => [Math.cos((a - 90) * Math.PI / 180) * r, Math.sin((a - 90) * Math.PI / 180) * r];
    items.forEach((label, i) => {
      const a0 = i * seg, a1 = (i + 1) * seg;
      const [x0, y0] = pt(a0, 100), [x1, y1] = pt(a1, 100);
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M0 0 L' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A100 100 0 0 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' Z');
      p.setAttribute('fill', colors[i]);
      p.setAttribute('stroke', '#e7b75f'); p.setAttribute('stroke-width', '1.2');
      wheel.append(p);
      const t = document.createElementNS(NS, 'text');
      const mid = a0 + seg / 2;
      t.setAttribute('transform', 'rotate(' + (mid - 90) + ') translate(66 0)' + (mid > 180 ? ' rotate(180)' : ''));
      t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'middle');
      t.textContent = label;
      wheel.append(t);
    });
    const rim = document.createElementNS(NS, 'circle');
    rim.setAttribute('r', '102'); rim.setAttribute('fill', 'none'); rim.setAttribute('stroke', '#e7b75f'); rim.setAttribute('stroke-width', '4');
    wheel.append(rim);
    for (let k = 0; k < 24; k++) { const [x, y] = pt(k * 15, 102); const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', x.toFixed(2)); c.setAttribute('cy', y.toFixed(2)); c.setAttribute('r', '2.6'); c.setAttribute('fill', k % 2 ? '#fff2d6' : '#e7b75f'); wheel.append(c); }
    let rot = 0;
    spin.addEventListener('click', () => {
      spin.disabled = true;
      const pick = Math.floor(Math.random() * items.length);
      const target = 360 - (pick * seg + seg / 2);
      const base = rot - (rot % 360);
      rot = base + 360 * (M.motion ? 6 : 1) + target + (Math.random() - 0.5) * seg * 0.6;
      wheel.style.transform = 'rotate(' + rot.toFixed(1) + 'deg)';
      const done = () => {
        spin.disabled = false;
        out.textContent = 'Сегодня начинаем с ' + said[pick] + '!';
        out.classList.remove('pop'); void out.offsetWidth; out.classList.add('pop');
      };
      if (M.motion) setTimeout(done, 4300); else done();
    });
  }

  /* Reviews carousel buttons */
  const track = $('#rev-track');
  $$('.rn').forEach((b) => b.addEventListener('click', () => {
    if (!track) return;
    const card = track.querySelector('.rv');
    track.scrollBy({ left: (card ? card.getBoundingClientRect().width + 16 : 320) * +b.dataset.dir, behavior: M.reduce ? 'auto' : 'smooth' });
  }));
})();
