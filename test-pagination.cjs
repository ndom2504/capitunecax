const url1 = 'https://api.scraperapi.com/?api_key=624751bbf5ddc786bad6c4f31f50d41c&url=https%3A%2F%2Fwww.guichetemplois.gc.ca%2Fjobsearch%2Frechercheemplois%3Fsort%3DM%26action%3Dsearch%26page%3D1&render=false';
const url2 = 'https://api.scraperapi.com/?api_key=624751bbf5ddc786bad6c4f31f50d41c&url=https%3A%2F%2Fwww.guichetemplois.gc.ca%2Fjobsearch%2Frechercheemplois%3Fsort%3DM%26action%3Dsearch%26page%3D2&render=false';

async function test() {
  console.log('Fetching page 1...');
  const r1 = await fetch(url1);
  const h1 = await r1.text();
  const ids1 = Array.from(h1.matchAll(/article id="article-(\d+)"/g)).map(m => m[1]);
  console.log('Page 1 IDs:', ids1.slice(0, 5).join(', '));

  console.log('Fetching page 2...');
  const r2 = await fetch(url2);
  const h2 = await r2.text();
  const ids2 = Array.from(h2.matchAll(/article id="article-(\d+)"/g)).map(m => m[1]);
  console.log('Page 2 IDs:', ids2.slice(0, 5).join(', '));
  
  const same = ids1[0] === ids2[0];
  console.log('Is same?', same);
}
test();
