# -*- coding: utf-8 -*-
# Generates the 4 sector landing pages (sector-*.html) from one template.
# Re-run after editing TEMPLATE or SECTORS: python scripts/generate-sector-pages.py

import io, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

WA = 'https://wa.me/966502010911?text=مرحباً، أود الاستفسار عن النظام المحاسبي'

SECTORS = {
    'sector-contracting.html': {
        'kw': 'المقاولات',
        'title': 'برنامج محاسبة للمقاولات معتمد ZATCA — تجربة مجانية | CDIT',
        'desc': 'نظام محاسبي سحابي لشركات ومؤسسات المقاولات: فوترة إلكترونية معتمدة من هيئة الزكاة، فواتير دفعات ومستخلصات، وتقارير مستحقات. يبدأ من 300 ريال سنوياً مع تجربة مجانية.',
        'h1': 'نظام محاسبي لقطاع المقاولات — فواتيرك الإلكترونية معتمدة',
        'hero_p': 'فوترة إلكترونية معتمدة لدفعاتك ومستخلصاتك، ومتابعة مستحقاتك عند العملاء — نظام سحابي بسيط يبدأ من 300 ريال سنوياً.',
        'why_h2': 'ليش يناسب المقاولين؟',
        'benefits': [
            'فواتير إلكترونية معتمدة متوافقة مع المرحلة الثانية ZATCA',
            'فواتير دفعات ومستخلصات بمرجع واضح لكل عميل',
            'تقارير تكشف المستحقات المتأخرة أولاً بأول',
            'سحابي — تتابع من موقع المشروع ومحاسبك من مكتبه',
        ],
        'pains': [
            ('فواتير دفعات ومستخلصات؟', 'أصدر فاتورة لكل دفعة أو مستخلص بمرجع واضح للعميل، متوافقة مع متطلبات هيئة الزكاة.'),
            ('عملاء يتأخرون بالسداد؟', 'تقارير العملاء تعرض لك المستحقات والمتأخرات أولاً بأول لتتابعها قبل ما تتراكم.'),
            ('محاسبك خارجي؟', 'النظام سحابي — محاسبك يدخل من مكتبه وأنت من موقع المشروع، بنفس البيانات لحظياً.'),
            ('تخاف من الغرامات؟', 'فواتيرك تصدر متوافقة مع الفاتورة الإلكترونية تلقائياً، فلا تنشغل بالتفاصيل النظامية.'),
        ],
        'featured': 'lite',
        'lite_note': 'الأنسب لأغلب المقاولين — فوترة معتمدة وتقارير',
        'full_note': 'إذا تحتاج مشتريات ومخازن لمواد البناء',
        'shots': [
            ('_product-screenshots/final/03-sales.png', 'إنشاء فاتورة مبيعات'),
            ('_product-screenshots/final/04-invoices.png', 'قائمة الفواتير مع حالة ZATCA'),
            ('_product-screenshots/final/06-reports.png', 'تقارير المبيعات والمستحقات'),
            ('_product-screenshots/final/02-customers.png', 'إدارة العملاء'),
        ],
        'activity': 'مقاولات',
    },
    'sector-law.html': {
        'kw': 'مكاتب المحاماة',
        'title': 'برنامج فوترة لمكاتب المحاماة معتمد ZATCA — تجربة مجانية | CDIT',
        'desc': 'نظام فوترة ومحاسبة سحابي لمكاتب المحاماة والاستشارات: فواتير أتعاب إلكترونية معتمدة من هيئة الزكاة وتقارير عملاء واضحة. يبدأ من 300 ريال سنوياً مع تجربة مجانية.',
        'h1': 'نظام فوترة ومحاسبة لمكاتب المحاماة والاستشارات',
        'hero_p': 'أصدر فواتير أتعابك الإلكترونية بثوانٍ، وتابع حسابات عملائك بنظام سحابي بسيط لا يحتاج خبرة محاسبية — من 300 ريال سنوياً.',
        'why_h2': 'ليش يناسب مكاتب المحاماة؟',
        'benefits': [
            'فواتير أتعاب إلكترونية معتمدة متوافقة مع ZATCA',
            'حسابات واضحة لكل عميل وقضية مالية',
            'بسيط — وقتك للقضايا لا لتعلّم المحاسبة',
            'بياناتك في حسابك الخاص بالنظام',
        ],
        'pains': [
            ('أتعاب وجلسات متفرقة؟', 'أصدر فاتورة لكل أتعاب أو دفعة بمرجعها، وتابع المسدّد والمتبقي لكل عميل.'),
            ('سرية بيانات موكّليك؟', 'بياناتك في حسابك الخاص، والنظام يستضاف وفق احتياجك — حتى على سيرفرك الخاص إن رغبت.'),
            ('وقتك للقضايا لا للمحاسبة؟', 'واجهة بسيطة تصدر الفاتورة بثوانٍ بدون دورات محاسبية ولا تعقيد.'),
            ('متطلبات هيئة الزكاة؟', 'الفواتير متوافقة مع المرحلة الثانية من الفاتورة الإلكترونية تلقائياً.'),
        ],
        'featured': 'lite',
        'lite_note': 'الأنسب للمكاتب — فوترة أتعاب وحضور موظفين',
        'full_note': 'لمن يحتاج إدارة مالية أوسع وتعدد مستخدمين',
        'shots': [
            ('_product-screenshots/light-invoice/01-new-invoice.jpeg', 'إنشاء فاتورة أتعاب'),
            ('_product-screenshots/light-invoice/02-invoices-list.jpeg', 'قائمة الفواتير'),
            ('_product-screenshots/light-invoice/04-customers.jpeg', 'حسابات العملاء'),
            ('_product-screenshots/light-invoice/05-reports.jpeg', 'التقارير'),
        ],
        'activity': 'محاماة',
    },
    'sector-engineering.html': {
        'kw': 'المكاتب الهندسية',
        'title': 'برنامج محاسبة للمكاتب الهندسية معتمد ZATCA — تجربة مجانية | CDIT',
        'desc': 'نظام محاسبي سحابي للمكاتب الهندسية والاستشارية: فوترة إلكترونية معتمدة لأتعاب التصميم والإشراف، متابعة دفعات المشاريع، وحضور وانصراف. يبدأ من 300 ريال سنوياً.',
        'h1': 'نظام محاسبي للمكاتب الهندسية والاستشارية',
        'hero_p': 'فوترة إلكترونية معتمدة لأتعاب التصميم والإشراف، مع متابعة دفعات كل مشروع وحضور فريقك — من 300 ريال سنوياً.',
        'why_h2': 'ليش يناسب المكاتب الهندسية؟',
        'benefits': [
            'فواتير إلكترونية معتمدة متوافقة مع المرحلة الثانية ZATCA',
            'فواتير دفعات لمراحل التصميم والإشراف',
            'حضور وانصراف لفريق المكتب',
            'تقارير جاهزة لمراجعك الضريبي',
        ],
        'pains': [
            ('دفعات مراحل التصميم والإشراف؟', 'أصدر فاتورة لكل مرحلة أو دفعة بمرجع المشروع، وتابع المسدّد والمتبقي.'),
            ('أكثر من مهندس بالمكتب؟', 'النظام يشمل حضوراً وانصرافاً لموظفيك بدون نظام إضافي.'),
            ('تقارير لمراجعك الضريبي؟', 'تقارير مبيعات وضريبة جاهزة للتصدير والطباعة في أي وقت.'),
            ('فواتيرك ما زالت ورقية؟', 'الورقي مخالف لمتطلبات الفاتورة الإلكترونية — انتقل لنظام متوافق خلال يوم.'),
        ],
        'featured': 'lite',
        'lite_note': 'الأنسب للمكاتب الهندسية — فوترة وحضور',
        'full_note': 'لمن يحتاج مشتريات ومخازن وتعدد مستخدمين',
        'shots': [
            ('_product-screenshots/light-invoice/00-dashboard.jpeg', 'لوحة التحكم'),
            ('_product-screenshots/light-invoice/01-new-invoice.jpeg', 'إنشاء فاتورة'),
            ('_product-screenshots/light-invoice/05-reports.jpeg', 'التقارير'),
            ('_product-screenshots/light-invoice/07-attendance.jpeg', 'الحضور والانصراف'),
        ],
        'activity': 'مكاتب هندسية',
    },
    'sector-pharmacy.html': {
        'kw': 'الصيدليات',
        'title': 'نظام نقاط بيع ومخزون للصيدليات مع تتبع الصلاحية | CDIT',
        'desc': 'نظام كاشير ومخزون للصيدليات والمستودعات الطبية: نقطة بيع سريعة، تتبّع تواريخ صلاحية الأدوية، جرد لحظي، وفوترة متوافقة. تجربة مجانية وأسعار سنوية معلنة.',
        'h1': 'نظام كاشير ومخزون للصيدليات — مع تتبّع تواريخ الصلاحية',
        'hero_p': 'نقطة بيع سريعة، مخزون يتتبّع صلاحية الأدوية قبل انتهائها، وتقارير مبيعات يومية — بأسعار سنوية معلنة وتجربة مجانية.',
        'why_h2': 'ليش يناسب الصيدليات؟',
        'benefits': [
            'تتبّع تواريخ صلاحية المنتجات قبل انتهائها',
            'نقطة بيع (POS) سريعة لمبيعات الكاشير اليومية',
            'مخزون وجرد لحظي بدون إغلاق الصيدلية',
            'فوترة متوافقة مع المتطلبات السعودية',
        ],
        'pains': [
            ('أدوية تنتهي صلاحيتها بالرف؟', 'النظام يتتبّع تواريخ الصلاحية وينبّهك للمنتجات القريبة من الانتهاء قبل أن تخسرها.'),
            ('جرد المخزون ياخذ أيام؟', 'مخزونك محدّث لحظياً مع كل عملية بيع وشراء — الجرد يصير مراجعة لا عملية شاقة.'),
            ('زحمة الكاشير؟', 'نقطة بيع سريعة مصممة للمبيعات اليومية المتكررة وصندوق يومي واضح.'),
            ('مستودع أو أكثر؟', 'الإصدار الكامل يدير المخازن والمستودعات المتعددة من نظام واحد.'),
        ],
        'featured': 'full',
        'lite_note': 'فوترة إلكترونية معتمدة وحضور موظفين',
        'full_note': 'الأنسب للصيدليات — يشمل المخازن والمستودعات',
        'shots': [
            ('_product-screenshots/asbab5/05-pos-daily-sales.jpeg', 'نقطة البيع — مبيعات اليوم'),
            ('_product-screenshots/asbab5/04-inventory.jpeg', 'المخزون وتتبّع الصلاحية'),
            ('_product-screenshots/asbab5/07-cashbox.jpeg', 'الصندوق اليومي'),
            ('_product-screenshots/asbab5/08-sales-report.jpeg', 'تقرير المبيعات'),
        ],
        'activity': 'صيدلية / مخازن',
    },
}

