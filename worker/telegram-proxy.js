// CDIT Telegram Proxy — Cloudflare Worker
//
// Receives notification requests from the cdit.co site and forwards them
// to the Telegram bot. The bot token + chat ID are stored as encrypted
// Worker secrets, never reaching the browser.
//
// Deploy via dashboard.cloudflare.com → Workers → Create Worker → paste this file.
// Then add two secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

const ALLOWED_ORIGINS = new Set([
  'https://cdit.co',
  'https://www.cdit.co',
  'https://zahmee.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765',
]);

const MAX_MESSAGE_LENGTH = 3500;

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

export default {
  async fetch(request, env) {
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

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return jsonResponse({ error: 'worker_not_configured' }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'invalid_json' }, 400, cors);
    }

    const { type, message } = body || {};

    if (type !== 'visit' && type !== 'contact' && type !== 'ai_lead') {
      return jsonResponse({ error: 'bad_type' }, 400, cors);
    }

    if (typeof message !== 'string' || message.length === 0 || message.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse({ error: 'bad_message' }, 400, cors);
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        disable_notification: type === 'visit',
      }),
    });

    if (!tgRes.ok) {
      const detail = await tgRes.text().catch(() => '');
      return jsonResponse({ error: 'upstream_failed', status: tgRes.status, detail: detail.slice(0, 200) }, 502, cors);
    }

    return jsonResponse({ ok: true }, 200, cors);
  },
};
