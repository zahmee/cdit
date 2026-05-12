// CDIT AI Agent — Cloudflare Worker
//
// يستلم طلبات المحادثة من cdit.co، يحقن الـ system prompt + tool schema،
// يستدعي DeepSeek ببث (SSE)، يُمرّر الردّ للمتصفح. عند اكتشاف اهتمام جدّي
// (tool call: send_lead_to_telegram) يستدعي Telegram API مباشرة لإرسال الـ lead
// لمحادثة المالك (لا يمر عبر cdit-telegram-proxy لتفادي Cloudflare error 1042).
//
// النشر: dashboard.cloudflare.com → Workers → Create Worker → الصق هذا الملف.
// Bindings: KV namespace باسم RATE_LIMIT_KV
// Secrets (الثلاثة من نوع Secret):
//   - DEEPSEEK_API_KEY        مفتاح DeepSeek API
//   - TELEGRAM_BOT_TOKEN      توكن البوت من @BotFather
//   - TELEGRAM_CHAT_ID        معرّف محادثة المالك
// تفاصيل النشر الكاملة في worker/AI_AGENT_README.md

const ALLOWED_ORIGINS = new Set([
  'https://cdit.co',
  'https://www.cdit.co',
  'https://zahmee.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765',
]);

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';
const MAX_INPUT_MESSAGES = 20;
const MAX_INPUT_CHARS = 8000;
const RATE_LIMIT_PER_HOUR = 20;

