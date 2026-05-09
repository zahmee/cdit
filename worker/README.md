# CDIT Telegram Proxy — دليل النشر

وكيل Cloudflare Worker مجاني يحفظ توكن البوت بعيداً عن المتصفح. الموقع يستدعي الـ Worker، والـ Worker يستدعي Telegram.

**الكلفة:** مجاني تماماً (Cloudflare Workers Free = 100,000 طلب/يوم).

---

## ١. أنشئ حساب Cloudflare (إن لم يكن لديك)

افتح <https://dash.cloudflare.com/sign-up> — مجاني، يحتاج بريد إلكتروني فقط.

## ٢. أنشئ Worker جديد

1. من الـ Dashboard → الجانب الأيسر → `Workers & Pages` → `Create` → `Create Worker`.
2. أعطه اسماً مثل `cdit-telegram-proxy` (سيكون جزءاً من الرابط).
3. اضغط `Deploy` (سيُنشأ Worker افتراضي بسيط).

## ٣. ضع كود الـ Worker

1. بعد الـ Deploy، اضغط `Edit code`.
2. احذف الكود الافتراضي.
3. الصق محتوى ملف `worker/telegram-proxy.js` بالكامل.
4. اضغط `Deploy` في الأعلى.

## ٤. أضف الـ Secrets

من صفحة الـ Worker → `Settings` → `Variables and Secrets` → `Add`:

| Variable name | Type | Value |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | **Secret** | التوكن الكامل من @BotFather |
| `TELEGRAM_CHAT_ID` | **Secret** | `7893804` |

> اختر `Secret` (وليس `Plain text`) — هذا يضمن أن القيم مشفّرة ولا تظهر في الـ logs.

اضغط `Deploy` بعد الإضافة.

## ٥. انسخ رابط الـ Worker

من صفحة الـ Worker → الأعلى → ستجد رابطاً بالشكل:
```
https://cdit-telegram-proxy.<اسم حسابك>.workers.dev
```

## ٦. ضع الرابط في الموقع

في الملفين التاليين، ابحث عن السطر `CDIT_TG_PROXY_URL` واستبدل القيمة:

- [`js/main.js`](../js/main.js)
- [`js/visitor-notify.js`](../js/visitor-notify.js)

```js
window.CDIT_TG_PROXY_URL = 'https://cdit-telegram-proxy.<حسابك>.workers.dev';
```

## ٧. اختبر

1. ادفع التغييرات: `git push`.
2. افتح موقعك → ستصلك رسالة "زيارة جديدة" في تلقرام.
3. افتح `contact.html` → عبّئ النموذج → اضغط إرسال → ستصلك الرسالة.

## ٨. ⚠️ مهم: أبطل التوكن القديم

بعد التأكد أن كل شيء يعمل عبر الـ Worker:

1. افتح `@BotFather` في تلقرام.
2. اكتب `/revoke` → اختر بوتك → سيعطيك توكناً **جديداً**.
3. حدّث `TELEGRAM_BOT_TOKEN` في الـ Worker (الخطوة ٤) بالتوكن الجديد.
4. اضغط `Deploy` في الـ Worker.

الآن التوكن القديم في تاريخ Git أصبح بلا قيمة، وتنبيه GitHub سيختفي بعد فترة قصيرة (يمكنك تسريع ذلك بـ Dismiss يدوياً).

---

## كيف يعمل النظام

```
الزائر يفتح الموقع
   ↓
js/visitor-notify.js يرسل POST إلى Worker
   ↓ (يحوي اسم الصفحة + الجهاز + الوقت)
Cloudflare Worker (يحوي التوكن سرياً)
   ↓
Telegram API → رسالة في محادثتك
```

**ما يستطيع المهاجم رؤيته في كود الموقع:**
- رابط الـ Worker (`https://cdit-telegram-proxy...`)

**ما لا يستطيع رؤيته:**
- التوكن
- الـ Chat ID

**حماية إضافية في الـ Worker:**
- `Access-Control-Allow-Origin` يقتصر على `cdit.co` و `localhost:8765` (للتطوير).
- التحقق من `Origin` header يرفض الطلبات من مواقع أخرى.
- حد أقصى ٣٥٠٠ حرف للرسالة الواحدة.
- التحقق من `type` (visit/contact فقط).

---

## استكشاف الأخطاء

| المشكلة | السبب المحتمل |
|---|---|
| لا تصل رسائل عند الزيارة | الـ URL في `js/visitor-notify.js` غير صحيح، أو لم تنشر الـ Worker |
| `403 forbidden_origin` في console المتصفح | تتصفح من نطاق غير مسموح. أضفه إلى `ALLOWED_ORIGINS` في الـ Worker |
| `500 worker_not_configured` | لم تضف الـ Secrets، أو نسيت اختيار `Secret` بدلاً من `Plain text` |
| `502 upstream_failed` | التوكن خاطئ، أو Telegram محجوب من Cloudflare (نادر جداً) |
