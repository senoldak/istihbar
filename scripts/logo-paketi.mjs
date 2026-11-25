// istihbar logo paketi (brand/logo/, spec 2026-11-26): Telgraf şeridi simgesi + küçük harf "istihbar" (Archivo Bold).
// Dosyalar: yatay logo (saydam ve koyu zemin), yalnız simge (işaret), kanal fotoğrafı (kâğıt zemin; Telegram daireye kırpar).
// SVG (yazı glif yolu) ve PNG. Kullanım: node scripts/logo-paketi.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { logoTelgraf, RENK, telgrafSimge } from './tasarim/kimlik.mjs';

const sar = (g, y, ic, zemin) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${g.toFixed(0)}" height="${y.toFixed(0)}" viewBox="0 0 ${g.toFixed(1)} ${y.toFixed(1)}">${zemin ? `<rect width="100%" height="100%" fill="${zemin}"/>` : ''}${ic}</svg>`;

/** Yatay logo; koyu: mürekkep zemin, yazı ve simge kâğıt rengine döner (kırmızı nokta aynı). */
export function logoSvg(koyu) {
  const kenar = 200;
  const pay = kenar / 4; // çevrede simgenin dörtte biri kadar boşluk
  const l = logoTelgraf(pay, pay, kenar, { koyu });
  return sar(l.genislik + 2 * pay, kenar + 2 * pay, l.ic, koyu ? RENK.murekkep : null);
}

/** Yalnız simge (saydam zemin). */
export function isaretSvg(koyu) {
  const pay = 50;
  return sar(200 + 2 * pay, 200 + 2 * pay, telgrafSimge(pay, pay, 200, { koyu }), koyu ? RENK.murekkep : null);
}

/** Kanal fotoğrafı: kâğıt zemin, ortada simge; simgenin görsel merkezi (100, 101) kartın ortasına gelir. */
export function ikonSvg(kenar = 640) {
  const boy = kenar * 0.62;
  const k = boy / 200;
  return sar(kenar, kenar, telgrafSimge(kenar / 2 - 100 * k, kenar / 2 - 101 * k, boy), RENK.zemin);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const KLASOR = 'brand/logo';
  fs.mkdirSync(KLASOR, { recursive: true });
  for (const f of fs.readdirSync(KLASOR)) if (/^istihbar-.*\.(svg|png)$/.test(f)) fs.unlinkSync(`${KLASOR}/${f}`);
  const dosyalar = {
    'istihbar-logo': [logoSvg(false), 1600],
    'istihbar-logo-koyu-zemin': [logoSvg(true), 1600],
    'istihbar-isaret': [isaretSvg(false), 600],
    'istihbar-isaret-koyu-zemin': [isaretSvg(true), 600],
    'istihbar-ikon': [ikonSvg(), 640],
  };
  for (const [ad, [icerik, g]] of Object.entries(dosyalar)) {
    fs.writeFileSync(`${KLASOR}/${ad}.svg`, icerik);
    await sharp(Buffer.from(icerik), { density: 300 }).resize({ width: g }).png().toFile(`${KLASOR}/${ad}.png`);
  }
  console.log(Object.keys(dosyalar).join('\n'));
}
