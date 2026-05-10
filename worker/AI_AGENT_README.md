# CDIT AI Agent — دليل النشر

وكيل Cloudflare Worker مجاني يستضيف منطق المساعد الذكي على موقع CDIT. الموقع يستدعي الـ Worker، والـ Worker يستدعي DeepSeek (مع إخفاء المفتاح)، ويُمرّر الردّ بثاً مباشراً للزائر. عند اكتشاف اهتمام جدّي يستدعي Telegram API مباشرة لإرسال العميل المحتمل.

**الكلفة:** Cloudflare Workers مجاني (١٠٠٬٠٠٠ طلب/يوم). الكلفة الفعلية من DeepSeek فقط — سنتات شهرياً للموقع التسويقي.

---

## ملخّص البنية

```
المتصفح (cdit.co)
   │  js/ai-agent.js: يبني الواجهة، يستهلك SSE
   ↓ POST { messages: [...] }
Cloudflare Worker `cdit-ai-agent`
   │  • CORS + Origin allowlist
   │  • Rate limit عبر KV: ٢٠ رسالة/IP/ساعة
   │  • يحقن System prompt + Tool schema
   │  • يستدعي DeepSeek streaming
   │  • عند tool_call → يستدعي Telegram API مباشرة
   ↓ stream
DeepSeek API (api.deepseek.com)
   ↓ تُولّد محادثة بأسلوب سعودي + tool_call عند الاهتمام الجدّي
Worker → api.telegram.org/bot.../sendMessage  (مكالمة مباشرة)
   ↓
Telegram → محادثة المالك
```

> **ملاحظة:** هذا الإعداد لا يستخدم `cdit-telegram-proxy` لإرسال الـ leads.
> الـ proxy يبقى مسؤولاً فقط عن إشعارات الزيارات ونموذج التواصل القديم.
> **سبب التجنّب:** Cloudflare يرفض استدعاء worker→worker مباشر بين workers
> على نفس الحساب على workers.dev (خطأ 1042) حتى مع Service Bindings.
> الحلّ الأنظف: الـ ai-agent يحمل توكن البوت بنفسه ويستدعي Telegram API.

---

## ١. أنشئ مفتاح DeepSeek مخصّص لـ CDIT

1. افتح <https://platform.deepseek.com/api_keys>.
2. اضغط `Create new key`، سمّه `CDIT-prod-2026`.
3. انسخ المفتاح فوراً (يُعرض مرة واحدة).
4. **(موصى به)** اضبط حداً شهرياً للإنفاق من Settings → Billing.

> سبب المفتاح المخصّص (وليس إعادة استخدام مفتاح مشروع آخر): سطح هجوم
> أوسع لموقع عام، فتعزل المخاطر، وتفصل الفواتير.

## ٢. أنشئ KV Namespace (للـ Rate Limit)

1. Cloudflare Dashboard → `Workers & Pages` → `KV` → `Create Instance`.
2. الاسم: `cdit-ai-rate-limit`.

## ٣. أنشئ Worker جديد

1. `Workers & Pages` → `Create` → `Create Worker` → `Start with Hello World!`.
2. الاسم: `cdit-ai-agent`.
3. اضغط `Deploy` (سيُنشأ Worker افتراضي).

## ٤. ضع كود الـ Worker

1. اضغط `</> Edit code`.
2. احذف الكود الافتراضي. الصق محتوى `worker/ai-agent.js` بالكامل.
3. اضغط `Deploy`.

## ٥. اربط الـ KV Namespace

1. صفحة الـ Worker → تبويب `Bindings` → `+ Add binding` → `KV namespace`.
2. **Variable name:** `RATE_LIMIT_KV` ← مهم: نفس الاسم بالضبط.
3. **KV namespace:** اختر `cdit-ai-rate-limit`.
4. `Save and Deploy`.

## ٦. أضف الـ Secrets

تبويب `Settings` → `Variables and Secrets` → `+ Add` (يمكن إضافة عدّة في نفس النافذة عبر `+ Add variable`):

| Variable name | Type | Value |
|---|---|---|
| `DEEPSEEK_API_KEY` | **Secret** | المفتاح من خطوة ١ |
| `TELEGRAM_BOT_TOKEN` | **Secret** | توكن البوت من @BotFather (نفس توكن `cdit-telegram-proxy`) |
| `TELEGRAM_CHAT_ID` | **Secret** | `7893804` (معرّف محادثة المالك) |

> **الثلاثة كلها يجب أن تكون من نوع `Secret`** (لا Plain text) — تُشفَّر ولا تظهر في logs.
>
> **استعادة توكن البوت:** افتح تلقرام → `@BotFather` → اكتب `/token` → اختر بوت CDIT → سيعطيك التوكن دون إبطاله.

اضغط `Deploy`.

## ٧. انسخ رابط الـ Worker

