// CDIT AI Chat Agent — frontend widget
//
// يبني فقاعة دردشة عائمة + بطاقة دعوة مدمجة في الـ hero،
// يستهلك SSE من cdit-ai-agent worker، يحفظ السجل في localStorage (٢٤ ساعة).
// الـ Worker يحقن system prompt + tool schema + DeepSeek key — كل اللوجك المهم هناك.
//
// النمط مطابق لـ visitor-notify.js: IIFE صامت، يفشل بصمت إن لم يُضبط الـ proxy URL.
// window.CDIT_AI_LANG = 'en' على الصفحات الإنجليزية لتبديل النصوص وإرسال lang='en' للـ worker.

(function () {
  'use strict';

  const PROXY_URL = window.CDIT_AI_AGENT_URL || '';
  if (!PROXY_URL || PROXY_URL.includes('<حسابك>') || PROXY_URL.includes('YOUR-')) {
    return; // لم يُنشر بعد، تجاهل بصمت
  }

  const IS_EN = window.CDIT_AI_LANG === 'en';

  const STORAGE_KEY = 'cdit_ai_chat_history';
  const HISTORY_TTL_MS = 24 * 60 * 60 * 1000;
  const MAX_HISTORY = 20;
  const PHONE = '+966502010911';
  const WHATSAPP_URL = 'https://wa.me/966502010911?text=' + encodeURIComponent(
    IS_EN
      ? 'Hello, I chatted with the AI assistant on your website and would like to follow up'
      : 'مرحباً، تواصلت مع المساعد الذكي في الموقع وأود متابعة الموضوع'
  );

  const QUICK_REPLIES = IS_EN ? [
    'Tell me about your services',
    'What is Al-Sadara?',
    "I'd like to talk to your team",
  ] : [
    'اعرض لي خدماتكم',
    'ما هي عائلة الصدارة؟',
    'أبغى أتواصل مع أحد المتواجدين',
  ];

  const GREETING = IS_EN
    ? "Hello! I'm CDIT's smart assistant 👋\nI can help you learn about our services and products, or connect you with our team. How can I help you today?"
    : 'مرحباً، أنا مساعد إبداع 👋\nأقدر أساعدك في معرفة خدماتنا، منتجاتنا، أو أرتب لك تواصل مع أحد المتواجدين الآن. كيف أقدر أخدمك؟';

  // ============================================================================
  // Helpers
  // ============================================================================
  function el(tag, props, children) {
    const node = document.createElement(tag);
    if (props) {
      for (const k in props) {
        if (k === 'class') node.className = props[k];
        else if (k === 'text') node.textContent = props[k];
        else if (k === 'html') node.innerHTML = props[k];
        else if (k.startsWith('on')) node.addEventListener(k.slice(2), props[k]);
        else node.setAttribute(k, props[k]);
      }
    }
    if (children) {
      for (const c of children) {
        if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
    }
    return node;
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.savedAt || Date.now() - parsed.savedAt > HISTORY_TTL_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      return Array.isArray(parsed.messages) ? parsed.messages.slice(-MAX_HISTORY) : [];
    } catch {
      return [];
    }
  }

  function saveHistory(messages) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        savedAt: Date.now(),
        messages: messages.slice(-MAX_HISTORY),
      }));
    } catch { /* quota/private mode — تجاهل */ }
  }

  // ============================================================================
  // الحالة
  // ============================================================================
  const state = {
    history: loadHistory(),
    streaming: false,
    abortController: null,
    leadSent: false,
  };

  // ============================================================================
  // بناء الـ DOM
  // ============================================================================
  const root = document.getElementById('ai-agent-root');
  if (!root) return;

  // الشريحة العائمة
  const chip = el('button', {
    type: 'button',
    class: 'ai-agent-chip',
    'aria-label': IS_EN ? 'Open CDIT Assistant' : 'افتح المساعد الذكي',
  }, [
    el('span', { class: 'ai-agent-chip__sparkle', 'aria-hidden': 'true', text: '✨' }),
    el('span', { class: 'ai-agent-chip__label', text: IS_EN ? 'Ask CDIT Assistant' : 'اسأل مساعد إبداع' }),
  ]);

  // اللوحة
  const panel = el('div', {
    class: 'ai-agent-panel',
    role: 'dialog',
    'aria-label': IS_EN ? 'Chat with CDIT Assistant' : 'محادثة مع مساعد إبداع',
  });

  const headerStatus = el('span', { class: 'ai-agent-panel__status' }, [
    el('span', { class: 'ai-agent-panel__status-dot', 'aria-hidden': 'true' }),
    document.createTextNode(IS_EN ? 'Available Now' : 'متاح الآن'),
  ]);

  const closeBtn = el('button', {
    type: 'button',
    class: 'ai-agent-panel__close',
    'aria-label': IS_EN ? 'Close' : 'إغلاق',
    text: '×',
  });

  const header = el('div', { class: 'ai-agent-panel__header' }, [
    el('div', { class: 'ai-agent-panel__brand' }, [
      el('div', { class: 'ai-agent-panel__avatar', 'aria-hidden': 'true', text: '✨' }),
      el('div', {}, [
        el('div', { class: 'ai-agent-panel__title', text: IS_EN ? 'CDIT Assistant' : 'مساعد إبداع' }),
        headerStatus,
      ]),
    ]),
    closeBtn,
  ]);

  const messages = el('div', { class: 'ai-agent-panel__messages', role: 'log', 'aria-live': 'polite' });

  const disclaimer = el('div', { class: 'ai-agent-panel__disclaimer' }, [
    document.createTextNode(IS_EN ? 'AI assistant — to confirm, contact WhatsApp ' : 'هذا المساعد ذكاء اصطناعي. للتأكد تواصل واتساب '),
    el('span', { class: 'ltr', text: PHONE }),
  ]);

  const textarea = el('textarea', {
    class: 'ai-agent-panel__textarea',
    placeholder: IS_EN ? 'Type your message...' : 'اكتب رسالتك...',
    rows: '1',
    'aria-label': IS_EN ? 'Message' : 'رسالة',
  });

  const sendBtn = el('button', {
    type: 'button',
    class: 'ai-agent-panel__send',
    'aria-label': IS_EN ? 'Send' : 'إرسال',
  });
  sendBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';

  const inputRow = el('div', { class: 'ai-agent-panel__input-row' }, [textarea, sendBtn]);

  panel.appendChild(header);
  panel.appendChild(messages);
  panel.appendChild(disclaimer);
  panel.appendChild(inputRow);

  root.appendChild(chip);
  root.appendChild(panel);

  // ============================================================================
  // Render helpers
  // ============================================================================
  function scrollToBottom() {
    requestAnimationFrame(() => {
      messages.scrollTop = messages.scrollHeight;
    });
  }

  function appendBubble(role, text) {
    const bubble = el('div', { class: 'ai-agent-bubble ai-agent-bubble--' + role });
    if (text) bubble.textContent = text;
    messages.appendChild(bubble);
    scrollToBottom();
    return bubble;
  }

  function renderQuickReplies() {
    const wrap = el('div', { class: 'ai-agent-quick-replies' });
    QUICK_REPLIES.forEach((label) => {
      const btn = el('button', {
        type: 'button',
        class: 'ai-agent-quick-reply',
        text: label,
        onclick: () => {
          if (state.streaming) return;
          wrap.remove();
          handleSend(label);
        },
      });
      wrap.appendChild(btn);
    });
    messages.appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  function showLeadConfirmation(ok, detail) {
    if (state.leadSent) return;
    state.leadSent = true;
    const childrenInner = [
      el('div', {
        class: 'ai-agent-lead-sent__title',
        text: ok
          ? (IS_EN ? 'Your request was sent to the CDIT team' : 'تم إرسال طلبك لفريق CDIT')
          : (IS_EN ? 'Failed to send request automatically' : 'تعذّر إرسال الطلب تلقائياً'),
      }),
    ];
    if (!ok && detail) {
      childrenInner.push(el('div', {
        class: 'ai-agent-lead-sent__detail',
        text: (IS_EN ? 'Debug: ' : 'تشخيص: ') + detail,
        style: 'font-size:0.7rem;opacity:0.8;margin:0.25rem 0;',
      }));
    }
    childrenInner.push(el('a', {
      class: 'ai-agent-lead-sent__cta',
      href: WHATSAPP_URL,
      target: '_blank',
      rel: 'noopener',
      text: IS_EN ? 'Contact us on WhatsApp →' : 'للسرعة تواصل واتساب ←',
    }));
    const strip = el('div', { class: 'ai-agent-lead-sent ' + (ok ? 'is-ok' : 'is-fail') }, [
      el('span', { class: 'ai-agent-lead-sent__icon', 'aria-hidden': 'true', text: ok ? '✓' : '!' }),
      el('div', {}, childrenInner),
    ]);
    messages.appendChild(strip);
    scrollToBottom();
  }

  function renderInitial() {
    messages.textContent = '';
    state.leadSent = false;

    if (state.history.length === 0) {
      appendBubble('bot', GREETING);
      renderQuickReplies();
    } else {
      for (const m of state.history) {
        appendBubble(m.role === 'user' ? 'user' : 'bot', m.content);
      }
    }
  }

  // ============================================================================
  // Open/close
  // ============================================================================
  function openPanel() {
    if (panel.classList.contains('is-open')) return;
    panel.classList.add('is-open');
    chip.classList.add('is-hidden');
    if (!messages.dataset.initialized) {
      renderInitial();
      messages.dataset.initialized = '1';
    }
    setTimeout(() => textarea.focus(), 50);
  }

  function closePanel() {
    panel.classList.remove('is-open');
    chip.classList.remove('is-hidden');
    if (state.streaming && state.abortController) {
      try { state.abortController.abort(); } catch {}
    }
  }

  chip.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);

  const heroTrigger = document.getElementById('ai-agent-hero-trigger');
  if (heroTrigger) heroTrigger.addEventListener('click', openPanel);

  // إظهار الشريحة بعد التمرير عن الـ hero
  const hero = document.querySelector('.hero');
  if (hero && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      const heroVisible = entries[0].isIntersecting;
      if (panel.classList.contains('is-open')) return; // لا تُظهر الشريحة لو اللوحة مفتوحة
      chip.classList.toggle('is-visible', !heroVisible);
    }, { threshold: 0 });
    io.observe(hero);
  } else {
    chip.classList.add('is-visible');
  }

  // ============================================================================
  // إرسال + بث الرد
  // ============================================================================
  function autoGrowTextarea() {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  textarea.addEventListener('input', autoGrowTextarea);
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const v = textarea.value.trim();
      if (v) handleSend(v);
    }
  });

  sendBtn.addEventListener('click', () => {
    const v = textarea.value.trim();
    if (v) handleSend(v);
  });

  function setStreaming(on) {
    state.streaming = on;
    sendBtn.disabled = on;
    sendBtn.classList.toggle('is-loading', on);
    textarea.disabled = on;
  }

  async function handleSend(content) {
    if (state.streaming) return;
    const text = String(content).trim();
    if (!text) return;

    // أزل الردود السريعة لو موجودة
    const qr = messages.querySelector('.ai-agent-quick-replies');
    if (qr) qr.remove();

    appendBubble('user', text);
    state.history.push({ role: 'user', content: text });
    textarea.value = '';
    autoGrowTextarea();

    const botBubble = appendBubble('bot', '');
    botBubble.classList.add('is-typing');

    setStreaming(true);
    state.abortController = new AbortController();

    let assembledText = '';
    let leadProgressShown = false;

    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: state.history.slice(-MAX_HISTORY),
          lang: IS_EN ? 'en' : 'ar',
          context: { page: 'home' },
        }),
        signal: state.abortController.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        botBubble.classList.remove('is-typing');
        if (errBody.error === 'rate_limited') {
          botBubble.textContent = IS_EN
            ? 'You have reached the message limit for this hour. Try again later or contact us on WhatsApp +966502010911.'
            : 'وصلت للحد الأقصى من الرسائل في هذه الساعة. حاول لاحقاً، أو تواصل واتساب +966502010911 مباشرة.';
        } else {
          botBubble.textContent = IS_EN
            ? 'Connection failed. Please try again or contact us on WhatsApp +966502010911.'
            : 'تعذّر الاتصال. حاول مرة أخرى، أو تواصل واتساب +966502010911.';
        }
        setStreaming(false);
        return;
      }

      if (!res.body || !res.body.getReader) {
        botBubble.classList.remove('is-typing');
        botBubble.textContent = IS_EN
          ? 'Your browser does not support streaming. Please update your browser or contact us on WhatsApp +966502010911.'
          : 'متصفحك لا يدعم البث. حدّث المتصفح أو تواصل واتساب +966502010911.';
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;

          let obj;
          try { obj = JSON.parse(payload); } catch { continue; }

          // حدث صناعي من الـ Worker بعد إرسال الـ lead
          if (obj.event === 'lead_sent') {
            showLeadConfirmation(!!obj.ok, obj.detail || '');
            continue;
          }
          if (obj.error) {
            botBubble.classList.remove('is-typing');
            if (!assembledText) botBubble.textContent = IS_EN
              ? 'Could not complete the response. Contact us on WhatsApp +966502010911.'
              : 'تعذّر إكمال الرد. تواصل واتساب +966502010911.';
            continue;
          }

          const choice = obj.choices && obj.choices[0];
          if (!choice) continue;
          const delta = choice.delta;

          if (delta && typeof delta.content === 'string' && delta.content) {
            botBubble.classList.remove('is-typing');
            assembledText += delta.content;
            botBubble.textContent = assembledText;
            scrollToBottom();
          }

          if (delta && delta.tool_calls && !leadProgressShown) {
            leadProgressShown = true;
            const progress = el('div', {
              class: 'ai-agent-lead-progress',
              text: IS_EN ? 'Sending your request to CDIT team...' : 'جاري إرسال طلبك لفريق CDIT...',
            });
            messages.appendChild(progress);
            scrollToBottom();
            // سيُستبدل بشريحة "تم الإرسال" عند وصول event: lead_sent
            setTimeout(() => { try { progress.remove(); } catch {} }, 8000);
          }
        }
      }

      if (assembledText) {
        state.history.push({ role: 'assistant', content: assembledText });
        saveHistory(state.history);
      }
    } catch (err) {
      botBubble.classList.remove('is-typing');
      if (err && err.name === 'AbortError') {
        if (!assembledText) botBubble.remove();
      } else {
        if (!assembledText) botBubble.textContent = IS_EN
          ? 'Connection lost. Please try again.'
          : 'انقطع الاتصال. حاول مرة أخرى.';
      }
    } finally {
      setStreaming(false);
      state.abortController = null;
      botBubble.classList.remove('is-typing');
    }
  }
})();
