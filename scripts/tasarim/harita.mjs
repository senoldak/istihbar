// Minimal panel haritası (spec 2026-11-25 §5.2): deniz = zemin, kara sıcak gri, sınırlar zemin renginde boşluk, hedef il/ülke
// mürekkep tonunda, kırmızı yalnız olay noktası ve halkası. Sol kenar 96 px'te kâğıda erir. Dönen etiket kutuları testler ve
// kart yerleşimi içindir.
import { BASLIK, ETIKET, genislik, RENK, yazi } from './kimlik.mjs';
import { dunyaUlkeleri, enYakinIl, ilBul, sehirBul, turkiye, ulkeBul, yakinSehirler } from './yer.mjs';

const PAY = 40; // etiketlerin kenara en yakın uzaklığı
const SOL = 96 + PAY; // sol kenar 96 px'te kâğıda erir; etiket o bölgeye girmez
const OLAY_BOY = 24;
const SEHIR_BOY = 19;
const buyuk = (s) => s.toLocaleUpperCase('tr');
// Etiketin arkasında zemin renginde hare: sınır çizgisi yazının içinden geçmez.
const hare = (p) => p.replace('<path ', `<path stroke="${RENK.zemin}" stroke-width="6" stroke-linejoin="round" `) + p;
const kesisir = (a, b) => a.x < b.x + b.g && b.x < a.x + a.g && a.y < b.y + b.h && b.y < a.y + a.h;

