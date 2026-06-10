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

// ========== Telegram Proxy (Cloudflare Worker) ==========
// Replace this URL with your deployed Worker URL. See worker/README.md for setup.
window.CDIT_TG_PROXY_URL = window.CDIT_TG_PROXY_URL || 'https://cdit-telegram-proxy.zahmee.workers.dev';

// ========== AI Agent (Cloudflare Worker → DeepSeek) ==========
// Replace with your deployed cdit-ai-agent Worker URL. See worker/AI_AGENT_README.md for setup.
window.CDIT_AI_AGENT_URL = window.CDIT_AI_AGENT_URL || 'https://cdit-ai-agent.zahmee.workers.dev';

// ========== Google Ads — Conversion Tracking ==========
// AW conversion ID + label from Google Ads → Tools → Conversions. See worker/ADS_TRACKING_README.md.
// If the ID still contains the XXXX placeholder, gtag is never loaded (fails silent like the workers above).
window.CDIT_GADS_ID = window.CDIT_GADS_ID || 'AW-352580261';
window.CDIT_GADS_CONVERSION_LABEL = window.CDIT_GADS_CONVERSION_LABEL || 'pb4PCMbzprYcEKXlj6gB';

// Load the Google global site tag once, on every page (main.js is shared site-wide).
(function loadGtag() {
  const id = window.CDIT_GADS_ID;
  if (!id || id.indexOf('XXXX') !== -1) return; // not configured yet → skip silently
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id);
})();

// Fire the "بدء تجربة مجانية" conversion. Called only on confirmed lead actions
// (trial form submit, AI assistant lead_sent). Safe no-op if gtag isn't loaded.
// Logs to the console on fire + on send so it can be verified without Tag Assistant.
window.cditTrackConversion = function () {
  const id = window.CDIT_GADS_ID;
  const label = window.CDIT_GADS_CONVERSION_LABEL;
  if (typeof window.gtag !== 'function') {
    console.warn('[CDIT] gtag غير محمّل — تم تخطّي حدث التحويل');
    return;
  }
  if (!id || !label || id.indexOf('XXXX') !== -1) {
    console.warn('[CDIT] معرّف/وسم Google Ads غير مضبوط — تم تخطّي حدث التحويل');
    return;
  }
  const sendTo = id + '/' + label;
  console.log('[CDIT] إطلاق حدث تحويل Google Ads →', sendTo);
  window.gtag('event', 'conversion', {
    send_to: sendTo,
    // يؤكّد وصول الحدث فعلاً لجوجل (يظهر في Console حتى لو انقطع Tag Assistant)
    event_callback: function () {
      console.log('[CDIT] ✓ تم إرسال حدث التحويل إلى Google →', sendTo);
    },
  });
};

// Read Google Ads click id + UTM params from the URL, persisting gclid for ~30 days
// so it survives navigation before the lead is submitted.
const GCLID_KEY = 'cdit_gclid_v1';
const GCLID_TTL_MS = 30 * 24 * 60 * 60 * 1000;
(function persistGclid() {
  try {
    const gclid = new URLSearchParams(window.location.search).get('gclid');
    if (gclid) localStorage.setItem(GCLID_KEY, JSON.stringify({ gclid, savedAt: Date.now() }));
  } catch (e) { /* private mode / quota — ignore */ }
})();

function getCampaignParams() {
  const out = { gclid: '', utm_source: '', utm_campaign: '', utm_term: '' };
  try {
    const p = new URLSearchParams(window.location.search);
    out.gclid = p.get('gclid') || '';
    out.utm_source = p.get('utm_source') || '';
    out.utm_campaign = p.get('utm_campaign') || '';
    out.utm_term = p.get('utm_term') || '';
    if (!out.gclid) {
      const stored = JSON.parse(localStorage.getItem(GCLID_KEY) || 'null');
      if (stored && stored.gclid && Date.now() - stored.savedAt < GCLID_TTL_MS) out.gclid = stored.gclid;
    }
  } catch (e) { /* ignore */ }
  return out;
}

