/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'autonomie-steps.ts');
const contents = fs.readFileSync(filePath, 'utf8');

const urlMatches = [...contents.matchAll(/https?:\/\/[^'"\s)]+/g)].map((m) => m[0]);
const urls = [...new Set(urlMatches)].sort();

const suspicious = urls.filter((u) => /doubleclick|utm_|tracking|redirect|bit\.ly/i.test(u));

const outTxt = path.join(__dirname, 'audit-autonomie-urls.txt');
const outJson = path.join(__dirname, 'audit-autonomie-urls.json');
fs.writeFileSync(outTxt, urls.join('\n') + '\n', 'utf8');
fs.writeFileSync(outJson, JSON.stringify({ count: urls.length, urls }, null, 2) + '\n', 'utf8');

console.log(`URL count: ${urls.length}`);
console.log(`Suspicious count: ${suspicious.length}`);
if (suspicious.length) {
  console.log('--- Suspicious URLs ---');
  console.log(suspicious.join('\n'));
}

console.log(`\\nWrote URL lists:`);
console.log(`- ${outTxt}`);
console.log(`- ${outJson}`);

// Optional: quick connectivity check for a small subset (HEAD can be blocked)
// We do a GET with a short timeout and report non-2xx/3xx.
const CHECK_LIMIT = 40;
const toCheck = urls.slice(0, CHECK_LIMIT);

function withTimeout(promise, ms) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return Promise.race([
    promise(ctrl.signal).finally(() => clearTimeout(id)),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms + 50)),
  ]);
}

async function checkUrl(u) {
  try {
    const res = await withTimeout(
      (signal) => fetch(u, { method: 'GET', redirect: 'follow', signal }),
      6000,
    );
    const ok = res.status >= 200 && res.status < 400;
    return { url: u, status: res.status, ok };
  } catch (e) {
    return { url: u, status: 0, ok: false, error: String(e && e.message ? e.message : e) };
  }
}

(async () => {
  // Only run checks when explicitly requested via env to avoid noise.
  if (!process.env.AUDIT_FETCH) return;

  console.log(`\nChecking first ${toCheck.length} URLs (set AUDIT_FETCH=1)...`);
  const results = [];
  for (const u of toCheck) {
    results.push(await checkUrl(u));
  }

  const bad = results.filter((r) => !r.ok);
  console.log(`Bad/blocked count: ${bad.length}`);
  if (bad.length) {
    console.log('--- Bad/blocked URLs (sample) ---');
    for (const r of bad.slice(0, 25)) {
      console.log(`${r.status}\t${r.url}${r.error ? `\t(${r.error})` : ''}`);
    }
  }
})();
