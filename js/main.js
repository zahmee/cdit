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
        const suffix = item.dataset.suffix || '';
        const duration = 2000;
        const startTime = performance.now();
        const numEl = item.querySelector('.num');

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

// ========== Contact Form ==========
const contactForm = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');
const formError = document.getElementById('form-error');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> جاري الإرسال...';
    formError.style.display = 'none';

    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));

    // Show success
    contactForm.style.display = 'none';
    formSuccess.style.display = 'block';

    // Open WhatsApp
    const phone = '966502010911';
    const name = contactForm.querySelector('[name="name"]').value;
    const message = contactForm.querySelector('[name="message"]').value;
    const waText = encodeURIComponent(`مرحباً، أنا ${name}. ${message}`);
    window.open(`https://wa.me/${phone}?text=${waText}`, '_blank');

    btn.disabled = false;
    btn.innerHTML = originalText;
  });

  // Reset form
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    contactForm.reset();
    contactForm.style.display = 'block';
    formSuccess.style.display = 'none';
    formError.style.display = 'none';
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