// ============================================================================
// System prompt — ثابت بايت-بـ-بايت ليُفعّل DeepSeek prompt caching التلقائي.
// لا تُضِف تواريخ، أسماء، أو متغيرات هنا — أيّ تغيير يكسر الـ cache.
// السياق المتغيّر (لو احتجناه لاحقاً) يُحقن في user message، لا هنا.
// ============================================================================
const SYSTEM_PROMPT = `أنت "مساعد إبداع" — المساعد الذكي لشركة CDIT (إبداع التطوير والبرمجة لتقنية المعلومات)،
مؤسسة سعودية ١٠٠٪ مقرها خميس مشيط، بدأت العمل في تطوير الأنظمة منذ ٢٠١٤، وتأسّست قانونياً (فرع تقنية المعلومات) في ٢٠٢٢.

## شخصيتك
- **ترد دائماً باللهجة السعودية الراقية** (نجدية مهذّبة)، بأسلوب مضياف ودافئ.
- استخدم بسخاء معتدل عبارات الترحيب والتأدّب السعودية مثل: "حيّاك الله"، "أبشر"، "أبشر طال عمرك"، "حيّاك"، "على راسي"، "من عيوني"، "تأمر أمر"، "تأمرني أمر"، "أمرك"، "هلا والله"، "حيّ هلا"، "نِعم العميل"، "كلّه على الراس"، "الشرف لنا".
- وزّع هذه العبارات بذكاء — لا تحشرها في كل سطر، فقط حيث تليق (عند الترحيب، الإجابة على طلب، تأكيد المساعدة).
- **مهذّب، مباشر، بدون مبالغة.** الترحيب السعودي لا يعني ثرثرة. جمل قصيرة وواضحة.
- لا تستخدم Markdown ثقيلاً (لا ## ولا ** ولا جداول). العربية البسيطة كافية.
- لا تكرّر التحية الكبيرة في كل رسالة — رحّب مرة في البداية وتابع المحادثة طبيعياً مع لمسة سعودية خفيفة.
- **لا تذكر اسم المالك أبداً.** استخدم "فريقنا" دائماً.

### أمثلة على الأسلوب الصحيح
- *الترحيب الأول:* "حيّاك الله، أبشر بخدمتك. أنا مساعد إبداع، تأمر أمر."
- *عند سؤال عن خدمة:* "أبشر طال عمرك، عندنا حلول سحابية كاملة..."
- *عند تأكيد طلب:* "على راسي، سأمرّر طلبك لفريقنا الآن."
- *عند تقديم اقتراح:* "من عيوني، أنصحك بالصدارة الكامل لو منشأتك متوسطة..."

### تجنّب
- العبارات الفصحى الجامدة ("تفضّل بالاستفسار"، "يسعدنا مساعدتك") — استبدلها باللهجة.
- المبالغة في الترحيب (لا تقول كل العبارات في رسالة واحدة).
- اللهجات الأخرى (مصرية، شامية، مغربية) — حافظ على السعودية.

## ما يميّز CDIT
- **فريق سعودي ١٠٠٪** نخدم الجهات داخل المملكة وخارجها.
- **نتفهّم متطلبات العميل بعمق** ونشرح له المتطلبات والاحتمالات بوضوح، بحيث تكون عنده الصورة الكاملة من بداية المشروع حتى نهايته.
- **مرونة استضافة كاملة:** DigitalOcean، أو سيرفرات العميل الخاصة (سواء على الإنترنت أو On-Premises داخل المنشأة)، أو أي مزوّد عالمي يفضّله العميل.
- **نتعامل مع جميع قواعد البيانات:** PostgreSQL، SQL Server، SQLite، أو أي نوع يفضّله العميل.
- **التقنيات الأساسية:** Node.js و Python.

## الاعتمادات الرسمية (للمصداقية)
- السجل التجاري (فرع IT): 5855353571
- الرقم الضريبي (VAT): 310232266400003
- الرقم الموحد للمنشأة: 7022056670

## الخدمات الستّ التفصيلية

١) **الحلول السحابية والإنترنت** — استضافة مواقع، نشر تطبيقات، حلول البريد الإلكتروني، الحماية والأمن السيبراني. نعمل على DigitalOcean وعلى سيرفرات العميل الخاصة وأي مزوّد عالمي.

٢) **خدمات تقنية المعلومات** — نسخ احتياطي للبيانات، صيانة الشبكات، التشخيص الوقائي، إدارة المشاريع.

٣) **تكامل الأنظمة** — ربط الأنظمة المختلفة (ERP، CRM، إلخ)، هجرة البيانات من بيئات قديمة لحديثة، API integration، تحويل البيانات. **نطوّر الأنظمة القائمة عند العميل ونرفعها إلى تقنيات حديثة.**

٤) **شبكات الاتصال اللاسلكية** — ربط الفروع لاسلكياً بسرعات عالية وتشفير قوي، مع مراقبة مستمرة.

٥) **الحلول المخصصة** — تطبيقات ويب وجوال مخصّصة. نطوّر بـ Node.js و Python بشكل أساسي، ونتعامل مع جميع قواعد البيانات الشائعة (PostgreSQL، SQL Server، SQLite، إلخ).

٦) **الذكاء الاصطناعي** — نماذج لغوية متقدمة، أتمتة العمليات، تحليل تنبؤي، معالجة اللغة الطبيعية. **نعمل حالياً على بناء وكلاء AI متصلين بأنظمة بيانات المنشآت، ووكلاء AI للرد على العملاء عبر واتساب وقنوات التواصل الاجتماعي بأي وسيلة يفضّلها العميل.**

## أمثلة من مشاريعنا (عامة، بدون أسماء عملاء)
- أتمتة المراسلات الإلكترونية لجهات حكومية.
- مشاريع مع قطاعات خيرية.
- نظام صيانة موحّد على مستوى المملكة لقطاع خاص.
- نظام مبيعات ومشتريات بأسلوب ذكي يستخدم الذكاء الاصطناعي في تحسين الطلبات وإدارة المخزون.

## القطاعات التي خدمناها
- **الجهات الحكومية**.
- **القطاع الخاص**.
- **القطاع الخيري**.

## منتجات عائلة "الصدارة" (جاهزة، مربوطة مع هيئة الزكاة والضريبة ZATCA Phase 2)
- **الصدارة الكامل** — نظام ERP شامل: مبيعات، مشتريات، عملاء، موردين، مستندات، تقارير، فوترة إلكترونية ZATCA. مناسب للمنشآت متوسطة وكبيرة الحجم. متعدّد المستخدمين.
- **الصدارة المخفّف — الإصدار 2** — فوترة إلكترونية ZATCA + حضور وانصراف، مناسب للمنشآت الصغيرة والمتوسطة. الإصدار 5.53.
- **الصدارة المخفّف — 5** — نقطة بيع (POS) + إدارة مخزون مع تتبّع تواريخ الصلاحيات، مناسب للصيدليات والمحلات والمتاجر الصغيرة.

## بيانات التواصل
- واتساب: +966502010911
- بريد: info@cdit.co
- العنوان: خميس مشيط، عسير، المملكة العربية السعودية، الرمز البريدي 62612
- ساعات العمل: الأحد - الخميس، ٨ ص - ٦ م (الجمعة والسبت إجازة)

## القواعد الصارمة (لا تتجاوزها)

١. **لا تخترع أسعاراً أبداً.** إذا سأل العميل عن السعر، الباقات، التكلفة، الميزانية، قل بالضبط:
   "الأسعار تختلف حسب احتياج كل منشأة. اترك جوالك أو تواصل واتساب +966502010911 وسيتواصل معك أحد فريقنا خلال ساعات العمل."
   ثم استدعِ أداة send_lead_to_telegram.

٢. **لا تعد بمواعيد تسليم محددة** ("نسلّم خلال أسبوعين"، "جاهز اليوم"). قل: "موعد التسليم يحدّده الفريق بعد فهم متطلباتك، وسيُوضَّح لك عند التواصل."

٣. **لا تقارن بمنافسين بالاسم.** إذا ذُكر منافس، رد: "نركّز على تقديم أفضل خدمة لعملائنا، وسيسعدنا أن نشرح لك ما يميّزنا عند التواصل."

٤. **لا تخترع خدمات/منتجات** غير المذكورة أعلاه. إذا سُئلت عن شيء غير موجود، قل بصراحة: "هذا ليس ضمن عروضنا الحالية، لكن يمكنك مناقشة احتياجك مع فريقنا عبر واتساب."

٥. **لا تذكر أسماء عملاء محددين** أو تفاصيل دقيقة عن مشاريع سابقة. اقتصر على الأمثلة العامة المذكورة أعلاه.

٦. **لا تذكر اسم المالك أبداً.** الفريق يتكلم باسم الشركة، استخدم "فريقنا" أو "فريق إبداع".

٧. **آلية جمع البيانات قبل إرسال الـ lead (مهمّة جداً):**

   عند ظهور إحدى هذه الإشارات:
   - طلب عرض سعر أو تقدير تكلفة.
   - طلب صريح للتواصل ("اتصلوا بي"، "تواصل معي"، "ابغى أتواصل").
   - وصف مشروع محدد يريد تنفيذه.

   **لا تستدعِ الأداة فوراً.** بدلاً من ذلك، اجمع البيانات الثلاثة الأساسية بالترتيب:
   - **(أ) الاسم الكامل** للعميل.
   - **(ب) رقم الجوال** (يفضّل بصيغة 05xxxxxxxx أو +9665xxxxxxxx).
   - **(ج) تفاصيل الطلب** — أيّ خدمة/منتج، وأهم احتياجاته (ولو بكلمات بسيطة).

   **اسأل بأسلوب سعودي مضياف، مرّة واحدة فقط ولا تطيل** — مثلاً:
   "أبشر طال عمرك، حتى يتواصل معك فريقنا بسرعة، تكرّم بإعطائنا: اسمك الكريم، رقم جوالك، وباختصار وش الخدمة اللي تحتاجها؟"

   إذا أعطى العميل **بعض** البيانات وناقصته أخرى، اطلب الناقص فقط بلطف: "تمام، بقيت رقم الجوال لو تكرمت."

   **استدعِ الأداة send_lead_to_telegram فقط عندما تكتمل البيانات الثلاثة** (الاسم + الجوال + تفاصيل الطلب).

   إذا رفض العميل إعطاء بياناته أو ألحّ على الإرسال بدونها، استدعها بما عندك مع تنبيه في حقل summary بأن العميل رفض إعطاء التفاصيل، ووجّهه للواتساب مباشرة.

   إذا ترك العميل جواله من البداية بدون أن تطلبه (مثلاً قال "اسمي محمد، جوالي 05x...، أبغى الصدارة")، استدعِ الأداة فوراً بكل البيانات.

٨. **عند استدعاء الأداة بعد اكتمال البيانات:** اكتب رسالة مرافقة سعودية قصيرة ("على راسي، تم تمرير طلبك لفريقنا، وحيّاك تتواصل واتساب +966502010911 لو احتجت رد أسرع") قبل/أثناء استدعاء الأداة.

٩. **الأسئلة خارج نطاق CDIT** (طقس، رياضة، طبخ، أخبار): اعتذر بلطف وأعِد توجيه المحادثة: "تخصّصي مساعدتك في خدمات ومنتجات CDIT. هل تحتاج معلومة عن أي من خدماتنا؟"

١٠. **لا تطلب بيانات حساسة** (بطاقات، كلمات سر، أرقام هوية). الجوال والاسم فقط.`;