من صفحة الـ Worker:
```
https://cdit-ai-agent.<اسم حسابك>.workers.dev
```

## ٨. ضع الرابط في الموقع

في [`js/main.js`](../js/main.js)، الـ URL محقون في `window.CDIT_AI_AGENT_URL` (سطر ٩٩ تقريباً):

```js
window.CDIT_AI_AGENT_URL = window.CDIT_AI_AGENT_URL || 'https://cdit-ai-agent.zahmee.workers.dev';
```

لو حسابك مختلف، عدّل الرابط هنا.

## ٩. اختبر

1. ادفع التغييرات: `git push`.
2. افتح <https://cdit.co/> (أو محلياً: `python -m http.server 8765` ثم `http://localhost:8765/`).
3. ستجد بطاقة "جرّب مساعد إبداع الذكي" تحت بطاقة الـ hero.
4. اضغطها → جرّب: `وش يميّزكم؟` → الردّ يبدأ بأسلوب سعودي وتُكتب الكلمات حرفاً بحرف.
5. جرّب: `اسمي محمد، جوالي 0501234567، أبغى الصدارة الكامل` → ستصل رسالة لتلقرام.

---

## التكلفة المتوقعة (DeepSeek)

أسعار `deepseek-chat` مرجعية (تحقّق من <https://platform.deepseek.com/usage>):
- مدخلات cache hit: ~$0.014 / مليون توكن
- مدخلات cache miss: ~$0.27 / مليون توكن
- مخرجات: ~$1.10 / مليون توكن

**سيناريو ١٠ محادثات/يوم × ١٠ أدوار:** أقل من $١/شهر.
**سيناريو ١٠٠ محادثة/يوم:** ~$١٠-١٥/شهر.

الـ system prompt ثابت بايت-بايت → ~٩٥٪ منه cache hit بعد أول استدعاء في النافذة الزمنية.

---

## استكشاف الأخطاء

| المشكلة | السبب المحتمل |
|---|---|
| لا يظهر زر المساعد في الصفحة | `js/ai-agent.js` لا يُحمَّل، أو `window.CDIT_AI_AGENT_URL` فاضي/يحوي placeholder |
| `403 forbidden_origin` في console | الـ Origin غير في `ALLOWED_ORIGINS`. أضفه في الكود (مثلاً `localhost:5500` لو تستخدم Live Server) |
| `500 worker_not_configured` | لم تضف `DEEPSEEK_API_KEY`، أو لم تربط KV باسم `RATE_LIMIT_KV` بالضبط |
| `502 upstream_failed` | المفتاح خطأ، أو DeepSeek محجوب، أو رصيدك انتهى |
| `429 rate_limited` | تجاوزت ٢٠ رسالة/ساعة من نفس الـ IP |
| الردّ يصل دفعة واحدة (لا streaming) | تحقّق من `Cache-Control: no-transform` في الـ Worker |
| الـ lead يصل بدون بيانات (—) | الـ AI استدعى الأداة قبل اكتمال الاسم/الجوال — راجع رقم ٧ في القواعد ضمن الـ system prompt |
| `lead_proxy_error 404 error code: 1042` | تحاول استدعاء worker آخر عبر HTTP. الإعداد الحالي يستدعي Telegram مباشرة. تأكد أن الكود الجديد منشور |
| الـ bot يخترع أسعاراً | الـ system prompt صريح في منع هذا — لو حصل، أرسل تفاصيل الحوار لمراجعة الـ prompt |

---

## تحديث الـ system prompt مستقبلاً

الـ prompt مكتوب كـ `const SYSTEM_PROMPT = ...` في `worker/ai-agent.js`.

**مهم:** أيّ تغيير يكسر prompt cache في DeepSeek (ترتفع تكلفة الإدخال مؤقتاً ~٢٠× حتى تستقر النافذة). فلا تعدّله إلا لأسباب جوهرية. للتعديل:

1. عدّل النص في `worker/ai-agent.js`.
2. ادفع التغيير لـ GitHub.
3. اذهب لـ Cloudflare → الـ Worker → `Edit code` → الصق المحتوى الجديد → `Deploy`.

---

## تنظيف اختياري (بعد التأكد أن النظام يعمل)

عند إعداد سابق كان فيه:
- متغيّر Plain text باسم `TELEGRAM_PROXY_URL`
- Service Binding باسم `TELEGRAM_PROXY` يشير لـ `cdit-telegram-proxy`

الكود الحالي **لا يستخدمهما**. يمكنك حذفهما من Cloudflare بأمان:
- `Variables and Secrets` → بجانب `TELEGRAM_PROXY_URL` → سلة المهملات.
- `Bindings` → بجانب `TELEGRAM_PROXY` → سلة المهملات.

(تركهما لا يضرّ، لكن النظافة أفضل.)
