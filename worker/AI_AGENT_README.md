# CDIT AI Agent — دليل النشر

وكيل Cloudflare Worker مجاني يستضيف منطق المساعد الذكي على موقع CDIT. الموقع يستدعي الـ Worker، والـ Worker يستدعي DeepSeek (مع إخفاء المفتاح)، ويُمرّر الردّ بثاً مباشراً للزائر. عند اكتشاف اهتمام جدّي يُرسل العميل المحتمل تلقائياً لـ telegram-proxy.

**الكلفة:** Cloudflare Workers مجاني (١٠٠٬٠٠٠ طلب/يوم). الكلفة الفعلية من DeepSeek فقط — سنتات شهرياً للموقع التسويقي.

---

## ١. أنشئ مفتاح DeepSeek مخصّص لـ CDIT

1. افتح <https://platform.deepseek.com/api_keys>.
2. اضغط `Create new key`.
3. سمّه `CDIT-prod-2026` (أو ما يناسبك).
4. انسخ المفتاح فوراً (يُعرض مرة واحدة).
5. **(موصى به)** اضبط حداً شهرياً للإنفاق من Settings → Billing لمنع المفاجآت.

> سبب المفتاح المخصّص (وليس إعادة استخدام مفتاح مشروع آخر): لو أُسيء الاستخدام، تبطل هذا فقط بدون كسر مشاريع أخرى. وفصل الفواتير يجعل المراقبة أسهل.

## ٢. أنشئ KV Namespace (للـ Rate Limit)

1. من Cloudflare Dashboard → `Workers & Pages` → `KV`.
2. اضغط `Create a namespace`.
3. الاسم: `cdit-ai-rate-limit`.
4. اضغط `Add`.

## ٣. أنشئ Worker جديد

1. من الـ Dashboard → `Workers & Pages` → `Create` → `Create Worker`.
2. الاسم: `cdit-ai-agent` (سيكون جزءاً من الرابط).
3. اضغط `Deploy` (يُنشأ Worker افتراضي).

## ٤. ضع كود الـ Worker

1. اضغط `Edit code`.
2. احذف الكود الافتراضي.
3. الصق محتوى ملف `worker/ai-agent.js` بالكامل.
4. اضغط `Deploy`.

## ٥. اربط الـ KV Namespace بالـ Worker

1. من صفحة الـ Worker → `Settings` → `Bindings` → `Add`.
2. اختر `KV Namespace`.
3. **Variable name:** `RATE_LIMIT_KV` ← مهم: نفس الاسم بالضبط.
4. **KV namespace:** اختر `cdit-ai-rate-limit` (الذي أنشأته في خطوة ٢).
5. `Save and Deploy`.

## ٦. أضف الـ Secrets والمتغيرات

من صفحة الـ Worker → `Settings` → `Variables and Secrets` → `Add`:

| Variable name | Type | Value |
|---|---|---|
| `DEEPSEEK_API_KEY` | **Secret** | المفتاح من خطوة ١ |
| `TELEGRAM_PROXY_URL` | Plain text | `https://cdit-telegram-proxy.<اسم حسابك>.workers.dev` |

> `DEEPSEEK_API_KEY` يجب أن يكون `Secret` (وليس Plain text) — يُشفَّر ولا يظهر في logs.
>
> `TELEGRAM_PROXY_URL` يكون Plain text (الرابط ليس سرّاً)، استخدم نفس رابط الـ Worker الموجود في `js/main.js` لـ `CDIT_TG_PROXY_URL`.

اضغط `Deploy` بعد الإضافة.

## ٧. انسخ رابط الـ Worker

من صفحة الـ Worker → الأعلى → ستجد رابطاً بالشكل:
```
https://cdit-ai-agent.<اسم حسابك>.workers.dev
```

## ٨. ضع الرابط في الموقع

في الملف [`js/main.js`](../js/main.js)، ابحث عن السطر `CDIT_AI_AGENT_URL` واستبدل القيمة:

```js
window.CDIT_AI_AGENT_URL = 'https://cdit-ai-agent.<حسابك>.workers.dev';
```

## ٩. حدّث `telegram-proxy.js` لقبول النوع الجديد

في الـ Worker القديم (`cdit-telegram-proxy`):

1. افتحه من Cloudflare Dashboard.
2. اضغط `Edit code`.
3. ابحث عن السطر:
   ```js
   if (type !== 'visit' && type !== 'contact') {
   ```
4. عدّله إلى:
   ```js
   if (type !== 'visit' && type !== 'contact' && type !== 'ai_lead') {
   ```
5. اضغط `Deploy`.

(تم تعديل هذا في الـ repo بالفعل في `worker/telegram-proxy.js` — فقط ادفع التغيير لـ GitHub، لكن **يجب** أيضاً نسخ المحتوى الجديد للـ Worker المنشور في Cloudflare يدوياً.)

## ١٠. اختبر