// ============================================================================
// English injection — حقن لغوي عند lang='en'. يأتي بعد SYSTEM_PROMPT في المحادثة
// فلا يكسر الـ cache prefix الثابت للـ system prompt الرئيسي.
// ============================================================================
const ENGLISH_SYSTEM_INJECTION = `IMPORTANT: This visitor is using the English version of the CDIT website. You MUST respond entirely in English — do NOT use any Arabic words or phrases.

Rules for English mode:
- Respond in professional, warm, friendly English throughout the conversation.
- Replace Saudi dialect phrases with polite English equivalents: "Of course!", "Absolutely!", "Happy to help!", "Certainly!", "With pleasure!", "Great question!"
- Keep ALL the same rules: never invent prices, never promise delivery dates, never name competitors, never invent services.
- When collecting lead info, ask in English: "To connect you with our team quickly, could you share your full name, phone number, and a brief description of what you need?"
- Collect name + phone + request details before firing the send_lead_to_telegram tool — same rules apply.
- The lead Telegram message content stays as-is (it's internal), but mark the source as the English website.`;

// ============================================================================
// Tool schema — يبقى ثابت أيضاً ليستفيد من الـ cache (يُحسب ضمن المدخلات).
// ============================================================================
const TOOLS = [{
  type: 'function',
  function: {
    name: 'send_lead_to_telegram',
    description: 'استدعِ هذه الأداة عندما يُظهر الزائر اهتماماً جدّياً: يطلب عرض سعر، يترك رقم جواله، يطلب التواصل صراحةً، أو يصف مشروعاً محدداً. لا تستدعها للأسئلة العامة أو التصفح العادي.',
    parameters: {
      type: 'object',
      properties: {
        name:    { type: 'string', description: 'اسم العميل إن ذكره' },
        phone:   { type: 'string', description: 'رقم جواله إن تركه (يفضّل بصيغة +966...)' },
        service: { type: 'string', description: 'الخدمة أو المنتج محل الاهتمام' },
        summary: { type: 'string', description: 'ملخص قصير ٢-٣ جمل لما يحتاجه العميل' },
      },
      required: ['summary'],
    },
  },
}];

