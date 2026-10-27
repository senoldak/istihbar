// Habere özel kart şablonları (1280 x 720 PNG). Veri vesaire'nin yazım adımından gelir ve orada kaynakla doğrulanmıştır
// (vesaire src/kart-sablon.js, aynı alan adları). Ortak çerçeve: solda üstte logo, sağda üstte saat, altta haberin başlığı.
// Kaynak adı yok (kaynaksız kanal). Taslaklar: mecmua/docs/istihbar-kartlar/sablon-*.png.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { genislik, logoYazisi, MONO, RENK, SANS, satirla, svg, yazi } from './kimlik.mjs';

const G = 1280;
const Y = 720;
const K = 72;
const YESIL = '#1f7a4d';
const LACIVERT = '#2b4a7a';
const ACIK_GRI = '#b9b4a8';
const DENIZ = '#e6edf1';
const KARA = '#ece8df';
const TR_KARA = '#fbfaf6';
const SINIR = '#9a9486';

const harita = (ad) => JSON.parse(fs.readFileSync(fileURLToPath(new URL(`../brand/harita/${ad}.json`, import.meta.url)), 'utf8'));
let TURKIYE;
let DUNYA;

const saatTr = (ms) => new Date(ms).toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });
const sayiTr = (x) => {
  const [t, o] = String(Math.round(x * 100) / 100).split('.');
  return t.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (o ? `,${o}` : '');
};
const degerTr = (x, birim) => (birim === '%' ? `%${sayiTr(x)}` : birim === 'TL' ? `${sayiTr(x)} TL` : birim ? `${sayiTr(x)} ${birim}` : sayiTr(x));
const kisalt = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const sade = (s) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/[ıi̇]/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();

function ust(yayin, { rozet = false } = {}) {
  if (!rozet) return logoYazisi('istihbar', K, 104, 44, RENK.murekkep).ic + (yayin ? saat(yayin) : '');
  const l = logoYazisi('istihbar', K + 24, 104, 44, RENK.murekkep);
  return `<rect x="${K}" y="50" width="${(l.genislik + 48).toFixed(1)}" height="76" rx="14" fill="#ffffff" fill-opacity="0.88"/>${l.ic}`;
}
const saat = (yayin) => {
  const s = saatTr(yayin);
  return yazi(MONO, s, G - K - genislik(MONO, s, 30), 100, 30, RENK.gri);
};
// Başlık: altta en çok 2 satır; sığmazsa küçülür.
function baslikYaz(baslik, taban = 640) {
  let boy = 40;
  let s = satirla(SANS, baslik, boy, G - 2 * K);
  while (s.length > 2 && boy > 28) s = satirla(SANS, baslik, (boy -= 2), G - 2 * K);
  s = s.slice(0, 2);
  return s.map((x, i) => yazi(SANS, x, K, taban - (s.length - 1 - i) * boy * 1.18, boy, RENK.murekkep)).join('');
}
const cizgi = (y) => `<rect x="${K}" y="${y}" width="${G - 2 * K}" height="2" fill="${RENK.cizgi}"/>`;
const ucgen = (x, y, yukari, renk) =>
  yukari ? `<path d="M${x},${y + 8} L${x + 18},${y + 8} L${x + 9},${y - 8} Z" fill="${renk}"/>` : `<path d="M${x},${y - 8} L${x + 18},${y - 8} L${x + 9},${y + 8} Z" fill="${renk}"/>`;

