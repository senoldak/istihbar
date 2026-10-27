// Kuyruktaki haber için hangi kartın çizileceği: depremde haritalı kart, yazıda doğrulanmış şablon verisi varsa habere özel
// kart, yoksa düz haber kartı. Çizim fırlatırsa bir alt seçeneğe düşülür; haber kartsız kalmaz.
import { depremKartPng } from './deprem-kart.mjs';
import { kartPng } from './kart.mjs';
import { ozelKartPng } from './sablon.mjs';

export async function ciz(h) {
  try {
    const ek = h.ek ? JSON.parse(h.ek) : null;
    if (ek && Number.isFinite(ek.enlem) && Number.isFinite(ek.boylam)) return await depremKartPng({ ...ek, kaynak: h.kaynak, yayin: h.yayin });
  } catch (e) {
    console.log(`deprem kartı çizilemedi, düz kart: ${e.message}`);
  }
  const baslik = h.yazi?.baslik || h.baslik;
  if (h.yazi?.kart) {
    try {
      return await ozelKartPng({ kart: h.yazi.kart, baslik, yayin: h.yayin });
    } catch (e) {
      console.log(`özel kart (${h.yazi.kart.sablon}) çizilemedi, düz kart: ${e.message}`);
    }
  }
  return kartPng({ baslik, yayin: h.yayin });
}
