// Habere özel veri görselleri (spec 2026-11-25 §5.1). Alan adları vesaire src/kart-sablon.js ile aynı; veri orada kaynakla
// doğrulanmıştır. Her çizici ({ kart, alan: {x, y, g, h} }) → svg içi; alanın dışına çizmez.
import { BASLIK, ETIKET, genislik, RENK, sigdir, yazi } from './kimlik.mjs';

export const sayiTr = (x, basamak = null) => {
  const [t, o] = (basamak == null ? String(Math.round(x * 100) / 100) : x.toFixed(basamak)).split('.');
  return t.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (o ? `,${o}` : '');
};
export const degerTr = (x, birim) => (birim === '%' ? `%${sayiTr(x)}` : birim === 'TL' ? `${sayiTr(x, 2)} TL` : birim ? `${sayiTr(x)} ${birim}` : sayiTr(x));
const kisalt = (font, s, boy, en) => {
  if (genislik(font, s, boy) <= en) return s;
  while (s && genislik(font, `${s}…`, boy) > en) s = s.slice(0, -1);
  return `${s.trimEnd()}…`;
};
const ortaY = (alan, h) => alan.y + Math.max(0, (alan.h - h) / 2);

function meclis({ kart: k, alan }) {
  const ogeler = k.ogeler ?? [];
  const toplam = Number(k.toplam);
  if (ogeler.length < 2 || !(toplam > 0) || ogeler.reduce((t, o) => t + o.deger, 0) > toplam) throw new Error('meclis verisi tutarsız');
  const renk = [RENK.vurgu, RENK.lacivert];
  const r1 = Math.min(200, alan.h * 0.92);
  const r2 = r1 * 0.6;
  const cx = alan.x + r1;
  const cy = ortaY(alan, r1) + r1;
  const p = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy - r * Math.sin(a)).toFixed(1)}`;
  let ic = '';
  let a0 = Math.PI;
  ogeler.forEach((o, i) => {
    const a1 = a0 - (o.deger / toplam) * Math.PI;
    ic += `<path d="M${p(r1, a0)}A${r1},${r1} 0 0 1 ${p(r1, a1)}L${p(r2, a1)}A${r2},${r2} 0 0 0 ${p(r2, a0)}Z" fill="${renk[i] ?? RENK.griCubuk}" stroke="${RENK.zemin}" stroke-width="4"/>`;
    a0 = a1;
  });
  ic += `<path d="M${cx},${cy - r1 - 12}L${cx},${cy - r2 + 12}" stroke="${RENK.murekkep}" stroke-width="3" stroke-dasharray="6 6"/>`;
  // Lejant
  const lx = cx + r1 + 64;
  const sutun = alan.x + alan.g - lx;
  const satir = 52;
  const ly = cy - r1 + 20;
  ogeler.slice(0, 5).forEach((o, i) => {
    const y = ly + i * satir;
    const deger = sayiTr(o.deger);
    const dw = genislik(BASLIK, deger, 34);
    ic += `<rect x="${lx}" y="${y - 22}" width="24" height="24" fill="${renk[i] ?? RENK.griCubuk}"/>`;
    ic += yazi(BASLIK, kisalt(BASLIK, o.ad, 30, sutun - dw - 70), lx + 40, y, 30, RENK.murekkep);
    ic += yazi(BASLIK, deger, alan.x + alan.g - dw, y + 2, 34, RENK.murekkep);
  });
  ic += yazi(ETIKET, `${sayiTr(toplam)} sandalye · çoğunluk ${Math.floor(toplam / 2) + 1}`, lx, ly + Math.min(5, ogeler.length) * satir + 10, 22, RENK.ikincil, { aralik: 0.06 });
  return ic;
}

// Önce → sonra ve zam aynı dili kullanır: eski değer gri, ok vurgu, yeni değer mürekkep, yanda açıklama/fark.
function onceSonra({ kart: k, alan }, { farkYaz }) {
  const boy = Math.min(80, alan.h * 0.5);
  const taban = ortaY(alan, boy * 1.3) + 22 + boy * 0.74;
  const once = degerTr(k.once.deger, k.birim);
  const sonra = degerTr(k.sonra.deger, k.birim);
  let x = alan.x;
  let ic = yazi(ETIKET, String(k.once.etiket).toLocaleUpperCase('tr'), x, taban - boy * 0.74 - 16, 21, RENK.ikincil, { aralik: 0.12 });
  ic += yazi(BASLIK, once, x, taban, boy, RENK.griCubuk);
  x += genislik(BASLIK, once, boy) + 32;
  ic += yazi(BASLIK, '→', x, taban - boy * 0.12, boy * 0.6, RENK.vurgu);
  x += genislik(BASLIK, '→', boy * 0.6) + 32;
  ic += yazi(ETIKET, String(k.sonra.etiket).toLocaleUpperCase('tr'), x, taban - boy * 0.74 - 16, 21, RENK.ikincil, { aralik: 0.12 });
  ic += yazi(BASLIK, sonra, x, taban, boy, RENK.murekkep);
  x += genislik(BASLIK, sonra, boy) + 40;
  const ek = farkYaz(k);
  if (ek) ic += yazi(ETIKET, kisalt(ETIKET, ek, 26, alan.x + alan.g - x), x, taban - 6, 26, RENK.ikincil);
  return ic;
}
const farkMetni = (k) => {
  const f = Math.round((k.sonra.deger - k.once.deger) * 100) / 100;
  const isaret = f > 0 ? '+' : f < 0 ? '−' : '';
  return k.birim === '%' ? `${isaret}${sayiTr(Math.abs(f))} puan` : `${isaret}${degerTr(Math.abs(f), k.birim)}`;
};

function cubuklar({ kart: k, alan }) {
  const ogeler = (k.ogeler ?? []).slice(0, 5);
  if (!ogeler.length) throw new Error('çubuk verisi yok');
  const en = Math.max(...ogeler.map((o) => o.deger));
  const satir = Math.min(64, alan.h / ogeler.length);
  const adG = 280;
  const degerG = 140;
  const cubukG = alan.g - adG - degerG - 48;
  const ust = ortaY(alan, satir * ogeler.length);
  const turkiyeVar = ogeler.some((o) => o.ad === 'Türkiye');
  let ic = '';
  ogeler.forEach((o, i) => {
    const orta = ust + i * satir + satir / 2;
    const vurgu = turkiyeVar ? o.ad === 'Türkiye' : i === 0;
    const deger = degerTr(o.deger, o.birim ?? k.birim);
    ic += yazi(BASLIK, kisalt(BASLIK, o.ad, 28, adG - 16), alan.x, orta + 10, 28, RENK.murekkep);
    ic += `<rect x="${alan.x + adG}" y="${(orta - 16).toFixed(1)}" width="${Math.max(4, (o.deger / en) * cubukG).toFixed(1)}" height="32" fill="${vurgu ? RENK.vurgu : RENK.griCubuk}"/>`;
    ic += yazi(BASLIK, deger, alan.x + alan.g - genislik(BASLIK, deger, 34), orta + 12, 34, RENK.murekkep);
  });
  return ic;
}

function siralama({ kart: k, alan }) {
  const ogeler = (k.ogeler ?? []).slice(0, 5);
  if (ogeler.length < 2) throw new Error('sıralama verisi yok');
  const satir = Math.min(76, alan.h / ogeler.length);
  const ust = ortaY(alan, satir * ogeler.length);
  let ic = '';
  ogeler.forEach((o, i) => {
    const y = ust + i * satir;
    const taban = y + satir / 2 + 11;
    const deger = o.deger == null ? '' : degerTr(o.deger, o.birim ?? k.birim);
    ic += `<rect x="${alan.x}" y="${y.toFixed(1)}" width="${alan.g}" height="2" fill="${RENK.cizgi}"/>`;
    ic += yazi(BASLIK, String(i + 1), alan.x, taban, 32, RENK.vurgu);
    ic += yazi(BASLIK, kisalt(BASLIK, o.ad, 32, alan.g - 320), alan.x + 56, taban, 32, RENK.murekkep);
    if (deger) ic += yazi(BASLIK, deger, alan.x + alan.g - genislik(BASLIK, deger, 32), taban, 32, RENK.murekkep);
  });
  return ic;
}

function zaman({ kart: k, alan }) {
  const olaylar = (k.olaylar ?? []).slice(0, 4);
  if (olaylar.length < 2) throw new Error('zaman verisi yok');
  const adim = alan.g / olaylar.length;
  const cizgiY = ortaY(alan, 150) + 14;
  let ic = `<rect x="${alan.x + 14}" y="${cizgiY - 2}" width="${alan.g - 28 - adim + 28}" height="4" fill="${RENK.cizgi}"/>`;
  olaylar.forEach((o, i) => {
    const x = alan.x + i * adim;
    const son = i === olaylar.length - 1;
    ic += `<circle cx="${x + 14}" cy="${cizgiY}" r="14" fill="${son ? RENK.vurgu : RENK.griCubuk}"/>`;
    ic += yazi(ETIKET, String(o.tarih).toLocaleUpperCase('tr'), x, cizgiY + 52, 21, RENK.ikincil, { aralik: 0.1 });
    const m = sigdir(BASLIK, String(o.metin), { boy: 28, enAz: 22, enGenis: adim - 32, enCokSatir: 2 });
    m.satirlar.forEach((s, j) => (ic += yazi(BASLIK, s, x, cizgiY + 92 + j * m.boy * 1.1, m.boy, RENK.murekkep)));
  });
  return ic;
}

export const VERI_GORSELLERI = {
  meclis,
  once_sonra: (g) => onceSonra(g, { farkYaz: (k) => [farkMetni(k), k.aciklama].filter(Boolean).join(' · ') }),
  zam: (g) => onceSonra(g, { farkYaz: (k) => k.aciklama ?? '' }),
  karsilastirma: cubuklar,
  siralama,
  zaman,
};