// ============================================================================
// CORS / helpers (مطابق نمط telegram-proxy.js)
// ============================================================================
function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : 'https://cdit.co';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResponse(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function validatePayload(body) {
  if (!body || typeof body !== 'object') return 'invalid_body';
  const { messages, lang } = body;
  if (lang !== undefined && lang !== 'ar' && lang !== 'en') return 'invalid_lang';
  if (!Array.isArray(messages) || messages.length === 0) return 'no_messages';
  if (messages.length > MAX_INPUT_MESSAGES) return 'too_many_messages';
  let totalChars = 0;
  for (const m of messages) {
    if (!m || typeof m !== 'object') return 'bad_message_shape';
    if (m.role !== 'user' && m.role !== 'assistant') return 'bad_role';
    if (typeof m.content !== 'string') return 'bad_content';
    totalChars += m.content.length;
  }
  if (totalChars > MAX_INPUT_CHARS) return 'too_long';
  return null;
}

async function checkRateLimit(env, ctx, ip) {
  if (!env.RATE_LIMIT_KV) return { allowed: true };
  const bucket = Math.floor(Date.now() / 3600_000);
  const key = `rl:${ip}:${bucket}`;
  let current = 0;
  try {
    current = parseInt(await env.RATE_LIMIT_KV.get(key) || '0', 10);
  } catch { /* fail-open على أخطاء KV */ }
  if (current >= RATE_LIMIT_PER_HOUR) {
    const retryAfter = Math.floor(3600 - ((Date.now() / 1000) % 3600));
    return { allowed: false, retryAfter };
  }
  ctx.waitUntil(
    env.RATE_LIMIT_KV.put(key, String(current + 1), { expirationTtl: 3720 }).catch(() => {})
  );
  return { allowed: true };
}

// ============================================================================
// Lead → Telegram (مكالمة مباشرة لـ Telegram API)
// نتجاوز telegram-proxy لتفادي Cloudflare error 1042 على workers.dev
// ============================================================================
async function sendLeadToTelegram(args, env, lang) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return { ok: false, detail: 'missing_telegram_secrets' };
  }

  const now = new Date();
  const timeStr = now.toLocaleString('ar-SA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  const text = `🤖 *عميل محتمل من المساعد الذكي*

━━━━━━━━━━━━━━━━━━
👤 *الاسم:* ${args.name || '—'}
📱 *الجوال:* ${args.phone || '—'}
🔧 *الخدمة:* ${args.service || '—'}

💬 *الملخص:*
${args.summary || '—'}
━━━━━━━━━━━━━━━━━━

🌐 *المصدر:* مساعد إبداع — ${lang === 'en' ? 'النسخة الإنجليزية' : 'الصفحة الرئيسية'}
🕐 *الوقت:* ${timeStr}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.log('telegram_api_error', res.status, body.slice(0, 200));
      return { ok: false, detail: `tg_${res.status}:${body.slice(0, 80)}` };
    }
    return { ok: true };
  } catch (err) {
    console.log('telegram_fetch_threw', String(err));
    return { ok: false, detail: 'fetch_threw:' + String(err).slice(0, 80) };
  }
}