1. ادفع التغييرات: `git push`.
2. افتح <https://cdit.co/> (أو محلياً: `python -m http.server 8765` ثم `http://localhost:8765/`).
3. ستجد بطاقة "جرّب مساعد إبداع الذكي" تحت بطاقة الـ hero.
4. اضغطها → تفتح نافذة المحادثة → اكتب "ما هي خدماتكم؟" → الردّ يُكتب حرفاً بحرف.
5. جرّب: "أبغى عرض سعر للصدارة الكامل، رقمي 0512345678" → يجب أن تصل رسالة لتلقرامك بنوع `ai_lead`.

---

## كيف يعمل النظام

```
الزائر يفتح cdit.co
   ↓ يضغط زر المساعد
js/ai-agent.js يبني الواجهة
   ↓ POST { messages: [...] }
Cloudflare Worker `cdit-ai-agent`
   │ • يفحص Origin (allowlist)
   │ • Rate limit: ٢٠ رسالة/IP/ساعة (KV)
   │ • يحقن system prompt + tool schema (لا يصلان للمتصفح)
   │ • يستدعي DeepSeek بـ stream=true
   ↓
DeepSeek API
   ↓ SSE stream
Worker (يُمرّر السطور للمتصفح، يجمع tool_calls جانبياً)
   ↓
   ├──→ المتصفح (يكتب الرد حرفاً بحرف)
   └──→ عند tool_call: send_lead_to_telegram
        ↓ POST { type: 'ai_lead', message }
        cdit-telegram-proxy
        ↓
        Telegram → محادثة أحمد
```

**ما يستطيع المهاجم رؤيته:**
- رابط الـ Worker (`https://cdit-ai-agent...`)

**ما لا يستطيع رؤيته:**
- مفتاح DeepSeek
- محتوى الـ system prompt
- شكل الـ tool schema

**حماية إضافية:**
- `Access-Control-Allow-Origin` يقتصر على `cdit.co` و `localhost:8765`.
- يرفض `role: 'system'` أو `'tool'` من العميل (لمنع تجاوز الـ system prompt).
- حد أقصى ٢٠ رسالة و ٨٠٠٠ حرف لكل طلب.
- Rate limit ٢٠ رسالة/IP/ساعة.

---

## التكلفة المتوقعة (DeepSeek)

أسعار `deepseek-chat` (مرجعية، تحقّق من <https://platform.deepseek.com/usage>):
- مدخلات cache hit: ~$0.014 / مليون توكن
- مدخلات cache miss: ~$0.27 / مليون توكن
- مخرجات: ~$1.10 / مليون توكن

**سيناريو ١٠ محادثات/يوم × ١٠ أدوار/محادثة:** أقل من $١/شهر.
**سيناريو ١٠٠ محادثة/يوم:** ~$١٠-١٥/شهر.

الـ system prompt ثابت (~٧٠٠ توكن) → ~٩٥٪ منه cache hit بعد أول استدعاء في النافذة الزمنية → التكلفة فعلياً من المخرجات فقط.

---

## استكشاف الأخطاء

| المشكلة | السبب المحتمل |
|---|---|
| لا يظهر زر المساعد في الصفحة | `js/ai-agent.js` لا يُحمَّل، أو `window.CDIT_AI_AGENT_URL` فاضي/يحوي `<حسابك>` |
| `403 forbidden_origin` في console | الـ Origin غير في الـ allowlist. أضفه في `ALLOWED_ORIGINS` بـ `worker/ai-agent.js` |
| `500 worker_not_configured` | لم تضف `DEEPSEEK_API_KEY`، أو لم تربط KV باسم `RATE_LIMIT_KV` بالضبط |
| `502 upstream_failed` | المفتاح خطأ، أو DeepSeek محجوب، أو رصيدك انتهى |
| `429 rate_limited` | تجاوزت ٢٠ رسالة/ساعة من نفس الـ IP. انتظر، أو ارفع الحد في الكود |
| الردّ يصل دفعة واحدة (لا streaming) | تحقّق من `Cache-Control: no-transform` في الـ Worker، وأن المتصفح حديث |
| `lead` لا يصل تلقرام | `TELEGRAM_PROXY_URL` خطأ، أو نسيت تحديث `telegram-proxy.js` لقبول `ai_lead` |
| الـ bot يخترع أسعاراً | الـ system prompt صريح في منع هذا — لو حدث، أرسل تفاصيل الحوار لمراجعة الـ prompt |

---

## تحديث الـ system prompt مستقبلاً

الـ prompt مكتوب كـ `const SYSTEM_PROMPT = ...` في `worker/ai-agent.js`.

**مهم:** أيّ تغيير يكسر prompt cache في DeepSeek (ترتفع تكلفة الإدخال مؤقتاً ~٢٠× حتى تستقر النافذة). فلا تعدّله إلا لأسباب جوهرية (خدمة جديدة، تغيير في القواعد). للتعديل:

1. عدّل النص في `worker/ai-agent.js`.
2. ادفع التغيير.
3. اذهب لـ Cloudflare → الـ Worker → `Edit code` → الصق المحتوى الجديد → `Deploy`.
