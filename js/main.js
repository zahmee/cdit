// ========== Header Scroll Effect ==========
const header = document.getElementById('main-header');
const mobileMenu = document.getElementById('mobile-menu');

function updateHeader() {
  if (!header) return;
  const isHome = document.body.classList.contains('page-home');
  if (window.scrollY > 20) {
    header.classList.remove('transparent');
    header.classList.add('scrolled');
  } else {
    if (isHome) {
      header.classList.add('transparent');
      header.classList.remove('scrolled');
    } else {
      header.classList.remove('transparent');
      header.classList.add('scrolled');
    }
  }
}
window.addEventListener('scroll', updateHeader);
window.addEventListener('load', updateHeader);

// ========== Mobile Menu ==========
const mobileToggle = document.getElementById('mobile-toggle');
if (mobileToggle && mobileMenu) {
  mobileToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

// ========== Active Nav Link ==========
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPath || (currentPath === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// ========== Stats Counter ==========
const statsSection = document.getElementById('stats-section');
if (statsSection) {
  const statItems = statsSection.querySelectorAll('.stat-item');
  let started = false;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !started) {
      started = true;
      statItems.forEach(item => {
        const target = parseInt(item.dataset.target);
        if (!Number.isFinite(target)) return; // non-numeric stats (e.g. "سجل تجاري") stay as-is
        const suffix = item.dataset.suffix || '';
        const duration = 2000;
        const startTime = performance.now();
        const numEl = item.querySelector('.num');
        if (!numEl) return;

        function animate(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          const value = Math.floor(progress * target);
          numEl.textContent = value + suffix;
          if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
      });
    }
  }, { threshold: 0.3 });

  observer.observe(statsSection);
}

// ========== WhatsApp Float ==========
const waBtn = document.getElementById('wa-float-btn');
const waPanel = document.getElementById('wa-panel');
if (waBtn && waPanel) {
  waBtn.addEventListener('click', () => {
    waPanel.classList.toggle('open');
    waBtn.classList.toggle('open');
    waBtn.classList.toggle('closed');
  });
}

// ========== Contact Form → WhatsApp ==========
const contactForm = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');
const formContainer = document.getElementById('form-container');
const WA_PHONE = '966502010911';

function buildWaMessage(fields) {
  const lines = [`السلام عليكم، أنا ${fields.name}`, ''];
  lines.push(`📱 رقم الجوال: ${fields.phone}`);
  if (fields.email) lines.push(`📧 البريد: ${fields.email}`);
  if (fields.service) lines.push(`🔧 الخدمة المطلوبة: ${fields.service}`);
  lines.push('', '💬 الرسالة:', fields.message, '', '—', 'مرسلة من موقع cdit.co');
  return lines.join('\n');
}

function buildWaUrl(text) {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
}

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const fd = new FormData(contactForm);
    const fields = {
      name: (fd.get('name') || '').trim(),
      phone: (fd.get('phone') || '').trim(),
      email: (fd.get('email') || '').trim(),
      service: (fd.get('service') || '').trim(),
      message: (fd.get('message') || '').trim(),
    };

    const waUrl = buildWaUrl(buildWaMessage(fields));

    // Must be called synchronously from the submit handler to avoid popup blockers
    window.open(waUrl, '_blank', 'noopener');

    // Update the manual fallback link (in case the popup was blocked)
    const fallback = document.getElementById('wa-fallback-link');
    if (fallback) fallback.href = waUrl;

    // Swap in the confirmation view
    if (formContainer) formContainer.style.display = 'none';
    if (formSuccess) formSuccess.style.display = 'block';
  });

  // Reset form
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    contactForm.reset();
    if (formContainer) formContainer.style.display = 'block';
    if (formSuccess) formSuccess.style.display = 'none';
  });
}

// ========== Screenshot Lightbox ==========
const lightbox = document.getElementById('lightbox');
if (lightbox) {
  const lbImg = document.getElementById('lightbox-img');
  const lbCaption = document.getElementById('lightbox-caption');
  const lbClose = document.getElementById('lightbox-close');

  const openLightbox = (src, caption, alt) => {
    lbImg.src = src;
    lbImg.alt = alt || caption || '';
    lbCaption.textContent = caption || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    // Defer clearing src so the closing animation (if any) is smooth
    setTimeout(() => { lbImg.src = ''; }, 150);
  };

  document.querySelectorAll('.edition-shot').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.src;
      const caption = btn.dataset.caption || '';
      const alt = btn.querySelector('img')?.alt || '';
      if (src) openLightbox(src, caption, alt);
    });
  });

  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });
}

// ========== Smooth Scroll for Anchor Links ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
