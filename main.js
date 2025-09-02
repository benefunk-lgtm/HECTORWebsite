// ScrollReveal minimal, performant animations - TEMPORARILY DISABLED FOR TESTING
/*
ScrollReveal().reveal('.vision-section', {
  duration: 400,
  distance: '30px',
  origin: 'bottom',
  easing: 'ease-out',
  reset: false
});
ScrollReveal().reveal('.team-section', {
  duration: 400,
  distance: '30px',
  origin: 'bottom',
  easing: 'ease-out',
  reset: false
});
ScrollReveal().reveal('.team-member', {
  duration: 400,
  distance: '20px',
  origin: 'bottom',
  interval: 100,
  easing: 'ease-out',
  reset: false
});
ScrollReveal().reveal('.invest-section', {
  duration: 400,
  distance: '30px',
  origin: 'bottom',
  easing: 'ease-out',
  reset: false
});
ScrollReveal().reveal('.fact-box', {
  duration: 400,
  distance: '20px',
  origin: 'right',
  interval: 100,
  easing: 'ease-out',
  reset: false
});
ScrollReveal().reveal('.contact-section', {
  duration: 400,
  distance: '30px',
  origin: 'bottom',
  easing: 'ease-out',
  reset: false
});
ScrollReveal().reveal('.contact-form', {
  duration: 400,
  distance: '20px',
  origin: 'bottom',
  easing: 'ease-out',
  reset: false
});
*/

