// Yatay kart (1280×720, spec 2026-11-25 §4.4 ve §5.2). Bölgeler ayrı, hiçbiri üst üste binmez:
// üst başlık (KATEGORİ · SS:DD) + başlık; görselsiz kartta başlık ortada; veri görselinde başlığın altında görsel;
// haritalı kartta minimal panel (solda başlık ve bilgi şeridi, sağda kâğıda eriyen harita); altta çizgili taban.
import sharp from 'sharp';
import { haritaSvg } from './harita.mjs';
import { BASLIK, ETIKET, genislik, kutuKaydet, logoTelgraf, RENK, sigdir, svg, yazi } from './kimlik.mjs';
import { VERI_GORSELLERI } from './veri.mjs';

export const G = 1280;
export const Y = 720;
const K = 64;
const UST = 48;
const TABAN = 624; // taban çizgisinin y'si; altı 96 px
const UB_BOY = 23;
const UB_ARALIK = 0.14;

// Veri görselleri: şablon adı → ({ kart, alan: {x, y, g, h} }) → svg içi (veri.mjs).
export const GORSELLER = VERI_GORSELLERI;

function ustBaslik({ kategori, saat, sonDakika, tsi }) {
  const zaman = tsi ? `${saat} TSİ` : saat;
  const bas = sonDakika ? 'SON DAKİKA' : kategori || null;
  const taban = UST + UB_BOY * 0.74;
  let ic = '';
  let x = K;
  if (bas) {
    ic += yazi(ETIKET, bas, x, taban, UB_BOY, sonDakika ? RENK.vurgu : RENK.ikincil, { aralik: UB_ARALIK });
    x += genislik(ETIKET, bas, UB_BOY, { aralik: UB_ARALIK });
    const ara = ` · ${zaman}`;
    ic += yazi(ETIKET, ara, x, taban, UB_BOY, RENK.ikincil, { aralik: UB_ARALIK });
    x += genislik(ETIKET, ara, UB_BOY, { aralik: UB_ARALIK });
  } else {
    ic += yazi(ETIKET, zaman, x, taban, UB_BOY, RENK.ikincil, { aralik: UB_ARALIK });
    x += genislik(ETIKET, zaman, UB_BOY, { aralik: UB_ARALIK });
  }
  kutuKaydet('ustBaslik', K, UST, x - K, UB_BOY * 0.74);
  return ic;
}

// Başlık satırları; ust = ilk satırın üst kenarı. Dönen alt = son satırın alt kenarı.
function baslikYaz(metin, { boy, enAz, enCokSatir, enGenis, ust }) {
  const r = sigdir(BASLIK, metin, { boy, enAz, enGenis, enCokSatir });
  const aralik = r.boy * 1.06;
  const ustBosluk = r.boy * 0.76; // büyük harf yüksekliği
  let ic = '';
  r.satirlar.forEach((s, i) => (ic += yazi(BASLIK, s, K, ust + ustBosluk + i * aralik, r.boy, RENK.murekkep)));
  const h = ustBosluk + (r.satirlar.length - 1) * aralik + r.boy * 0.22;
  kutuKaydet('baslik', K, ust, Math.max(...r.satirlar.map((s) => genislik(BASLIK, s, r.boy))), h);
  return { ic, alt: ust + h, boy: r.boy, satir: r.satirlar.length };
}

function taban(tarih) {
  const l = logoTelgraf(K, TABAN + 26, 44);
  const tb = TABAN + 48 + 22 * 0.36;
  const tg = genislik(ETIKET, tarih, 22, { aralik: 0.12 });
  kutuKaydet('taban', 0, TABAN, G, Y - TABAN);
  return `<rect x="0" y="${TABAN}" width="${G}" height="2" fill="${RENK.cizgi}"/>${l.ic}${yazi(ETIKET, tarih, G - K - tg, tb, 22, RENK.ikincil, { aralik: 0.12 })}`;
}

