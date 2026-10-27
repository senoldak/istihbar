// Habere özel "dunya" kartının altlığını (brand/harita/dunya.json) üretir: bütün ülkeler, Türkçe adlarıyla.
// Kaynak: Natural Earth 1:50m ülkeler (kamu malı, atıf gerekmez), NAME_TR alanı Türkçe ad.
// Kullanım: node scripts/harita/lag-dunya.mjs <ne_50m_admin_0_countries.geojson>
// (https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson)
import fs from 'node:fs';

function seyrelt(halka, tol = 0.05) {
  const cikis = [];
  for (const p of halka) {
    const q = cikis.at(-1);
    if (!q || Math.abs(p[0] - q[0]) > tol || Math.abs(p[1] - q[1]) > tol) cikis.push(p);
  }
  return cikis;
}

const halkalar = (g) =>
  (g.type === 'Polygon' ? [g.coordinates] : g.coordinates)
    .map((p) => seyrelt(p[0]).map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)]))
    .filter((h) => h.length > 3);

const kaynak = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ulkeler = kaynak.features
  .map((f) => ({ kod: f.properties.ADM0_A3, ad: f.properties.NAME, ad_tr: f.properties.NAME_TR, halkalar: halkalar(f.geometry) }))
  .filter((u) => u.halkalar.length);

fs.mkdirSync('brand/harita', { recursive: true });
fs.writeFileSync('brand/harita/dunya.json', JSON.stringify({ kaynak: 'Natural Earth 1:50m (kamu malı)', ulkeler }));
console.log(`${ulkeler.length} ülke, ${(fs.statSync('brand/harita/dunya.json').size / 1024).toFixed(0)} KB`);
