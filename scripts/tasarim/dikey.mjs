// Dikey kartlar (1080×1350, 4:5; spec 2026-11-25 §4.5, §5.3): bülten, haftanın özeti, bugün, piyasalar, akaryakıt zammı.
// İskelet: üst başlık, başlık, gövdeyi dolduran liste ya da tablo, çizgili taban (logo + tarih). Veri vesaire'nin kare iş
// kuyruğundan gelir; biçimleri bugünkü işlerle aynı.
import { BASLIK, ETIKET, genislik, kutuKaydet, logoBlok, RENK, sigdir, svg, yazi } from './kimlik.mjs';
import { piyasaVerisi } from '../piyasa.mjs';
import { sayiTr } from './veri.mjs';

const G = 1080;
const Y = 1350;
const K = 72;
const UST = 72;
const UB = 37;
const TABAN = 1218;
const buyuk = (s) => String(s).toLocaleUpperCase('tr');
const saatTr = (ms) => new Date(ms).toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });
const tarihTr = (ms) => new Date(ms).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', year: 'numeric' });

// Üst başlık + başlık; dönen govde: başlığın altından tabana kadarki alan.
function bas(ust, baslik) {
  let ic = yazi(ETIKET, ust, K, UST + UB * 0.74, UB, RENK.ikincil, { aralik: 0.14 });
  const r = sigdir(BASLIK, baslik, { boy: 114, enAz: 84, enGenis: G - 2 * K, enCokSatir: 2 });
  const ilk = UST + UB + 30 + r.boy * 0.76;
  r.satirlar.forEach((s, i) => (ic += yazi(BASLIK, s, K, ilk + i * r.boy * 1.04, r.boy, RENK.murekkep)));
  const alt = ilk + (r.satirlar.length - 1) * r.boy * 1.04 + r.boy * 0.22;
  const govde = { x: K, y: alt + 48, g: G - 2 * K, h: TABAN - 48 - (alt + 48) };
  kutuKaydet('govde', govde.x, govde.y, govde.g, govde.h);
  return { ic, govde };
}

function taban(tarih) {
  const l = logoBlok(K, TABAN + 33, 66);
  const tg = genislik(ETIKET, buyuk(tarih), 30, { aralik: 0.12 });
  kutuKaydet('taban', 0, TABAN, G, Y - TABAN);
  return `<rect x="0" y="${TABAN}" width="${G}" height="2" fill="${RENK.cizgi}"/>${l.ic}${yazi(ETIKET, buyuk(tarih), G - K - tg, TABAN + 66 + 30 * 0.36, 30, RENK.ikincil, { aralik: 0.12 })}`;
}

// Liste: { sol, metin } satırları; metin en çok 2 satır. Az satırda yazı büyür ve aralık açılır, çok satırda yazı küçülür.
function liste(satirlar, govde, { solG = 56, solRenk = RENK.vurgu } = {}) {
  const n = satirlar.length;
  const enGenis = govde.g - solG;
  let boy = n <= 2 ? 60 : 50;
  let yer = [];
  const olc = (b) => satirlar.map((s) => sigdir(BASLIK, s.metin, { boy: b, enAz: b, enGenis, enCokSatir: 2 }));
  const yuk = (r) => r.boy * 0.76 + (r.satirlar.length - 1) * r.boy * 1.12 + r.boy * 0.22;
  for (; boy >= 42; boy -= 2) {
    yer = olc(boy);
    if (yer.reduce((t, r) => t + yuk(r), 0) + n * 2 * 33 <= govde.h) break;
  }
  const metinH = yer.reduce((t, r) => t + yuk(r), 0);
  const enCokAra = n <= 2 ? 33 * 4 : 33 * 2;
  const ara = Math.max(33, Math.min(enCokAra, (govde.h - metinH) / (2 * n)));
  let y = govde.y;
  let ic = '';
  yer.forEach((r, i) => {
    ic += `<rect x="${govde.x}" y="${y.toFixed(1)}" width="${govde.g}" height="1.5" fill="${RENK.cizgi}"/>`;
    const ilk = y + ara + r.boy * 0.76;
    ic += yazi(BASLIK, satirlar[i].sol, govde.x, ilk, Math.min(r.boy, 44), solRenk);
    r.satirlar.forEach((s, j) => (ic += yazi(BASLIK, s, govde.x + solG, ilk + j * r.boy * 1.12, r.boy, RENK.murekkep)));
    y += 2 * ara + yuk(r);
  });
  kutuKaydet('liste', govde.x, govde.y, govde.g, y - govde.y);
  return ic;
}

