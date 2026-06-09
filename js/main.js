/* OTC Services — Shared JS */

document.addEventListener('DOMContentLoaded', function () {

  // ---- Sticky Nav ----
  const nav       = document.querySelector('.site-nav');
  const navLogo   = document.querySelector('.nav-logo img');
  const partners  = document.getElementById('partners-section');
  const pageHero  = document.getElementById('page-hero-section');
  const trigger   = partners || pageHero;

  if (nav) {
    window.addEventListener('scroll', () => {
      const threshold = trigger
        ? trigger.offsetTop + trigger.offsetHeight
        : 20;
      const scrolled = window.scrollY > threshold;
      nav.classList.toggle('scrolled', scrolled);
      if (navLogo) {
        navLogo.src = scrolled ? 'assets/logo-dark.svg' : 'assets/logo-white.svg';
      }
    });
  }

  // ---- Mobile Nav Toggle ----
  const mobileToggle = document.querySelector('.nav-mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navCta = document.querySelector('.nav-cta');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', String(!expanded));

      if (navLinks) navLinks.classList.toggle('mobile-open');

      // Toggle hamburger to X
      const spans = mobileToggle.querySelectorAll('span');
      if (!expanded) {
        spans[0].style.transform = 'translateY(7px) rotate(45deg)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
  }

  // ---- FAQ Accordion (smooth height animation) ----
  const faqItems = document.querySelectorAll('.faq-item');

  // Wrap body content in an inner div so padding is included in scrollHeight
  faqItems.forEach(item => {
    const body = item.querySelector('.faq-body');
    if (!body || body.querySelector('.faq-body-inner')) return;
    const inner = document.createElement('div');
    inner.className = 'faq-body-inner';
    while (body.firstChild) inner.appendChild(body.firstChild);
    body.appendChild(inner);
  });

  function closeItem(item) {
    const body = item.querySelector('.faq-body');
    if (!body) return;
    // Snap to explicit px height so the transition from current → 0 is smooth
    body.style.height = body.getBoundingClientRect().height + 'px';
    body.offsetHeight; // force reflow
    body.style.height = '0';
    item.classList.remove('open');
  }

  function openItem(item) {
    const body = item.querySelector('.faq-body');
    if (!body) return;
    item.classList.add('open');
    body.style.height = body.scrollHeight + 'px';
    body.addEventListener('transitionend', function handler() {
      body.style.height = 'auto'; // allow resize after open
      body.removeEventListener('transitionend', handler);
    });
  }

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(i => { if (i !== item) closeItem(i); });
      isOpen ? closeItem(item) : openItem(item);
    });
  });

  // ---- FAQ Tabs ----
  const faqTabs = document.querySelectorAll('.faq-tab');
  if (faqTabs.length) {
    faqTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        faqTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.dataset.filter;
        document.querySelectorAll('.faq-item').forEach(item => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  // ---- Testimonial Carousel ----
  const cards = document.querySelectorAll('.testimonial-card');
  const dots = document.querySelectorAll('.carousel-dot');
  let current = 0;

  function showSlide(index) {
    cards.forEach((c, i) => c.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    current = index;
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => showSlide(i));
  });

  if (cards.length > 1) {
    setInterval(() => {
      const next = (current + 1) % cards.length;
      showSlide(next);
    }, 5000);
  }

  // ---- Contact / Newsletter Form Handling ----
  document.querySelectorAll('form[data-form]').forEach(form => {
    // Clear invalid state on user input
    form.querySelectorAll('.form-line-input, .form-line-textarea').forEach(field => {
      field.addEventListener('input', () => field.classList.remove('invalid'));
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const success = form.querySelector('.form-success');
      const error   = form.querySelector('.form-error-msg');
      const btn     = form.querySelector('button[type="submit"]');

      // Validate required fields
      let valid = true;
      form.querySelectorAll('[required]').forEach(field => {
        if (!field.value.trim()) {
          field.classList.add('invalid');
          valid = false;
        }
      });
      if (!valid) return;

      if (btn) { btn.disabled = true; btn.innerHTML = 'Sending&hellip;'; }

      // Simulate submission — replace with real endpoint
      setTimeout(() => {
        if (success) { success.style.display = 'flex'; }
        form.reset();
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = (btn.dataset.label || 'Submit') +
            ' <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
        }
      }, 1200);
    });
  });

  // ---- Active nav link ----
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) link.classList.add('active');
  });
});

// Mobile nav styles injected
const mobileNavStyle = document.createElement('style');
mobileNavStyle.textContent = `
  @media (max-width: 767px) {
    .nav-links.mobile-open {
      display: flex !important;
      flex-direction: column;
      position: absolute;
      top: 72px;
      left: 0;
      right: 0;
      background: var(--color-navy);
      padding: 16px;
      gap: 4px;
      border-top: 1px solid rgba(255,255,255,0.1);
      z-index: 99;
    }
    .nav-links.mobile-open a {
      padding: 12px 16px;
      border-radius: var(--radius-md);
      width: 100%;
    }
    .nav-dropdown-menu {
      position: static;
      opacity: 1 !important;
      visibility: visible !important;
      transform: none !important;
      background: rgba(255,255,255,0.05);
      margin: 4px 0 4px 16px;
      box-shadow: none;
    }
  }
`;
document.head.appendChild(mobileNavStyle);

// ---- Service item slide-in ----
(function () {
  if (!('IntersectionObserver' in window)) return;

  document.querySelectorAll('.services-list').forEach(function (list) {
    var items = list.querySelectorAll('.service-item');
    items.forEach(function (item, i) {
      item.classList.add('will-animate');
      item.dataset.slideIndex = i;
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = parseInt(entry.target.dataset.slideIndex, 10) || 0;
        entry.target.style.transitionDelay = (idx * 0.1) + 's';
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    items.forEach(function (item) { observer.observe(item); });
  });
})();

// ---- Count-up on scroll ----
(function () {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const animated = new Set();

  function isInViewport(el) {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.9 && r.bottom > 0;
  }

  function animateCounter(el) {
    if (animated.has(el)) return;
    animated.add(el);

    const target   = parseFloat(el.dataset.target);
    const prefix   = el.dataset.prefix  || '';
    const suffix   = el.dataset.suffix  || '';
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1800;
    const start    = performance.now();

    function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

    function frame(now) {
      const elapsed  = Math.min((now - start) / duration, 1);
      const value    = target * ease(elapsed);
      el.textContent = prefix + value.toFixed(decimals) + suffix;
      if (elapsed < 1) requestAnimationFrame(frame);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(frame);
  }

  function checkCounters() {
    counters.forEach(el => {
      if (isInViewport(el)) animateCounter(el);
    });
  }

  window.addEventListener('scroll', checkCounters, { passive: true });
  setTimeout(checkCounters, 300);

  // IntersectionObserver as belt-and-suspenders
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) animateCounter(e.target); });
    }, { threshold: 0.2 });
    counters.forEach(el => io.observe(el));
  }
})();
