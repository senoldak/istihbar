// istihbar kimliği (spec 2026-11-25 §4): açık kâğıt renkleri, Archivo dar kesimleri, yol olarak yazı, sığdırma, logo bloğu.
// SVG'ler yazı tipi gerektirmez (her harf yol olarak çizilir). Testler için yazılan metinler ve yerleşen ana öğe kutuları
// kayıt açıkken toplanır.
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

export const RENK = {
  zemin: '#f4f2ed',
  murekkep: '#15181d',
  ikincil: '#6b6a66',
  cizgi: '#d9d5cc',
  vurgu: '#d0211a',
  trKara: '#e2ddd2',
  komsuKara: '#ebe7df',
  sehir: '#8b887f',
  griCubuk: '#b9b4a8',
  lacivert: '#2b4a7a',
  yesil: '#1f7a4d',
};

const yol = (ad) => fileURLToPath(new URL(`../../brand/yazi/${ad}`, import.meta.url));
export const BASLIK = opentype.loadSync(yol('Archivo-DarExtraBold.ttf'));
export const ETIKET = opentype.loadSync(yol('Archivo-DarBold.ttf'));
// Logo yazısı: normal genişlik Archivo Bold (spec 2026-11-26).
export const KELIME = opentype.loadSync(yol('Archivo-Bold.ttf'));

let yaziKaydi = null;
export const yaziKaydiBaslat = () => (yaziKaydi = []);
export function yaziKaydiBitir() {
  const k = yaziKaydi;
  yaziKaydi = null;
  return k;
}
let kutuKaydi = null;
export const kutuKaydiBaslat = () => (kutuKaydi = []);
export function kutuKaydet(ad, x, y, g, h) {
  if (kutuKaydi) kutuKaydi.push({ ad, x, y, g, h });
}
export function kutuKaydiBitir() {
  const k = kutuKaydi;
  kutuKaydi = null;
  return k;
}

/** Genişlik; aralik em cinsinden harf aralığı (son harften sonra eklenmez). */
export function genislik(font, metin, boy, { aralik = 0 } = {}) {
  const n = [...metin].length;
  return font.getAdvanceWidth(metin, boy) + (n > 1 ? (n - 1) * aralik * boy : 0);
}

/** Düz yazı (yol olarak). */
export function yazi(font, metin, x, taban, boy, renk, { aralik = 0 } = {}) {
  if (yaziKaydi) yaziKaydi.push(metin);
  if (!aralik) return `<path d="${font.getPath(metin, x, taban, boy).toPathData(2)}" fill="${renk}"/>`;
  let d = '';
  let imlec = x;
  for (const h of metin) {
    d += font.getPath(h, imlec, taban, boy).toPathData(2);
    imlec += font.getAdvanceWidth(h, boy) + aralik * boy;
  }
  return `<path d="${d}" fill="${renk}"/>`;
}

// Kelime kelime satırlara böler; satıra sığmayan tek kelime harf harf bölünür.
function satirla(font, metin, boy, enGenis) {
  const satirlar = [];
  let satir = '';
  const ekle = (k) => {
    const aday = satir ? `${satir} ${k}` : k;
    if (genislik(font, aday, boy) <= enGenis) return (satir = aday);
    if (satir) satirlar.push(satir);
    satir = '';
    if (genislik(font, k, boy) <= enGenis) return (satir = k);
    let parca = '';
    for (const h of k) {
      if (genislik(font, parca + h, boy) > enGenis) satirlar.push(parca), (parca = '');
      parca += h;
    }
    satir = parca;
  };
  for (const k of metin.trim().split(/\s+/)) ekle(k);
  if (satir) satirlar.push(satir);
  return satirlar;
}

/** Boyu enAz'a kadar küçültür; yine sığmazsa son satır … ile kesilir. */
export function sigdir(font, metin, { boy, enAz, adim = 2, enGenis, enCokSatir }) {
  for (let b = boy; b >= enAz; b -= adim) {
    const s = satirla(font, metin, b, enGenis);
    if (s.length <= enCokSatir) return { boy: b, satirlar: s, kesildi: false };
  }
  const s = satirla(font, metin, enAz, enGenis).slice(0, enCokSatir);
  let son = s[s.length - 1];
  while (son && genislik(font, `${son}…`, enAz) > enGenis) son = son.slice(0, -1).trimEnd();
  s[s.length - 1] = `${son.replace(/[\s,.;:–-]+$/, '')}…`;
  return { boy: enAz, satirlar: s, kesildi: true };
}

// Telgraf şeridi simgesi (spec 2026-11-26): 200×200 kutuda dört şerit; n nokta, c çizgi; kırmızı yalnız ilk nokta.
const SOLUK = { acik: '#d6d0c4', koyu: '#4a4d52' };
const SERITLER = [
  [['n', 'v'], ['c', 'm'], ['n', 'm']],
  [['c', 'm'], ['n', 'm'], ['n', 'm'], ['n', 's']],
  [['n', 'm'], ['c', 'm'], ['c', 's']],
  [['n', 's'], ['n', 's'], ['c', 's'], ['n', 's']],
];

/** Simge: (x, y) sol üst, boy kenar uzunluğu (px). */
export function telgrafSimge(x, y, boy, { koyu = false } = {}) {
  const renk = { v: RENK.vurgu, m: koyu ? RENK.zemin : RENK.murekkep, s: koyu ? SOLUK.koyu : SOLUK.acik };
  let ic = '';
  SERITLER.forEach((satir, i) => {
    const sy = 34 + i * 44;
    let sx = 8;
    for (const [tur, r] of satir) {
      if (tur === 'n') {
        ic += `<circle cx="${sx + 14}" cy="${sy}" r="14" fill="${renk[r]}"/>`;
        sx += 40;
      } else {
        ic += `<rect x="${sx}" y="${sy - 14}" width="62" height="28" rx="14" fill="${renk[r]}"/>`;
        sx += 74;
      }
    }
  });
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(boy / 200).toFixed(4)})">${ic}</g>`;
}

/** Logo: simge + küçük harf "istihbar". (x, y) simgenin sol üstü; yukseklik simge kenarı. */
export function logoTelgraf(x, y, yukseklik, { koyu = false } = {}) {
  const boy = yukseklik * 0.78;
  const ara = yukseklik * 0.28;
  const aralik = -0.02;
  const taban = y + yukseklik / 2 + boy * 0.36;
  const ic = telgrafSimge(x, y, yukseklik, { koyu }) + yazi(KELIME, 'istihbar', x + yukseklik + ara, taban, boy, koyu ? RENK.zemin : RENK.murekkep, { aralik });
  return { ic, genislik: yukseklik + ara + genislik(KELIME, 'istihbar', boy, { aralik }) };
}

export const svg = (g, y, ic) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${g}" height="${y}" viewBox="0 0 ${g} ${y}"><rect width="100%" height="100%" fill="${RENK.zemin}"/>${ic}</svg>`;