function enBuyukHalka(halkalar) {
  return halkalar.slice().sort((a, b) => b.length - a.length)[0];
}
function kutu(halka) {
  const xs = halka.map((p) => p[0]);
  const ys = halka.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

// Girdiyi çözer: olay noktası, hedef poligon, olay adı, yer bilgisi ve başlangıç ölçeği (alan genişliği 660'a göre).
function coz(girdi, g, y) {
  const olcek = g / 660;
  if (girdi.tur === 'il' || girdi.tur === 'deprem') {
    const koord = Number.isFinite(girdi.enlem) && Number.isFinite(girdi.boylam) ? [girdi.boylam, girdi.enlem] : null;
    const bulunan = ilBul(girdi.il);
    // İl bulunamadıysa (denizde deprem: "Akdeniz") en yakın il kullanılır; bu bir tahmindir ve öyle etiketlenir.
    const il = bulunan ?? (girdi.tur === 'deprem' && koord ? enYakinIl(koord) : null);
    if (!il) throw new Error(`bilinmeyen il: ${girdi.il}`);
    return { nokta: girdi.tur === 'deprem' && koord ? koord : il.nokta, hedef: il.halkalar, ad: il.ad, yer: { ad: il.ad, tahmini: !bulunan }, tr: true, k: (girdi.tur === 'deprem' ? 200 : 168) * olcek };
  }
  if (girdi.tur === 'dunya') {
    const u = ulkeBul(girdi.ulke);
    if (!u) throw new Error(`bilinmeyen ülke: ${girdi.ulke}`);
    const s = girdi.sehir ? sehirBul(girdi.sehir, u.kod) : null;
    const [x0, y0, x1, y1] = kutu(enBuyukHalka(u.halkalar));
    const orta = [(x0 + x1) / 2, (y0 + y1) / 2];
    const sik = Math.cos((orta[1] * Math.PI) / 180);
    const k = Math.min(120, Math.max(14, Math.min((0.55 * 660) / ((x1 - x0) * sik || 1), (0.7 * 624) / (y1 - y0 || 1)))) * olcek;
    return { nokta: s ? s.nokta : orta, hedef: u.halkalar, hedefKod: u.kod, ad: s ? s.ad : u.ad_tr, yer: { ad: s ? s.ad : u.ad_tr, saatDilimi: s?.saatDilimi ?? null, sehir: !!s }, tr: false, k };
  }
  throw new Error(`bilinmeyen harita türü: ${girdi.tur}`);
}

/** girdi: { tur: 'il', il } | { tur: 'deprem', il, enlem?, boylam?, buyukluk } | { tur: 'dunya', ulke, sehir? } */
export function haritaSvg(girdi, { g, y }) {
  const c = coz(girdi, g, y);
  const sik = Math.cos((c.nokta[1] * Math.PI) / 180);
  const nx = g * 0.5;
  const ny = y * 0.46;
  const f = ([lon, lat]) => [nx + (lon - c.nokta[0]) * sik * c.k, ny - (lat - c.nokta[1]) * c.k];
  const gorunur = (h) => {
    const [a, b, cc, d] = kutu(h);
    const [x0, y1] = f([a, b]);
    const [x1, y0] = f([cc, d]);
    return x1 >= -20 && x0 <= g + 20 && y1 >= -20 && y0 <= y + 20;
  };
  const yol = (halkalar) =>
    halkalar
      .filter((h) => h.length > 2 && gorunur(h))
      .map((h) => {
        let son = null;
        const p = [];
        for (const q of h.map(f)) if (!son || Math.abs(q[0] - son[0]) + Math.abs(q[1] - son[1]) >= 1.2) p.push((son = q));
        return p.length > 2 ? `M${p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('L')}Z` : '';
      })
      .join('');

  let ic = `<rect width="${g}" height="${y}" fill="${RENK.zemin}"/>`;
  if (c.tr) {
    const tr = turkiye();
    ic += `<path d="${yol(tr.ulkeler.filter((u) => u.kod !== 'TUR').flatMap((u) => u.halkalar))}" fill="${RENK.komsuKara}" stroke="${RENK.zemin}" stroke-width="2.4"/>`;
    ic += `<path d="${yol(tr.ulkeler.find((u) => u.kod === 'TUR').halkalar)}" fill="${RENK.trKara}"/>`;
  } else {
    ic += `<path d="${yol(dunyaUlkeleri().flatMap((u) => u.halkalar))}" fill="${RENK.komsuKara}" stroke="${RENK.zemin}" stroke-width="2.4"/>`;
  }
  ic += `<path d="${yol(c.hedef)}" fill="${RENK.murekkep}" fill-opacity="0.10" stroke="${RENK.murekkep}" stroke-opacity="0.55" stroke-width="2"/>`;

  // Olay adı: noktanın sağ üstünde; sağa sığmazsa sol üstünde; ikisine de sığmazsa yazı küçülür (en az 16 px), yine
  // sığmazsa noktanın üstüne, görünür alan içinde (sol erime bölgesi + pay ile sağ pay arası) ortalanır. Üste sığmazsa altta.
  const etiketler = [];
  const olayAd = buyuk(c.ad);
  const ust = ny - 36 - OLAY_BOY >= PAY;
  const ucY = ust ? ny - 36 : ny + 36;
  let boy = OLAY_BOY;
  let og;
  let yan = null;
  for (; boy >= 16; boy -= 2) {
    og = genislik(BASLIK, olayAd, boy, { aralik: 0.1 });
    if (nx + 50 + og <= g - PAY) yan = 'sag';
    else if (nx - 50 - og >= SOL) yan = 'sol';
    if (yan) break;
  }
  if (!yan) boy = 16;
  og = genislik(BASLIK, olayAd, boy, { aralik: 0.1 });
  const ucX = yan === 'sag' ? nx + 44 : yan === 'sol' ? nx - 44 : nx;
  const tx = yan === 'sag' ? ucX + 6 : yan === 'sol' ? ucX - 6 - og : Math.min(Math.max(nx - og / 2, SOL), g - PAY - og);
  const taban = ucY + boy * 0.36;
  const olayKutu = { ad: olayAd, x: tx, y: taban - boy * 0.74, g: og, h: boy * 0.74 };
  etiketler.push(olayKutu);

  // Komşu şehirler: en çok iki; noktaya 104 px'ten yakın, kenar payını aşan ya da bir etikete binen düşer.
  const sehirKatmani = [];
  for (const s of yakinSehirler(c.nokta, { haric: [c.ad, c.yer.ad], adet: 12 })) {
    if (sehirKatmani.length === 2) break;
    const [x, yy] = f(s.nokta);
    if (Math.hypot(x - nx, yy - ny) < 104) continue;
    const ad = buyuk(s.ad);
    const w = genislik(ETIKET, ad, SEHIR_BOY, { aralik: 0.11 });
    const kt = { ad, x: x - 6, y: yy - SEHIR_BOY * 0.6, g: w + 16, h: SEHIR_BOY * 1.2 };
    if (kt.x < SOL || kt.y < PAY || kt.x + kt.g > g - PAY || kt.y + kt.h > y - PAY) continue;
    if (etiketler.some((e) => kesisir(e, kt))) continue;
    etiketler.push(kt);
    sehirKatmani.push(`<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="3.6" fill="${RENK.sehir}"/>` + hare(yazi(ETIKET, ad, x + 10, yy + SEHIR_BOY * 0.36, SEHIR_BOY, RENK.sehir, { aralik: 0.11 })));
  }
  ic += sehirKatmani.join('');

  ic += `<circle cx="${nx}" cy="${ny}" r="28" fill="none" stroke="${RENK.vurgu}" stroke-opacity="0.35" stroke-width="2"/>`;
  ic += `<circle cx="${nx}" cy="${ny}" r="10" fill="${RENK.vurgu}"/>`;
  const bx = yan === 'sag' ? nx + 10 : yan === 'sol' ? nx - 10 : nx;
  const by = ust ? ny - 8 : ny + 8;
  const ucY2 = yan ? ucY : ust ? ucY + 8 : ucY - boy * 0.74 - 8; // ortalanan etikette çizgi yazının altında/üstünde biter
  ic += `<path d="M${bx},${by}L${ucX},${ucY2}" stroke="${RENK.murekkep}" stroke-width="1.6"/>`;
  ic += hare(yazi(BASLIK, olayAd, tx, taban, boy, RENK.murekkep, { aralik: 0.1 }));

  // Sol kenar kâğıda erir.
  ic += `<defs><linearGradient id="kagit-gecis" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${RENK.zemin}"/><stop offset="1" stop-color="${RENK.zemin}" stop-opacity="0"/></linearGradient></defs><rect width="96" height="${y}" fill="url(#kagit-gecis)"/>`;
  return { ic, etiketler, yer: c.yer, nokta: { x: nx, y: ny } };
}
