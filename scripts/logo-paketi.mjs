// istihbar logo paketi (brand/logo/, spec 2026-11-25 §7): blok logo (vurgu kırmızısı blokta beyaz İSTİHBAR) açık ve koyu
// zemin için; kanal fotoğrafı (kırmızı kare, ortada beyaz İ; Telegram daireye kırpar). SVG (yazı glif yolu) ve PNG.
// Kullanım: node scripts/logo-paketi.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { BASLIK, logoBlok, RENK, yazi } from './tasarim/kimlik.mjs';

const sar = (g, y, ic, zemin) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${g.toFixed(0)}" height="${y.toFixed(0)}" viewBox="0 0 ${g.toFixed(1)} ${y.toFixed(1)}">${zemin ? `<rect width="100%" height="100%" fill="${zemin}"/>` : ''}${ic}</svg>`;

/** Blok logo; koyu: mürekkep zemin üstünde (blok aynı). */
export function logoSvg(koyu) {
  const pay = 40;
  const l = logoBlok(pay, pay, 200);
  return sar(l.genislik + 2 * pay, 200 + 2 * pay, l.ic, koyu ? RENK.murekkep : null);
}

/** Kanal fotoğrafı: kırmızı kare, ortada beyaz İ (görsel olarak ortalı: noktalı İ'nin kutusu). */
export function ikonSvg(kenar = 640) {
  const boy = kenar * 0.62;
  const kutu = BASLIK.getPath('İ', 0, 0, boy).getBoundingBox();
  const x = (kenar - (kutu.x2 - kutu.x1)) / 2 - kutu.x1;
  const taban = (kenar - (kutu.y2 - kutu.y1)) / 2 - kutu.y1;
  return sar(kenar, kenar, yazi(BASLIK, 'İ', x, taban, boy, '#ffffff'), RENK.vurgu);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const KLASOR = 'brand/logo';
  fs.mkdirSync(KLASOR, { recursive: true });
  for (const f of fs.readdirSync(KLASOR)) if (/^istihbar-.*\.(svg|png)$/.test(f)) fs.unlinkSync(`${KLASOR}/${f}`);
  const dosyalar = { 'istihbar-logo': logoSvg(false), 'istihbar-logo-koyu-zemin': logoSvg(true), 'istihbar-ikon': ikonSvg() };
  for (const [ad, icerik] of Object.entries(dosyalar)) {
    fs.writeFileSync(`${KLASOR}/${ad}.svg`, icerik);
    await sharp(Buffer.from(icerik), { density: 300 }).resize({ width: ad.includes('ikon') ? 640 : 1600 }).png().toFile(`${KLASOR}/${ad}.png`);
  }
  console.log(Object.keys(dosyalar).join('\n'));
}