// Escape Telegram legacy-Markdown control chars so user/campaign values (names,
// utm_* with underscores, etc.) can't break message parsing and drop the lead.
// The worker sends with parse_mode:'Markdown'; an unbalanced _ * ` [ causes a 400.
function escapeMd(s) {
  return String(s == null ? '' : s).replace(/[_*`\[]/g, '\\$&');
}

function sendFormToTelegram(fields) {
  const now = new Date();
  const timeStr = now.toLocaleString('ar-SA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });

  const message = `📬 *رسالة جديدة من موقع CDIT*

━━━━━━━━━━━━━━━━━━
👤 *الاسم:* ${escapeMd(fields.name) || '—'}
📱 *الجوال:* ${escapeMd(fields.phone) || '—'}
📧 *البريد:* ${escapeMd(fields.email) || '—'}
🔧 *الخدمة:* ${escapeMd(fields.service) || '—'}

💬 *الرسالة:*
${escapeMd(fields.message) || '—'}
━━━━━━━━━━━━━━━━━━

🕐 *الوقت:* ${timeStr}
🌐 *من صفحة:* تواصل معنا — cdit.co/contact.html`;

  fetch(window.CDIT_TG_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'contact', message }),
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

// ========== Trial Request Form (tajribah.html → Telegram + Google Ads conversion) ==========
// The primary "بدء تجربة مجانية" conversion. Captures name + phone + activity,
// notifies the team via the Telegram proxy (type:'lead'), then fires the Ads conversion.
function sendLeadToTelegram(fields, camp) {
  const now = new Date();
  const timeStr = now.toLocaleString('ar-SA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });

  let message = `🎯 *طلب تجربة جديد — حملة إعلانية*

━━━━━━━━━━━━━━━━━━
👤 *الاسم:* ${escapeMd(fields.name) || '—'}
📱 *الجوال:* ${escapeMd(fields.phone) || '—'}
🏢 *نوع النشاط:* ${escapeMd(fields.activity) || '—'}
━━━━━━━━━━━━━━━━━━

🕐 *الوقت:* ${timeStr}
🌐 *من صفحة:* طلب التجربة — cdit.co${escapeMd(window.location.pathname)}`;

  if (camp && (camp.gclid || camp.utm_campaign || camp.utm_source || camp.utm_term)) {
    message += `\n\n📊 *مصدر الحملة:*`;
    if (camp.utm_source) message += `\n• المصدر: ${escapeMd(camp.utm_source)}`;
    if (camp.utm_campaign) message += `\n• الحملة: ${escapeMd(camp.utm_campaign)}`;
    if (camp.utm_term) message += `\n• الكلمة: ${escapeMd(camp.utm_term)}`;
    if (camp.gclid) message += `\n• gclid: ${escapeMd(camp.gclid)}`;
  }

  return fetch(window.CDIT_TG_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'lead', message }),
    keepalive: true
  });
}

const trialForm = document.getElementById('trial-form');
if (trialForm) {
  const trialContainer = document.getElementById('trial-form-container');
  const trialSuccess = document.getElementById('trial-success');
  const trialError = document.getElementById('trial-error');

  trialForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (trialError) trialError.style.display = 'none';

    const fd = new FormData(trialForm);
    const fields = {
      name: (fd.get('name') || '').trim(),
      phone: (fd.get('phone') || '').trim(),
      activity: (fd.get('activity') || '').trim(),
    };

    // Send the lead (fire-and-forget; success UI shows regardless so the visitor isn't blocked).
    sendLeadToTelegram(fields, getCampaignParams()).catch(() => {
      if (trialError) trialError.style.display = 'block';
    });

    // Fire the Google Ads conversion on submit (the lead action itself).
    if (typeof window.cditTrackConversion === 'function') window.cditTrackConversion();

    // Swap to the success state.
    if (trialContainer) trialContainer.style.display = 'none';
    if (trialSuccess) {
      trialSuccess.style.display = 'block';
      trialSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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

// ========== Scroll Reveal ==========
// Auto-tags common cards site-wide (no HTML edits needed) plus anything with
// an explicit .reveal class, then fades each in on first intersection.
// prefers-reduced-motion is handled in CSS (reveal is a no-op there).
(function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  const AUTO_SELECTORS = '.service-card, .why-card, .edition-teaser, .post-card, .stat-item, .sector-pain';
  document.querySelectorAll(AUTO_SELECTORS).forEach(el => el.classList.add('reveal'));

  // Stagger siblings: 2nd card +90ms, 3rd +180ms... capped so long grids don't lag
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.style.getPropertyValue('--reveal-delay')) return; // explicit delay wins
    const siblings = el.parentElement ? Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal')) : [];
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.setProperty('--reveal-delay', Math.min(idx * 90, 450) + 'ms');
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
})();
