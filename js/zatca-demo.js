// ZATCA live demo + compliance quiz (homepage)
//
// الديمو يولّد رمز QR حقيقي بصيغة TLV المعتمدة في المرحلة الأولى من الفاتورة
// الإلكترونية (Tags 1-5: اسم البائع، الرقم الضريبي، التاريخ، الإجمالي، الضريبة).
// كل شيء يعمل داخل المتصفح — لا تُرسل أي بيانات لأي جهة.
// توليد الـ QR عبر js/vendor-qrcode.js (qrcode-generator, MIT).

(function () {
  'use strict';

  // اللغة من وسم <html lang> — الصفحات الإنجليزية تضع lang="en"
  const IS_EN = (document.documentElement.lang || 'ar').toLowerCase().indexOf('en') === 0;

  // ==========================================================================
  // ZATCA invoice demo
  // ==========================================================================
  const nameInput = document.getElementById('zd-name');
  const vatInput = document.getElementById('zd-vat');
  const amountInput = document.getElementById('zd-amount');
  const qrBox = document.getElementById('zd-qr-box');

  if (nameInput && vatInput && amountInput && qrBox) {
    const invName = document.getElementById('zd-inv-name');
    const invVat = document.getElementById('zd-inv-vat');
    const invDate = document.getElementById('zd-inv-date');
    const invSub = document.getElementById('zd-inv-sub');
    const invTax = document.getElementById('zd-inv-tax');
    const invTotal = document.getElementById('zd-inv-total');

    const encoder = new TextEncoder();

    // TLV: لكل حقل بايت للوسم + بايت للطول + البايتات نفسها (UTF-8)
    function tlv(tag, str) {
      const bytes = encoder.encode(str);
      if (bytes.length > 255) throw new Error('TLV value too long');
      const out = new Uint8Array(2 + bytes.length);
      out[0] = tag;
      out[1] = bytes.length;
      out.set(bytes, 2);
      return out;
    }

    function buildTlvBase64(sellerName, vatNumber, isoDate, total, vatAmount) {
      const parts = [
        tlv(1, sellerName),
        tlv(2, vatNumber),
        tlv(3, isoDate),
        tlv(4, total),
        tlv(5, vatAmount),
      ];
      const len = parts.reduce((n, p) => n + p.length, 0);
      const all = new Uint8Array(len);
      let off = 0;
      for (const p of parts) { all.set(p, off); off += p.length; }
      let bin = '';
      for (let i = 0; i < all.length; i++) bin += String.fromCharCode(all[i]);
      return btoa(bin);
    }

    function render() {
      const name = (nameInput.value || '').trim() || (IS_EN ? 'Najah Trading Est.' : 'مؤسسة النجاح التجارية');
      const vat = (vatInput.value || '').replace(/\D/g, '').slice(0, 15) || '310232266400003';
      const sub = Math.max(0, parseFloat(amountInput.value) || 0);
      const tax = Math.round(sub * 15) / 100;
      const total = Math.round((sub + tax) * 100) / 100;
      const now = new Date();
      const iso = now.toISOString().slice(0, 19) + 'Z';

      invName.textContent = name;
      invVat.textContent = vat;
      invDate.textContent = now.toISOString().slice(0, 10);
      invSub.textContent = sub.toFixed(2);
      invTax.textContent = tax.toFixed(2);
      invTotal.textContent = total.toFixed(2);

      if (typeof window.qrcode !== 'function') return; // المكتبة لم تُحمّل بعد
      try {
        const b64 = buildTlvBase64(name, vat, iso, total.toFixed(2), tax.toFixed(2));
        const qr = window.qrcode(0, 'M'); // typeNumber 0 = اختيار تلقائي للحجم
        qr.addData(b64, 'Byte');
        qr.make();
        qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      } catch (e) {
        qrBox.textContent = '';
      }
    }

    let t = null;
    function scheduleRender() {
      clearTimeout(t);
      t = setTimeout(render, 150);
    }
    nameInput.addEventListener('input', scheduleRender);
    vatInput.addEventListener('input', scheduleRender);
    amountInput.addEventListener('input', scheduleRender);

    // أول رسم: انتظر تحميل المكتبة (كلا السكربتين defer لكن الترتيب مضمون،
    // نتحقق احتياطاً لو نُقل السكربت لاحقاً)
    if (typeof window.qrcode === 'function') {
      render();
    } else {
      window.addEventListener('load', render);
    }
  }

  // ==========================================================================
  // Compliance quiz — ٣ أسئلة، نتيجة صادقة بدون تهويل
  // ==========================================================================
  const quizBody = document.getElementById('quiz-body');
  if (!quizBody) return;

  const progressBars = document.querySelectorAll('#zatca-quiz .quiz-progress i');
  const WA_URL = 'https://wa.me/966502010911?text=' + encodeURIComponent(IS_EN
    ? 'Hello, I used the e-invoicing compliance checker on your website and have a question'
    : 'مرحباً، استخدمت أداة فحص الفاتورة الإلكترونية في موقعكم وأود الاستفسار');

  const QUESTIONS = IS_EN ? [
    {
      q: 'Is your business registered for VAT?',
      opts: ['Yes, registered', 'No, not registered', 'Not sure'],
    },
    {
      q: 'How do you currently issue your invoices?',
      opts: ['Manually / on paper', 'Excel or Word', 'An electronic invoicing system'],
    },
    {
      q: 'Roughly, what is your annual revenue?',
      opts: ['Under SAR 375,000', 'SAR 375,000 to 3 million', 'Over SAR 3 million'],
    },
  ] : [
    {
      q: 'هل منشأتك مسجّلة في ضريبة القيمة المضافة؟',
      opts: ['نعم، مسجّلة', 'لا، غير مسجّلة', 'لست متأكداً'],
    },
    {
      q: 'كيف تصدر فواتيرك حالياً؟',
      opts: ['يدوياً أو على الورق', 'إكسل أو وورد', 'نظام فوترة إلكتروني'],
    },
    {
      q: 'إيرادات منشأتك السنوية تقريباً؟',
      opts: ['أقل من ٣٧٥ ألف ريال', 'من ٣٧٥ ألف إلى ٣ ملايين', 'أكثر من ٣ ملايين'],
    },
  ];

  const answers = [];

  function setProgress(step) {
    progressBars.forEach((bar, i) => bar.classList.toggle('done', i < step));
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function renderQuestion(idx) {
    setProgress(idx);
    quizBody.textContent = '';
    const item = QUESTIONS[idx];
    quizBody.appendChild(el('div', 'quiz-q', item.q));
    const opts = el('div', 'quiz-opts');
    item.opts.forEach((label, optIdx) => {
      const btn = el('button', 'quiz-opt', label);
      btn.type = 'button';
      btn.addEventListener('click', () => {
        answers[idx] = optIdx;
        if (idx + 1 < QUESTIONS.length) renderQuestion(idx + 1);
        else renderResult();
      });
      opts.appendChild(btn);
    });
    quizBody.appendChild(opts);
  }

  function computeResult() {
    const [vat, billing, revenue] = answers;
    // غير مسجّل بالضريبة
    if (vat === 1) {
      if (revenue === 0) {
        return IS_EN ? {
          icon: 'ok', emoji: '✅',
          title: 'Not obligated yet — but get ready today',
          body: 'As long as your revenue is below the mandatory VAT registration threshold (SAR 375,000), e-invoicing is not required of you yet. Once you cross the threshold you must register for VAT and then comply with e-invoicing — starting with a compliant system now saves you a rushed transition later.',
        } : {
          icon: 'ok', emoji: '✅',
          title: 'غير ملزم حالياً — لكن جهّز نفسك من اليوم',
          body: 'ما دامت إيراداتك تحت حد التسجيل الإلزامي (٣٧٥ ألف ريال) فأنت غير ملزم بالفاتورة الإلكترونية بعد. متى تجاوزت الحد يجب التسجيل في الضريبة ثم الالتزام بالفوترة الإلكترونية — والبدء بنظام جاهز من الآن يوفّر عليك الانتقال المتعجّل لاحقاً.',
        };
      }
      return IS_EN ? {
        icon: 'warn', emoji: '⚠️',
        title: 'It looks like you need to register for VAT first',
        body: 'Your revenue exceeds the mandatory VAT registration threshold (SAR 375,000), and registration then requires e-invoicing compliance. We recommend sorting out your status as soon as possible — our system prepares you for both steps at once.',
      } : {
        icon: 'warn', emoji: '⚠️',
        title: 'يبدو أنك ملزم بالتسجيل في الضريبة أولاً',
        body: 'إيراداتك تتجاوز حد التسجيل الإلزامي في ضريبة القيمة المضافة (٣٧٥ ألف ريال)، والتسجيل يستلزم بعده الالتزام بالفاتورة الإلكترونية. ننصحك بترتيب وضعك بأسرع وقت — ونظامنا يجهّزك للخطوتين معاً.',
      };
    }
    // مسجّل أو غير متأكد + فوترة يدوية/إكسل
    if (billing === 0 || billing === 1) {
      return IS_EN ? {
        icon: 'warn', emoji: '⚠️',
        title: 'Your business is obligated — manual invoicing is a violation',
        body: 'Every VAT-registered business has been required to issue invoices through a compliant electronic system since Phase 1, and paper invoices or Excel files expose you to fines. ZATCA is rolling Phase 2 (integration) out in successive waves with ever-lower revenue thresholds — the earlier you start, the easier and cheaper the transition.',
      } : {
        icon: 'warn', emoji: '⚠️',
        title: 'منشأتك ملزمة — والفوترة اليدوية مخالفة',
        body: 'كل منشأة مسجّلة في ضريبة القيمة المضافة ملزمة بإصدار فواتير إلكترونية عبر نظام متوافق منذ المرحلة الأولى، والفواتير الورقية أو ملفات الإكسل تعرّضك للغرامات. هيئة الزكاة تُلزم المنشآت بالمرحلة الثانية (الربط) على موجات متتالية بحدود إيرادات تنخفض باستمرار — كلما بدأت أبكر كان الانتقال أسهل وأرخص.',
      };
    }
    // مسجّل + عنده نظام
    return IS_EN ? {
      icon: 'ok', emoji: '🔍',
      title: 'Great — now confirm your system is Phase 2 compliant',
      body: 'Having an e-invoicing system covers Phase 1, but Phase 2 requires direct integration with the Fatoora platform according to the enforcement waves ZATCA announces. Make sure your provider supports integration — and if not, our system is certified Phase 2 compliant and you can try it for free.',
    } : {
      icon: 'ok', emoji: '🔍',
      title: 'خطوة ممتازة — تبقّى التأكد من توافق نظامك مع المرحلة الثانية',
      body: 'وجود نظام فوترة إلكتروني يغطي المرحلة الأولى، لكن المرحلة الثانية تتطلب الربط والتكامل المباشر مع منصة فاتورة وفق موجات الإلزام التي تعلنها الهيئة. تأكد أن مزوّدك يدعم الربط — وإن لم يكن، نظامنا معتمد ومتوافق مع المرحلة الثانية ويمكنك تجربته مجاناً.',
    };
  }

  function renderResult() {
    setProgress(QUESTIONS.length);
    quizBody.textContent = '';
    const r = computeResult();

    const wrap = el('div', 'quiz-result');
    const icon = el('div', 'quiz-result-icon ' + r.icon, r.emoji);
    icon.setAttribute('aria-hidden', 'true');
    wrap.appendChild(icon);
    wrap.appendChild(el('h3', '', r.title));
    wrap.appendChild(el('p', '', r.body));

    const actions = el('div', 'quiz-result-actions');
    const trial = el('a', 'price-cta', IS_EN ? 'Start Your Free Trial' : 'ابدأ تجربتك المجانية');
    trial.href = 'tajribah.html';
    trial.style.cssText = 'background:var(--primary);color:#fff;padding:0.85rem 1.75rem';
    const wa = el('a', 'price-cta', IS_EN ? 'Ask Our Team on WhatsApp' : 'اسأل فريقنا واتساب');
    wa.href = WA_URL;
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.style.cssText = 'border:2px solid var(--primary);color:var(--primary);padding:0.85rem 1.75rem';
    actions.appendChild(trial);
    actions.appendChild(wa);
    wrap.appendChild(actions);

    const note = el('p', '', IS_EN
      ? 'This tool is indicative only and is no substitute for the official ZATCA sources for precise regulatory details.'
      : 'هذه الأداة إرشادية ولا تغني عن الرجوع لهيئة الزكاة والضريبة والجمارك للتفاصيل النظامية الدقيقة.');
    note.style.cssText = 'font-size:0.72rem;color:var(--gray-400);margin-top:1.25rem;margin-bottom:0';
    wrap.appendChild(note);

    const restart = el('button', 'quiz-restart', IS_EN ? 'Start the check over' : 'إعادة الفحص من البداية');
    restart.type = 'button';
    restart.addEventListener('click', () => { answers.length = 0; renderQuestion(0); });
    wrap.appendChild(restart);

    quizBody.appendChild(wrap);
  }

  renderQuestion(0);
})();
