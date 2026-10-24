// Deprem kartındaki haritanın altlığını (brand/harita/turkiye.json) üretir: Türkiye il sınırları ve komşu ülkeler.
// Kaynak: Natural Earth 1:10m ülkeler ve il/eyalet sınırları (kamu malı, atıf gerekmez).
// Kullanım: node scripts/harita/lag-turkiye.mjs <ne_10m_admin_0_countries.geojson> <ne_10m_admin_1_states_provinces.geojson>
import fs from 'node:fs';

const KOMSU = ['TUR', 'GRC', 'BGR', 'GEO', 'ARM', 'AZE', 'IRN', 'IRQ', 'SYR', 'CYP', 'CYN', 'MKD', 'ROU', 'UKR', 'RUS', 'LBN', 'ISR', 'JOR', 'EGY'];
// Türkiye ve çevresi (boylam, enlem); deprem merkezi kenara yakın olsa da halkası sığsın diye geniş.
export const KUTU = [19, 32, 51, 47];
const [X0, Y0, X1, Y1] = KUTU;

function kesis(a, b, eksen, v) {
  const t = (v - a[eksen]) / (b[eksen] - a[eksen]);
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}

// Sutherland–Hodgman ile kutuya kırp.
function kirp(halka) {
  const kenarlar = [
    [(p) => p[0] >= X0, (a, b) => kesis(a, b, 0, X0)],
    [(p) => p[0] <= X1, (a, b) => kesis(a, b, 0, X1)],
    [(p) => p[1] >= Y0, (a, b) => kesis(a, b, 1, Y0)],
    [(p) => p[1] <= Y1, (a, b) => kesis(a, b, 1, Y1)],
  ];
  let cikis = halka;
  for (const [icinde, kes] of kenarlar) {
    const giris = cikis;
    cikis = [];
    for (let i = 0; i < giris.length; i++) {
      const a = giris[i];
      const b = giris[(i + 1) % giris.length];
      if (icinde(b)) {
        if (!icinde(a)) cikis.push(kes(a, b));
        cikis.push(b);
      } else if (icinde(a)) cikis.push(kes(a, b));
    }
    if (!cikis.length) return [];
  }
  return cikis;
}

function seyrelt(halka, tol = 0.01) {
  const cikis = [];
  for (const p of halka) {
    const q = cikis.at(-1);
    if (!q || Math.abs(p[0] - q[0]) > tol || Math.abs(p[1] - q[1]) > tol) cikis.push(p);
  }
  return cikis;
}

const halkalar = (g) =>
  (g.type === 'Polygon' ? [g.coordinates] : g.coordinates)
    .map((p) => seyrelt(kirp(p[0])).map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]))
    .filter((h) => h.length > 3);

const [a0, a1] = process.argv.slice(2).map((d) => JSON.parse(fs.readFileSync(d, 'utf8')));
const ulkeler = a0.features
  .filter((f) => KOMSU.includes(f.properties.ADM0_A3))
  .map((f) => ({ kod: f.properties.ADM0_A3, halkalar: halkalar(f.geometry) }))
  .filter((u) => u.halkalar.length);
const iller = a1.features
  .filter((f) => f.properties.adm0_a3 === 'TUR')
  .map((f) => ({ ad: f.properties.name, halkalar: halkalar(f.geometry) }));

fs.mkdirSync('brand/harita', { recursive: true });
fs.writeFileSync('brand/harita/turkiye.json', JSON.stringify({ kaynak: 'Natural Earth (kamu malı)', kutu: KUTU, ulkeler, iller }));
console.log(`${ulkeler.length} ülke, ${iller.length} il, ${(fs.statSync('brand/harita/turkiye.json').size / 1024).toFixed(0)} KB`);