// ===== BENEFITS SECTION SCROLLYTELLING =====
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // ========== Header shiny hover (safe to remove) ==========
  try {
    const headerBar = document.querySelector('.header-bar');
    const navLinks = document.querySelectorAll('.center-navbar a');
    const moveShine = (clientX) => {
      if (!headerBar) return;
      const rect = headerBar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      headerBar.style.setProperty('--shine-x', pct + '%');
    };
    navLinks.forEach(link => {
      link.addEventListener('mouseenter', (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        moveShine((r.left + r.right) / 2);
      });
    });
    if (headerBar) {
      headerBar.addEventListener('mouseleave', () => {
        headerBar.style.setProperty('--shine-x', '50%');
      });
    }
  } catch (_) {}

  // Smooth scroll for navbar with header offset
  try {
    const headerEl = document.querySelector('.main-header');
    const getHeaderHeight = () => (headerEl ? headerEl.getBoundingClientRect().height : 0);
    const anchors = document.querySelectorAll('.center-navbar a[href^="#"]');
    anchors.forEach((a) => {
      a.addEventListener('click', (evt) => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        evt.preventDefault();
        const offset = getHeaderHeight() + 8; // small spacing
        const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        try { if (history && history.pushState) history.pushState(null, '', href); } catch (_) {}
      });
    });
    try { document.documentElement.style.setProperty('--header-offset', (getHeaderHeight() + 8) + 'px'); } catch (_) {}
    window.addEventListener('resize', () => {
      try { document.documentElement.style.setProperty('--header-offset', (getHeaderHeight() + 8) + 'px'); } catch (_) {}
    }, { passive: true });
  } catch (_) {}

  // Check if GSAP and ScrollTrigger are available
  if (typeof gsap === 'undefined') {
    console.error('GSAP library not loaded!');
    return;
  }
  
  if (typeof ScrollTrigger === 'undefined') {
    console.error('ScrollTrigger plugin not loaded!');
    return;
  }
  
  // Register ScrollTrigger plugin with GSAP
  gsap.registerPlugin(ScrollTrigger);
  // Prevent browser scroll restoration from fighting with pinned layouts
  try { if (history && 'scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (_) {}
  try { ScrollTrigger.clearScrollMemory && ScrollTrigger.clearScrollMemory(); } catch (_) {}
  
  // Get all the elements we need for the scrollytelling
  const benefitsSection = document.getElementById('benefits-section');
  const featureItems = document.querySelectorAll('.feature-item');
  const overlayImages = document.querySelectorAll('.overlay-image');
  const triggers = document.querySelectorAll('.trigger');
  const flockWrap = document.querySelector('.flock-wrap');
  const flockContainer = document.getElementById('flockLottie');
  let flockHasPlayed = false;
  let flockAnim = null;
  try { console.log('[FLOCK] elements', { flockWrap: !!flockWrap, flockContainer: !!flockContainer }); } catch (_) {}
  const setActive = (featureKey) => {
    featureItems.forEach((el) => {
      const isTarget = el.dataset.feature === featureKey;
      el.classList.toggle('is-active', isTarget);
      if (isTarget) {
        el.classList.add('has-activated');
      }
    });
  };
  
  // Validate that all required elements exist
  if (!benefitsSection) {
    console.error('Benefits section not found!');
    return;
  }
  
  if (featureItems.length === 0) {
    console.error('No feature items found!');
    return;
  }
  
  if (overlayImages.length === 0) {
    console.error('No overlay images found!');
    return;
  }
  
  if (triggers.length === 0) {
    console.error('No trigger elements found!');
    return;
  }
  
  // Create the main timeline for the benefits section
  
  // Create a single ScrollTrigger that pins the diorama viewport and controls animations
  const benefitsTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: '#benefits-section',
      start: 'top -15%',
      end: '+=320%',
      pin: '.diorama-viewport',
      pinSpacing: true,
      scrub: 1,
      markers: false,
      onLeave: self => {
        // Ensure final visual state is locked in
        gsap.set(['.robot-1', '.robot-2', '.robot-3', '.precision-grid'], {
          opacity: 1,
          clearProps: 'filter,transform'
        });
        // Keep layout stable without Y shift; all items visible
        gsap.set('.feature-item', { opacity: 1, y: 0, scale: 1 });
        // Lock mover dot to final position to avoid overshoot
        const moverDot = document.querySelector('.timeline-dot.dot-mover');
        const finalDot = document.querySelector('.timeline-dot.dot-conservation');
        if (moverDot && finalDot) {
          moverDot.style.top = finalDot.offsetTop + 'px';
        }

        // Remove pin-spacer without visual jump by compensating scroll position
        const viewportEl = document.querySelector('.diorama-viewport');
        const beforeTop = viewportEl ? viewportEl.getBoundingClientRect().top : 0;
        if (self) self.kill(true);
        benefitsTimeline.kill();
        const afterTop = viewportEl ? viewportEl.getBoundingClientRect().top : 0;
        const delta = afterTop - beforeTop;
        if (delta !== 0) {
          window.scrollBy(0, delta);
        }

        // Keep section at a stable height and gently position viewport in view
        const benefitsSectionEl = document.getElementById('benefits-section');
        if (benefitsSectionEl) {
          benefitsSectionEl.style.minHeight = '140vh';
          benefitsSectionEl.classList.add('finalized');
          // Do not hide triggers to avoid layout jump; CSS keeps them zero-height
        }

        // Avoid refresh here to prevent reflow; finalized state ensures stability
      },
      onUpdate: (self) => {
        // Animation progress tracking (optional)
      }
    }
  });
  
  // Setup moving timeline dot positions and pulse effect
  const moverDotEl = document.querySelector('.timeline-dot.dot-mover');
  const dotAutoEl = document.querySelector('.timeline-dot.dot-autonomy');
  const dotPrecEl = document.querySelector('.timeline-dot.dot-precision');
  const dotConsEl = document.querySelector('.timeline-dot.dot-conservation');
  const getTop = (el) => (el ? el.offsetTop : 0);
  const dotTop = {
    autonomy: getTop(dotAutoEl),
    precision: getTop(dotPrecEl),
    conservation: getTop(dotConsEl)
  };
  const pulseMover = () => {
    if (!moverDotEl) return;
    gsap.fromTo(moverDotEl, { scale: 1 }, { scale: 1.22, duration: 0.18, yoyo: true, repeat: 1, ease: 'power1.out' });
  };
  const playAutonomyVisuals = () => {
    gsap.killTweensOf('.robot-1');
    gsap.set('.robot-1', { opacity: 1 });
    gsap.fromTo('.robot-1', { scale: 1 }, { scale: 1.03, duration: 0.6, ease: 'power1.out' });
    gsap.to('.robot-1', { scale: 1, duration: 0.6, ease: 'power1.out', delay: 0.6 });
  };
  const playPrecisionVisuals = () => {
    gsap.killTweensOf(['.robot-2', '.precision-grid']);
    gsap.fromTo('.precision-grid', { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' });
    gsap.set('.robot-2', { opacity: 1 });
    gsap.fromTo('.robot-2', { scale: 1 }, { scale: 1.03, duration: 0.6, ease: 'power1.out' });
    gsap.to('.robot-2', { scale: 1, duration: 0.6, ease: 'power1.out', delay: 0.6 });
  };
  const playConservationVisuals = () => {
    try { console.log('[FLOCK] conservation activated'); } catch (_) {}
    gsap.killTweensOf('.robot-3');
    gsap.set('.robot-3', { opacity: 1 });
    gsap.fromTo('.robot-3', { scale: 1 }, { scale: 1.03, duration: 0.6, ease: 'power1.out' });
    gsap.to('.robot-3', { scale: 1, duration: 0.6, ease: 'power1.out', delay: 0.6 });
    // Flock Lottie (JSON) play-once
    if (flockWrap && flockContainer && !flockHasPlayed) {
      flockHasPlayed = true;
      try {
        console.log('[FLOCK] load lottie-json');
        gsap.to(flockWrap, { opacity: 1, duration: 0.4, ease: 'power1.out' });
        flockAnim = lottie.loadAnimation({
          container: flockContainer,
          renderer: 'svg',
          loop: false,
          autoplay: true,
          path: 'assets/Birds.json'
        });
        flockAnim.addEventListener('complete', () => {
          gsap.to(flockWrap, { opacity: 0, duration: 0.6, ease: 'power1.in' });
        });
      } catch (e) { try { console.warn('[FLOCK] json load error', e); } catch (_) {} }
    }
  };
  if (moverDotEl) {
    gsap.set(moverDotEl, { top: dotTop.autonomy, opacity: 0 });
  }

  // Create a proper timeline with clear progression
  // Each feature gets a specific time slot in the timeline
  
  // FEATURE 1: Autonomy (sequential phase; visuals time-based)
  benefitsTimeline
    .to(moverDotEl, { opacity: 1, duration: 0.3, ease: 'power1.out' })
    .call(() => { setActive('autonomy'); pulseMover(); playAutonomyVisuals(); })
    .to('.feature-item[data-feature="autonomy"]', { opacity: 1, scale: 1.02, duration: 0.3, ease: 'power1.out' }, '<')
    .to('.timeline-dot.dot-autonomy', { opacity: 1, scale: 1, duration: 0.3, ease: 'power1.out' }, '<+0.02')
    ;
  
  // FEATURE 2: Precision (glide; visuals time-based on arrival)
  benefitsTimeline
    .to(moverDotEl, { top: dotTop.precision, duration: 2.2, ease: 'power2.inOut' })
    .call(() => { setActive('precision'); pulseMover(); playPrecisionVisuals(); })
    .to('.feature-item[data-feature="autonomy"]', { opacity: 0.6, scale: 1, duration: 0.3, ease: 'power1.out' }, '<')
    .to('.feature-item[data-feature="precision"]', { opacity: 1, scale: 1.02, duration: 0.3, ease: 'power1.out' }, '<')
    .to('.timeline-dot.dot-autonomy', { opacity: 0, scale: 0.8, duration: 0.3, ease: 'power1.in' }, '<')
    .to('.timeline-dot.dot-precision', { opacity: 1, scale: 1, duration: 0.3, ease: 'power1.out' }, '<+0.02')
    ;
  
  // FEATURE 3: Conservation (glide; visuals time-based on arrival)
  benefitsTimeline
    .to(moverDotEl, { top: dotTop.conservation, duration: 2.2, ease: 'power2.inOut' })
    .call(() => { setActive('conservation'); pulseMover(); playConservationVisuals(); })
    .to('.feature-item[data-feature="precision"]', { opacity: 0.6, scale: 1, duration: 0.3, ease: 'power1.out' }, '<')
    .to('.feature-item[data-feature="conservation"]', { opacity: 1, scale: 1.02, duration: 0.3, ease: 'power1.out' }, '<')
    .to('.timeline-dot.dot-precision', { opacity: 0, scale: 0.8, duration: 0.3, ease: 'power1.in' }, '<')
    .to('.timeline-dot.dot-conservation', { opacity: 1, scale: 1, duration: 0.3, ease: 'power1.out' }, '<+0.02')
    // plateau at final position so mover holds on the last dot
    .to({}, { duration: 1.5 });

  // Ensure conservation scales back to 1 after its animation completes
  benefitsTimeline.add(() => {
    gsap.to('.feature-item[data-feature="conservation"]', { scale: 1, duration: 0.4, ease: 'power1.out' });
  });
  
  // Benefits scrollytelling initialized successfully
  
  // Remove previous listeners/hacks (replaced by onLeave)
  
  // Ensure ScrollTrigger is properly initialized
  ScrollTrigger.refresh();
  
  // Test if GSAP is working by adding a simple animation
  gsap.set('.diorama-viewport', { opacity: 1 });

  // IntersectionObserver to trigger mission section highlights once
  try {
    const missionSection = document.querySelector('.about-mission');
    if (missionSection) {
      // Facts count-up helpers
      const factNumbers = missionSection.querySelectorAll('.fact-number[data-target]');
      let factsRun = false;
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      const computeStartValue = (target) => {
        if (!isFinite(target)) return 0;
        const abs = Math.abs(target);
        if (abs >= 1_000_000_000) return target * 0.985; // billions → start at 98.5%
        if (abs >= 100_000_000) return target * 0.97;     // hundreds of millions → 97%
        if (abs >= 1_000_000) return target * 0.9;        // millions → 90%
        if (abs >= 1_000) return target * 0.6;            // thousands → 60%
        return 0;                                         // small numbers → from 0
      };
      const formatNumberDot = (value, decimals) => {
        const negative = value < 0;
        const abs = Math.abs(value);
        let str;
        if (decimals > 0) {
          str = abs.toFixed(decimals);
        } else {
          str = Math.round(abs).toString();
        }
        const parts = str.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        const finalStr = parts.join('.');
        return negative ? '-' + finalStr : finalStr;
      };
      const animateNumber = (el) => {
        const target = parseFloat(el.getAttribute('data-target'));
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        const duration = 2200; // slow down a bit
        const startValue = computeStartValue(target);
        const delta = target - startValue;
        const startTime = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - startTime) / duration);
          const eased = easeOutCubic(t);
          const current = startValue + delta * eased;
          if (t < 1) {
            el.textContent = formatNumberDot(current, decimals);
            requestAnimationFrame(tick);
          } else {
            el.textContent = formatNumberDot(target, decimals);
          }
        };
        requestAnimationFrame(tick);
      };
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            missionSection.classList.add('in-view');
            if (!factsRun && factNumbers && factNumbers.length) {
              factsRun = true;
              factNumbers.forEach(animateNumber);
            }
            obs.unobserve(entry.target);
          }
        });
      }, { root: null, rootMargin: '0px', threshold: 0.3 });
      io.observe(missionSection);
    }
  } catch (_) {}

  // ===== Robust refresh hooks (devtools resize, fonts, orientation, tab switching) =====
  try {
    let savedScrollY = 0;
    const requestRefresh = (() => {
      let raf = null;
      return () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const currentY = window.scrollY || document.documentElement.scrollTop || 0;
          ScrollTrigger.refresh();
          // restore scroll after refresh to avoid jumps caused by pin-spacer recalcs
          requestAnimationFrame(() => {
            window.scrollTo(0, currentY);
          });
        });
      };
    })();

    // On full load (images, fonts) and common viewport changes
    window.addEventListener('load', requestRefresh, { passive: true });
    window.addEventListener('resize', requestRefresh, { passive: true });
    window.addEventListener('orientationchange', requestRefresh, { passive: true });
    // When switching tabs (hidden/visible), disable pins while hidden and fully rebuild Story on return
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        try {
          savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
          ScrollTrigger.getAll().forEach(st => st.disable());
        } catch (_) {}
      } else {
        try {
          ScrollTrigger.clearScrollMemory && ScrollTrigger.clearScrollMemory();
          ScrollTrigger.getAll().forEach(st => st.enable());
        } catch (_) {}
        window.scrollTo(0, savedScrollY);
        // Rebuild the Story's ScrollTrigger and restore its internal progress
        try {
          if (storyTimeline) {
            const time = storyTimeline.time();
            storySavedProgress = storyTimeline.progress();
            storyTimeline.scrollTrigger && storyTimeline.scrollTrigger.kill(true);
          }
          const rebuilt = setupStoryTimeline();
          if (rebuilt) {
            if (!isNaN(storySavedProgress)) rebuilt.progress(storySavedProgress, false);
          }
        } catch (_) {}
        requestRefresh();
        // double refresh after a tick to catch late layout changes
        setTimeout(() => {
          window.scrollTo(0, savedScrollY);
          requestRefresh();
        }, 50);
      }
    });
    // Returning from bfcache should trigger a hard refresh of ScrollTrigger measurements
    window.addEventListener('pageshow', (e) => {
      try { ScrollTrigger.clearScrollMemory && ScrollTrigger.clearScrollMemory(); } catch (_) {}
      if (e && e.persisted) {
        // re-enable in case they were disabled on hide
        try { ScrollTrigger.getAll().forEach(st => st.enable()); } catch (_) {}
      }
      requestRefresh();
      setTimeout(requestRefresh, 50);
      // rebuild story timeline after page show to avoid stale pin spacers
      setTimeout(() => { try { setupStoryTimeline && setupStoryTimeline(true); } catch (_) {} }, 0);
    }, { passive: true });
    // Focus can change viewport metrics on some platforms
    window.addEventListener('focus', requestRefresh, { passive: true });
    // While navigating away, pause ScrollTrigger to avoid measuring during background lifecycle
    window.addEventListener('pagehide', () => {
      try { ScrollTrigger.update(); } catch (_) {}
    }, { passive: true });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(requestRefresh).catch(() => {});
    }

    // When Story section first comes into view, force a refresh (handles mobile address bar/devtools
    const storySection = document.querySelector('.about-story');
    if (storySection) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            requestRefresh();
            obs.disconnect();
          }
        });
      }, { threshold: 0.2 });
      io.observe(storySection);
    }
  } catch (_) {}

  // ===== About Story Section: Pin and slide simple timeline (encapsulated) =====
  let storyTimeline = null;
  let storySavedProgress = 0;
  function setupStoryTimeline() {
    try {
      const story = document.querySelector('.about-story');
      if (!story) return null;
      // Kill previous story triggers and unwrap pin-spacers for this section
      ScrollTrigger.getAll().filter(st => st.vars && st.vars.trigger === story).forEach(st => st.kill(true));
      document.querySelectorAll('.pin-spacer').forEach(sp => {
        if (sp.firstElementChild && sp.firstElementChild.classList && sp.firstElementChild.classList.contains('about-story')) {
          sp.replaceWith(sp.firstElementChild);
        }
      });

      const simple = story.querySelector('.story-simple');
      const points = Array.from(story.querySelectorAll('.story-simple-point'));
      if (!(simple && points.length >= 2)) return null;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: story,
          start: 'top top',
          end: `+=${points.length * 60}%`,
          pin: true,
          pinSpacing: true,
          pinType: 'fixed',
          pinReparent: true,
          scrub: 1.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          markers: false
        }
      });

      const animateBgYear = (year) => {
        const container = story.querySelector('.story-bg-year');
        if (!container) return;
        const fixedSpan = container.querySelector('.bg-year-fixed');
        const lastSpan = container.querySelector('.bg-year-last');
        if (!fixedSpan || !lastSpan) return;
        const yearStr = String(year);
        const prefix = yearStr.slice(0, -1);
        const lastDigit = yearStr.slice(-1);
        fixedSpan.textContent = prefix;
        if (lastSpan.textContent !== lastDigit) {
          gsap.killTweensOf(lastSpan);
          lastSpan.textContent = lastDigit;
        }
        gsap.fromTo(
          lastSpan,
          { filter: 'blur(0.4px)', scale: 0.996 },
          { filter: 'blur(0px)', scale: 1, duration: 0.5, ease: 'power1.out' }
        );
      };

      // Initial states and background year
      points.forEach((el) => {
        const left = (el.style.left || '').trim();
        if (left.endsWith('vw')) {
          const val = parseFloat(left);
          const leftSlotVal = parseFloat((points[0] && points[0].style.left) || '20');
          const rightSlotVal = parseFloat((points[1] && points[1].style.left) || '80');
          if (Math.abs(val - leftSlotVal) < 0.5) {
            gsap.set(el, { opacity: 1, scale: 1.06 });
            const y = el.getAttribute('data-year');
            if (y) animateBgYear(y);
          } else if (Math.abs(val - rightSlotVal) < 0.5) {
            gsap.set(el, { opacity: 0.25, scale: 0.96 });
          } else if (val > rightSlotVal) {
            gsap.set(el, { opacity: 0.05, scale: 0.9 });
          } else {
            gsap.set(el, { opacity: 0.05, scale: 0.9 });
          }
        }
      });

      const leftSlot = (points[0] && points[0].style.left) ? points[0].style.left : '20vw';
      const rightSlot = (points[1] && points[1].style.left) ? points[1].style.left : '80vw';
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const afterNext = points[i + 2];
        tl.to(current, { opacity: 0, scale: 0.98, duration: 0.45, ease: 'none' }, `step${i}`);
        tl.to(current, { left: '-10vw', duration: 1.0, ease: 'none' }, `step${i}`);
        tl.to(next, { left: leftSlot, opacity: 1, scale: 1.06, duration: 1.0, ease: 'none' }, `step${i}`);
        tl.add(() => {
          const y = next.getAttribute('data-year');
          if (y) animateBgYear(y);
        }, `step${i}`);
        if (afterNext) tl.to(afterNext, { left: rightSlot, opacity: 0.5, scale: 0.96, duration: 1.0, ease: 'none' }, `step${i}`);
        tl.add(() => {
          for (let j = i + 3; j < points.length; j++) {
            gsap.set(points[j], { opacity: 0.25 });
          }
        });
        tl.to({}, { duration: 0.15 });
      }

      const stepTimes = [];
      for (let i = 0; i < points.length - 1; i++) {
        const labelName = `step${i}`;
        if (tl.labels && tl.labels[labelName] != null) {
          stepTimes.push(tl.labels[labelName]);
        }
      }
      const syncBgToTime = () => {
        const t = tl.time();
        let activeIndex = 0;
        for (let i = 0; i < stepTimes.length; i++) {
          if (t >= stepTimes[i] + 0.001) activeIndex = i + 1; else break;
        }
        const y = points[activeIndex] && points[activeIndex].getAttribute('data-year');
        if (y) animateBgYear(y);
      };
      tl.eventCallback('onUpdate', syncBgToTime);
      syncBgToTime();

      storyTimeline = tl;
      return tl;
    } catch (_) { return null; }
  }

  // Initial story timeline setup
  setupStoryTimeline();
  
  // ===== Contact Section: subtle entrance animation (once) =====
  try {
    const contactSection = document.querySelector('.contact-section');
    if (contactSection) {
      let contactIntroPlayed = false;
      try { console.log('[CONTACT] setup start', { found: !!contactSection }); } catch (_) {}
      const leftEl = document.querySelector('.contact-left');
      const rightEl = document.querySelector('.contact-right');
      if (!leftEl || !rightEl) { try { console.warn('[CONTACT] missing elements', { left: !!leftEl, right: !!rightEl }); } catch (_) {} }
      gsap.set(leftEl, { opacity: 0, x: '-3.2vw', force3D: true });
      gsap.set(rightEl, { opacity: 0, x: '3.2vw', force3D: true });
      try {
        const csL = leftEl ? window.getComputedStyle(leftEl) : null;
        const csR = rightEl ? window.getComputedStyle(rightEl) : null;
        console.log('[CONTACT] after set', {
          left: leftEl ? { opacity: csL.opacity, transform: csL.transform } : null,
          right: rightEl ? { opacity: csR.opacity, transform: csR.transform } : null
        });
      } catch (_) {}

      const startContact = () => {
        if (contactIntroPlayed) return;
        // Gate: only after story unpins/not active anymore
        try {
          const storyActive = !!(typeof storyTimeline !== 'undefined' && storyTimeline && storyTimeline.scrollTrigger && storyTimeline.scrollTrigger.isActive);
          if (storyActive) {
            console.log('[CONTACT] blocked: story still active');
            return;
          }
        } catch (_) {}
        // Gate: ensure actually on screen
        const rect = contactSection.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const visible = rect.top < vh * 0.7 && rect.bottom > vh * 0.15;
        if (!visible) {
          try { console.log('[CONTACT] blocked: not sufficiently visible', { rect }); } catch (_) {}
          return;
        }
        contactIntroPlayed = true;
        try { console.log('[CONTACT] starting animation'); } catch (_) {}
        const tl = gsap.timeline({ defaults: { ease: 'power1.out' } });
        tl.to(leftEl, { opacity: 1, x: 0, duration: 0.6 }, 0)
          .to(rightEl, { opacity: 1, x: 0, duration: 0.6 }, 0.06)
          .add(() => { try { console.log('[CONTACT] tween complete'); } catch (_) {} });
      };

      // IntersectionObserver to start when actually visible
      try {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              startContact();
            }
          });
        }, { root: null, threshold: 0.3, rootMargin: '0px 0px -10% 0px' });
        io.observe(contactSection);
      } catch (_) {
        // Fallback to scroll listener
        const onScroll = () => { startContact(); if (contactIntroPlayed) window.removeEventListener('scroll', onScroll); };
        window.addEventListener('scroll', onScroll, { passive: true });
      }
    }
  } catch (_) {}

  // ===== Contact Form: validation + Netlify submit (no reload) =====
  try {
    const form = document.getElementById('contactForm');
    if (form) {
      const statusEl = form.querySelector('.form-status');
      const getVal = (id) => (form.querySelector(`#${id}`) || {}).value || '';
      const setStatus = (msg, ok) => {
        if (!statusEl) return;
        statusEl.style.color = ok ? '#86efac' : '#fca5a5';
        statusEl.textContent = msg;
      };
      const validEmail = (v) => /^(?:[a-zA-Z0-9_'^&\/+-])+(?:\.(?:[a-zA-Z0-9_'^&\/+-])+)*@(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/.test(v);
      const encode = (data) => new URLSearchParams(data).toString();
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setStatus('', true);
        const fullName = getVal('fullName').trim();
        const email = getVal('emailAddress').trim();
        const phone = getVal('phoneNumber').trim();
        const message = getVal('messageField').trim();
        const agree = (form.querySelector('#agreePrivacy') || {}).checked;
        if (!fullName || !email || !message) return setStatus('Please fill name, email and message.', false);
        if (!validEmail(email)) return setStatus('Please enter a valid email address.', false);
        if (!agree) return setStatus('Please agree to the Privacy Policy terms.', false);
        // Netlify Forms AJAX submit
        const payload = {
          'form-name': form.getAttribute('name') || 'contact',
          fullName, email, phone, message
        };
        try {
          setStatus('Sending…', true);
          const resp = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: encode(payload)
          });
          if (!resp.ok) throw new Error('Network');
          setStatus('Thanks, your message has been sent!', true);
          form.reset();
        } catch (_) {
          setStatus('Oops, something went wrong.', false);
        }
      });
    }
  } catch (_) {}
});