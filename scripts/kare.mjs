// Kare kartlar (1080 x 1080 PNG): bülten, haftanın özeti, bugün; ekonomi, akaryakıt ve meteoroloji kartları da buradan
// dağıtılır. Veri vesaire'nin kare iş kuyruğundan gelir (GET /istihbar/kare-kuyruk: { anahtar, tur, veri }).
// Kaynak adı yok. Taslak: mecmua/docs/istihbar-kartlar/taslak-bulten-karti.png.
import sharp from 'sharp';
import { genislik, logoYazisi, MONO, RENK, SANS, satirla, svg, yazi } from './kimlik.mjs';
import { piyasaVerisi } from './piyasa.mjs';

export const S = 1080;
export const K = 64;
const METIN_GENISLIK = S - 2 * K - 64; // 952: numara sütunundan sonra kalan

/** Ortak üst: logo, büyük başlık, alt satır (tarih), kalın çizgi. */
export function kareUst(baslik, alt) {
  let ic = logoYazisi('istihbar', K, 112, 52, RENK.murekkep).ic;
  ic += yazi(SANS, baslik, K, 214, 56, RENK.murekkep);
  if (alt) ic += yazi(MONO, alt, K, 262, 28, RENK.gri);
  return ic + `<rect x="${K}" y="292" width="${S - 2 * K}" height="3" fill="${RENK.murekkep}"/>`;
}

/** Madde başlığı yerleşimi: 38 px'te en çok 2 satır; sığmazsa 30 px'e kadar küçülür, gene sığmazsa 2 satırda kesilir. */
export function maddeYerlesim(metin, enGenis = METIN_GENISLIK) {
  let boy = 38;
  let satirlar = satirla(SANS, metin, boy, enGenis);
  while (satirlar.length > 2 && boy > 30) satirlar = satirla(SANS, metin, (boy -= 2), enGenis);
  if (satirlar.length > 2) {
    satirlar = satirlar.slice(0, 2);
    let son = satirlar[1];
    while (son.length > 1 && genislik(SANS, `${son}…`, boy) > enGenis) son = son.slice(0, -1).trimEnd();
    satirlar[1] = `${son}…`;
  }
  return { boy, satirlar };
}

// Numaralı (ya da saatli) liste; her madde en çok 2 satır, aralarında ince çizgi.
function liste(ogeler, { etiket, girinti }) {
  let ic = '';
  let y = 350;
  ogeler.forEach((o, i) => {
    const { boy, satirlar } = maddeYerlesim(o.metin, S - 2 * K - girinti);
    ic += yazi(MONO, etiket(o, i), K, y + 34, girinti > 64 ? 28 : 34, RENK.kirmizi);
    satirlar.forEach((s, j) => (ic += yazi(SANS, s, K + girinti, y + 34 + j * boy * 1.2, boy, RENK.murekkep)));
    y += 34 + (satirlar.length - 1) * boy * 1.2 + 40;
    if (i < ogeler.length - 1) ic += `<rect x="${K + girinti}" y="${(y - 22).toFixed(1)}" width="${S - 2 * K - girinti}" height="2" fill="${RENK.cizgi}"/>`;
  });
  return ic;
}

const ALTYAZI = (m) => yazi(MONO, m, K, S - 56, 26, RENK.gri);

export const bultenKartSvg = (v) =>
  svg(S, S, kareUst(v.baslik, v.tarih) + liste(v.maddeler.slice(0, 5).map((m) => ({ metin: m.baslik })), { etiket: (_, i) => String(i + 1), girinti: 70 }) + ALTYAZI('Ayrıntılar mesajda'), RENK.kagit);
export const haftaKartSvg = bultenKartSvg;
export const bugunKartSvg = (v) =>
  svg(S, S, kareUst('Bugün', v.tarih) + liste(v.ogeler.slice(0, 6), { etiket: (o) => o.saat ?? '', girinti: 120 }), RENK.kagit);

