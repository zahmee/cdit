/**
 * Visitor Notification Script — sends a silent visit notification to Telegram
 * via the CDIT Cloudflare Worker proxy. No bot token is exposed in this file.
 *
 * Worker URL is read from window.CDIT_TG_PROXY_URL (set by js/main.js).
 * Country/city detection happens server-side via request.cf in the Worker — no external API needed.
 * See worker/README.md for deployment instructions.
 */
(function () {
  'use strict';

  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = 'Unknown';
    let browser = 'Unknown';

    if (/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(ua)) {
      device = 'Mobile';
      if (/iPad/i.test(ua)) device = 'Tablet';
    } else {
      device = 'Desktop';
    }

    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/OPR\//i.test(ua)) browser = 'Opera';
    else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
    else if (/Trident/i.test(ua)) browser = 'IE';

    return { device, browser };
  }

  function getPageName() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    const names = {
      'index.html': '🏠 الرئيسية',
      'about.html': 'ℹ️ من نحن',
      'contact.html': '📞 تواصل معنا',
      'portfolio.html': '💼 أعمالنا',
      'products.html': '📦 منتجاتنا',
      'services.html': '🔧 خدماتنا',
      'news.html': '📰 أخبار التقنية'
    };
    return names[page] || '📄 ' + page;
  }

  function getReferrer() {
    const ref = document.referrer;
    if (!ref) return 'مباشرة';
    if (ref.includes('google')) return '🔍 Google';
    if (ref.includes('bing')) return '🔍 Bing';
    if (ref.includes('twitter')) return '🐦 Twitter';
    if (ref.includes('facebook') || ref.includes('fb')) return '📘 Facebook';
    if (ref.includes('wa.me') || ref.includes('whatsapp')) return '💬 WhatsApp';
    if (ref.includes('t.co')) return '🐦 Twitter';
    if (ref.includes('linkedin')) return '💼 LinkedIn';
    if (ref.includes('cdit.co')) return '🔗 صفحة داخلية';
    return ref.substring(0, 50);
  }

  function sendNotification() {
    var proxyUrl = window.CDIT_TG_PROXY_URL;
    if (!proxyUrl || proxyUrl.includes('YOUR-ACCOUNT')) {
      return;
    }

    var deviceInfo = getDeviceInfo();
    var pageName = getPageName();
    var referrer = getReferrer();
    var now = new Date();
    var timeStr = now.toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    var message = '🔔 *زيارة جديدة لموقع CDIT*\n\n'
      + '📄 الصفحة: ' + pageName + '\n'
      + '🕐 الوقت: ' + timeStr + '\n'
      + '📱 الجهاز: ' + deviceInfo.device + ' - ' + deviceInfo.browser + '\n'
      + '🌐 اللغة: ' + (navigator.language || 'غير محدد') + '\n'
      + '🔗 من: ' + referrer;

    fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'visit', message: message }),
      keepalive: true
    }).catch(function () {});
  }

  if (document.readyState === 'complete') {
    sendNotification();
  } else {
    window.addEventListener('load', sendNotification);
  }
})();
