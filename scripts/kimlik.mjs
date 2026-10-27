// istihbar kimliğinin çizim yardımcıları: renkler, yazı tipleri, glif yolu olarak yazı ve kırmızı noktalı logo.
// SVG'ler yazı tipi gerektirmez (her harf yol olarak çizilir); logo paketi ve kart çizicisi birlikte kullanır.
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

export const RENK = { kirmizi: '#d92a1c', murekkep: '#15171a', kagit: '#f6f4ee', gri: '#6b6a64', cizgi: '#dedad0' };

const yol = (ad) => fileURLToPath(new URL(`../brand/yazi/${ad}`, import.meta.url));
export const MONO = opentype.loadSync(yol('IBMPlexMono-SemiBold.ttf'));
export const SANS = opentype.loadSync(yol('IBMPlexSans-SemiBold.ttf'));
const ARALIK = -0.04; // logodaki harf aralığı (em)

// 'i' glifinin nokta konturu: en üstteki kapalı yol. Kırmızı daire onun merkezine, ondan biraz iri oturur.
function noktaKutusu() {
  const yollar = [];
  let cur = [];
  for (const k of MONO.charToGlyph('i').path.commands) {
    if (k.type === 'M' && cur.length) yollar.push(cur), (cur = []);
    cur.push(k);
  }
  yollar.push(cur);
  const kutu = (y) => {
    const ys = y.filter((k) => 'y' in k).map((k) => k.y);
    const xs = y.filter((k) => 'x' in k).map((k) => k.x);
    return { x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) };
  };
  return yollar.map(kutu).sort((a, b) => b.y2 - a.y2)[0];
}
export const NOKTA = noktaKutusu();

/** Logo yazısı: i'ler noktasız ı + kırmızı daire. boy = em boyu (piksel); taban = yazı tabanının y'si. */
export function logoYazisi(metin, x, taban, boy, renk) {
  const o = boy / MONO.unitsPerEm;
  let d = '';
  let daireler = '';
  let imlec = x;
  for (const h of metin) {
    const g = MONO.charToGlyph(h === 'i' ? 'ı' : h);
    d += g.getPath(imlec, taban, boy).toPathData(2);
    if (h === 'i') {
      // TrueType y yukarı; SVG y aşağı.
      const cx = imlec + ((NOKTA.x1 + NOKTA.x2) / 2) * o;
      const cy = taban - ((NOKTA.y1 + NOKTA.y2) / 2) * o;
      const r = (Math.max(NOKTA.x2 - NOKTA.x1, NOKTA.y2 - NOKTA.y1) / 2) * 1.12 * o;
      daireler += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${RENK.kirmizi}"/>`;
    }
    imlec += g.advanceWidth * o + ARALIK * boy;
  }
  return { ic: `<path d="${d}" fill="${renk}"/>${daireler}`, genislik: imlec - x - ARALIK * boy };
}

// Testler için: yol olarak çizilen yazı SVG'den geri okunamaz; kayıt açıkken her yazı metni burada toplanır.
let kayit = null;
export const yaziKaydiBaslat = () => (kayit = []);
export function yaziKaydiBitir() {
  const k = kayit;
  kayit = null;
  return k;
}

/** Düz yazı (yol olarak). */
export function yazi(font, metin, x, taban, boy, renk) {
  if (kayit) kayit.push(metin);
  return `<path d="${font.getPath(metin, x, taban, boy).toPathData(2)}" fill="${renk}"/>`;
}
export const genislik = (font, metin, boy) => font.getAdvanceWidth(metin, boy);

/** Kelime kelime satırlara böler; sığmayan tek kelime kendi satırında kalır. */
export function satirla(font, metin, boy, enGenis) {
  const satirlar = [];
  let satir = '';
  for (const k of metin.split(/\s+/)) {
    const aday = satir ? `${satir} ${k}` : k;
    if (satir && genislik(font, aday, boy) > enGenis) satirlar.push(satir), (satir = k);
    else satir = aday;
  }
  if (satir) satirlar.push(satir);
  return satirlar;
}

export const svg = (g, y, ic, zemin) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${g.toFixed(0)}" height="${y.toFixed(0)}" viewBox="0 0 ${g.toFixed(1)} ${y.toFixed(1)}">${zemin ? `<rect width="100%" height="100%" fill="${zemin}"/>` : ''}${ic}</svg>`;