// Ekonomi kartı ("Piyasalar"): on satır, değer + günlük + haftalık değişim; grafik yok. Taslak: taslak-ekonomi-karti.png.
const YESIL = '#1f7a4d';
const ucgen = (x, y, yukari, renk) =>
  yukari ? `<path d="M${x},${y + 8} L${x + 18},${y + 8} L${x + 9},${y - 8} Z" fill="${renk}"/>` : `<path d="M${x},${y - 8} L${x + 18},${y - 8} L${x + 9},${y + 8} Z" fill="${renk}"/>`;
function degisimYaz(d, birim, sag, orta) {
  if (d == null) return yazi(MONO, '—', sag - genislik(MONO, '—', 28), orta, 28, RENK.gri);
  const yuvarlak = birim === 'bp' ? Math.round(d) : Math.round(d * 100) / 100;
  const renk = yuvarlak > 0 ? YESIL : yuvarlak < 0 ? RENK.kirmizi : RENK.gri;
  const metin = birim === 'bp' ? `${Math.abs(yuvarlak)} bp` : `%${Math.abs(yuvarlak).toFixed(2).replace('.', ',')}`;
  const x = sag - genislik(MONO, metin, 28);
  return yazi(MONO, metin, x, orta, 28, renk) + (yuvarlak === 0 ? '' : ucgen(x - 28, orta - 10, yuvarlak > 0, renk));
}
export async function ekonomiKartSvg(v, is) {
  const { satirlar, eksik } = await piyasaVerisi(is?.ortam?.fetchFn ?? fetch);
  if (eksik > satirlar.length / 2) throw new Error(`piyasa verisi eksik (${eksik}/${satirlar.length})`);
  let ic = kareUst(v.baslik ?? 'Piyasalar', v.alt);
  ic += yazi(MONO, 'Günlük', 790 - genislik(MONO, 'Günlük', 22), 318, 22, RENK.gri);
  ic += yazi(MONO, 'Haftalık', S - K - genislik(MONO, 'Haftalık', 22), 318, 22, RENK.gri);
  satirlar.forEach((s, i) => {
    const y = 330 + i * 64;
    const orta = y + 44;
    ic += yazi(SANS, s.ad, K, orta, 32, RENK.murekkep);
    ic += yazi(MONO, s.deger, 560 - genislik(MONO, s.deger, 32), orta, 32, s.deger === '—' ? RENK.gri : RENK.murekkep);
    ic += degisimYaz(s.gunluk, s.birim, 790, orta);
    ic += degisimYaz(s.haftalik, s.birim, S - K, orta);
    if (i < satirlar.length - 1) ic += `<rect x="${K}" y="${y + 63}" width="${S - 2 * K}" height="1.5" fill="${RENK.cizgi}"/>`;
  });
  ic += yazi(MONO, 'Yatırım tavsiyesi değildir', K, S - 40, 22, RENK.gri);
  return svg(S, S, ic, RENK.kagit);
}

const CIZICILER = {
  bulten: (v) => bultenKartSvg(v),
  hafta: (v) => haftaKartSvg(v),
  bugun: (v) => bugunKartSvg(v),
  ekonomi: (v, is) => ekonomiKartSvg(v, is),
};

/** Kare iş → PNG. null: gönderilecek kart yok (çağıran /istihbar/kare-bos'a bildirir). Bilinmeyen tür fırlatır. */
export async function kareCiz(is) {
  const c = CIZICILER[is.tur];
  if (!c) throw new Error(`bilinmeyen kare tür: ${is.tur}`);
  const sonuc = await c(is.veri ?? {}, is);
  if (sonuc == null) return null;
  // Çizici SVG metni ya da hazır PNG döndürür.
  return Buffer.isBuffer(sonuc) ? sonuc : sharp(Buffer.from(sonuc)).png().toBuffer();
}

// Başka modüllerin (ekonomi, akaryakıt, meteoroloji) kendi çizicisini eklemesi için.
export function kareTuruEkle(tur, cizici) {
  CIZICILER[tur] = cizici;
}
