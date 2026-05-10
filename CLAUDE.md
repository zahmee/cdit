# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CDIT (إبداع التطوير والبرمجة) — a marketing site for a Saudi IT services company. Static multi-page site, `lang="ar" dir="rtl"`, vanilla HTML/CSS/JS, no build system, no package.json, no tests, no dependencies. Files are served as-is.

There are no build, lint, or test commands. To preview, open any `.html` directly in a browser.

## Shared chrome is duplicated across six pages

The site is `index.html`, `services.html`, `products.html`, `about.html`, `portfolio.html`, `contact.html` at the repo root. There is **no templating** — each page contains its own copy of the header (`#main-header`), the mobile menu (`#mobile-menu`), the footer, and the floating WhatsApp widget. Editing any shared element (logo, nav links, phone number, footer columns) means editing all six files.

Contact details are also duplicated page-by-page — phone `966502010911` and email `info@cdit.co` appear ~15× per page. Treat any change to contact info as a repo-wide find-and-replace.

## Styling (`css/style.css`, single file)

Design tokens on `:root`: `--primary #0e75a1`, `--primary-dark`, `--primary-light`, `--accent #00d4aa`, `--secondary #1a1a2e`, plus a `--gray-50 … --gray-900` scale. Prefer these over hex literals when adding styles.

RTL is the default (`direction: rtl` on `body`). Use the `.ltr` helper on inline elements that should flow LTR — phone numbers, URLs, Latin tokens. Gradient utilities `.gradient-primary` and `.gradient-accent` are the site's brand washes.

Note: service/product cards in the HTML use inline `style="background:#..."` on icon boxes rather than classes. If you refactor one, sweep all instances.

## Behavior (`js/main.js`, ~137 lines, vanilla)

One file, no modules, no dependencies. The non-obvious pieces:

- **Header state.** `updateHeader()` toggles `.transparent` ↔ `.scrolled` on `#main-header` based on `window.scrollY > 20`. Only pages with `class="page-home"` on `<body>` start transparent; every other page is always `.scrolled`. If you add a new landing-style page, add `page-home` to its body.
- **Stats counter.** `#stats-section` is watched by an `IntersectionObserver` (threshold 0.3). On first intersection it animates each `.stat-item .num` from 0 to `data-target` over 2000ms and appends `data-suffix`. It fires once per page load — reload to re-see.
- **Contact form.** `#contact-form` does **not** post anywhere. It simulates a 1500ms submit, swaps in `#form-success`, and opens `https://wa.me/966502010911?text=...` with a pre-filled Arabic message built from the form's `name` and `message` fields. The phone number is hard-coded in `main.js` — keep it in sync with the HTML.
- **WhatsApp float.** `#wa-float-btn` / `#wa-panel` toggle an `.open` class; present on every page.
- **Active nav.** Computed from `window.location.pathname.split('/').pop()` and matched against each `.nav-link`'s `href`. Nav hrefs must be bare filenames (e.g. `about.html`), not paths.

## AI chat agent (homepage only, `js/ai-agent.js`)

Lives only on `index.html` for v1. Three entry points: the inline hero invitation card (`#ai-agent-hero-trigger`, just below the floating "2014" glass card), the floating chip (mounted in `#ai-agent-root`, revealed via IntersectionObserver after the hero scrolls out, sitting above the WhatsApp button), and the chat panel modal that both triggers open. Self-mounting IIFE that aborts silently if `window.CDIT_AI_AGENT_URL` (set in `main.js`) still has a placeholder.

Conversation history persists in `localStorage['cdit_ai_chat_history']` with a 24-hour TTL, capped at the last 20 messages. The `state.leadSent` flag is per-session — the green "تم إرسال طلبك" strip shows once even if the lead tool fires multiple times in the same conversation.

The widget streams replies via SSE: `fetch().body.getReader()` parses `data: {...}` lines and appends `delta.content` tokens to the active bot bubble. Two synthetic events the worker emits beyond the OpenAI shape: `{event:'lead_sent', ok, detail}` (drives the green/red strip), and `{error:'stream_failed'}` (shown as a generic "تعذّر إكمال الرد" bubble).

**Backend = Cloudflare Worker `cdit-ai-agent`** at `worker/ai-agent.js`. It holds the DeepSeek API key, injects the system prompt + tool schema, streams DeepSeek SSE through the browser, and on `finish_reason='tool_calls'` for `send_lead_to_telegram` calls Telegram API **directly** (not via `cdit-telegram-proxy`) — Cloudflare blocks worker→worker fetch on `*.workers.dev` with error 1042 even with Service Bindings, so the AI worker carries its own `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` secrets.

The system prompt is **byte-stable** so DeepSeek's automatic prompt caching kicks in (~95% input cost reduction). Don't interpolate dates/names/per-user state into it — they go into the conversation messages instead. Editing the prompt invalidates the cache for ~1 hour.

Three hard rules in the prompt that must not regress: (1) never invent prices — always redirect to WhatsApp + fire `send_lead_to_telegram`; (2) collect name + phone + request details *before* firing the tool (don't fire with empty/dash fields); (3) reply in **Saudi dialect** with phrases like "أبشر طال عمرك", "حيّاك الله", "على راسي". The persona is "مساعد إبداع".

Rate limit is 20 messages/IP/hour via Workers KV (binding `RATE_LIMIT_KV` → namespace `cdit-ai-rate-limit`). Origin allowlist in the worker includes `cdit.co`, `localhost:8765`, `127.0.0.1:8765` — VS Code Live Server (`:5500`) is NOT in the list; use `python -m http.server 8765` for local testing.

Deployment + secrets walkthrough: `worker/AI_AGENT_README.md`.
