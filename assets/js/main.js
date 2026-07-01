(() => {
  const stage = document.querySelector('.desktop-stage');
  const desktopFrame = document.querySelector('.desktop-bg');
  const draggables = [...document.querySelectorAll('[data-draggable], .desktop-window')];
  const panels = [...document.querySelectorAll('[data-panel]')];
  let topZ = 100;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const heroWidth = 1536;
  const heroHeight = 1024;
  const lineTargets = [
    { selector: '.layer-window-left', anchorX: .92, anchorY: .29, endX: 760, endY: 445, bend: -.12 },
    { selector: '.layer-window-top', anchorX: .14, anchorY: .62, endX: 1188, endY: 394, bend: .1 },
    { selector: '.layer-window-mid', anchorX: .03, anchorY: .61, endX: 1024, endY: 608, bend: .05 },
    { selector: '.layer-photo-left', anchorX: .5, anchorY: .16, endX: 682, endY: 668, bend: -.16 },
    { selector: '.layer-paper', anchorX: .14, anchorY: .18, endX: 900, endY: 562, bend: .1 },
    { selector: '.layer-photo-right', anchorX: .5, anchorY: .12, endX: 1048, endY: 696, bend: .18 },
  ];
  const layerBoxes = {
    'decor-receipt-top': [255, 18, 132, 154],
    'decor-pixel-cloud': [462, 61, 120, 64],
    'decor-folder-top': [391, 171, 78, 78],
    'decor-note-ring': [1350, 292, 121, 126],
    'decor-note-heart': [433, 718, 176, 174],
    'decor-folder-bottom': [958, 866, 154, 92],
    'layer-window-left': [30, 154, 291, 321],
    'layer-window-top': [1266, 66, 200, 222],
    'layer-paper': [1351, 292, 121, 126],
    'layer-window-mid': [1166, 455, 304, 197],
    'layer-trash': [31, 691, 74, 82],
    'layer-photo-left': [260, 747, 167, 207],
    'layer-photo-right': [1026, 757, 158, 128],
  };

  function syncDesktopLayers() {
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const frameRect = (desktopFrame || stage).getBoundingClientRect();
    const scale = Math.max(frameRect.width / heroWidth, frameRect.height / heroHeight);
    const offsetX = frameRect.left - stageRect.left + (frameRect.width - heroWidth * scale) / 2;
    const offsetY = frameRect.top - stageRect.top + (frameRect.height - heroHeight * scale) / 2;
    Object.entries(layerBoxes).forEach(([className, box]) => {
      const el = document.querySelector('.' + className);
      if (!el || el.dataset.wasDragged === 'true') return;
      const [x, y, w, h] = box;
      el.style.left = (offsetX + x * scale) + 'px';
      el.style.top = (offsetY + y * scale) + 'px';
      el.style.width = (w * scale) + 'px';
      el.style.height = (h * scale) + 'px';
    });

    const lines = document.querySelector('.connection-lines');
    if (lines) {
      lines.style.left = (frameRect.left - stageRect.left) + 'px';
      lines.style.top = (frameRect.top - stageRect.top) + 'px';
      lines.style.width = frameRect.width + 'px';
      lines.style.height = frameRect.height + 'px';
    }
    updateConnectionLines();
  }

  function updateConnectionLines() {
    if (!stage || !desktopFrame) return;
    const svg = document.querySelector('.connection-lines');
    if (!svg) return;
    const stageRect = stage.getBoundingClientRect();
    const frameRect = desktopFrame.getBoundingClientRect();
    const frameLeft = frameRect.left - stageRect.left;
    const frameTop = frameRect.top - stageRect.top;
    const scaleX = frameRect.width / heroWidth;
    const scaleY = frameRect.height / heroHeight;
    svg.setAttribute('viewBox', `0 0 ${frameRect.width} ${frameRect.height}`);
    svg.replaceChildren();
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);
    lineTargets.forEach((target) => {
      const el = document.querySelector(target.selector);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = rect.left - stageRect.left - frameLeft + rect.width * target.anchorX;
      const y = rect.top - stageRect.top - frameTop + rect.height * target.anchorY;
      const endX = target.endX * scaleX;
      const endY = target.endY * scaleY;
      const midX = (x + endX) / 2;
      const midY = (y + endY) / 2 + (endX - x) * target.bend;
      const gradientId = `lineFade-${target.selector.replace(/[^a-z0-9]/gi, '')}`;
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.setAttribute('id', gradientId);
      gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
      gradient.setAttribute('x1', x.toFixed(1));
      gradient.setAttribute('y1', y.toFixed(1));
      gradient.setAttribute('x2', endX.toFixed(1));
      gradient.setAttribute('y2', endY.toFixed(1));
      gradient.innerHTML = '<stop offset="0%" stop-color="rgba(255,70,86,.92)" stop-opacity="1" /><stop offset="62%" stop-color="rgba(255,70,86,.68)" stop-opacity=".68" /><stop offset="100%" stop-color="rgba(255,70,86,0)" stop-opacity="0" />';
      defs.appendChild(gradient);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x.toFixed(1)} ${y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`);
      path.setAttribute('stroke', `url(#${gradientId})`);
      svg.appendChild(path);
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('class', 'connection-dot');
      dot.setAttribute('cx', x.toFixed(1));
      dot.setAttribute('cy', y.toFixed(1));
      dot.setAttribute('r', '3');
      svg.appendChild(dot);
    });
  }

  function bringFront(el) {
    if (!el) return;
    topZ += 1;
    el.style.zIndex = topZ;
  }

  function openPanel(name) {
    const panel = panels.find((item) => item.dataset.panel === name);
    if (!panel) return;
    panel.classList.add('active');
    bringFront(panel);
    history.replaceState(null, '', '#' + name);
  }

  document.querySelectorAll('[data-open]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      if (trigger.dataset.wasDragged === 'true') {
        trigger.dataset.wasDragged = 'false';
        return;
      }
      event.preventDefault();
      openPanel(trigger.dataset.open);
    });
  });

  document.querySelectorAll('[data-scroll]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const target = document.getElementById(trigger.dataset.scroll);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => button.closest('.desktop-window')?.classList.remove('active'));
  });
  document.querySelectorAll('[data-minimize]').forEach((button) => {
    button.addEventListener('click', () => button.closest('.desktop-window')?.classList.remove('active'));
  });

  draggables.forEach((el) => {
    let holdTimer = 0;
    let pointerId = null;
    let startPointerX = 0;
    let startPointerY = 0;
    let startLeft = 0;
    let startTop = 0;
    let dragging = false;
    const isWindow = el.classList.contains('desktop-window');

    const startDrag = (event) => {
      if (pointerId !== event.pointerId) return;
      const parentRect = stage.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      startLeft = rect.left - parentRect.left;
      startTop = rect.top - parentRect.top;
      startPointerX = event.clientX;
      startPointerY = event.clientY;
      el.style.left = startLeft + 'px';
      el.style.top = startTop + 'px';
      if (!isWindow) {
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';
      }
      dragging = true;
      el.dataset.wasDragged = 'true';
      el.classList.remove('is-armed', 'is-released');
      el.classList.add('is-dragging');
      bringFront(el);
      try { el.setPointerCapture(pointerId); } catch (error) {}
    };

    el.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (isWindow && !event.target.closest('.window-titlebar')) {
        bringFront(el);
        return;
      }
      event.preventDefault();
      pointerId = event.pointerId;
      dragging = false;
      el.dataset.wasDragged = 'false';
      el.classList.add('is-armed');
      clearTimeout(holdTimer);
      holdTimer = window.setTimeout(() => startDrag(event), isWindow ? 80 : 220);
    });

    el.addEventListener('pointermove', (event) => {
      if (!dragging || pointerId !== event.pointerId) return;
      const parentRect = stage.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      const nextLeft = clamp(startLeft + event.clientX - startPointerX, 0, parentRect.width - rect.width);
      const nextTop = clamp(startTop + event.clientY - startPointerY, 0, parentRect.height - rect.height);
      el.style.left = nextLeft + 'px';
      el.style.top = nextTop + 'px';
      updateConnectionLines();
    });

    const stop = () => {
      clearTimeout(holdTimer);
      el.classList.remove('is-armed');
      if (dragging) {
        el.classList.remove('is-dragging');
        el.classList.add('is-released');
        window.setTimeout(() => el.classList.remove('is-released'), 460);
      }
      if (pointerId !== null) {
        try { if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId); } catch (error) {}
      }
      pointerId = null;
      dragging = false;
      updateConnectionLines();
    };

    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
    el.addEventListener('lostpointercapture', stop);
  });

  document.querySelectorAll('.desktop-layer img, .decor-layer').forEach((img) => {
    img.addEventListener('load', syncDesktopLayers, { once: true });
  });
  syncDesktopLayers();
  window.addEventListener('resize', () => {
    syncDesktopLayers();
    updateConnectionLines();
  }, { passive: true });

  let lastParticle = 0;
  const colors = ['', 'blue', 'yellow'];
  window.addEventListener('pointermove', (event) => {
    const now = performance.now();
    if (now - lastParticle < 22) return;
    lastParticle = now;
    const particle = document.createElement('span');
    particle.className = 'cursor-particle ' + colors[Math.floor(Math.random() * colors.length)];
    particle.style.left = event.clientX + 'px';
    particle.style.top = event.clientY + 'px';
    particle.style.setProperty('--dx', (Math.random() * -28 - 8).toFixed(1) + 'px');
    particle.style.setProperty('--dy', (Math.random() * 24 - 12).toFixed(1) + 'px');
    document.body.appendChild(particle);
    window.setTimeout(() => particle.remove(), 700);
  }, { passive: true });

  const logo = document.querySelector('[data-portfolio-logo]');
  if (logo) {
    let lastScatter = 0;
    const scatter = (event, count = 18) => {
      const now = performance.now();
      if (now - lastScatter < 120) return;
      lastScatter = now;
      const rect = logo.getBoundingClientRect();
      for (let i = 0; i < count; i += 1) {
        const shard = document.createElement('span');
        shard.className = 'logo-shard ' + colors[Math.floor(Math.random() * colors.length)];
        const originX = event.clientX || rect.left + rect.width * Math.random();
        const originY = event.clientY || rect.top + rect.height * Math.random();
        shard.style.left = (originX + (Math.random() - .5) * rect.width * .38) + 'px';
        shard.style.top = (originY + (Math.random() - .5) * rect.height * .5) + 'px';
        shard.style.setProperty('--dx', (Math.random() * 160 - 80).toFixed(1) + 'px');
        shard.style.setProperty('--dy', (Math.random() * 150 - 70).toFixed(1) + 'px');
        shard.style.setProperty('--rot', (Math.random() * 220 - 110).toFixed(1) + 'deg');
        document.body.appendChild(shard);
        window.setTimeout(() => shard.remove(), 960);
      }
    };
    logo.addEventListener('pointerenter', (event) => scatter(event, 34));
    logo.addEventListener('pointermove', (event) => scatter(event, 12), { passive: true });
  }

  if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
})();
