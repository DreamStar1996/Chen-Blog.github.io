/* ════════════════════════════════════════════════════════════════
   backgrounds.js — 多模式 Canvas 星空背景引擎
   ----------------------------------------------------------------
   统一管理唯一的 <canvas id="cosmos">，可在五种背景之间循环切换：
     · cosmos    星空   —— 闪烁星点 + 偶发流星（日间淡出，默认）
     · startrack 星轨   —— 长曝光式旋转星轨（致敬 nekotora / tcdw）
     · meteor    流星   —— 缓缓漂移的彗星 / 巨星（改编自 lvfan 的 universe）
     · sakura    花瓣   —— 主题配色程序化花瓣，斜向飘落（借鉴樱花背景）
     · firefly   萤火   —— 带柔光晕的游动光点，白昼隐去（借鉴萤火虫）
   ----------------------------------------------------------------
   对外暴露 window.StellarBG：
     StellarBG.init()            初始化并按上次选择启动
     StellarBG.setMode(m)        切换模式 'cosmos'|'startrack'|'meteor'|'sakura'|'firefly'
     StellarBG.cycle()           依次循环切换
     StellarBG.setTheme(t)       'day' | 'night'（控制星点淡出与画布明度）
     StellarBG.getMode()         返回当前模式
   ----------------------------------------------------------------
   Hexo 迁移提示：本文件即「背景特效」主题选项，未来可由 _config 里的
   一个字段（如 background: startrack）决定默认模式，其余照搬即可。
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const canvas = document.getElementById('cosmos');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, DPR = 1;
  let theme = 'night';
  let mode = 'cosmos';
  let rafId = null;
  let resizeTimer = null;

  /* 主题色板（与 CSS 变量保持同源的 RGB 三元组） */
  const PAL = {
    white: '245,242,234',
    gold: '236,202,134',
    ice: '136,196,236',
    rose: '217,138,154',
    violet: '169,154,223'
  };

  const STORE_KEY = 'stellaria-bg-mode';
  const MODES = ['cosmos', 'startrack', 'meteor', 'sakura', 'firefly'];
  const LABELS = {
    cosmos:    { cn: '星空', en: 'COSMOS',  icon: '✦' },
    startrack: { cn: '星轨', en: 'STARTRAIL', icon: '✺' },
    meteor:    { cn: '流星', en: 'METEOR',  icon: '☄' },
    sakura:    { cn: '花瓣', en: 'PETALS',  icon: '❀' },
    firefly:   { cn: '萤火', en: 'FIREFLY', icon: '✲' }
  };

  /* ───────── 画布尺寸（含 DPR） ───────── */
  function sizeCanvas() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.floor(innerWidth * DPR);
    H = canvas.height = Math.floor(innerHeight * DPR);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
  }

  /* ════════════════ 模式 1 · 星空（闪烁 + 流星） ════════════════ */
  let stars = [], shoot = [];
  let vis = 1, targetVis = 1;
  let shootTimer = null;

  function cosmosInit() {
    const n = Math.round(innerWidth * innerHeight / 7800);
    stars = [];
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: (Math.random() * 1.1 + 0.3) * DPR,
        base: Math.random() * 0.5 + 0.25,
        tw: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.02 + 0.006,
        c: r < 0.12 ? PAL.gold : (r < 0.24 ? PAL.ice : PAL.white)
      });
    }
    shoot = [];
  }
  function cosmosSpawnShoot() {
    shoot.push({
      x: Math.random() * W * 0.7 + W * 0.1,
      y: Math.random() * H * 0.35,
      len: 0, max: (Math.random() * 160 + 120) * DPR,
      sp: (Math.random() * 5 + 7) * DPR,
      ang: Math.PI * 0.78 + (Math.random() * 0.16 - 0.08),
      a: 1
    });
  }
  function cosmosScheduleShoot() {
    clearTimeout(shootTimer);
    shootTimer = setTimeout(() => {
      if (mode === 'cosmos' && theme === 'night' && vis > 0.85) cosmosSpawnShoot();
      cosmosScheduleShoot();
    }, Math.random() * 7000 + 4000);
  }
  function cosmosLoop() {
    vis += (targetVis - vis) * 0.05;
    ctx.clearRect(0, 0, W, H);
    if (vis > 0.02) {
      for (const s of stars) {
        s.tw += s.sp;
        const a = Math.max(0, s.base + Math.sin(s.tw) * 0.35) * vis;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 7);
        ctx.fillStyle = 'rgba(' + s.c + ',' + a + ')';
        if (a > 0.55) { ctx.shadowBlur = 6 * DPR; ctx.shadowColor = 'rgba(' + s.c + ',.8)'; }
        else ctx.shadowBlur = 0;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      for (let i = shoot.length - 1; i >= 0; i--) {
        const m = shoot[i];
        const dx = Math.cos(m.ang), dy = Math.sin(m.ang);
        m.x += dx * m.sp; m.y += dy * m.sp;
        if (m.len < m.max) m.len += m.sp; else m.a -= 0.02;
        const tx = m.x - dx * m.len, ty = m.y - dy * m.len;
        const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
        g.addColorStop(0, 'rgba(245,242,234,' + (m.a * vis) + ')');
        g.addColorStop(1, 'rgba(245,242,234,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.4 * DPR; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
        if (m.a <= 0 || m.x > W + 50 || m.y > H + 50) shoot.splice(i, 1);
      }
    }
    rafId = requestAnimationFrame(cosmosLoop);
  }
  function runCosmos() {
    cosmosInit();
    cosmosScheduleShoot();
    cosmosLoop();
  }

  /* ════════════════ 模式 2 · 星轨（旋转长曝光） ════════════════
     在离屏画布上一次性铺满数千颗星，随后让可见画布每帧微旋一点并
     反复绘制该离屏图，旧帧不清除 → 拖出一圈圈弧形星轨；周期性地用
     极淡的底色擦拭，避免越积越满。画布透明累积，页面星云得以透出。 */
  let off = null, offCtx = null, frame = 0, trackStars = [];

  function startrackBuild() {
    const side = Math.floor(2.6 * Math.max(W, H));
    off = document.createElement('canvas');
    off.width = off.height = side;
    offCtx = off.getContext('2d');

    // 星点数量随面积缩放并设上限，兼顾观感与性能
    const count = Math.min(16000, Math.round(side * side / 9000));
    trackStars = [];
    const palette = [PAL.white, PAL.white, PAL.gold, PAL.ice, PAL.gold, PAL.rose];
    for (let i = 0; i < count; i++) {
      const c = palette[(Math.random() * palette.length) | 0];
      const alpha = (Math.random() * 0.55 + 0.35).toFixed(2);
      offCtx.beginPath();
      offCtx.arc(Math.random() * side, Math.random() * side, 1.15 * DPR, 0, 2 * Math.PI);
      offCtx.fillStyle = 'rgba(' + c + ',' + alpha + ')';
      offCtx.fill();
    }

    // 重置可见画布坐标系并预热若干帧，让一开始就带些弧度
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2);
    frame = 0;
    for (let k = 0; k < 46; k++) {
      ctx.rotate(0.05 * Math.PI / 180);
      ctx.drawImage(off, -off.width / 2, -off.height / 2);
    }
  }
  function startrackLoop() {
    frame++;
    ctx.drawImage(off, -off.width / 2, -off.height / 2);
    // 预热后周期性淡化，擦掉最旧的轨迹
    if (frame > 150 && frame % 8 === 0) {
      ctx.fillStyle = 'rgba(6,6,15,.05)';
      ctx.fillRect(-3 * Math.max(W, H), -3 * Math.max(W, H), 6 * Math.max(W, H), 6 * Math.max(W, H));
    }
    ctx.rotate(0.025 * Math.PI / 180);
    rafId = requestAnimationFrame(startrackLoop);
  }
  function runStartrack() {
    startrackBuild();
    startrackLoop();
  }

  /* ════════════════ 模式 3 · 流星（漂移彗星） ════════════════
     改编自 lvfan(2018) 的 universe：星点斜向右上缓缓漂移，淡入淡出，
     偶现拖尾彗星与发光巨星。每帧清屏（透明），页面背景照常透出。 */
  let driftStars = [];
  const SPEED = 0.05 * 0.6;

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function prob(percent) { return (Math.random() * 1000 | 0) + 1 < percent * 10; }

  function makeDrift(first) {
    const giant = prob(3);
    const comet = giant || first ? false : prob(8);
    const o = {
      giant, comet,
      x: rand(0, W - 10 * DPR),
      y: rand(0, H),
      r: rand(1.1, 2.6) * DPR,
      opacity: 0,
      fadingIn: true,
      fadingOut: false
    };
    const boost = comet ? SPEED * rand(50, 120) : 0;
    o.dx = (rand(SPEED, 6 * SPEED) + boost + SPEED * 2) * DPR;
    o.dy = (-rand(SPEED, 6 * SPEED) - boost) * DPR;
    o.thresh = rand(0.2, comet ? 0.6 : 1);
    o.delta = rand(0.0005, 0.002) + (comet ? 0.001 : 0);
    o.color = giant ? PAL.violet : (comet ? PAL.white : PAL.gold);
    return o;
  }
  function meteorInit() {
    const count = Math.round(innerWidth * 0.18);
    driftStars = [];
    for (let i = 0; i < count; i++) driftStars.push(makeDrift(true));
  }
  function meteorLoop() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < driftStars.length; i++) {
      const s = driftStars[i];
      // move
      s.x += s.dx; s.y += s.dy;
      if (s.x > W - W / 4 || s.y < 0) s.fadingOut = true;
      // fade in / out
      if (s.fadingIn) { s.opacity += s.delta; if (s.opacity > s.thresh) s.fadingIn = false; }
      if (s.fadingOut) {
        s.opacity -= s.delta / 2;
        if (s.opacity < 0 || s.x > W || s.y < 0) { driftStars[i] = makeDrift(false); continue; }
      }
      // draw
      ctx.beginPath();
      if (s.giant) {
        ctx.fillStyle = 'rgba(' + s.color + ',' + s.opacity + ')';
        ctx.arc(s.x, s.y, 2 * DPR, 0, 2 * Math.PI);
        ctx.fill();
      } else if (s.comet) {
        ctx.fillStyle = 'rgba(' + s.color + ',' + s.opacity + ')';
        ctx.arc(s.x, s.y, 1.5 * DPR, 0, 2 * Math.PI);
        ctx.fill();
        for (let t = 0; t < 30; t++) {
          ctx.fillStyle = 'rgba(' + s.color + ',' + (s.opacity - (s.opacity / 22) * t) + ')';
          ctx.fillRect(s.x - s.dx / 4 * t, s.y - s.dy / 4 * t - 2 * DPR, 2 * DPR, 2 * DPR);
        }
      } else {
        ctx.fillStyle = 'rgba(' + s.color + ',' + s.opacity + ')';
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
    }
    rafId = requestAnimationFrame(meteorLoop);
  }
  function runMeteor() {
    meteorInit();
    meteorLoop();
  }

  /* ════════════════ 模式 4 · 花瓣（飘落星瓣） ════════════════
     借鉴 canvas「樱花背景」，但改为主题配色（金 / 玫 / 冰）的程序化花瓣，
     斜向飘落 + 自旋 + 左右摇曳，无需任何外部图片资源。
     日间保留约四成可见度（与星点淡出节奏一致，仍透出日空）。 */
  let petals = [];
  const PETAL_COLORS = [PAL.gold, PAL.gold, PAL.rose, PAL.ice, PAL.white];

  function makePetal(fromTop) {
    return {
      x: Math.random() * W,
      y: fromTop ? -20 * DPR - Math.random() * H : Math.random() * H,
      s: (Math.random() * 6 + 5) * DPR,
      rot: Math.random() * Math.PI * 2,
      rotSp: (Math.random() * 0.02 - 0.01),
      sway: Math.random() * Math.PI * 2,
      swaySp: Math.random() * 0.02 + 0.008,
      swayAmp: (Math.random() * 0.7 + 0.3) * DPR,
      fall: (Math.random() * 0.6 + 0.5) * DPR,
      a: Math.random() * 0.4 + 0.45,
      c: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0]
    };
  }
  function sakuraInit() {
    const n = Math.round(innerWidth / 15);
    petals = [];
    for (let i = 0; i < n; i++) petals.push(makePetal(false));
  }
  function drawPetal(p, fade) {
    const s = p.s;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.a * fade;
    ctx.fillStyle = 'rgba(' + p.c + ',1)';
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.62, -s * 0.42, s * 0.62, s * 0.42, 0, s);
    ctx.bezierCurveTo(-s * 0.62, s * 0.42, -s * 0.62, -s * 0.42, 0, -s);
    ctx.fill();
    ctx.restore();
  }
  function sakuraLoop() {
    vis += (targetVis - vis) * 0.05;
    const fade = 0.4 + 0.6 * vis;           // 日间仍留约四成
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.sway += p.swaySp;
      p.rot += p.rotSp;
      p.x += Math.sin(p.sway) * p.swayAmp + 0.25 * DPR;
      p.y += p.fall + p.swayAmp * 0.3;
      if (p.y > H + 24 * DPR || p.x > W + 24 * DPR) petals[i] = makePetal(true);
      drawPetal(p, fade);
    }
    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(sakuraLoop);
  }
  function runSakura() {
    sakuraInit();
    sakuraLoop();
  }

  /* ════════════════ 模式 5 · 萤火（游动光点） ════════════════
     借鉴 canvas「萤火虫」，改为带柔光晕的金 / 冰光点，缓慢游走并呼吸明灭。
     白昼隐去（与现实一致，也避免与明亮日空相冲）。 */
  let fireflies = [];
  function makeFly() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: (Math.random() * 1.6 + 1.0) * DPR,
      ang: Math.random() * Math.PI * 2,
      angSp: (Math.random() * 0.03 - 0.015),
      sp: (Math.random() * 0.25 + 0.12) * DPR,
      tw: Math.random() * Math.PI * 2,
      twSp: Math.random() * 0.04 + 0.015,
      base: Math.random() * 0.4 + 0.35,
      c: Math.random() < 0.78 ? PAL.gold : PAL.ice
    };
  }
  function fireflyInit() {
    const n = Math.round(innerWidth / 22);
    fireflies = [];
    for (let i = 0; i < n; i++) fireflies.push(makeFly());
  }
  function fireflyLoop() {
    vis += (targetVis - vis) * 0.05;        // 白昼 vis→0，萤火随之隐去
    ctx.clearRect(0, 0, W, H);
    if (vis > 0.03) {
      for (let i = 0; i < fireflies.length; i++) {
        const f = fireflies[i];
        f.ang += f.angSp + Math.sin(f.tw) * 0.01;
        f.tw += f.twSp;
        f.x += Math.cos(f.ang) * f.sp;
        f.y += Math.sin(f.ang) * f.sp;
        if (f.x < -10) f.x = W + 10; if (f.x > W + 10) f.x = -10;
        if (f.y < -10) f.y = H + 10; if (f.y > H + 10) f.y = -10;
        const a = Math.max(0, f.base + Math.sin(f.tw) * 0.4) * vis;
        const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 7);
        glow.addColorStop(0, 'rgba(' + f.c + ',' + (a * 0.9) + ')');
        glow.addColorStop(0.4, 'rgba(' + f.c + ',' + (a * 0.28) + ')');
        glow.addColorStop(1, 'rgba(' + f.c + ',0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 7, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'rgba(' + f.c + ',' + a + ')';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    rafId = requestAnimationFrame(fireflyLoop);
  }
  function runFirefly() {
    fireflyInit();
    fireflyLoop();
  }

  /* ───────── 启停调度 ───────── */
  function stopAll() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    clearTimeout(shootTimer);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
  }
  function start() {
    stopAll();
    if (mode === 'startrack') runStartrack();
    else if (mode === 'meteor') runMeteor();
    else if (mode === 'sakura') runSakura();
    else if (mode === 'firefly') runFirefly();
    else runCosmos();
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { sizeCanvas(); start(); }, 160);
  }

  /* ───────── 持久化 + 控件 ───────── */
  function persist() { try { localStorage.setItem(STORE_KEY, mode); } catch (e) {} }
  function restore() {
    try {
      const v = localStorage.getItem(STORE_KEY);
      if (v && MODES.indexOf(v) > -1) mode = v;
    } catch (e) {}
  }
  /* 日间画布淡化：星空 / 星轨 / 流星在日空下淡出；花瓣保留自身淡度不再额外压暗 */
  function applyDayDim() {
    canvas.classList.toggle('cosmos--day', theme === 'day' && mode !== 'sakura');
  }
  function reflectControl() {
    const el = document.getElementById('bg-switch');
    if (!el) return;
    const L = LABELS[mode];
    const ico = el.querySelector('.bg-switch-ico');
    const nm = el.querySelector('.bg-switch-name');
    const en = el.querySelector('.bg-switch-en');
    if (ico) ico.textContent = L.icon;
    if (nm) nm.textContent = L.cn;
    if (en) en.textContent = L.en;
    el.setAttribute('title', '切换背景：当前「' + L.cn + '」');
  }

  /* ───────── 对外接口 ───────── */
  window.StellarBG = {
    init() {
      restore();
      sizeCanvas();
      start();
      reflectControl();
      window.addEventListener('resize', onResize);
      const el = document.getElementById('bg-switch');
      if (el) el.addEventListener('click', () => this.cycle());
    },
    setMode(m) {
      if (MODES.indexOf(m) < 0 || m === mode) return;
      mode = m;
      persist();
      reflectControl();
      applyDayDim();
      sizeCanvas();
      start();
    },
    cycle() {
      const i = MODES.indexOf(mode);
      this.setMode(MODES[(i + 1) % MODES.length]);
    },
    setTheme(t) {
      theme = t;
      applyDayDim();
      targetVis = (t === 'night') ? 1 : 0;
    },
    getMode() { return mode; }
  };
})();