// ============================================================================
// Stream relay: يُمرّر deltas للمتصفح، يجمع tool_calls ثم يرسل lead عند finish_reason='tool_calls'
// ============================================================================
async function relayUpstream(upstream, writable, env, ctx, lang) {
  const reader = upstream.body.getReader();
  const writer = writable.getWriter();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  const toolCallsByIndex = new Map();
  let leadHandled = false;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);

        // مرّر السطر للمتصفح كما هو (مع \n)
        await writer.write(encoder.encode(line + '\n'));

        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;

        let obj;
        try { obj = JSON.parse(payload); } catch { continue; }

        const choice = obj.choices && obj.choices[0];
        if (!choice) continue;
        const delta = choice.delta;
        const finish = choice.finish_reason;

        if (delta && delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const i = (typeof tc.index === 'number') ? tc.index : 0;
            const existing = toolCallsByIndex.get(i) || { name: '', args: '' };
            if (tc.function && tc.function.name) existing.name = tc.function.name;
            if (tc.function && tc.function.arguments) existing.args += tc.function.arguments;
            toolCallsByIndex.set(i, existing);
          }
        }

        if (finish === 'tool_calls' && !leadHandled) {
          leadHandled = true;
          let leadResult = { ok: false, detail: 'no_matching_tool' };
          let foundTool = false;
          for (const tc of toolCallsByIndex.values()) {
            if (tc.name !== 'send_lead_to_telegram') continue;
            foundTool = true;
            try {
              const args = JSON.parse(tc.args || '{}');
              console.log('lead_tool_args', JSON.stringify(args).slice(0, 200));
              leadResult = await sendLeadToTelegram(args, env, lang);
            } catch (err) {
              console.log('lead_args_parse_error', String(err), tc.args.slice(0, 100));
              leadResult = { ok: false, detail: 'parse_error:' + String(err).slice(0, 80) };
            }
          }
          if (!foundTool) {
            console.log('lead_no_tool_found', Array.from(toolCallsByIndex.values()).map(t => t.name).join(','));
          }
          const synthetic = `data: ${JSON.stringify({ event: 'lead_sent', ok: leadResult.ok, detail: leadResult.detail || '' })}\n\n`;
          await writer.write(encoder.encode(synthetic));
        }
      }
    }

    // مسح ما تبقى في الـ buffer (نادر — DeepSeek يُنهي بسطر فارغ)
    if (buffer.length > 0) {
      await writer.write(encoder.encode(buffer));
    }
  } catch (err) {
    try {
      const errPayload = `data: ${JSON.stringify({ error: 'stream_failed', detail: String(err).slice(0, 200) })}\n\n`;
      await writer.write(encoder.encode(errPayload));
    } catch { /* الـ writer قد أُغلق */ }
  } finally {
    try { await writer.close(); } catch {}
    try { reader.releaseLock(); } catch {}
  }
}

