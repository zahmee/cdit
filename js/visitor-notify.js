/**
 * Visitor Notification Script - Telegram Integration
 * Sends a silent notification to Telegram when a visitor loads any page.
 * Completely invisible to the user - no UI elements, no console logs.
 */
(function () {
  'use strict';

  const BOT_TOKEN = '8382959043:AAHSh9M8i4ReIlMaK_rD_vL2vcqvQxgDexA';
  const CHAT_ID = '7893804';
  const TELEGRAM_API = 'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage';

  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = 'Unknown';
    let browser = 'Unknown';

    // Detect device type
    if (/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(ua)) {
      device = 'Mobile';
      if (/iPad/i.test(ua)) device = 'Tablet';
    } else {
      device = 'Desktop';
    }

    // Detect browser
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
      'services.html': '🔧 خدماتنا'
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
    const { device, browser } = getDeviceInfo();
    const pageName = getPageName();
    const referrer = getReferrer();
    const now = new Date();
    const timeStr = now.toLocaleString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const message = `🔔 *زيارة جديدة لموقع CDIT*

📄 الصفحة: ${pageName}
🕐 الوقت: ${timeStr}
📱 الجهاز: ${device} - ${browser}
🌐 اللغة: ${navigator.language || 'غير محدد'}
🔗 من: ${referrer}`;

    // Use sendBeacon for reliability (works even if page closes quickly)
    const payload = JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
      disable_notification: false
    });

    // Primary: use fetch with keepalive
    if (typeof fetch !== 'undefined') {
      fetch(TELEGRAM_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(function () {
        // Silently fail - user should not see any errors
      });
    } else {
      // Fallback: use Image beacon
      const data = 'chat_id=' + encodeURIComponent(CHAT_ID) +
        '&text=' + encodeURIComponent(message) +
        '&parse_mode=' + encodeURIComponent('Markdown');
      new Image().src = TELEGRAM_API + '?' + data;
    }
  }

  // Send notification when page is fully loaded
  if (document.readyState === 'complete') {
    sendNotification();
  } else {
    window.addEventListener('load', sendNotification);
  }
})();
