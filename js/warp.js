/* ════════════════════════════════════════════════════════════════
   warp.js — 曲率引擎「跃迁」动画（原样保留）
   嵌入 warp/index.html (One-Body / 三体水滴) 的 iframe，
   通过 #autoplay 锚点自驱动画，postMessage 与父页面通信，
   抵达瞬间白光闪烁切换到博客预览界面。
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  let warpInProgress = false;
  let warpIframe = null;
  let warpFinishTimeoutId = null;

  const stage = document.getElementById('warp-stage');
  const warpLoader = document.getElementById('warp-loader');
  const warpSkip = document.getElementById('warp-skip');
  const warpFlash = document.getElementById('warp-flash');

  function launchWarp() {
    if (warpInProgress) return;
    warpInProgress = true;

    // 1. 公告页淡出 + 显示加载提示
    document.body.classList.add('warping');
    document.getElementById('cosmos').classList.add('dim');
    document.getElementById('page').classList.add('hidden-during-warp');
    document.getElementById('topbar').classList.add('fade');
    warpLoader.classList.add('show');

    // 2. 创建 iframe 加载 One-Body
    //    使用 #autoplay 锚点让 iframe 内部自行驱动跃迁动画 +
    //    通过 postMessage 与父页面通信，避免 file:// 协议下的跨源限制
    const iframe = document.createElement('iframe');
    iframe.src = 'warp/index.html#autoplay';
    iframe.allow = 'autoplay';
    iframe.setAttribute('scrolling', 'no');
    iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;';
    stage.innerHTML = '';
    stage.appendChild(iframe);
    warpIframe = iframe;

    warpSkip.classList.add('show');

    // 安全兜底：若 35s 内仍未收到 finished 事件，则强制结束
    warpFinishTimeoutId = setTimeout(() => {
      console.warn('warp 超时未完成, 强制结束跃迁');
      finishWarp();
    }, 35000);
  }

  /* 监听 iframe 通过 postMessage 上报的事件 */
  window.addEventListener('message', (e) => {
    const d = e && e.data;
    if (!d || d.source !== 'warp') return;
    if (d.event === 'ready') {
      // 场景已就绪 → 展示舞台并隐藏加载提示
      if (warpInProgress) {
        stage.classList.add('show');
        warpLoader.classList.remove('show');
      }
    } else if (d.event === 'finished') {
      if (warpFinishTimeoutId) { clearTimeout(warpFinishTimeoutId); warpFinishTimeoutId = null; }
      finishWarp();
    }
  });

  /* 跃迁结束 - 白光闪 + 切到博客 */
  function finishWarp() {
    if (!warpInProgress) return;
    warpSkip.classList.remove('show');

    // 白光闪烁
    warpFlash.style.transition = 'none';
    warpFlash.style.opacity = '0';
    requestAnimationFrame(() => {
      warpFlash.style.transition = 'opacity 0.28s ease-out';
      warpFlash.style.opacity = '1';
      setTimeout(() => {
        // 切换页面 (在白光最亮时切换, 隐藏切换过程)
        stage.classList.remove('show');
        warpLoader.classList.remove('show');
        document.body.classList.remove('warping');
        document.body.classList.add('arrived');
        document.getElementById('page').style.display = 'none';
        const blog = document.getElementById('blog-arrived');
        blog.classList.add('show');
        blog.classList.add('fade-in');
        document.getElementById('return-home').classList.add('show');
        window.scrollTo({ top: 0 });
        if (typeof window.refreshChrome === 'function') window.refreshChrome();
        // 抵达后立即揭示首屏内的迁移组件
        if (typeof window.revealInView === 'function') {
          requestAnimationFrame(() => window.revealInView());
        }

        // 白光淡出
        warpFlash.style.transition = 'opacity 0.95s ease-in';
        warpFlash.style.opacity = '0';

        // 销毁 iframe (释放 GPU/内存)
        setTimeout(() => {
          if (warpIframe && warpIframe.parentNode) {
            // 通过 postMessage 让 iframe 内部停止音频 (避免 file:// 跨源问题)
            try {
              if (warpIframe.contentWindow) {
                warpIframe.contentWindow.postMessage({ target: 'warp', action: 'stop-audio' }, '*');
              }
            } catch (e) {}
            warpIframe.parentNode.removeChild(warpIframe);
            warpIframe = null;
          }
          warpInProgress = false;
        }, 1200);
      }, 290);
    });
  }

  /* 返回公告页 */
  function returnHome() {
    document.body.classList.remove('arrived');
    const blog = document.getElementById('blog-arrived');
    blog.classList.remove('show');
    blog.classList.remove('fade-in');
    document.getElementById('return-home').classList.remove('show');
    document.getElementById('page').style.display = '';
    document.getElementById('page').classList.remove('hidden-during-warp');
    document.getElementById('cosmos').classList.remove('dim');
    document.getElementById('topbar').classList.remove('fade');
    window.scrollTo({ top: 0 });
    if (typeof window.refreshChrome === 'function') window.refreshChrome();
  }

  /* 事件绑定 */
  document.getElementById('warp-cta-hero').addEventListener('click', launchWarp);
  document.getElementById('warp-cta-bottom').addEventListener('click', launchWarp);
  document.getElementById('return-home').addEventListener('click', returnHome);
  warpSkip.addEventListener('click', () => {
    if (warpFinishTimeoutId) clearTimeout(warpFinishTimeoutId);
    finishWarp();
  });

})();