// ============================================================================
// المعالج الرئيسي
// ============================================================================
export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405, cors);
    }

    if (!ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse({ error: 'forbidden_origin' }, 403, cors);
    }

    if (!env.DEEPSEEK_API_KEY) {
      return jsonResponse({ error: 'worker_not_configured', detail: 'DEEPSEEK_API_KEY missing' }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'invalid_json' }, 400, cors);
    }

    const validationError = validatePayload(body);
    if (validationError) {
      return jsonResponse({ error: validationError }, 400, cors);
    }

    // Rate limit
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rl = await checkRateLimit(env, ctx, ip);
    if (!rl.allowed) {
      return jsonResponse({ error: 'rate_limited', retry_after_seconds: rl.retryAfter }, 429, cors);
    }

    const lang = body.lang === 'en' ? 'en' : 'ar';

    // ابنِ قائمة system messages — SYSTEM_PROMPT أولاً ليثبت كـ cache prefix.
    // عند lang='en' نُضيف تعليم لغوي بعده دون كسر الـ cache.
    const systemMessages = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (lang === 'en') {
      systemMessages.push({ role: 'system', content: ENGLISH_SYSTEM_INJECTION });
    }

    const upstreamBody = {
      model: MODEL,
      stream: true,
      messages: [
        ...systemMessages,
        ...body.messages,
      ],
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: 0.4,
    };

    let upstream;
    try {
      upstream = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(upstreamBody),
      });
    } catch (err) {
      return jsonResponse({ error: 'upstream_unreachable', detail: String(err).slice(0, 200) }, 502, cors);
    }

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      return jsonResponse(
        { error: 'upstream_failed', status: upstream.status, detail: detail.slice(0, 300) },
        502,
        cors
      );
    }

    // مرّر الـ stream للمتصفح عبر TransformStream، مع التقاط tool_calls على جانبنا
    const { readable, writable } = new TransformStream();
    ctx.waitUntil(relayUpstream(upstream, writable, env, ctx, lang));

    return new Response(readable, {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  },
};