// Bilgi şeridi: sütunun dibinde, en çok 3 sütun, boş değer çizilmez, enGenis'e sığmayan sütun düşer.
function bilgiSeridi(bilgi, { alt, enGenis }) {
  const ogeler = bilgi.filter((b) => b && String(b.deger ?? '').trim()).slice(0, 3);
  if (!ogeler.length) return '';
  const degerBoy = (b) => (b.buyuk ? 68 : 36);
  const enBuyuk = Math.max(...ogeler.map(degerBoy));
  const degerTaban = alt;
  const etiketTaban = degerTaban - enBuyuk * 0.74 - 14;
  const cizgiY = etiketTaban - 18 * 0.74 - 18;
  let ic = '';
  let x = K;
  for (const b of ogeler) {
    const etiket = String(b.etiket).toLocaleUpperCase('tr');
    const deger = String(b.deger);
    const w = Math.max(genislik(ETIKET, etiket, 18, { aralik: 0.14 }), genislik(BASLIK, deger, degerBoy(b)));
    if (x + w > K + enGenis) break;
    ic += yazi(ETIKET, etiket, x, etiketTaban, 18, RENK.ikincil, { aralik: 0.14 });
    ic += yazi(BASLIK, deger, x, degerTaban, degerBoy(b), RENK.murekkep);
    x += w + 44;
  }
  const gen = x - 44 - K;
  kutuKaydet('bilgi', K, cizgiY, Math.max(gen, 1), degerTaban + 8 - cizgiY);
  return `<rect x="${K}" y="${cizgiY.toFixed(1)}" width="${enGenis}" height="2" fill="${RENK.murekkep}"/>${ic}`;
}

/** girdi: { kategori?, saat, sonDakika?, tsi?, baslik, tarih, gorsel? } */
export function yatayKartSvg({ kategori, saat, sonDakika = false, tsi = false, baslik, tarih, gorsel = null }) {
  let ic = ustBaslik({ kategori, saat, sonDakika, tsi });
  const ust = UST + UB_BOY + 20;
  if (!gorsel) {
    // Başlık üst başlıkla taban arasında dikeyde ortalı.
    const deneme = sigdir(BASLIK, baslik, { boy: 88, enAz: 64, enGenis: G - 2 * K, enCokSatir: 3 });
    const h = deneme.boy * 0.76 + (deneme.satirlar.length - 1) * deneme.boy * 1.06 + deneme.boy * 0.22;
    const ortaUst = Math.max(ust, (ust + TABAN - 24) / 2 - h / 2);
    ic += baslikYaz(baslik, { boy: 88, enAz: 64, enCokSatir: 3, enGenis: G - 2 * K, ust: ortaUst }).ic;
  } else if (gorsel.tur === 'harita') {
    const SUTUN = 556;
    const b = baslikYaz(baslik, { boy: 62, enAz: 44, enCokSatir: 3, enGenis: SUTUN, ust });
    const h = haritaSvg(gorsel.girdi, { g: 660, y: TABAN });
    const bilgi = typeof gorsel.bilgi === 'function' ? gorsel.bilgi(h.yer) : gorsel.bilgi ?? [];
    ic = `<svg x="620" y="0" width="660" height="${TABAN}" viewBox="0 0 660 ${TABAN}" overflow="hidden">${h.ic}</svg>` + ic + b.ic + bilgiSeridi(bilgi, { alt: TABAN - 40, enGenis: SUTUN });
    kutuKaydet('harita', 716, 0, G - 716, TABAN);
  } else if (gorsel.tur === 'veri') {
    const ciz = GORSELLER[gorsel.sablon];
    if (!ciz) throw new Error(`bilinmeyen şablon: ${gorsel.sablon}`);
    const b = baslikYaz(baslik, { boy: 60, enAz: 44, enCokSatir: 2, enGenis: G - 2 * K, ust });
    const alan = { x: K, y: b.alt + 28, g: G - 2 * K, h: TABAN - 32 - (b.alt + 28) };
    ic += b.ic + ciz({ kart: gorsel.kart, alan });
    kutuKaydet('gorsel', alan.x, alan.y, alan.g, alan.h);
  } else {
    throw new Error(`bilinmeyen görsel türü: ${gorsel.tur}`);
  }
  return svg(G, Y, ic + taban(tarih));
}

export const yatayKartPng = (girdi) => sharp(Buffer.from(yatayKartSvg(girdi))).png().toBuffer();
