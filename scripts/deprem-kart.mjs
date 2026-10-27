// istihbar deprem kartı (1280 x 720 PNG): Türkiye il haritası, merkez üssünde kırmızı nokta ve büyüklüğe göre halkalar,
// sol altta bilgi kutusu (büyüklük, yer, derinlik, saat, kaynak). Harita altlığı brand/harita/turkiye.json (Natural Earth).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { genislik, logoYazisi, MONO, RENK, SANS, svg, yazi } from './kimlik.mjs';

const G = 1280;
const Y = 720;
const HARITA = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../brand/harita/turkiye.json', import.meta.url)), 'utf8'));
const DENIZ = '#e6edf1';
const KOMSU_KARA = '#ece8df';
const TR_KARA = '#fbfaf6';
const IL_SINIRI = '#d3cdbf';
const ULKE_SINIRI = '#9a9486';

// Eşdikdörtgen izdüşüm, enlem 39'da boylam sıkıştırması; kartın tamamını kaplar (merkez Türkiye'nin ortası).
// Görünen alan altlıktan dar: kenarlarda kırpılmış kara görünmesin.
const [X0, Y0, X1, Y1] = [24.5, 35.0, 45.5, 42.6];
const SIK = Math.cos((39 * Math.PI) / 180);
const OLCEK = G / ((X1 - X0) * SIK); // genişliğe sığdır; üst-alt boşluğu altlığın denizi ve komşuları doldurur
const MERKEZ = [35.2, 38.9];
const izdus = ([lon, lat]) => [G / 2 + (lon - MERKEZ[0]) * SIK * OLCEK, Y / 2 - (lat - MERKEZ[1]) * OLCEK + 40];

const yol = (halkalar) => halkalar.map((h) => `M${h.map((p) => izdus(p).map((v) => v.toFixed(1)).join(',')).join('L')}Z`).join('');

function altlik() {
  let ic = `<rect width="${G}" height="${Y}" fill="${DENIZ}"/>`;
  for (const u of HARITA.ulkeler) if (u.kod !== 'TUR') ic += `<path d="${yol(u.halkalar)}" fill="${KOMSU_KARA}" stroke="${ULKE_SINIRI}" stroke-width="0.8"/>`;
  ic += `<path d="${HARITA.iller.map((i) => yol(i.halkalar)).join('')}" fill="${TR_KARA}" stroke="${IL_SINIRI}" stroke-width="0.9" stroke-linejoin="round"/>`;
  const tr = HARITA.ulkeler.find((u) => u.kod === 'TUR');
  ic += `<path d="${yol(tr.halkalar)}" fill="none" stroke="${ULKE_SINIRI}" stroke-width="1.6" stroke-linejoin="round"/>`;
  return ic;
}
const ALTLIK = altlik();

const saatTr = (ms) => new Date(ms).toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });
const virgul = (x, basamak = 1) => x.toFixed(basamak).replace('.', ',');

/** d: { buyukluk, enlem, boylam, derinlik, il, ilce, kaynak, yayin } */
export function depremKartSvg(d) {
  let ic = ALTLIK;
  // Merkez üssü: büyüklükle büyüyen üç halka ve dolu nokta.
  const [x, y] = izdus([d.boylam, d.enlem]);
  const taban = 10 + Math.max(0, d.buyukluk - 3) * 9;
  [3, 2, 1].forEach((k) => (ic += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(taban * k * 1.35).toFixed(1)}" fill="${RENK.kirmizi}" fill-opacity="${0.05 * (4 - k)}" stroke="${RENK.kirmizi}" stroke-opacity="${0.18 + 0.14 * (3 - k)}" stroke-width="2"/>`));
  ic += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${RENK.kirmizi}" stroke="#ffffff" stroke-width="3"/>`;

  // Logo rozeti (haber kartıyla aynı).
  const logo = logoYazisi('istihbar', 72 + 30, 112, 56, RENK.murekkep);
  ic += `<rect x="72" y="48" width="${(logo.genislik + 60).toFixed(1)}" height="92" rx="16" fill="#ffffff" fill-opacity="0.82" stroke="${RENK.cizgi}" stroke-width="1.5"/>${logo.ic}`;

  // Bilgi kutusu: sol alt; merkez üssü sol alttaysa (Ege) sağ alta geçer, deprem kutunun altında kalmasın.
  const kx = x < 640 && y > 330 ? G - 48 - 520 : 48;
  const kh = 292;
  const ky = Y - 48 - kh;
  const kg = 520;
  ic += `<rect x="${kx}" y="${ky}" width="${kg}" height="${kh}" fill="#ffffff" fill-opacity="0.94" stroke="${RENK.murekkep}" stroke-width="1.5"/>`;
  ic += `<rect x="${kx}" y="${ky}" width="10" height="${kh}" fill="${RENK.kirmizi}"/>`;
  // Sıra: yer → büyüklük → "büyüklüğünde deprem" → derinlik ve saat.
  const sol = kx + 36;
  const yer = [d.il, d.ilce].filter(Boolean).join(' · ');
  let yerBoy = 38;
  while (yerBoy > 24 && genislik(SANS, yer, yerBoy) > kg - 60) yerBoy -= 2; // uzun il-ilçe adı kutuya sığsın
  ic += yazi(SANS, yer, sol, ky + 60, yerBoy, RENK.murekkep);
  ic += yazi(MONO, virgul(d.buyukluk), sol, ky + 160, 92, RENK.murekkep);
  ic += yazi(SANS, 'büyüklüğünde deprem', sol, ky + 202, 28, RENK.gri);
  const alt = [d.derinlik != null ? `Derinlik ${virgul(d.derinlik)} km` : null, d.yayin ? saatTr(d.yayin) : null].filter(Boolean).join(' · ');
  ic += yazi(MONO, alt, sol, ky + 254, 24, RENK.gri);
  // Kaynak ve harita atfı yok (kaynaksız kanal; Natural Earth kamu malı, atıf gerekmez).
  return svg(G, Y, ic);
}

export const depremKartPng = (d) => sharp(Buffer.from(depremKartSvg(d))).png().toBuffer();
