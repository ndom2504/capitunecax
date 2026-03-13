const fs = require('fs');
async function test() {
  const url = 'https://api.scraperapi.com/?api_key=624751bbf5ddc786bad6c4f31f50d41c&url=https%3A%2F%2Fwww.guichetemplois.gc.ca%2Fjobsearch%2Frechercheemplois%3Fsort%3DM%26action%3Dsearch%26page%3D2&render=false';
  const r = await fetch(url);
  const html = await r.text();
  console.log('Matches for article:', (html.match(/<article\s+id="article-/gi) || []).length);
}
test();
