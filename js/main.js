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

// ========== Telegram Bot Config ==========
const TG_BOT_TOKEN = '8382959043:AAHSh9M8i4ReIlMaK_rD_vL2vcqvQxgDexA';
const TG_CHAT_ID = '7893804';
const TG_API = 'https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage';

function sendFormToTelegram(fields) {
  const now = new Date();
  const timeStr = now.toLocaleString('ar-SA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });

  const message = `📬 *رسالة جديدة من موقع CDIT*

━━━━━━━━━━━━━━━━━━
👤 *الاسم:* ${fields.name || '—'}
📱 *الجوال:* ${fields.phone || '—'}
📧 *البريد:* ${fields.email || '—'}
🔧 *الخدمة:* ${fields.service || '—'}

💬 *الرسالة:*
${fields.message || '—'}
━━━━━━━━━━━━━━━━━━

🕐 *الوقت:* ${timeStr}
🌐 *من صفحة:* تواصل معنا — cdit.co/contact.html`;

  fetch(TG_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    }),
    keepalive: true
  }).catch(() => {});
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

    // Send to Telegram
    sendFormToTelegram(fields);

    // Show success message
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

// ========== Prayer Times Widget (Riyadh, Umm al-Qura) ==========
const PRAYER_API = 'https://api.aladhan.com/v1/timingsByCity?city=Riyadh&country=SA&method=4';
const PRAYER_NAMES_AR = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_CACHE_KEY = 'cdit_prayer_v1';

async function fetchPrayerData() {
  const today = new Date().toDateString();
  try {
    const cached = JSON.parse(localStorage.getItem(PRAYER_CACHE_KEY) || 'null');
    if (cached && cached.day === today) return cached.data;
  } catch (e) {}

  const res = await fetch(PRAYER_API);
  if (!res.ok) throw new Error('Prayer API request failed');
  const json = await res.json();
  const data = { timings: json.data.timings, hijri: json.data.date.hijri };
  try { localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify({ day: today, data })); } catch (e) {}
  return data;
}

function getNextPrayer(timings) {
  const now = new Date();
  for (const name of PRAYER_ORDER) {
    const raw = (timings[name] || '').split(' ')[0]; // strip "(AST)" if present
    const [h, m] = raw.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) continue;
    const t = new Date();
    t.setHours(h, m, 0, 0);
    if (t > now) return { name, time: raw, at: t };
  }
  return null;
}

function formatPrayerCountdown(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? h + 'س ' + m + 'د' : m + 'د';
}

function renderPrayer(data) {
  const list = document.getElementById('prayer-list');
  const hijriEl = document.getElementById('prayer-hijri');
  const cdEl = document.getElementById('prayer-countdown');
  if (!list || !hijriEl || !cdEl) return;

  const next = getNextPrayer(data.timings);
  hijriEl.textContent = data.hijri.day + ' ' + data.hijri.month.ar + ' ' + data.hijri.year + 'هـ';

  list.innerHTML = PRAYER_ORDER.map(name => {
    const cls = next && next.name === name ? 'next' : '';
    const time = (data.timings[name] || '').split(' ')[0];
    return '<li class="' + cls + '"><span>' + PRAYER_NAMES_AR[name] + '</span><span class="time">' + time + '</span></li>';
  }).join('');

  if (next) {
    cdEl.textContent = formatPrayerCountdown(next.at - new Date());
  } else {
    cdEl.textContent = 'الفجر';
  }
}

async function initPrayerWidget() {
  const root = document.getElementById('prayer-float');
  if (!root) return;
  let data;
  try {
    data = await fetchPrayerData();
  } catch (e) {
    return; // API failure → keep widget hidden, site continues normally
  }

  root.hidden = false;
  renderPrayer(data);
  setInterval(() => renderPrayer(data), 60000);

  const btn = document.getElementById('prayer-float-btn');
  const closeBtn = document.getElementById('prayer-panel-close');
  if (btn) btn.addEventListener('click', () => root.classList.toggle('open'));
  if (closeBtn) closeBtn.addEventListener('click', () => root.classList.remove('open'));
}

initPrayerWidget();
