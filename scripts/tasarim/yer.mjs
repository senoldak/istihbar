// Yer arama (spec 2026-11-25 §5.2): il, ülke, şehir ve yakın şehirler. Veri: brand/harita/{turkiye,dunya,yerler}.json.
// Koordinat hiçbir zaman yapay zekâdan gelmez; yalnız bu tablolardan.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const oku = (ad) => JSON.parse(fs.readFileSync(fileURLToPath(new URL(`../../brand/harita/${ad}.json`, import.meta.url)), 'utf8'));
const TR = oku('turkiye');
const YER = oku('yerler');
let DUNYA;

export const sade = (s) =>
  String(s ?? '')
    .toLocaleLowerCase('tr')
    .replace(/[ıi̇]/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const TAKMA = {
  abd: 'Amerika Birleşik Devletleri',
  amerika: 'Amerika Birleşik Devletleri',
  ingiltere: 'Birleşik Krallık',
  cin: 'Çin Halk Cumhuriyeti',
  kongo: 'Demokratik Kongo Cumhuriyeti',
  cekya: 'Çek Cumhuriyeti',
  gazze: 'Filistin',
};

// yerler.json'daki iller turkiye.json ile aynı sırada üretildi; poligon sıra ile eşleşir.
const ILLER = YER.iller.map((il, i) => ({ ad: il.ad, ad_sade: il.ad_sade, nokta: il.nokta, halkalar: TR.iller[i].halkalar }));

export function ilBul(ad) {
  const s = sade(ad);
  if (!s) return null;
  return ILLER.find((il) => il.ad_sade === s) ?? null;
}

const uzaklik = (a, b) => Math.hypot((a[0] - b[0]) * Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180), a[1] - b[1]);

export const enYakinIl = (nokta) => ILLER.reduce((en, il) => (uzaklik(il.nokta, nokta) < uzaklik(en.nokta, nokta) ? il : en));

export function ulkeBul(ad) {
  DUNYA ??= oku('dunya');
  const aranan = sade(TAKMA[sade(ad)] ?? ad);
  if (!aranan) return null;
  const u = DUNYA.ulkeler.find((x) => sade(x.ad_tr ?? '') === aranan || sade(x.ad) === aranan);
  return u ? { kod: u.kod, ad_tr: u.ad_tr ?? u.ad, halkalar: u.halkalar } : null;
}

export function dunyaUlkeleri() {
  DUNYA ??= oku('dunya');
  return DUNYA.ulkeler;
}
export const turkiye = () => TR;

export function sehirBul(ad, ulkeKod) {
  const s = sade(ad);
  if (!s) return null;
  const k = YER.sehirler.find((x) => (x.ad_sade === s || x.ad_ham === s) && (!ulkeKod || x.ulke === ulkeKod));
  return k ? { ad: k.ad, nokta: k.nokta, saatDilimi: k.saatDilimi ?? null } : null;
}

/** Noktaya en yakın şehirler (il merkezleri + dünya şehirleri), uzaklık sırasıyla; haric'teki adlar atlanır. */
export function yakinSehirler(nokta, { haric = [], adet = 2 } = {}) {
  const atla = new Set(haric.map(sade));
  return [...ILLER.map((il) => ({ ad: il.ad, nokta: il.nokta })), ...YER.sehirler.map((s) => ({ ad: s.ad, nokta: s.nokta }))]
    .filter((s) => !atla.has(sade(s.ad)))
    .map((s) => ({ ...s, u: uzaklik(s.nokta, nokta) }))
    .sort((a, b) => a.u - b.u)
    .slice(0, adet)
    .map(({ ad, nokta: n }) => ({ ad, nokta: n }));
}
