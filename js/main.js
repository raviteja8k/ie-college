// Aadyas Junior College - home page interactions
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Images load from the live site. If one fails, use the local copy, or initials, or the text logo.
  function handleBroken(img) {
    if (img.dataset.fallback && !img.dataset.failed) {
      img.dataset.failed = '1';
      img.src = img.dataset.fallback;
      return;
    }
    if (img.dataset.initials) {
      img.parentElement.dataset.initials = img.dataset.initials;
      img.remove();
      return;
    }
    if (img.closest('.brand')) img.closest('.brand').classList.add('no-logo');
  }
  $$('img').forEach(img => {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) handleBroken(img);
    img.addEventListener('error', () => handleBroken(img));
  });


  // Hero background video: desktop only, no reduced motion, never on data saver
  const heroVideo = $('.hero-video');
  const saveData = navigator.connection && navigator.connection.saveData;
  if (heroVideo && !reduceMotion && !saveData && matchMedia('(min-width: 900px)').matches) {
    heroVideo.src = heroVideo.dataset.src;
    heroVideo.addEventListener('playing', () => heroVideo.classList.add('is-playing'), { once: true });
    heroVideo.addEventListener('error', () => heroVideo.remove());
    heroVideo.play().catch(() => {});
  }

  // Mobile menu
  const burger = $('.burger');
  const nav = $('#nav');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.header')) setMenu(false); });

  // Header shrink, scroll progress, current nav item
  const header = $('.header');
  const progress = $('.progress');
  const sections = $$('main section[id]');
  const navLinks = $$('.nav a[href^="#"]');
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('is-scrolled', y > 30);
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    let current = '';
    sections.forEach(s => { if (s.offsetTop - 140 <= y) current = s.id; });
    navLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + current));
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Scroll reveal
  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('motion');
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    const groups = new Map();
    $$('.reveal').forEach(el => {
      const i = groups.get(el.parentElement) || 0;
      groups.set(el.parentElement, i + 1);
      el.style.setProperty('--d', `${Math.min(i, 5) * 0.08}s`);
      io.observe(el);
    });
  }

  // Chip groups (shared behaviour)
  function chipGroup(group, onPick) {
    const chips = $$('.chip', group);
    chips.forEach(chip => chip.addEventListener('click', () => {
      chips.forEach(c => { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
      onPick(chip);
    }));
  }

  // Course filter: dim streams that don't match the goal
  const courses = $$('.course');
  const courseStatus = $('#course-status');
  chipGroup($('#courses .chips'), chip => {
    const goal = chip.dataset.goal;
    let n = 0;
    courses.forEach(c => {
      const match = goal === 'all' || c.dataset.goals.split(' ').includes(goal);
      c.classList.toggle('is-dim', !match);
      if (match) n++;
    });
    courseStatus.textContent = goal === 'all' ? 'Showing all 5 streams' : `${n} ${n === 1 ? 'stream fits' : 'streams fit'} ${chip.textContent}`;
  });

  // Gallery filter
  const shots = $$('.shot');
  chipGroup($('#campus .chips'), chip => {
    const tag = chip.dataset.tag;
    shots.forEach(s => {
      const show = tag === 'all' || s.dataset.tag === tag;
      s.classList.toggle('is-hidden', !show);
      s.classList.remove('is-pop');
      if (show && !reduceMotion) { void s.offsetWidth; s.classList.add('is-pop'); }
    });
  });

  // Modals (video + lightbox)
  let opener = null;
  const openModal = (dlg, from) => { opener = from; dlg.showModal(); document.body.classList.add('is-locked'); };
  $$('dialog.modal').forEach(dlg => {
    dlg.addEventListener('close', () => {
      document.body.classList.remove('is-locked');
      const v = $('video', dlg); if (v) v.pause();
      opener?.focus();
    });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    $('[data-close]', dlg).addEventListener('click', () => dlg.close());
  });

  const videoModal = $('#video-modal');
  const video = $('#campus-video');
  $$('[data-video]').forEach(b => b.addEventListener('click', () => {
    openModal(videoModal, b);
    video.play().catch(() => {});
  }));

  const lightbox = $('#lightbox');
  const lbImg = $('#lb-img');
  const lbCap = $('#lb-cap');
  let idx = 0;
  const visibleShots = () => shots.filter(s => !s.classList.contains('is-hidden'));
  const show = i => {
    const list = visibleShots();
    idx = (i + list.length) % list.length;
    const img = $('img', list[idx]);
    lbImg.src = img.dataset.failed ? img.currentSrc || img.src : (img.dataset.full || img.src);
    lbImg.alt = img.alt;
    lbCap.textContent = $('span', list[idx]).textContent;
  };
  lbImg.addEventListener('error', () => {
    const img = $('img', visibleShots()[idx]);
    if (lbImg.src !== img.src) lbImg.src = img.src;
  });
  shots.forEach(s => s.addEventListener('click', () => { show(visibleShots().indexOf(s)); openModal(lightbox, s); }));
  $('.lb-prev').addEventListener('click', () => show(idx - 1));
  $('.lb-next').addEventListener('click', () => show(idx + 1));
  lightbox.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });

  // Enquiry form (preview only, nothing is sent)
  const form = $('#enquiry-form');
  const msg = $('#form-msg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('input', form).forEach(input => {
      const bad = !input.checkValidity();
      input.parentElement.classList.toggle('is-error', bad);
      if (bad && ok) { input.focus(); ok = false; }
    });
    if (!ok) {
      msg.hidden = false;
      msg.style.background = '#fdecec'; msg.style.color = '#a11';
      msg.textContent = 'Please add your name and a 10-digit mobile number.';
      return;
    }
    msg.hidden = false;
    msg.style.background = ''; msg.style.color = '';
    msg.textContent = `Thanks, ${$('#f-name').value.split(' ')[0]}! This is a preview, so nothing was sent. Please call +91 63098 59955 for now.`;
    form.reset();
  });
  $$('input', form).forEach(i => i.addEventListener('input', () => i.parentElement.classList.remove('is-error')));
  form.addEventListener('focusin', () => document.body.classList.add('is-typing'));
  form.addEventListener('focusout', () => setTimeout(() => { if (!form.contains(document.activeElement)) document.body.classList.remove('is-typing'); }, 0));

  // Social placeholders: stay put until real links are added
  $$('.social a[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));
})();