const SABLON = {
  meclis(k) {
    const renkler = [LACIVERT, RENK.kirmizi, YESIL, '#c58b1a', '#6b4e9b'];
    const partiler = k.ogeler.map((o, i) => ({ ...o, renk: /^diğer/i.test(o.ad) ? ACIK_GRI : renkler[i % renkler.length] }));
    const toplam = k.toplam;
    const cx = 420;
    const cy = 470;
    const r0 = 120;
    const r1 = 300;
    const sira = 9;
    const noktalar = [];
    for (let s = 0; s < sira; s++) {
      const r = r0 + ((r1 - r0) * s) / (sira - 1);
      const n = Math.round((toplam * r) / ((r0 + r1) / 2) / sira);
      for (let j = 0; j < n; j++) noktalar.push({ a: Math.PI - (Math.PI * j) / Math.max(1, n - 1), r });
    }
    noktalar.sort((p, q) => q.a - p.a);
    while (noktalar.length > toplam) noktalar.splice(Math.floor(noktalar.length / 2), 1);
    const yaricap = Math.max(4, Math.min(9.5, 2400 / toplam));
    let ic = '';
    let i = 0;
    for (const p of partiler)
      for (let j = 0; j < p.deger && i < noktalar.length; j++, i++) {
        const q = noktalar[i];
        ic += `<circle cx="${(cx + q.r * Math.cos(q.a)).toFixed(1)}" cy="${(cy - q.r * Math.sin(q.a)).toFixed(1)}" r="${yaricap}" fill="${p.renk}"/>`;
      }
    for (; i < noktalar.length; i++) {
      const q = noktalar[i];
      ic += `<circle cx="${(cx + q.r * Math.cos(q.a)).toFixed(1)}" cy="${(cy - q.r * Math.sin(q.a)).toFixed(1)}" r="${yaricap}" fill="${RENK.cizgi}"/>`;
    }
    const cogunluk = String(Math.floor(toplam / 2) + 1);
    ic += yazi(MONO, cogunluk, cx - genislik(MONO, cogunluk, 26) / 2, cy + 2, 26, RENK.gri);
    ic += yazi(MONO, 'çoğunluk', cx - genislik(MONO, 'çoğunluk', 18) / 2, cy + 26, 18, RENK.gri);
    let ly = 250;
    for (const p of partiler.slice(0, 5)) {
      ic += `<rect x="780" y="${ly - 26}" width="22" height="22" rx="4" fill="${p.renk}"/>`;
      ic += yazi(SANS, kisalt(p.ad, 22), 816, ly - 6, 26, RENK.murekkep);
      ic += yazi(MONO, String(p.deger), G - K - genislik(MONO, String(p.deger), 40), ly, 40, RENK.murekkep);
      ly += 64;
    }
    return ic + yazi(MONO, `${toplam} sandalye`, 780, ly + 6, 24, RENK.gri);
  },

  sonuc(k) {
    const ogeler = k.ogeler.slice(0, 4);
    const enBuyuk = Math.max(...ogeler.map((o) => o.deger));
    const adim = ogeler.length > 2 ? 100 : 150;
    let ic = '';
    let y = 220;
    ogeler.forEach((o, i) => {
      ic += yazi(SANS, kisalt(o.ad, 40), K, y, 30, RENK.murekkep);
      const w = ((G - 2 * K - 220) * o.deger) / enBuyuk;
      ic += `<rect x="${K}" y="${y + 16}" width="${w.toFixed(1)}" height="${adim > 100 ? 54 : 40}" fill="${i === 0 ? LACIVERT : i === 1 ? RENK.kirmizi : ACIK_GRI}"/>`;
      ic += yazi(MONO, degerTr(o.deger, o.birim ?? '%'), K + w + 20, y + (adim > 100 ? 60 : 48), adim > 100 ? 44 : 34, RENK.murekkep);
      y += adim;
    });
    return ic;
  },

  harita(k) {
    TURKIYE ??= harita('turkiye');
    const il = TURKIYE.iller.find((x) => sade(x.ad) === sade(k.yer));
    if (!il) throw new Error(`bilinmeyen il: ${k.yer}`);
    const SIK = Math.cos((39 * Math.PI) / 180);
    const OL = G / (21 * SIK);
    const iz = ([lo, la]) => [G / 2 + (lo - 35.2) * SIK * OL, Y / 2 - (la - 38.9) * OL - 60];
    const yol = (hs) => hs.map((h) => `M${h.map((p) => iz(p).map((v) => v.toFixed(1)).join(',')).join('L')}Z`).join('');
    let ic = `<rect width="${G}" height="${Y}" fill="${DENIZ}"/>`;
    for (const u of TURKIYE.ulkeler) if (u.kod !== 'TUR') ic += `<path d="${yol(u.halkalar)}" fill="${KARA}" stroke="${SINIR}" stroke-width="0.8"/>`;
    ic += `<path d="${TURKIYE.iller.map((x) => yol(x.halkalar)).join('')}" fill="${TR_KARA}" stroke="#d3cdbf" stroke-width="0.9"/>`;
    ic += `<path d="${yol(il.halkalar)}" fill="${RENK.kirmizi}" fill-opacity="0.18" stroke="${RENK.kirmizi}" stroke-width="1.5"/>`;
    const [x, y] = iz(merkez(il.halkalar));
    ic += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="${RENK.kirmizi}" stroke="#fff" stroke-width="3"/>`;
    ic += yazi(SANS, k.yer, x + 20, y + 10, 30, RENK.murekkep);
    return { arka: ic };
  },

  dunya(k) {
    DUNYA ??= harita('dunya');
    const aranan = sade(TAKMA[sade(k.yer)] ?? k.yer);
    const ulke = DUNYA.ulkeler.find((u) => sade(u.ad_tr ?? '') === aranan || sade(u.ad) === aranan);
    if (!ulke) throw new Error(`bilinmeyen ülke: ${k.yer}`);
    const [x0, y0, x1, y1] = kutu(ulke.halkalar.slice().sort((a, b) => b.length - a.length)[0]);
    const cxg = (x0 + x1) / 2;
    const cyg = (y0 + y1) / 2;
    const SIK = Math.cos((cyg * Math.PI) / 180);
    const alanY = 560;
    const gen = Math.max(20, (x1 - x0) * 2.2, ((y1 - y0) * 2.2 * G) / alanY / SIK);
    const OL = G / (gen * SIK);
    const iz = ([lo, la]) => [G / 2 + (lo - cxg) * SIK * OL, alanY / 2 + 10 - (la - cyg) * OL];
    const yol = (hs) => hs.map((h) => `M${h.map((p) => iz(p).map((v) => v.toFixed(1)).join(',')).join('L')}Z`).join('');
    const gorunur = (u) => {
      const [a, b, c, d] = kutu(u.halkalar.flat());
      return c >= cxg - gen && a <= cxg + gen && d >= cyg - gen && b <= cyg + gen;
    };
    let ic = `<rect width="${G}" height="${Y}" fill="${DENIZ}"/>`;
    for (const u of DUNYA.ulkeler) if (u !== ulke && gorunur(u)) ic += `<path d="${yol(u.halkalar)}" fill="${KARA}" stroke="${SINIR}" stroke-width="0.8"/>`;
    ic += `<path d="${yol(ulke.halkalar)}" fill="${RENK.kirmizi}" stroke="${SINIR}" stroke-width="1"/>`;
    const [x, y] = iz([cxg, cyg]);
    const ad = ulke.ad_tr ?? k.yer;
    const lx = x + 140 + genislik(SANS, ad, 34) > G - 20 ? x - 140 - genislik(SANS, ad, 34) : x + 140;
    ic += `<path d="M${x.toFixed(1)},${y.toFixed(1)} L${(lx > x ? lx - 8 : lx + genislik(SANS, ad, 34) + 8).toFixed(1)},${(y - 60).toFixed(1)}" stroke="${RENK.murekkep}" stroke-width="2"/>`;
    ic += `<rect x="${(lx - 10).toFixed(1)}" y="${(y - 96).toFixed(1)}" width="${(genislik(SANS, ad, 34) + 20).toFixed(1)}" height="52" rx="8" fill="#ffffff" fill-opacity="0.88"/>`;
    ic += yazi(SANS, ad, lx, y - 58, 34, RENK.murekkep);
    return { arka: ic };
  },

  buyuk_rakam(k) {
    const s = sayiTr(k.sayi);
    let boy = 300;
    while (genislik(MONO, s, boy) > 620 && boy > 140) boy -= 20;
    const w = genislik(MONO, s, boy);
    let ic = yazi(MONO, s, K - 8, 430, boy, RENK.kirmizi);
    const sat = satirla(SANS, k.aciklama, 44, G - 2 * K - w - 40).slice(0, 3);
    sat.forEach((x, i) => (ic += yazi(SANS, x, K + w + 24, 330 + i * 60, 44, RENK.murekkep)));
    return ic + cizgi(490);
  },

  once_sonra(k) {
    let ic = k.aciklama ? yazi(MONO, k.aciklama, K, 200, 28, RENK.gri) : '';
    const a = degerTr(k.once.deger, k.birim);
    const b = degerTr(k.sonra.deger, k.birim);
    let boy = 140;
    while (Math.max(genislik(MONO, a, boy), genislik(MONO, b, boy)) > 470 && boy > 70) boy -= 10;
    ic += yazi(MONO, k.once.etiket, K, 270, 26, RENK.gri) + yazi(MONO, a, K, 410, boy, RENK.gri);
    ic += `<path d="M560,360 L640,360 M620,340 L645,360 L620,380" stroke="${RENK.murekkep}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    const artis = k.sonra.deger >= k.once.deger;
    const renk = artis ? RENK.kirmizi : YESIL;
    ic += yazi(MONO, k.sonra.etiket, 700, 270, 26, RENK.gri) + yazi(MONO, b, 700, 410, boy, renk);
    const fark = Math.round((k.sonra.deger - k.once.deger) * 100) / 100;
    const farkMetni = `${fark >= 0 ? '+' : '−'}${sayiTr(Math.abs(fark))} ${k.birim === '%' ? 'puan' : k.birim ?? ''}`.trim();
    return ic + yazi(MONO, farkMetni, 700, 460, 30, renk);
  },

  alinti(k) {
    let ic = yazi(SANS, '“', K - 10, 300, 200, RENK.kirmizi);
    let boy = 50;
    let s = satirla(SANS, k.soz, boy, G - 2 * K - 60);
    while (s.length > 4 && boy > 32) s = satirla(SANS, k.soz, (boy -= 4), G - 2 * K - 60);
    s = s.slice(0, 4);
    s.forEach((x, i) => (ic += yazi(SANS, x, K + 60, 250 + i * boy * 1.24, boy, RENK.murekkep)));
    const kim = [k.kisi, k.unvan].filter(Boolean).join(' · ');
    ic += yazi(MONO, kisalt(kim, 60), K + 60, 250 + s.length * boy * 1.24 + 30, 26, RENK.gri);
    return ic + cizgi(560);
  },

  zaman(k) {
    const y = 330;
    const x0 = K + 20;
    const x1 = G - K - 20;
    let ic = `<rect x="${x0}" y="${y - 2}" width="${x1 - x0}" height="4" fill="${RENK.murekkep}"/>`;
    const n = k.olaylar.length;
    k.olaylar.forEach((o, i) => {
      const x = x0 + ((x1 - x0) * i) / (n - 1);
      const son = i === n - 1;
      ic += `<circle cx="${x}" cy="${y}" r="${son ? 16 : 11}" fill="${son ? RENK.kirmizi : RENK.murekkep}"/>`;
      const hiza = (w) => (i === 0 ? x - 10 : son ? x + 10 - w : x - w / 2);
      ic += yazi(MONO, o.tarih, hiza(genislik(MONO, o.tarih, 24)), y - 40, 24, son ? RENK.kirmizi : RENK.gri);
      satirla(SANS, o.metin, 28, (x1 - x0) / n - 20)
        .slice(0, 3)
        .forEach((sat, j) => (ic += yazi(SANS, sat, hiza(genislik(SANS, sat, 28)), y + 60 + j * 34, 28, RENK.murekkep)));
    });
    return ic;
  },

  oylama(k) {
    const renk = (ad, i) => (/kabul|evet/i.test(ad) ? YESIL : /ret|hayır/i.test(ad) ? RENK.kirmizi : i === 0 ? YESIL : i === 1 ? RENK.kirmizi : ACIK_GRI);
    const ogeler = k.ogeler.slice(0, 3);
    const top = ogeler.reduce((t, o) => t + o.deger, 0) || 1;
    const w = G - 2 * K;
    let x = K;
    let ic = '';
    ogeler.forEach((o, i) => {
      const g = (w * o.deger) / top;
      ic += `<rect x="${x.toFixed(1)}" y="250" width="${g.toFixed(1)}" height="90" fill="${renk(o.ad, i)}"/>`;
      x += g;
    });
    ic += `<rect x="${K + w / 2 - 1.5}" y="230" width="3" height="130" fill="${RENK.murekkep}"/>`;
    ic += yazi(MONO, 'salt çoğunluk', K + w / 2 + 10, 228, 20, RENK.gri);
    ogeler.forEach((o, i) => {
      const xx = K + i * 360;
      ic += `<rect x="${xx}" y="402" width="20" height="20" rx="4" fill="${renk(o.ad, i)}"/>`;
      ic += yazi(SANS, kisalt(o.ad, 18), xx + 32, 421, 28, RENK.murekkep);
      ic += yazi(MONO, sayiTr(o.deger), xx + 32, 480, 52, RENK.murekkep);
    });
    return ic;
  },

  zam(k) {
    let ic = yazi(MONO, kisalt(k.aciklama, 60), K, 200, 26, RENK.gri);
    const a = degerTr(k.once.deger, k.birim);
    const b = degerTr(k.sonra.deger, k.birim);
    ic += yazi(MONO, a, K, 360, 92, RENK.gri);
    ic += `<rect x="${K}" y="318" width="${genislik(MONO, a, 92).toFixed(1)}" height="6" fill="${RENK.gri}"/>`;
    const artis = k.sonra.deger >= k.once.deger;
    const renk = artis ? RENK.kirmizi : YESIL;
    ic += yazi(MONO, b, 660, 360, 92, renk);
    const fark = Math.round(Math.abs(k.sonra.deger - k.once.deger) * 100) / 100;
    ic += yazi(MONO, `${artis ? '+' : '−'}${degerTr(fark, k.birim)}`, 660, 420, 34, renk);
    return ic + cizgi(490);
  },

  geri_sayim(k) {
    const s = String(k.gun);
    const w = genislik(MONO, s, 340);
    let ic = yazi(MONO, s, K - 6, 470, 340, RENK.kirmizi);
    ic += yazi(SANS, 'gün kaldı', K + w + 30, 330, 56, RENK.murekkep);
    ic += yazi(MONO, k.tarih, K + w + 30, 390, 30, RENK.gri);
    ic += yazi(SANS, kisalt(k.aciklama, 40), K + w + 30, 440, 30, RENK.murekkep);
    return ic + cizgi(510);
  },

  atama(k) {
    let ic = yazi(MONO, k.durum, K, 210, 26, /AYRILDI|ALINDI/.test(k.durum) ? RENK.kirmizi : YESIL);
    let boy = 84;
    while (genislik(SANS, k.kisi, boy) > G - 2 * K && boy > 48) boy -= 4;
    ic += yazi(SANS, k.kisi, K, 320, boy, RENK.murekkep);
    ic += yazi(SANS, kisalt(k.unvan, 50), K, 385, 38, RENK.gri);
    return ic + cizgi(470);
  },

  karsilastirma(k) {
    const ogeler = k.ogeler.slice(0, 5);
    const enBuyuk = Math.max(...ogeler.map((o) => o.deger));
    let ic = k.aciklama ? yazi(MONO, k.aciklama, K, 190, 24, RENK.gri) : '';
    ogeler.forEach((o, i) => {
      const y = 220 + i * 66;
      ic += yazi(SANS, kisalt(o.ad, 16), K, y + 38, 30, RENK.murekkep);
      const w = (700 * o.deger) / enBuyuk;
      ic += `<rect x="330" y="${y + 10}" width="${w.toFixed(1)}" height="38" fill="${i === 0 ? RENK.kirmizi : LACIVERT}"/>`;
      ic += yazi(MONO, degerTr(o.deger, o.birim ?? k.birim), 330 + w + 16, y + 40, 30, RENK.murekkep);
    });
    return ic;
  },

  siralama(k) {
    let ic = '';
    k.ogeler.slice(0, 5).forEach((o, i, l) => {
      const y = 210 + i * 70;
      ic += yazi(MONO, String(i + 1), K, y + 40, 40, i === 0 ? RENK.kirmizi : RENK.gri);
      ic += yazi(SANS, kisalt(o.ad, 30), K + 70, y + 40, 38, RENK.murekkep);
      const d = degerTr(o.deger, o.birim);
      ic += yazi(MONO, d, G - K - genislik(MONO, d, 36), y + 40, 36, RENK.murekkep);
      if (i < l.length - 1) ic += `<rect x="${K + 70}" y="${y + 60}" width="${G - 2 * K - 70}" height="1.5" fill="${RENK.cizgi}"/>`;
    });
    return ic;
  },
};

