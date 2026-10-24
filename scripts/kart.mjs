// istihbar haber kartı (1280 x 720 PNG): kâğıt zemin, solda üstte logo, sağda üstte saat, ortada büyük başlık,
// altta kaynak. Haberin fotoğrafı kullanılmaz (telif); kart yalnız yazı ve kimlikten oluşur.
import sharp from 'sharp';
import { genislik, logoYazisi, MONO, RENK, SANS, satirla, svg, yazi } from './kimlik.mjs';

const G = 1280;
const Y = 720;
const KENAR = 72;
const BASLIK_ALANI = { ust: 196, alt: 592 };

// Başlık en büyük boyda başlar, 4 satıra sığana kadar küçülür.
function baslikYerlestir(baslik) {
  for (let boy = 70; boy >= 44; boy -= 2) {
    const satirlar = satirla(SANS, baslik, boy, G - KENAR * 2);
    const aralik = boy * 1.16;
    if (satirlar.length <= 4 && satirlar.length * aralik <= BASLIK_ALANI.alt - BASLIK_ALANI.ust) return { boy, satirlar, aralik };
  }
  const boy = 46;
  const satirlar = satirla(SANS, baslik, boy, G - KENAR * 2).slice(0, 5);
  return { boy, satirlar, aralik: boy * 1.16 };
}

const saatTr = (ms) => new Date(ms).toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });

// Logo rozeti: logo kendi levhasının içinde durur, başlık onu bastırmaz.
const ROZET = {
  beyaz: { dolgu: '#ffffff', cerceve: RENK.cizgi },
  seffaf: { dolgu: RENK.murekkep, opaklik: 0.06 },
  cerceve: { cerceve: RENK.murekkep },
};

function rozet(tur) {
  const boy = 56;
  const ic = logoYazisi('istihbar', KENAR + 30, 112, boy, RENK.murekkep);
  const r = ROZET[tur];
  if (!r) return logoYazisi('istihbar', KENAR, 112, 52, RENK.murekkep).ic;
  const kutu = { x: KENAR, y: 48, g: ic.genislik + 60, y2: 92 };
  const dolgu = r.dolgu ? `fill="${r.dolgu}"${r.opaklik ? ` fill-opacity="${r.opaklik}"` : ''}` : 'fill="none"';
  const cizgi = r.cerceve ? ` stroke="${r.cerceve}" stroke-width="2"` : '';
  return `<rect x="${kutu.x}" y="${kutu.y}" width="${kutu.g.toFixed(1)}" height="${kutu.y2}" rx="16" ${dolgu}${cizgi}/>` + ic.ic;
}

export function kartSvg({ baslik, kaynak, yayin }, { rozetTuru = 'seffaf' } = {}) {
  let ic = rozet(rozetTuru);
  if (yayin) {
    const saat = saatTr(yayin);
    ic += yazi(MONO, saat, G - KENAR - genislik(MONO, saat, 34), 108, 34, RENK.gri);
  }
  const { boy, satirlar, aralik } = baslikYerlestir(baslik);
  const blok = satirlar.length * aralik;
  let taban = BASLIK_ALANI.ust + (BASLIK_ALANI.alt - BASLIK_ALANI.ust - blok) / 2 + boy * 0.92;
  for (const s of satirlar) ic += yazi(SANS, s, KENAR, taban, boy, RENK.murekkep), (taban += aralik);
  ic += `<rect x="${KENAR}" y="618" width="${G - KENAR * 2}" height="2" fill="${RENK.cizgi}"/>`;
  ic += yazi(MONO, kaynak, KENAR, 672, 30, RENK.gri);
  return svg(G, Y, ic, RENK.kagit);
}

export const kartPng = (haber, secenek) => sharp(Buffer.from(kartSvg(haber, secenek))).png().toBuffer();
