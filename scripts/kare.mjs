// Dikey kartlar (1080×1350): bülten, haftanın özeti, bugün, piyasalar, akaryakıt zammı. Veri vesaire'nin kare iş
// kuyruğundan gelir (GET /istihbar/kare-kuyruk: { anahtar, tur, veri }). Çizim scripts/tasarim/dikey.mjs'de. Kaynak adı yok.
import sharp from 'sharp';
import { akaryakitBildir } from './akaryakit.mjs';
import { DIKEY } from './tasarim/dikey.mjs';

const CIZICILER = {
  ...DIKEY,
  // Akaryakıt: önce fiyat bildirimi (kart yok, iş 'bos' olur); değişim varsa vesaire ürün başına 'zam' işi açar.
  akaryakit: (_v, is) => akaryakitBildir(is),
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

// Başka modüllerin kendi çizicisini eklemesi için.
export function kareTuruEkle(tur, cizici) {
  CIZICILER[tur] = cizici;
}
