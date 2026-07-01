(() => {
  const hero = document.querySelector('.hero-lab');
  const windows = [...document.querySelectorAll('[data-window]')];
  const lines = new Map([...document.querySelectorAll('[data-line]')].map((line) => [line.dataset.line, line]));
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function pointInHero(el, pinX = 50, pinY = 50) {
    const heroRect = hero.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    return {
      x: ((rect.left + rect.width * pinX / 100 - heroRect.left) / heroRect.width) * 100,
      y: ((rect.top + rect.height * pinY / 100 - heroRect.top) / heroRect.height) * 100,
    };
  }

  function updateHeroThreads() {
    if (!hero) return;
    windows.forEach((win) => {
      const line = lines.get(win.dataset.window);
      if (!line) return;
      const style = getComputedStyle(win);
      const end = pointInHero(win, parseFloat(style.getPropertyValue('--pin-x')) || 50, parseFloat(style.getPropertyValue('--pin-y')) || 50);
      line.setAttribute('x2', end.x.toFixed(2));
      line.setAttribute('y2', end.y.toFixed(2));
    });
  }

  windows.forEach((win) => {
    let holdTimer = 0;
    let pointerId = null;
    let startPointerX = 0;
    let startPointerY = 0;
    let startLeft = 0;
    let startTop = 0;
    let dragging = false;

    const startDrag = (event) => {
      if (pointerId !== event.pointerId) return;
      const heroRect = hero.getBoundingClientRect();
      const rect = win.getBoundingClientRect();
      startLeft = rect.left - heroRect.left;
      startTop = rect.top - heroRect.top;
      startPointerX = event.clientX;
      startPointerY = event.clientY;
      win.style.left = startLeft + 'px';
      win.style.top = startTop + 'px';
      win.style.right = 'auto';
      win.style.bottom = 'auto';
      win.style.width = rect.width + 'px';
      win.style.height = rect.height + 'px';
      win.style.aspectRatio = 'auto';
      dragging = true;
      win.classList.remove('is-armed', 'is-released');
      win.classList.add('is-dragging');
      try { win.setPointerCapture(pointerId); } catch (error) {}
    };

    win.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      pointerId = event.pointerId;
      dragging = false;
      win.classList.add('is-armed');
      clearTimeout(holdTimer);
      holdTimer = window.setTimeout(() => startDrag(event), 220);
    });

    win.addEventListener('pointermove', (event) => {
      if (!dragging || pointerId !== event.pointerId) return;
      const heroRect = hero.getBoundingClientRect();
      const rect = win.getBoundingClientRect();
      const nextLeft = clamp(startLeft + event.clientX - startPointerX, 0, heroRect.width - rect.width);
      const nextTop = clamp(startTop + event.clientY - startPointerY, 0, heroRect.height - rect.height);
      win.style.left = nextLeft + 'px';
      win.style.top = nextTop + 'px';
      updateHeroThreads();
    });

    const stop = () => {
      clearTimeout(holdTimer);
      win.classList.remove('is-armed');
      if (dragging) {
        win.classList.remove('is-dragging');
        win.classList.add('is-released');
        window.setTimeout(() => win.classList.remove('is-released'), 460);
      }
      if (pointerId !== null) {
        try { if (win.hasPointerCapture(pointerId)) win.releasePointerCapture(pointerId); } catch (error) {}
      }
      pointerId = null;
      dragging = false;
      updateHeroThreads();
    };

    win.addEventListener('pointerup', stop);
    win.addEventListener('pointercancel', stop);
    win.addEventListener('lostpointercapture', () => {
      clearTimeout(holdTimer);
      if (!dragging) win.classList.remove('is-armed');
    });
  });

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

  updateHeroThreads();
  window.addEventListener('resize', updateHeroThreads);
})();
