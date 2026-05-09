// Generates data/news.json by fetching tech headlines and rewriting them
// in engaging Arabic via DeepSeek. Runs on GitHub Actions only.
//
// Required env: DEEPSEEK_API_KEY

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const OUTPUT_PATH = join(REPO_ROOT, 'data', 'news.json');

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_KEY) {
  console.error('Missing DEEPSEEK_API_KEY env var');
  process.exit(1);
}

const TARGET_ITEMS = 20;
const MAX_AGE_HOURS = 48;
const HN_URL = 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30';
const TC_URL = 'https://techcrunch.com/feed/';

const SYSTEM_PROMPT = `أنت محرر أخبار تقنية لشركة CDIT السعودية. مهمتك إعادة صياغة عنوان إنجليزي بعربية فصيحة قريبة من القارئ.

قواعد صارمة:
1. عنوان عربي مختصر (٧-١٢ كلمة)، جذاب بلا مبالغة، ممنوع clickbait.
2. ملخص من جملتين بأسلوب صديق ذكي يشرح التقنية:
   - استخدم تشبيهات ذكية أو لمسة فكاهة خفيفة عند المناسبة فقط
   - لا تستخدم الإيموجي داخل النصوص
   - مفهوم لقارئ غير تقني سعودي
   - لا تستخدم كلمات إنجليزية إلا للأسماء (Apple, Google, OpenAI)
3. اقترح إيموجي واحد مناسب للموضوع.
4. وسم عربي قصير (كلمة-كلمتين): مثل "ذكاء اصطناعي"، "أمن سيبراني"، "شركات"، "رقاقات"، "سحابة"، "تطبيقات"، "ألعاب"، "سيارات".

أعد JSON صارماً فقط، بلا أي نص قبل أو بعد:
{"title_ar":"...","summary_ar":"...","emoji":"...","tag":"..."}`;

// ---------- Sources ----------

async function fetchHN() {
  const res = await fetch(HN_URL);
  if (!res.ok) throw new Error('HN fetch failed: ' + res.status);
  const json = await res.json();
  const cutoff = Date.now() / 1000 - MAX_AGE_HOURS * 3600;
  return (json.hits || [])
    .filter(h => h.title && h.url && h.created_at_i > cutoff)
    .map(h => ({
      id: 'hn-' + h.objectID,
      title_en: h.title,
      url: h.url,
      source: 'Hacker News',
      fetched_at: new Date().toISOString(),
    }));
}

async function fetchTechCrunch() {
  try {
    const res = await fetch(TC_URL, { headers: { 'User-Agent': 'cdit-news-bot/1.0' } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRegex.exec(xml)) && items.length < 15) {
      const block = m[1];
      const title = (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1];
      const link = (block.match(/<link>([\s\S]*?)<\/link>/) || [])[1];
      const guid = (block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/) || [])[1];
      const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1];
      if (!title || !link) continue;
      const ts = pubDate ? new Date(pubDate).getTime() : Date.now();
      if (Date.now() - ts > MAX_AGE_HOURS * 3600 * 1000) continue;
      items.push({
        id: 'tc-' + (guid || link).split('/').pop().replace(/[^a-z0-9-]/gi, '').slice(0, 30),
        title_en: title.trim(),
        url: link.trim(),
        source: 'TechCrunch',
        fetched_at: new Date().toISOString(),
      });
    }
    return items;
  } catch (e) {
    console.warn('TechCrunch fetch failed:', e.message);
    return [];
  }
}

// ---------- DeepSeek ----------

async function rewriteWithDeepSeek(item) {
  const userPrompt = `العنوان الإنجليزي: ${item.title_en}\nالمصدر: ${item.source}\nالرابط: ${item.url}`;

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + DEEPSEEK_KEY,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error('DeepSeek ' + res.status + ': ' + body.slice(0, 200));
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty DeepSeek response');

  const parsed = JSON.parse(content);
  if (!parsed.title_ar || !parsed.summary_ar || !parsed.emoji || !parsed.tag) {
    throw new Error('DeepSeek output missing fields: ' + content.slice(0, 200));
  }

  return {
    id: item.id,
    title_ar: String(parsed.title_ar).trim(),
    summary_ar: String(parsed.summary_ar).trim(),
    url: item.url,
    source: item.source,
    emoji: String(parsed.emoji).trim().slice(0, 4),
    tag: String(parsed.tag).trim().slice(0, 30),
    fetched_at: item.fetched_at,
  };
}

// ---------- Pipeline ----------

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = (it.title_en || '').toLowerCase().slice(0, 60);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}

async function readPrevious() {
  try {
    const raw = await readFile(OUTPUT_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function main() {
  console.log('Fetching sources...');
  const [hn, tc] = await Promise.all([
    fetchHN().catch(e => { console.warn('HN failed:', e.message); return []; }),
    fetchTechCrunch(),
  ]);
  console.log(`Got ${hn.length} HN + ${tc.length} TechCrunch items`);

  const candidates = dedupe([...hn, ...tc]).slice(0, TARGET_ITEMS + 5);
  if (candidates.length === 0) {
    console.error('No candidate items. Aborting.');
    process.exit(1);
  }

  console.log(`Rewriting ${candidates.length} items via DeepSeek...`);
  const items = [];
  for (const cand of candidates) {
    if (items.length >= TARGET_ITEMS) break;
    try {
      const rewritten = await rewriteWithDeepSeek(cand);
      items.push(rewritten);
      console.log(`  ✓ ${rewritten.title_ar.slice(0, 60)}`);
    } catch (e) {
      console.warn(`  ✗ Skipping "${cand.title_en.slice(0, 50)}":`, e.message);
    }
    // Gentle pacing — DeepSeek has generous rate limits but be kind
    await new Promise(r => setTimeout(r, 200));
  }

  if (items.length < 5) {
    console.error(`Only ${items.length} items succeeded. Aborting (need >=5).`);
    process.exit(1);
  }

  const out = {
    generated_at: new Date().toISOString(),
    model: 'deepseek-chat',
    count: items.length,
    items,
  };

  // Skip write if items unchanged (compared by id set)
  const prev = await readPrevious();
  if (prev && prev.items) {
    const prevIds = new Set(prev.items.map(i => i.id));
    const newIds = new Set(items.map(i => i.id));
    const same = prevIds.size === newIds.size && [...prevIds].every(id => newIds.has(id));
    if (same) {
      console.log('No new items — keeping existing news.json.');
      return;
    }
  }

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${items.length} items to data/news.json`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