// Gemini'nin kısa ya da gündelik ülke adları → Natural Earth Türkçe adı.
const TAKMA = {
  abd: 'Amerika Birleşik Devletleri',
  amerika: 'Amerika Birleşik Devletleri',
  ingiltere: 'Birleşik Krallık',
  cin: 'Çin Halk Cumhuriyeti',
  kongo: 'Demokratik Kongo Cumhuriyeti',
  cekya: 'Çek Cumhuriyeti',
  gazze: 'Filistin',
};

function kutu(noktalar) {
  const xs = noktalar.map((p) => p[0]);
  const ys = noktalar.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
function merkez(halkalar) {
  const [a, b, c, d] = kutu(halkalar.slice().sort((x, y) => y.length - x.length)[0]);
  return [(a + c) / 2, (b + d) / 2];
}

/** { kart: { sablon, … }, baslik, yayin } → SVG. Bilinmeyen şablon ya da veri fırlatır (çağıran düz karta düşer). */
export function ozelKartSvg({ kart, baslik, yayin }) {
  const ciz = SABLON[kart?.sablon];
  if (!ciz) throw new Error(`bilinmeyen şablon: ${kart?.sablon}`);
  const sonuc = ciz(kart);
  if (typeof sonuc === 'object') {
    // Harita şablonları: harita bütün kartı kaplar, başlık altta beyaz bantta.
    const bant = `<rect x="0" y="${Y - 150}" width="${G}" height="150" fill="#ffffff" fill-opacity="0.93"/>`;
    return svg(G, Y, sonuc.arka + ust(yayin, { rozet: true }) + bant + baslikYaz(baslik, 640));
  }
  return svg(G, Y, ust(yayin) + sonuc + baslikYaz(baslik, 640), RENK.kagit);
}

export const ozelKartPng = (girdi) => sharp(Buffer.from(ozelKartSvg(girdi))).png().toBuffer();
