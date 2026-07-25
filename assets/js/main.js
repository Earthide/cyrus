(() => {
  const stage = document.querySelector('.desktop-stage');
  const desktopFrame = document.querySelector('.desktop-bg');
  const draggables = [...document.querySelectorAll('[data-draggable], .desktop-window')];
  const panels = [...document.querySelectorAll('[data-panel]')];
  const bootScreen = document.querySelector('[data-boot-screen]');
  const skipBootKey = 'cyrus-skip-next-boot';
  const trashLayer = document.querySelector('.layer-trash');
  const removableLayers = [...document.querySelectorAll('[data-draggable]')].filter((item) => !item.classList.contains('layer-trash'));
  const trashResetTip = stage ? Object.assign(document.createElement('button'), {
    className: 'trash-reset-tip',
    type: 'button',
    textContent: '已放入回收站 · 点击 Portfolio 恢复',
  }) : null;
  if (trashResetTip) trashResetTip.setAttribute('aria-label', '恢复被放入回收站的主视觉素材');
  if (stage && trashResetTip) stage.appendChild(trashResetTip);
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
    'layer-window-left': [69, 127, 291, 321],
    'layer-window-top': [1184, 66, 200, 222],
    'layer-paper': [1262, 330, 121, 126],
    'layer-window-mid': [1166, 455, 304, 197],
    'layer-trash': [894, 807, 86, 94],
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

    const logo = document.querySelector('[data-portfolio-logo]');
    if (logo) {
      logo.style.removeProperty('left');
      logo.style.removeProperty('right');
      logo.style.removeProperty('margin-inline');
      logo.style.top = (offsetY + heroHeight * scale * .325) + 'px';
      logo.style.width = (heroWidth * scale * .82) + 'px';
      logo.style.removeProperty('transform');
    }

    const lines = document.querySelector('.connection-lines');
    if (lines) {
      lines.style.left = (frameRect.left - stageRect.left) + 'px';
      lines.style.top = (frameRect.top - stageRect.top) + 'px';
      lines.style.width = frameRect.width + 'px';
      lines.style.height = frameRect.height + 'px';
    }
    positionTrashResetTip();
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
      if (!el || el.classList.contains('is-trashed')) return;
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

  function layerHitsTrash(el) {
    if (!el || !trashLayer || el === trashLayer) return false;
    if (!el.matches('[data-draggable]')) return false;
    const rect = el.getBoundingClientRect();
    const trashRect = trashLayer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const centerInside = centerX >= trashRect.left
      && centerX <= trashRect.right
      && centerY >= trashRect.top
      && centerY <= trashRect.bottom;
    const overlapX = Math.max(0, Math.min(rect.right, trashRect.right) - Math.max(rect.left, trashRect.left));
    const overlapY = Math.max(0, Math.min(rect.bottom, trashRect.bottom) - Math.max(rect.top, trashRect.top));
    const overlapArea = overlapX * overlapY;
    const minArea = Math.min(rect.width * rect.height, trashRect.width * trashRect.height);
    return centerInside || overlapArea / Math.max(minArea, 1) > .18;
  }

  function resetHeroLayers() {
    const trashedLayers = removableLayers.filter((el) => el.classList.contains('is-trashed'));
    removableLayers.forEach((el, index) => {
      const wasTrashed = trashedLayers.includes(el);
      el.classList.remove('is-dragging', 'is-released', 'is-armed', 'is-over-trash');
      delete el.dataset.wasDragged;
      el.style.left = '';
      el.style.top = '';
      el.style.width = '';
      el.style.height = '';
      el.style.zIndex = '';
      if (wasTrashed) {
        el.style.setProperty('--restore-delay', `${index * 55}ms`);
        el.classList.add('is-restoring');
      }
    });
    trashLayer?.classList.remove('is-trash-target');
    hideTrashResetTip();
    syncDesktopLayers();
    trashedLayers.forEach((el) => {
      el.classList.remove('is-trashed');
      window.setTimeout(() => {
        el.classList.remove('is-restoring');
        el.style.removeProperty('--restore-delay');
      }, 760);
    });
  }

  function positionTrashResetTip() {
    if (!stage || !trashLayer || !trashResetTip || !trashResetTip.classList.contains('is-visible')) return;
    const stageRect = stage.getBoundingClientRect();
    const trashRect = trashLayer.getBoundingClientRect();
    const tipWidth = trashResetTip.offsetWidth || 96;
    const tipHeight = trashResetTip.offsetHeight || 24;
    const x = trashRect.left - stageRect.left + trashRect.width / 2 - tipWidth / 2;
    const y = trashRect.top - stageRect.top - tipHeight - Math.max(6, trashRect.height * .1);
    trashResetTip.style.left = clamp(x, 12, stageRect.width - tipWidth - 12) + 'px';
    trashResetTip.style.top = Math.max(12, y) + 'px';
  }

  function showTrashResetTip() {
    if (!trashResetTip) return;
    trashResetTip.classList.add('is-visible');
    positionTrashResetTip();
  }

  function hideTrashResetTip() {
    if (!trashResetTip) return;
    trashResetTip.classList.remove('is-visible');
  }

  if (bootScreen) {
    const bootPercent = document.querySelector('[data-boot-percent]');
    const bootWindow = bootScreen.querySelector('.boot-window');
    const bootStartButton = document.querySelector('[data-boot-start]');
    const bootLineOne = document.querySelector('[data-boot-line-one]');
    const bootLineTwo = document.querySelector('[data-boot-line-two]');
    const bootDuration = 1550;
    const shouldSkipBoot = (() => {
      try {
        if (window.sessionStorage.getItem(skipBootKey) === 'true') {
          window.sessionStorage.removeItem(skipBootKey);
          return true;
        }
        const referrer = new URL(document.referrer);
        if (referrer.origin !== window.location.origin) return false;
        return /\/about\.html$/i.test(referrer.pathname) || /\/works\/work-\d+\.html$/i.test(referrer.pathname);
      } catch (error) {
        return false;
      }
    })();
    let bootAudio = null;
    let bootAudioUnlocked = false;
    let bootStarted = false;
    let bootStart = 0;
    const unlockBootAudio = () => {
      if (bootAudioUnlocked) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      try {
        bootAudio = bootAudio || new AudioContext();
        bootAudio.resume();
        const tick = bootAudio.createOscillator();
        const gain = bootAudio.createGain();
        gain.gain.setValueAtTime(0.0001, bootAudio.currentTime);
        tick.connect(gain);
        gain.connect(bootAudio.destination);
        tick.start();
        tick.stop(bootAudio.currentTime + 0.02);
        bootAudioUnlocked = true;
      } catch (error) {}
    };
    const playBootChime = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      try {
        const audio = bootAudio || new AudioContext();
        if (audio.state === 'suspended') audio.resume();
        const master = audio.createGain();
        master.gain.setValueAtTime(0.0001, audio.currentTime);
        master.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.05);
        master.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 1.9);
        master.connect(audio.destination);
        const notes = [
          { f: 329.63, t: 0, d: .72, type: 'sine' },
          { f: 493.88, t: .08, d: .9, type: 'triangle' },
          { f: 659.25, t: .2, d: .98, type: 'sine' },
          { f: 987.77, t: .52, d: .88, type: 'triangle' },
          { f: 1318.51, t: .72, d: .62, type: 'sine' },
        ];
        notes.forEach((note) => {
          const osc = audio.createOscillator();
          const gain = audio.createGain();
          osc.type = note.type;
          osc.frequency.setValueAtTime(note.f, audio.currentTime + note.t);
          osc.frequency.exponentialRampToValueAtTime(note.f * 1.012, audio.currentTime + note.t + note.d);
          gain.gain.setValueAtTime(0.0001, audio.currentTime + note.t);
          gain.gain.exponentialRampToValueAtTime(0.58, audio.currentTime + note.t + 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + note.t + note.d);
          osc.connect(gain);
          gain.connect(master);
          osc.start(audio.currentTime + note.t);
          osc.stop(audio.currentTime + note.t + note.d + 0.04);
        });
        const shimmer = audio.createOscillator();
        const shimmerGain = audio.createGain();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(1760, audio.currentTime + .72);
        shimmer.frequency.exponentialRampToValueAtTime(2349.32, audio.currentTime + 1.28);
        shimmerGain.gain.setValueAtTime(0.0001, audio.currentTime + .72);
        shimmerGain.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + .82);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 1.55);
        shimmer.connect(shimmerGain);
        shimmerGain.connect(master);
        shimmer.start(audio.currentTime + .72);
        shimmer.stop(audio.currentTime + 1.62);
        window.setTimeout(() => {
          try { if (audio !== bootAudio) audio.close(); } catch (error) {}
        }, 2200);
      } catch (error) {}
    };
    const shatterBoot = () => {
      if (!bootWindow) return;
      const rect = bootWindow.getBoundingClientRect();
      const colors = ['blue', 'cyan', 'paper', ''];
      const count = 90;
      for (let i = 0; i < count; i += 1) {
        const shard = document.createElement('span');
        shard.className = 'boot-shard ' + colors[Math.floor(Math.random() * colors.length)];
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;
        const angle = Math.atan2(y - (rect.top + rect.height / 2), x - (rect.left + rect.width / 2));
        const distance = 90 + Math.random() * 260;
        shard.style.left = x + 'px';
        shard.style.top = y + 'px';
        shard.style.setProperty('--dx', (Math.cos(angle) * distance + (Math.random() - .5) * 80).toFixed(1) + 'px');
        shard.style.setProperty('--dy', (Math.sin(angle) * distance + (Math.random() - .5) * 90).toFixed(1) + 'px');
        shard.style.setProperty('--rot', (Math.random() * 360 - 180).toFixed(1) + 'deg');
        bootScreen.appendChild(shard);
      }
    };
    const updateBootPercent = (now) => {
      if (!bootPercent || !bootScreen.isConnected) return;
      const raw = Math.min((now - bootStart) / bootDuration, 1);
      const eased = raw < .58
        ? .32 * Math.pow(raw / .58, 2.2)
        : .32 + .68 * (1 - Math.pow(1 - (raw - .58) / .42, 2.8));
      bootPercent.textContent = `${Math.min(100, Math.round(eased * 100))}%`;
      if (raw < 1) requestAnimationFrame(updateBootPercent);
    };
    const startBoot = () => {
      if (bootStarted) return;
      bootStarted = true;
      if (bootLineOne) bootLineOne.textContent = 'Cyrus正在醒来...';
      if (bootLineTwo) bootLineTwo.textContent = '系统对接，一些想法正在接入桌面...';
      unlockBootAudio();
      document.body.classList.add('boot-running');
      bootStart = performance.now();
      requestAnimationFrame(updateBootPercent);
      window.setTimeout(() => {
        playBootChime();
        shatterBoot();
        document.body.classList.add('boot-shattering');
        document.body.classList.remove('is-booting');
        document.body.classList.add('boot-complete');
        window.setTimeout(() => {
          window.setTimeout(() => bootScreen.remove(), 700);
        }, 360);
      }, bootDuration);
    };
    if (shouldSkipBoot) {
      document.body.classList.remove('is-booting');
      document.body.classList.add('boot-complete');
      bootScreen.remove();
    } else {
      bootStartButton?.addEventListener('click', startBoot);
    }
  }

  const languageButtons = [...document.querySelectorAll('[data-lang]')];
  languageButtons.forEach((button) => {
    const isChinese = button.dataset.lang === 'zh';
    button.classList.toggle('is-active', isChinese);
    button.setAttribute('aria-pressed', String(isChinese));
  });

  document.querySelectorAll('a[href*="index.html"]').forEach((link) => {
    link.addEventListener('click', () => {
      if (bootScreen) return;
      try { window.sessionStorage.setItem(skipBootKey, 'true'); } catch (error) {}
    });
  });

  const menuToggle = document.querySelector('[data-menu-toggle]');
  const closeSiteMenu = () => {
    document.body.classList.remove('site-menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  };
  menuToggle?.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('site-menu-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  document.querySelectorAll('.desktop-bar nav a, .desktop-bar nav button').forEach((item) => {
    item.addEventListener('click', closeSiteMenu);
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 560) closeSiteMenu();
  });

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

  const playModal = document.querySelector('[data-play-modal]');
  const playModalTitle = document.getElementById('play-modal-title');
  const playModalImg = document.querySelector('[data-play-modal-img]');
  document.querySelectorAll('[data-play-src]').forEach((card) => {
    card.addEventListener('click', () => {
      if (!playModal || !playModalTitle || !playModalImg) return;
      playModalTitle.textContent = card.dataset.playTitle || '尝试';
      playModalImg.src = card.dataset.playSrc;
      playModalImg.alt = card.dataset.playTitle || '';
      playModal.classList.add('is-open');
      playModal.setAttribute('aria-hidden', 'false');
    });
  });
  document.querySelectorAll('[data-play-close]').forEach((button) => {
    button.addEventListener('click', () => {
      playModal?.classList.remove('is-open');
      playModal?.setAttribute('aria-hidden', 'true');
    });
  });
  const gallery = document.querySelector('[data-work-gallery]');
  const galleryModal = document.querySelector('[data-gallery-modal]');
  const galleryModalImg = document.querySelector('[data-gallery-modal-img]');
  const openGalleryModal = (button) => {
    if (!galleryModal || !galleryModalImg) return;
    const img = button.querySelector('img');
    galleryModalImg.src = button.dataset.galleryImage || img?.src || '';
    galleryModalImg.alt = img?.alt || '';
    galleryModal.classList.add('is-open');
    galleryModal.setAttribute('aria-hidden', 'false');
  };
  if (gallery) {
    const track = gallery.querySelector('[data-gallery-track]');
    const pages = [...gallery.querySelectorAll('.work-gallery-page')];
    const prevButton = gallery.querySelector('[data-gallery-prev]');
    const nextButton = gallery.querySelector('[data-gallery-next]');
    const viewport = gallery.querySelector('.work-gallery-viewport');
    const mobileGalleryQuery = window.matchMedia('(max-width: 760px)');
    let galleryIndex = 0;
    let galleryPointerId = null;
    let galleryStartX = 0;
    let galleryStartY = 0;
    let galleryDeltaX = 0;
    let galleryDidSwipe = false;
    const getGallerySlides = () => {
      if (gallery.classList.contains('is-mobile-single') && mobileGalleryQuery.matches) {
        return [...gallery.querySelectorAll('.work-gallery-image, .work-gallery-video-page')];
      }
      return pages;
    };
    const syncGallery = () => {
      if (!track) return;
      const slides = getGallerySlides();
      galleryIndex = Math.min(galleryIndex, Math.max(slides.length - 1, 0));
      track.style.transition = 'transform .42s cubic-bezier(.2,.72,.2,1)';
      track.style.transform = `translateX(-${galleryIndex * 100}%)`;
      if (prevButton) prevButton.disabled = galleryIndex === 0;
      if (nextButton) nextButton.disabled = galleryIndex >= slides.length - 1;
    };
    const goToGallery = (nextIndex) => {
      const slides = getGallerySlides();
      galleryIndex = Math.min(Math.max(nextIndex, 0), Math.max(slides.length - 1, 0));
      syncGallery();
    };
    prevButton?.addEventListener('click', () => {
      goToGallery(galleryIndex - 1);
    });
    nextButton?.addEventListener('click', () => {
      goToGallery(galleryIndex + 1);
    });
    viewport?.addEventListener('pointerdown', (event) => {
      if (event.target?.closest?.('video, iframe, [data-youtube-player]')) return;
      if (event.button !== undefined && event.button !== 0) return;
      galleryPointerId = event.pointerId;
      galleryStartX = event.clientX;
      galleryStartY = event.clientY;
      galleryDeltaX = 0;
      galleryDidSwipe = false;
      viewport.classList.add('is-dragging');
      try { viewport.setPointerCapture(galleryPointerId); } catch (error) {}
    });
    viewport?.addEventListener('pointermove', (event) => {
      if (galleryPointerId !== event.pointerId || !track) return;
      galleryDeltaX = event.clientX - galleryStartX;
      const deltaY = event.clientY - galleryStartY;
      if (Math.abs(galleryDeltaX) < 8 || Math.abs(galleryDeltaX) < Math.abs(deltaY)) return;
      galleryDidSwipe = true;
      track.style.transition = 'none';
      track.style.transform = `translateX(calc(-${galleryIndex * 100}% + ${galleryDeltaX}px))`;
    }, { passive: true });
    const endGallerySwipe = (event) => {
      if (galleryPointerId !== event.pointerId) return;
      const threshold = Math.max(56, (viewport?.clientWidth || 0) * .08);
      if (galleryDeltaX <= -threshold) goToGallery(galleryIndex + 1);
      else if (galleryDeltaX >= threshold) goToGallery(galleryIndex - 1);
      else syncGallery();
      viewport?.classList.remove('is-dragging');
      if (galleryPointerId !== null) {
        try { if (viewport?.hasPointerCapture(galleryPointerId)) viewport.releasePointerCapture(galleryPointerId); } catch (error) {}
      }
      galleryPointerId = null;
      window.setTimeout(() => { galleryDidSwipe = false; }, 180);
    };
    viewport?.addEventListener('pointerup', endGallerySwipe);
    viewport?.addEventListener('pointercancel', endGallerySwipe);
    viewport?.addEventListener('lostpointercapture', () => {
      viewport?.classList.remove('is-dragging');
      galleryPointerId = null;
      syncGallery();
    });
    gallery.querySelectorAll('[data-gallery-image]').forEach((button) => {
      button.addEventListener('click', () => {
        if (galleryDidSwipe) return;
        openGalleryModal(button);
      });
    });
    mobileGalleryQuery.addEventListener?.('change', syncGallery);
    syncGallery();
  }
  document.querySelectorAll('[data-gallery-image]').forEach((button) => {
    if (button.closest('[data-work-gallery]')) return;
    button.addEventListener('click', () => openGalleryModal(button));
  });
  document.querySelectorAll('[data-youtube-player]').forEach((player) => {
    const playButton = player.querySelector('[data-youtube-play]');
    playButton?.addEventListener('click', () => {
      const videoId = player.dataset.youtubeId;
      if (!videoId) return;
      const iframe = document.createElement('iframe');
      const pageOrigin = window.location.origin && window.location.origin !== 'null'
        ? `&origin=${encodeURIComponent(window.location.origin)}`
        : '';
      iframe.className = 'work-gallery-video work-gallery-youtube';
      iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?feature=oembed&autoplay=1&rel=0&playsinline=1${pageOrigin}`;
      iframe.title = 'AIC2025 85 Presentation';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;
      player.replaceChildren(iframe);
    }, { once: true });
  });
  document.querySelectorAll('[data-gallery-close]').forEach((button) => {
    button.addEventListener('click', () => {
      galleryModal?.classList.remove('is-open');
      galleryModal?.setAttribute('aria-hidden', 'true');
    });
  });
  document.querySelectorAll('[data-card-stage]').forEach((stage) => {
    const desiredCardOrder = [
      0,
      1,
      14, 15, 16, 17, 18, 19,
      20, 21, 22, 23, 24,
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
    ];
    const cardReturn = stage.querySelector('[data-card-return]');
    const allCards = [...stage.querySelectorAll('[data-flip-card]')].sort((a, b) => {
      const getCardNumber = (card) => {
        if (card.dataset.cardOrder) return Number(card.dataset.cardOrder);
        const src = card.querySelector('.catshroom-card-front img')?.getAttribute('src') || '';
        const match = src.match(/card-front-(\d+)\.png/);
        return match ? Number(match[1]) : 0;
      };
      return desiredCardOrder.indexOf(getCardNumber(a)) - desiredCardOrder.indexOf(getCardNumber(b));
    });
    const cards = allCards.filter((card) => !card.classList.contains('catshroom-pack-card'));
    const cardSlider = stage.querySelector('[data-card-slider]');
    let cardOffset = 0;
    let cardTimer = 0;
    let cardPointerId = null;
    let cardStartOffset = 0;
    let cardStartX = 0;
    let cardStartY = 0;
    let cardDeltaX = 0;
    let cardDidDrag = false;
    let cardHovering = false;
    let packSwipeCard = null;
    let packOpening = false;
    const wrapCardIndex = (index) => ((index % cards.length) + cards.length) % cards.length;
    const syncCardSlider = () => {
      if (!cardSlider || !cards.length) return;
      const rect = cardSlider.getBoundingClientRect();
      const progress = cards.length > 1 ? wrapCardIndex(Math.round(cardOffset)) / (cards.length - 1) : 0;
      const x = progress * rect.width;
      const y = 48 - Math.sin(progress * Math.PI) * 18;
      const cueProgress = .72;
      const cueX = cueProgress * rect.width;
      const cueY = 48 - Math.sin(cueProgress * Math.PI) * 18 - 10;
      cardSlider.style.setProperty('--slider-dot-left', `${x.toFixed(2)}px`);
      cardSlider.style.setProperty('--slider-dot-top', `${y.toFixed(2)}px`);
      cardSlider.style.setProperty('--slider-cue-left', `${cueX.toFixed(2)}px`);
      cardSlider.style.setProperty('--slider-cue-top', `${cueY.toFixed(2)}px`);
    };
    const setCardOffsetFromSlider = (clientX, startX = null, startOffset = cardOffset) => {
      if (!cardSlider || !cards.length) return;
      if (startX === null) {
        const rect = cardSlider.getBoundingClientRect();
        const progress = clamp((clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
        cardOffset = wrapCardIndex(Math.round(progress * (cards.length - 1)));
      } else {
        const draggedSteps = Math.round((clientX - startX) / 34);
        cardOffset = wrapCardIndex(startOffset + draggedSteps);
      }
      renderCards();
    };
    const renderCards = () => {
      const activeCard = stage.querySelector('.catshroom-card.is-active');
      cards.forEach((card, index) => {
        const relative = wrapCardIndex(index - cardOffset);
        const centered = relative <= cards.length / 2 ? relative : relative - cards.length;
        const visibleDistance = Math.abs(centered);
        const clamped = Math.max(-9, Math.min(9, centered));
        const angle = clamped * 8.2 * Math.PI / 180;
        const x = Math.sin(angle) * 820;
        const y = (1 - Math.cos(angle)) * 360 - 86;
        card.style.setProperty('--card-x', `${x}px`);
        card.style.setProperty('--card-y', `${y}px`);
        card.style.setProperty('--card-rot', `${clamped * 5.8}deg`);
        card.style.setProperty('--card-scale', `${Math.max(.58, 1.04 - visibleDistance * .03)}`);
        card.style.setProperty('--card-opacity', `${visibleDistance > 10 ? 0 : 1}`);
        card.style.setProperty('--card-z', `${Math.round(160 - visibleDistance * 6)}`);
        card.style.pointerEvents = visibleDistance > 10 || activeCard ? 'none' : 'auto';
      });
      if (activeCard) activeCard.style.pointerEvents = 'auto';
      syncCardSlider();
    };
    const startCardTimer = () => {
      window.clearInterval(cardTimer);
      if (stage.classList.contains('has-active')) return;
      if (cardHovering || cardPointerId !== null) return;
      cardTimer = window.setInterval(() => {
        cardOffset = wrapCardIndex(cardOffset + 1);
        renderCards();
      }, 1500);
    };
    const resetCards = () => {
      packOpening = false;
      cardDidDrag = false;
      stage.classList.remove('has-active', 'is-pack-active', 'is-pack-open');
      allCards.forEach((card) => {
        card.classList.remove('is-active', 'is-pulled', 'is-pulled-settled', 'is-tearing', 'is-pack-leaving', 'is-hovered');
        card.style.removeProperty('--pack-swipe-x');
        card.style.removeProperty('--pack-tear-progress');
        card.style.removeProperty('--pack-tear-cut');
        card.classList.add('is-flipped');
        card.style.pointerEvents = '';
        card.setAttribute('aria-pressed', 'false');
      });
      renderCards();
      stage.classList.remove('has-active', 'is-pack-active', 'is-pack-open');
      window.requestAnimationFrame(() => {
        stage.classList.remove('has-active', 'is-pack-active', 'is-pack-open');
        renderCards();
      });
      startCardTimer();
    };
    const openPack = (packCard) => {
      if (packOpening) return;
      packOpening = true;
      const pool = cards;
      const shuffled = pool.map((card) => ({ card, sort: Math.random() })).sort((a, b) => a.sort - b.sort).slice(0, 5).map((item) => item.card);
      const spread = [
        { x: -370, y: -54, r: -2.4 },
        { x: -185, y: -52, r: -1.2 },
        { x: 0, y: -58, r: 0 },
        { x: 185, y: -52, r: 1.2 },
        { x: 370, y: -54, r: 2.4 }
      ];
      pool.forEach((card) => {
        card.classList.remove('is-pulled', 'is-pulled-settled', 'is-peeking', 'is-hovered');
        card.style.pointerEvents = 'none';
      });
      stage.classList.add('has-active');
      shuffled.forEach((card, peekIndex) => {
        card.classList.add('is-peeking', 'is-flipped');
        card.classList.remove('is-active');
        card.style.setProperty('--peek-x', `${(peekIndex - 2) * 5}px`);
        card.style.setProperty('--peek-y', `${322 - peekIndex}px`);
        card.style.setProperty('--peek-rot', '0deg');
        card.style.setProperty('--peek-z', `${236 + peekIndex}`);
      });
      window.setTimeout(() => {
        packCard.classList.add('is-pack-leaving');
      }, 420);
      window.setTimeout(() => {
        stage.classList.add('is-pack-open', 'has-active');
        stage.classList.remove('is-pack-active');
        packCard.classList.remove('is-tearing', 'is-active');
        packCard.style.pointerEvents = 'none';
      }, 620);
      window.setTimeout(() => {
        shuffled.forEach((card, pulledIndex) => {
          const pos = spread[pulledIndex];
          card.style.setProperty('--pull-x', `${pos.x}px`);
          card.style.setProperty('--pull-y', `${pos.y}px`);
          card.style.setProperty('--pull-rot', `${pos.r}deg`);
          card.style.setProperty('--pull-z', `${250 + pulledIndex}`);
          card.style.setProperty('--pull-delay', '0ms');
          card.classList.remove('is-active', 'is-peeking', 'is-pulled-settled', 'is-flipped');
          card.classList.add('is-pulled');
          card.setAttribute('aria-pressed', 'false');
          card.style.pointerEvents = 'auto';
        });
        cardDidDrag = false;
        window.setTimeout(() => {
          shuffled.forEach((card) => card.classList.add('is-pulled-settled'));
        }, 520);
      }, 760);
    };
    if (cardReturn) {
      cardReturn.addEventListener('click', (event) => {
        event.stopPropagation();
        resetCards();
      });
    }
    if (cardSlider) {
      let sliderPointerId = null;
      let sliderStartX = 0;
      let sliderStartOffset = 0;
      const endSliderDrag = (event) => {
        if (sliderPointerId !== event.pointerId) return;
        try { if (cardSlider.hasPointerCapture(sliderPointerId)) cardSlider.releasePointerCapture(sliderPointerId); } catch (error) {}
        sliderPointerId = null;
        cardSlider.classList.remove('is-sliding');
        window.setTimeout(() => { cardDidDrag = false; }, 120);
        startCardTimer();
      };
      cardSlider.addEventListener('pointerdown', (event) => {
        if (stage.classList.contains('has-active')) return;
        if (event.button !== undefined && event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        sliderPointerId = event.pointerId;
        sliderStartX = event.clientX;
        sliderStartOffset = cardOffset;
        cardDidDrag = true;
        cardSlider.classList.add('is-sliding');
        window.clearInterval(cardTimer);
        try { cardSlider.setPointerCapture(sliderPointerId); } catch (error) {}
      });
      cardSlider.addEventListener('pointermove', (event) => {
        if (sliderPointerId !== event.pointerId) return;
        event.preventDefault();
        setCardOffsetFromSlider(event.clientX, sliderStartX, sliderStartOffset);
      }, { passive: false });
      cardSlider.addEventListener('pointerup', endSliderDrag);
      cardSlider.addEventListener('pointercancel', endSliderDrag);
    }
    allCards.forEach((card, index) => {
      card.classList.add('is-flipped');
      const resetActiveTilt = () => {
        card.style.setProperty('--active-tilt-x', '0deg');
        card.style.setProperty('--active-tilt-y', '0deg');
        card.style.setProperty('--active-shadow-x', '0px');
        card.style.setProperty('--active-shadow-y', '0px');
      };
      card.addEventListener('pointermove', (event) => {
        if (!card.classList.contains('is-active') || event.pointerType !== 'mouse') return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.setProperty('--active-tilt-x', `${(-y * 24).toFixed(2)}deg`);
        card.style.setProperty('--active-tilt-y', `${(x * 28).toFixed(2)}deg`);
        card.style.setProperty('--active-shadow-x', `${(x * 26).toFixed(2)}px`);
        card.style.setProperty('--active-shadow-y', `${(y * 20).toFixed(2)}px`);
      }, { passive: true });
      card.addEventListener('pointerleave', resetActiveTilt);
      card.addEventListener('pointerenter', () => {
        if (!card.classList.contains('is-pulled')) return;
        cards.forEach((item) => item.classList.remove('is-hovered'));
        card.classList.add('is-hovered');
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-hovered');
      });
      card.addEventListener('click', (event) => {
        event.stopPropagation();
        if (cardDidDrag) return;
        if (stage.classList.contains('is-pack-open') && card.classList.contains('is-pulled')) {
          const showingFront = card.classList.toggle('is-flipped');
          card.setAttribute('aria-pressed', showingFront ? 'true' : 'false');
          return;
        }
        const wasActive = card.classList.contains('is-active');
        if (wasActive) {
          if (card.classList.contains('catshroom-pack-card')) {
            packSwipeCard = null;
            cardPointerId = null;
            card.classList.remove('is-tearing');
            card.style.setProperty('--pack-swipe-x', '0px');
            card.style.setProperty('--pack-tear-progress', '0');
            card.style.setProperty('--pack-tear-cut', '0%');
            return;
          }
          const showingFront = card.classList.toggle('is-flipped');
          card.setAttribute('aria-pressed', showingFront ? 'true' : 'false');
          return;
        }
        if (card.classList.contains('catshroom-pack-card')) {
          window.clearInterval(cardTimer);
          stage.classList.add('has-active', 'is-pack-active');
          allCards.forEach((item) => {
            item.classList.remove('is-active');
            item.style.setProperty('--active-tilt-x', '0deg');
            item.style.setProperty('--active-tilt-y', '0deg');
            item.style.setProperty('--active-shadow-x', '0px');
            item.style.setProperty('--active-shadow-y', '0px');
            item.style.pointerEvents = item === card ? 'auto' : 'none';
            item.setAttribute('aria-pressed', 'false');
          });
          card.classList.add('is-active', 'is-flipped');
          card.setAttribute('aria-pressed', 'true');
          return;
        }
        window.clearInterval(cardTimer);
        stage.classList.add('has-active');
        allCards.forEach((item) => {
          item.classList.remove('is-active');
          item.style.setProperty('--active-tilt-x', '0deg');
          item.style.setProperty('--active-tilt-y', '0deg');
          item.style.setProperty('--active-shadow-x', '0px');
          item.style.setProperty('--active-shadow-y', '0px');
          item.setAttribute('aria-pressed', 'false');
        });
        cardOffset = cards.indexOf(card);
        renderCards();
        card.classList.add('is-active', 'is-flipped', 'is-selecting');
        window.setTimeout(() => card.classList.remove('is-selecting'), 520);
        card.setAttribute('aria-pressed', 'true');
      });
    });
    stage.addEventListener('pointerdown', (event) => {
      const targetCard = event.target.closest('[data-flip-card]');
      const activePack = targetCard?.classList.contains('catshroom-pack-card') && targetCard.classList.contains('is-active');
      if (event.button !== undefined && event.button !== 0) return;
      if (!activePack) return;
      if (targetCard.classList.contains('is-pack-leaving') || packOpening) return;
      event.preventDefault();
      cardPointerId = event.pointerId;
      cardStartOffset = cardOffset;
      cardStartX = event.clientX;
      cardStartY = event.clientY;
      cardDeltaX = 0;
      cardDidDrag = false;
      packSwipeCard = targetCard;
      window.clearInterval(cardTimer);
      try { targetCard.setPointerCapture(cardPointerId); } catch (error) {}
    });
    stage.addEventListener('pointermove', (event) => {
      if (cardPointerId !== event.pointerId) return;
      cardDeltaX = event.clientX - cardStartX;
      const deltaY = event.clientY - cardStartY;
      if (packSwipeCard) {
        if (cardDeltaX > 18 && cardDeltaX > Math.abs(deltaY) * .45) {
          cardDidDrag = true;
          if (event.cancelable) event.preventDefault();
          const tearDistance = Math.max(0, Math.min(150, cardDeltaX - 18));
          const tearProgress = Math.min(1, tearDistance / 108);
          packSwipeCard.classList.add('is-tearing');
          packSwipeCard.style.setProperty('--pack-swipe-x', `${tearDistance}px`);
          packSwipeCard.style.setProperty('--pack-tear-progress', tearProgress.toFixed(3));
          packSwipeCard.style.setProperty('--pack-tear-cut', `${(tearProgress * 24).toFixed(2)}%`);
          if (cardDeltaX > 90) {
            const openingPack = packSwipeCard;
            packSwipeCard = null;
            cardPointerId = null;
            openingPack.style.setProperty('--pack-tear-progress', '1');
            openingPack.style.setProperty('--pack-tear-cut', '24%');
            window.setTimeout(() => openPack(openingPack), 880);
          }
        }
        return;
      }
    }, { passive: false });
    const endCardDrag = (event) => {
      if (cardPointerId !== event.pointerId) return;
      stage.classList.remove('is-dragging');
      try {
        const capturedCard = packSwipeCard || event.target.closest('[data-flip-card]');
        if (capturedCard?.hasPointerCapture(cardPointerId)) capturedCard.releasePointerCapture(cardPointerId);
      } catch (error) {}
      if (packSwipeCard) {
        packSwipeCard.style.setProperty('--pack-swipe-x', '0px');
        packSwipeCard.style.setProperty('--pack-tear-progress', '0');
        packSwipeCard.style.setProperty('--pack-tear-cut', '0%');
        packSwipeCard.classList.remove('is-tearing');
      }
      packSwipeCard = null;
      cardPointerId = null;
      window.setTimeout(() => { cardDidDrag = false; }, 160);
      startCardTimer();
    };
    stage.addEventListener('pointerup', endCardDrag);
    stage.addEventListener('pointercancel', endCardDrag);
    stage.addEventListener('pointerenter', () => {
      cardHovering = true;
      window.clearInterval(cardTimer);
    });
    stage.addEventListener('pointerleave', () => {
      cardHovering = false;
      if (!stage.classList.contains('has-active')) startCardTimer();
    });
    stage.addEventListener('click', (event) => {
      if (cardDidDrag) return;
      if (event.target.closest('[data-flip-card], [data-card-slider], [data-card-return]')) return;
      const activeCard = stage.querySelector('.catshroom-card.is-active');
      if (stage.classList.contains('is-pack-active')) {
        if (!packOpening && !stage.querySelector('.catshroom-pack-card.is-tearing')) resetCards();
        return;
      }
      if (stage.classList.contains('is-pack-open')) return;
      if (!activeCard || activeCard.classList.contains('catshroom-pack-card')) return;
      resetCards();
    });
    renderCards();
    startCardTimer();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      playModal?.classList.remove('is-open');
      playModal?.setAttribute('aria-hidden', 'true');
      document.querySelector('[data-gallery-modal]')?.classList.remove('is-open');
      document.querySelector('[data-gallery-modal]')?.setAttribute('aria-hidden', 'true');
    }
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
      startLeft = el.offsetLeft;
      startTop = el.offsetTop;
      startPointerX = event.clientX;
      startPointerY = event.clientY;
      el.style.left = startLeft + 'px';
      el.style.top = startTop + 'px';
      if (!isWindow) {
        el.style.width = el.offsetWidth + 'px';
        el.style.height = el.offsetHeight + 'px';
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
      if (el.matches('[data-draggable]') && !el.classList.contains('layer-trash')) {
        const isOverTrash = layerHitsTrash(el);
        trashLayer?.classList.toggle('is-trash-target', isOverTrash);
        el.classList.toggle('is-over-trash', isOverTrash);
      }
      updateConnectionLines();
    });

    const stop = () => {
      clearTimeout(holdTimer);
      el.classList.remove('is-armed');
      if (dragging) {
        el.classList.remove('is-dragging');
        el.classList.add('is-released');
        window.setTimeout(() => el.classList.remove('is-released'), 460);
        if (layerHitsTrash(el)) {
          el.classList.add('is-trashed');
          el.classList.remove('is-released');
          showTrashResetTip();
        }
      }
      el.classList.remove('is-over-trash');
      trashLayer?.classList.remove('is-trash-target');
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

  const scheduleDesktopSync = () => {
    syncDesktopLayers();
    requestAnimationFrame(() => {
      syncDesktopLayers();
      requestAnimationFrame(syncDesktopLayers);
    });
  };

  document.querySelectorAll('.desktop-layer img, .decor-layer, [data-portfolio-logo]').forEach((img) => {
    img.addEventListener('load', scheduleDesktopSync, { once: true });
  });
  scheduleDesktopSync();
  window.addEventListener('load', scheduleDesktopSync, { once: true });
  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleDesktopSync).catch(() => {});
  }
  window.addEventListener('resize', () => {
    scheduleDesktopSync();
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
    logo.addEventListener('click', resetHeroLayers);
    logo.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        resetHeroLayers();
      }
    });
  }

  const revealTargets = [
    ...document.querySelectorAll('.reference-section .path-button'),
    ...document.querySelectorAll('.reference-section .section-note'),
    ...document.querySelectorAll('.work-card'),
    ...document.querySelectorAll('.play-card'),
    ...document.querySelectorAll('.contact-icons a'),
    ...document.querySelectorAll('.back-top'),
  ];
  revealTargets.forEach((item, index) => {
    item.classList.add('reveal-item');
    item.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 80}ms`);
  });
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          entry.target.classList.remove('is-faded');
        } else if (entry.boundingClientRect.top < 0) {
          entry.target.classList.remove('is-visible');
          entry.target.classList.add('is-faded');
        } else {
          entry.target.classList.remove('is-visible', 'is-faded');
        }
      });
    }, { threshold: [0, .12, .28], rootMargin: '-8% 0px -12% 0px' });
    revealTargets.forEach((item) => revealObserver.observe(item));
  } else {
    revealTargets.forEach((item) => item.classList.add('is-visible'));
  }

  const visibleSections = [...document.querySelectorAll('.reference-section')];
  const updateSectionVisibility = () => {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    visibleSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const visible = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
      const ratio = clamp(visible / Math.min(rect.height, viewportHeight), 0, 1);
      section.style.setProperty('--section-visibility', ratio.toFixed(3));
    });
  };
  updateSectionVisibility();
  window.addEventListener('scroll', updateSectionVisibility, { passive: true });
  window.addEventListener('resize', updateSectionVisibility, { passive: true });

  if (location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
})();
