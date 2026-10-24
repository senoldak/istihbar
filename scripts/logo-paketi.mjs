// istihbar logo paketi (brand/logo/): yazı logosu ve ikon, açık ve koyu zemin; SVG (yazı glif yolu, yazı tipi
// gerekmez) ve PNG. Logo: IBM Plex Mono SemiBold "istihbar", iki i'nin noktası kırmızı daire. İkon: tek i.
// Kullanım: node scripts/logo-paketi.mjs
import fs from 'node:fs';
import sharp from 'sharp';
import { logoYazisi, MONO, NOKTA, RENK, svg } from './kimlik.mjs';

const KLASOR = 'brand/logo';
const EM = MONO.unitsPerEm;

function logo(koyu) {
  const boy = 200;
  const bosluk = boy * 0.3;
  const yukseklik = ((MONO.ascender - MONO.descender) / EM) * boy;
  const { ic, genislik } = logoYazisi('istihbar', bosluk, bosluk + (MONO.ascender / EM) * boy, boy, koyu ? RENK.kagit : RENK.murekkep);
  return svg(genislik + bosluk * 2, yukseklik + bosluk * 2, ic);
}

// İkon: kare zemin, ortada tek i; Telegram daireye kırptığı için harf dairenin içinde kalır.
function ikon(koyu, kenar = 640) {
  const boy = kenar * 0.96;
  const g = MONO.charToGlyph('ı');
  const o = boy / EM;
  const bb = g.getBoundingBox();
  const ust = Math.max(bb.y2, NOKTA.y2 * 1.03); // noktanın tepesi
  const yukseklik = (ust - bb.y1) * o;
  const taban = (kenar - yukseklik) / 2 + ust * o;
  const x = (kenar - g.advanceWidth * o) / 2;
  const { ic } = logoYazisi('i', x, taban, boy, koyu ? RENK.kagit : RENK.murekkep);
  return svg(kenar, kenar, ic, koyu ? RENK.murekkep : RENK.kagit);
}

fs.mkdirSync(KLASOR, { recursive: true });
const dosyalar = {
  'istihbar-logo': logo(false),
  'istihbar-logo-koyu-zemin': logo(true),
  'istihbar-ikon': ikon(false),
  'istihbar-ikon-koyu-zemin': ikon(true),
};
for (const [ad, icerik] of Object.entries(dosyalar)) {
  fs.writeFileSync(`${KLASOR}/${ad}.svg`, icerik);
  const g = ad.includes('ikon') ? 640 : 1600;
  await sharp(Buffer.from(icerik), { density: 300 }).resize({ width: g }).png().toFile(`${KLASOR}/${ad}.png`);
}
console.log(Object.keys(dosyalar).join('\n'));