// Tablo: her satır [sol metin, sağ değerler…]; sağ sütunlar sağa hizalı, verilen x'lerde biter.
function tablo(satirlar, govde, { saglar, boy = 42 }) {
  const satirH = Math.min(150, govde.h / satirlar.length);
  const b = Math.min(boy, satirH * 0.5);
  let ic = '';
  satirlar.forEach((s, i) => {
    const y = govde.y + i * satirH;
    const taban = y + satirH / 2 + b * 0.36;
    ic += `<rect x="${govde.x}" y="${y.toFixed(1)}" width="${govde.g}" height="1.5" fill="${RENK.cizgi}"/>`;
    ic += yazi(ETIKET, s[0], govde.x, taban, b, RENK.murekkep);
    s.slice(1).forEach((h, j) => {
      if (!h) return;
      const metin = typeof h === 'string' ? h : h.metin;
      const renk = typeof h === 'string' ? RENK.murekkep : h.renk;
      const w = genislik(BASLIK, metin, b);
      ic += yazi(BASLIK, metin, saglar[j] - w, taban, b, renk);
      if (h.ucgen) ic += ucgen(saglar[j] - w - b * 0.9, taban - b * 0.34, h.ucgen, renk, b * 0.5);
    });
  });
  kutuKaydet('liste', govde.x, govde.y, govde.g, satirlar.length * satirH);
  return { ic, alt: govde.y + satirlar.length * satirH };
}
const ucgen = (x, y, yon, renk, k) =>
  yon === 'yukari'
    ? `<path d="M${x},${y + k / 2}L${x + k},${y + k / 2}L${x + k / 2},${y - k / 2}Z" fill="${renk}"/>`
    : `<path d="M${x},${y - k / 2}L${x + k},${y - k / 2}L${x + k / 2},${y + k / 2}Z" fill="${renk}"/>`;

function bulten(v) {
  const saat = String(v.tarih ?? '').match(/\d{2}:\d{2}/)?.[0];
  const { ic, govde } = bas(saat ? `BÜLTEN · ${saat}` : 'BÜLTEN', v.baslik);
  const maddeler = (v.maddeler ?? []).slice(0, 5).map((m, i) => ({ sol: String(i + 1), metin: m.baslik }));
  return svg(G, Y, ic + liste(maddeler, govde) + taban(String(v.tarih ?? '').split(' · ')[0]));
}
function hafta(v) {
  const { ic, govde } = bas('HAFTA · PAZAR 20:00', v.baslik ?? 'Haftanın özeti');
  const maddeler = (v.maddeler ?? []).slice(0, 5).map((m, i) => ({ sol: String(i + 1), metin: m.baslik }));
  return svg(G, Y, ic + liste(maddeler, govde) + taban(v.tarih ?? ''));
}
function bugun(v) {
  const { ic, govde } = bas('GÜNDEM', 'Bugün');
  const ogeler = (v.ogeler ?? []).slice(0, 6).map((o) => ({ sol: String(o.saat ?? ''), metin: o.metin }));
  return svg(G, Y, ic + liste(ogeler, govde, { solG: 150, solRenk: RENK.murekkep }) + taban(v.tarih ?? ''));
}

const degisim = (d, birim) => {
  if (d == null) return { metin: '—', renk: RENK.ikincil };
  const yuv = birim === 'bp' ? Math.round(d) : Math.round(d * 100) / 100;
  const renk = yuv > 0 ? RENK.yesil : yuv < 0 ? RENK.vurgu : RENK.ikincil;
  const metin = birim === 'bp' ? `${Math.abs(yuv)} bp` : `%${sayiTr(Math.abs(yuv), 2)}`;
  return { metin, renk, ucgen: yuv > 0 ? 'yukari' : yuv < 0 ? 'asagi' : null };
};
async function ekonomi(v, is) {
  const { satirlar, eksik } = await piyasaVerisi(is?.ortam?.fetchFn ?? fetch);
  if (eksik > satirlar.length / 2) throw new Error(`piyasa verisi eksik (${eksik}/${satirlar.length})`);
  const [slot, tarih, saat] = String(v.alt ?? '').split(' · ');
  const baslik = ['Sabah', 'Öğle', 'Akşam'].includes(slot) ? `${slot} piyasaları` : v.baslik ?? 'Piyasalar';
  const { ic, govde } = bas(saat ? `PİYASALAR · ${saat}` : 'PİYASALAR', baslik);
  const t = tablo(
    satirlar.map((s) => [s.ad, s.deger, degisim(s.gunluk, s.birim)]),
    { ...govde, h: govde.h - 60 },
    { saglar: [K + 700, G - K], boy: 40 },
  );
  const not = yazi(ETIKET, 'Yatırım tavsiyesi değildir', K, t.alt + 50, 26, RENK.ikincil);
  return svg(G, Y, ic + t.ic + not + taban(tarih ?? ''));
}

function zam(v) {
  const { ic, govde } = bas(`AKARYAKIT · ${saatTr(v.yayin)}`, v.baslik);
  const yerler = v.yerler?.length ? v.yerler : [{ yer: v.yer, eski: v.eski, yeni: v.yeni }];
  const satirlar = yerler.map((y) => {
    const f = Math.round((y.yeni - y.eski) * 100) / 100;
    return [y.yer, `${sayiTr(y.yeni, 2)} TL`, { metin: `${f > 0 ? '+' : f < 0 ? '−' : ''}${sayiTr(Math.abs(f), 2)}`, renk: f > 0 ? RENK.vurgu : f < 0 ? RENK.yesil : RENK.ikincil }];
  });
  const t = tablo(satirlar, { ...govde, h: Math.min(govde.h - 70, satirlar.length * 150) }, { saglar: [K + 760, G - K], boy: 52 });
  const not = yazi(ETIKET, 'Gece yarısından itibaren · litre fiyatı', K, t.alt + 56, 28, RENK.ikincil);
  return svg(G, Y, ic + t.ic + not + taban(tarihTr(v.yayin)));
}

export const DIKEY = { bulten, hafta, bugun, ekonomi, zam };
