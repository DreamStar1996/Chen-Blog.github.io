/* ════════════════════════════════════════════════════════════════
   main.js — 主题交互
   加载 · 进度 · 倒计时 · 滚动揭示 · 日夜切换 + 跃迁过渡 · 订阅表单
   （星空背景见 backgrounds.js · 曲率引擎 warp 逻辑见 warp.js）
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ───────── 初始加载 + 进度条 ───────── */
  window.addEventListener('load', () => {
    setTimeout(() => {
      const l = document.getElementById('loader');
      if (l) l.classList.add('hidden');
    }, 800);
    setTimeout(() => {
      const fill = document.getElementById('progress-fill');
      if (fill) fill.style.width = '92%';
    }, 1200);
  });

  /* ───────── 星空背景：交由 backgrounds.js 统一管理 ───────── */
  if (window.StellarBG) window.StellarBG.init();

  /* ───────── 滚动揭示 ───────── */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 100);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));

  /* 立即揭示当前视口内的元素（用于「跃迁抵达」后首屏直接显现） */
  window.revealInView = function () {
    document.querySelectorAll('[data-reveal]:not(.visible)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0) {
        el.classList.add('visible');
        observer.unobserve(el);
      }
    });
  };

  /* ───────── 倒计时（2026-06-01 上线） ───────── */
  const target = new Date('2026-06-01T00:00:00').getTime();
  function updateCountdown() {
    const diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v).padStart(2, '0'); };
    set('cd-days', d); set('cd-hours', h); set('cd-mins', m); set('cd-secs', s);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ───────── 日 / 夜 切换 + 日出日落过渡 ───────── */
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const ctrans = document.getElementById('ctrans');
  let animating = false;
  let theme = 'night';

  function applyTheme(t) {
    theme = t;
    if (t === 'day') root.setAttribute('data-theme', 'day');
    else root.removeAttribute('data-theme');
    if (toggle) toggle.setAttribute('aria-checked', String(t === 'day'));
    if (window.StellarBG) window.StellarBG.setTheme(t);
  }
  function flipTheme() {
    if (animating || !ctrans) return;
    animating = true;
    const toDay = theme !== 'day';
    ctrans.classList.remove('to-day', 'to-night', 'run');
    void ctrans.offsetWidth;                 // 重启动画
    ctrans.classList.add(toDay ? 'to-day' : 'to-night', 'run');
    setTimeout(() => applyTheme(toDay ? 'day' : 'night'), 560);   // 在霞光最浓时切换
    setTimeout(() => { ctrans.classList.remove('run', 'to-day', 'to-night'); animating = false; }, 1340);
  }
  if (toggle) toggle.addEventListener('click', flipTheme);

  /* ───────── 订阅表单（星空来信） ───────── */
  const subBtn = document.getElementById('subBtn');
  const form = document.getElementById('newsForm');
  const email = document.getElementById('subEmail');
  if (subBtn && form && email) {
    subBtn.addEventListener('click', () => {
      if (!email.value.includes('@') || !email.value.includes('.')) {
        email.style.borderColor = 'var(--rose)';
        email.focus();
        return;
      }
      form.innerHTML = '<p class="news-ok">✦ 已收到你的邮箱，下一封星空来信即将启程。</p>';
    });
  }

  /* ───────── 阅读进度条 + 返回顶部（全站可用；warp 过场时隐藏） ───────── */
  const readBar = document.getElementById('read-progress');
  const toTop = document.getElementById('to-top');

  function scrollTopPos() {
    // body 设了 overflow-y:auto，滚动条可能落在 html/body 任一处，全取最大值
    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function onScrollChrome() {
    const warping = document.body.classList.contains('warping');
    const doc = document.documentElement;
    const top = scrollTopPos();
    const max = (doc.scrollHeight - window.innerHeight) || 1;
    const pct = Math.min(100, Math.max(0, (top / max) * 100));
    if (readBar) {
      readBar.style.width = pct + '%';
      readBar.classList.toggle('show', !warping && top > 20);
    }
    if (toTop) {
      toTop.classList.toggle('show', !warping && top > 240);
    }
  }
  window.addEventListener('scroll', onScrollChrome, { passive: true });
  document.addEventListener('scroll', onScrollChrome, { passive: true, capture: true });
  window.addEventListener('resize', onScrollChrome);

  if (toTop) {
    toTop.addEventListener('click', () => {
      // 兼容不同滚动容器，全部置零
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }
  // 抵达 / 返回（warp.js 改动 body 类）后刷新一次显隐状态
  window.refreshChrome = onScrollChrome;
  onScrollChrome();

})();