ACTIVITIES = ['مقاولات', 'محاماة', 'مكاتب هندسية', 'دعاية وإعلان', 'صيدلية / مخازن', 'تجارة عامة / متجر', 'أخرى']

CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'

NAV = '''      <nav class="desktop-nav">
        <a href="index.html" class="nav-link">الرئيسية</a>
        <a href="services.html" class="nav-link">خدماتنا</a>
        <a href="products.html" class="nav-link">منتجاتنا</a>
        <a href="portfolio.html" class="nav-link">أعمالنا</a>
        <a href="news.html" class="nav-link">أخبار التقنية</a>
        <a href="about.html" class="nav-link">من نحن</a>
        <a href="contact.html" class="nav-link">تواصل معنا</a>
      </nav>'''


def build(slug, s):
    benefits = '\n'.join(
        '            <li>%s%s</li>' % (CHECK_SVG, b) for b in s['benefits'])
    pains = '\n'.join(
        '            <div class="sector-pain"><div class="q">%s</div><div class="a">%s</div></div>' % (q, a)
        for q, a in s['pains'])
    shots = '\n'.join(
        '''        <button type="button" class="edition-shot" data-src="%s" data-caption="%s">
          <img src="%s" alt="%s" loading="lazy">
          <span class="shot-label">%s</span>
        </button>''' % (src, cap, src, cap, cap) for src, cap in s['shots'])
    options = '\n'.join(
        '                  <option%s>%s</option>' % (' selected' if a == s['activity'] else '', a)
        for a in ACTIVITIES)

    lite_cls = ' style="border:2px solid var(--primary)"' if s['featured'] == 'lite' else ''
    full_cls = ' style="border:2px solid var(--primary)"' if s['featured'] == 'full' else ''

    return '''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#0e75a1">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <title>%(title)s</title>
  <meta name="description" content="%(desc)s">
  <link rel="canonical" href="https://cdit.co/%(slug)s">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ar_SA">
  <meta property="og:site_name" content="CDIT">
  <meta property="og:title" content="%(title)s">
  <meta property="og:description" content="%(desc)s">
  <meta property="og:url" content="https://cdit.co/%(slug)s">
  <meta property="og:image" content="https://cdit.co/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <!-- Header -->
  <header id="main-header" class="scrolled">
    <div class="container header-inner">
      <a href="index.html" class="logo"><div class="logo-icon">C</div><div><div class="logo-text">CDIT</div><div class="logo-sub">إبداع التطوير والبرمجة لتقنية المعلومات</div></div></a>
%(nav)s
      <div class="header-actions">
        <a href="tel:+966502010911" class="header-phone"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span class="ltr">+966502010911</span></a>
        <a href="%(wa)s" target="_blank" class="btn-whatsapp">واتساب</a>
      </div>
      <button class="mobile-toggle" id="mobile-toggle" aria-label="القائمة"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg></button>
    </div>
    <div class="mobile-menu" id="mobile-menu">
      <div class="container">
        <a href="index.html" class="nav-link">الرئيسية</a>
        <a href="services.html" class="nav-link">خدماتنا</a>
        <a href="products.html" class="nav-link">منتجاتنا</a>
        <a href="portfolio.html" class="nav-link">أعمالنا</a>
        <a href="news.html" class="nav-link">أخبار التقنية</a>
        <a href="about.html" class="nav-link">من نحن</a>
        <a href="contact.html" class="nav-link">تواصل معنا</a>
        <a href="%(wa)s" target="_blank" class="btn-whatsapp">تواصل عبر واتساب</a>
      </div>
    </div>
  </header>

  <main style="padding-top:4rem">
    <!-- Hero -->
    <div class="gradient-primary text-white py-20">
      <div class="container text-center">
        <span class="trial-badge">معتمد ومتوافق مع هيئة الزكاة والضريبة (ZATCA)</span>
        <h1 class="text-4xl sm:text-5xl font-black mb-4">%(h1)s</h1>
        <p class="text-blue-200 text-lg max-w-2xl mx-auto">%(hero_p)s</p>
      </div>
    </div>

    <!-- Trial -->
    <div class="container py-20">
      <div class="trial-grid">
        <!-- Benefits + pains + pricing -->
        <div class="trial-aside">
          <h2>%(why_h2)s</h2>
          <ul class="trial-benefits">
%(benefits)s
          </ul>

          <div class="sector-pains">
%(pains)s
          </div>

          <div class="trial-pricing">
            <div class="trial-price-card"%(lite_cls)s>
              <div class="trial-price-name">المخفّف</div>
              <div class="trial-price-val"><span class="num">300</span> ريال<span class="per">/ سنوياً</span></div>
              <div class="trial-price-note">%(lite_note)s</div>
            </div>
            <div class="trial-price-card"%(full_cls)s>
              <div class="trial-price-name">الكامل</div>
              <div class="trial-price-val"><span class="num">900</span> ريال<span class="per">/ سنوياً</span></div>
              <div class="trial-price-note">%(full_note)s</div>
            </div>
          </div>

          <div class="demo-box">
            <div class="demo-box-head">
              <span class="demo-tag">معاينة فورية</span>
              <h3>تبي تشوف النظام قبل ما تترك بياناتك؟</h3>
              <p>ادخل على الديمو المشترك وجرّبه بنفسك. (بيئة عرض مشتركة للتجربة فقط.)</p>
            </div>
            <a href="https://app.cdit.co" target="_blank" rel="noopener" class="demo-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              شاهد الديمو الآن
            </a>
            <div class="demo-creds">
              <div class="demo-cred"><span>رابط النظام</span><strong class="ltr">app.cdit.co</strong></div>
              <div class="demo-cred"><span>رقم المؤسسة</span><strong class="ltr">2</strong></div>
              <div class="demo-cred"><span>اسم المستخدم</span><strong class="ltr">admin@cdit.co</strong></div>
              <div class="demo-cred"><span>كلمة المرور</span><strong class="ltr">1234</strong></div>
            </div>
          </div>
        </div>

        <!-- Capture form (primary conversion) -->
        <div class="contact-form-wrapper" id="trial-card">
          <div id="trial-success" style="display:none">
            <div class="success-box">
              <div class="icon-circle"><svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
              <h3>وصلنا طلبك ✅</h3>
              <p>شكراً لك. يتواصل معك فريق CDIT خلال ساعات العمل لتفعيل تجربتك المجانية وضبط النظام على نشاطك.<br>وللسرعة، تقدر تتواصل عبر <a href="https://wa.me/966502010911?text=مرحباً، تركت بياناتي لطلب تجربة النظام المحاسبي" target="_blank" rel="noopener" style="color:var(--primary);font-weight:700;text-decoration:underline">واتساب مباشرة</a>.</p>
              <a href="https://app.cdit.co" target="_blank" rel="noopener" class="btn-submit" style="width:auto;padding:0.75rem 2rem;text-decoration:none">شاهد الديمو ريثما يتواصل فريقنا</a>
            </div>
          </div>
          <div id="trial-form-container">
            <h2>اطلب تجربتك المجانية</h2>
            <p class="sub">اترك بياناتك ويتواصل معك فريقنا لتفعيل التجربة — بدون التزام.</p>
            <form id="trial-form" class="form-grid">
              <div class="form-group full">
                <label>الاسم الكامل *</label>
                <input type="text" name="name" required placeholder="محمد أحمد" autocomplete="name">
              </div>
              <div class="form-group full">
                <label>رقم الجوال *</label>
                <input type="tel" name="phone" required
                       pattern="\\+9665[0-9]{8}"
                       placeholder="+9665xxxxxxxx"
                       title="يجب أن يبدأ الرقم بـ +9665 ويتبعه 8 أرقام، مثال: +966512345678"
                       inputmode="tel"
                       maxlength="13"
                       autocomplete="tel"
                       class="ltr" dir="ltr">
              </div>
              <div class="form-group full">
                <label>نوع نشاطك *</label>
                <select name="activity" required>
%(options)s
                </select>
              </div>
              <div class="form-group full" id="trial-error" style="display:none">
                <div class="alert-error">حدث خطأ، يرجى المحاولة مرة أخرى أو التواصل مباشرة عبر واتساب.</div>
              </div>
              <div class="form-group full">
                <button type="submit" class="btn-submit">
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>
                  ابدأ تجربتك المجانية
                </button>
              </div>
              <p class="trial-form-foot">بإرسالك الطلب توافق على تواصل فريق CDIT معك بخصوص الخدمة.</p>
            </form>
          </div>
        </div>
      </div>

      <!-- Real screenshots -->
      <div class="shots-strip">
        <h3>لقطات حقيقية من النظام</h3>
        <div class="row">
%(shots)s
        </div>
      </div>
    </div>
  </main>

  <!-- Saudi Compliance Strip -->
  <section class="saudi-compliance" aria-labelledby="compliance-title">
    <div class="container">
      <div class="compliance-header">
        <h2 id="compliance-title">نلتزم بالأنظمة والمعايير السعودية</h2>
        <p>أنظمتنا متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك لحلول الفوترة الإلكترونية في المملكة</p>
      </div>
      <div class="compliance-logos">
        <img src="saudi_official_logos/06_Saudi_Vision_2030_Black.png" alt="رؤية المملكة العربية السعودية 2030" loading="lazy">
        <img src="saudi_official_logos/01_ZATCA_Logo.png" alt="هيئة الزكاة والضريبة والجمارك" loading="lazy">
        <img src="saudi_official_logos/03_Fatoora_Einvoicing.png" alt="فاتورة — الفوترة الإلكترونية" loading="lazy">
        <img src="saudi_official_logos/05_VAT_Logo.png" alt="ضريبة القيمة المضافة" loading="lazy">
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="main-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <div class="logo"><div class="logo-icon">C</div><div><div class="logo-text">CDIT</div><div class="logo-sub">إبداع التطوير والبرمجة لتقنية المعلومات</div></div></div>
        <p>مؤسسة سعودية متخصصة في تطوير البرمجيات وحلول الأعمال الرقمية من خميس مشيط، نخدم منشآت الأعمال في منطقة عسير والمملكة.</p>
        <div class="credentials">
          <div class="cred"><span>السجل التجاري</span> <strong class="ltr">5855353571</strong></div>
          <div class="cred"><span>الرقم الضريبي</span> <strong class="ltr">310232266400003</strong></div>
          <div class="cred"><span>الرقم الموحد</span> <strong class="ltr">7022056670</strong></div>
          <div class="cred"><span>المقر</span> <strong>خميس مشيط</strong></div>
        </div>
      </div>
      <div class="footer-col">
        <h3>حلول حسب القطاع</h3>
        <ul>
          <li><a href="sector-contracting.html"><span class="dot"></span>برنامج محاسبة للمقاولات</a></li>
          <li><a href="sector-law.html"><span class="dot"></span>فوترة لمكاتب المحاماة</a></li>
          <li><a href="sector-engineering.html"><span class="dot"></span>محاسبة للمكاتب الهندسية</a></li>
          <li><a href="sector-pharmacy.html"><span class="dot"></span>كاشير ومخزون للصيدليات</a></li>
          <li><a href="tajribah.html"><span class="dot"></span>طلب تجربة مجانية</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3>المدونة</h3>
        <ul>
          <li><a href="blog/zatca-phase2-requirements.html"><span class="dot"></span>متطلبات المرحلة الثانية من الفاتورة الإلكترونية</a></li>
          <li><a href="blog/zatca-fines.html"><span class="dot"></span>غرامات الفاتورة الإلكترونية وكيف تتجنبها</a></li>
          <li><a href="blog/choose-accounting-software.html"><span class="dot"></span>كيف تختار برنامج محاسبة لمنشأتك</a></li>
          <li><a href="blog/index.html"><span class="dot"></span>كل المقالات</a></li>
        </ul>
      </div>
      <div class="footer-col footer-contact">
        <h3>تواصل معنا</h3>
        <ul>
          <li><a href="tel:+966502010911"><div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div><span class="ltr">+966502010911</span></a></li>
          <li><a href="mailto:info@cdit.co"><div class="icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><span>info@cdit.co</span></a></li>
        </ul>
        <a href="%(wa)s" target="_blank" class="btn-whatsapp" style="margin-top:1.5rem;width:100%%;justify-content:center;display:flex;align-items:center;gap:0.5rem"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>ابدأ محادثة الآن</a>
      </div>
    </div>
    <div class="footer-bar">
      <p>© 2026 مؤسسة إبداع التطوير والبرمجة لتقنية المعلومات (CDIT). جميع الحقوق محفوظة.</p>
      <div class="links"><a href="blog/index.html">المدونة</a><a href="tajribah.html">تجربة مجانية</a><a href="privacy.html">سياسة الخصوصية</a><a href="terms.html">الشروط والأحكام</a></div>
    </div>
  </footer>

  <!-- Lightbox -->
  <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="عرض الصورة">
    <button type="button" class="lightbox-close" id="lightbox-close" aria-label="إغلاق"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    <img class="lightbox-img" id="lightbox-img" alt="">
    <div class="lightbox-caption" id="lightbox-caption"></div>
  </div>

  <!-- WhatsApp Float -->
  <div class="whatsapp-float">
    <div class="whatsapp-panel" id="wa-panel">
      <div class="whatsapp-panel-header"><div class="brand"><div class="brand-icon">C</div><div><div class="brand-title">CDIT</div><div class="brand-status">متاح الآن • رد خلال دقائق</div></div></div><p>مرحباً! 👋 كيف يمكننا مساعدتك اليوم؟</p></div>
      <div class="whatsapp-options">
        <a href="%(wa)s" target="_blank" class="opt-wa"><svg class="opt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg><div><div class="opt-title">واتساب</div><div class="opt-sub">تواصل فوري</div></div></a>
        <a href="tel:+966502010911" class="opt-phone"><svg class="opt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><div><div class="opt-title">اتصال مباشر</div><div class="opt-sub ltr">+966502010911</div></div></a>
      </div>
      <p style="text-align:center;font-size:0.75rem;color:var(--gray-400);margin-top:0.75rem">ساعات العمل: الأحد - الخميس، 8 ص - 6 م</p>
    </div>
    <button class="whatsapp-float-btn closed" id="wa-float-btn" aria-label="تواصل"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></button>
  </div>

  <!-- AI Agent root: chip + chat panel mounted by js/ai-agent.js -->
  <div id="ai-agent-root"></div>

  <script src="js/main.js"></script>
  <script src="js/ai-agent.js" defer></script>
  <script src="js/visitor-notify.js" defer></script>
</body>
</html>
''' % {
        'title': s['title'], 'desc': s['desc'], 'slug': slug, 'nav': NAV, 'wa': WA,
        'h1': s['h1'], 'hero_p': s['hero_p'], 'why_h2': s['why_h2'],
        'benefits': benefits, 'pains': pains, 'shots': shots, 'options': options,
        'lite_cls': lite_cls, 'full_cls': full_cls,
        'lite_note': s['lite_note'], 'full_note': s['full_note'],
    }


for slug, s in SECTORS.items():
    out = os.path.join(ROOT, slug)
    with io.open(out, 'w', encoding='utf-8', newline='\n') as f:
        f.write(build(slug, s))
    print('wrote', slug)
