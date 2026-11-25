// Kuyruktaki haber için kartı seçer ve çizer (spec 2026-11-25 §5, §6.2, §6.3). Üst başlık: deprem → DEPREM; değilse
// yazının kategorisi; yoksa yalnız saat. Puanı 85 ve üstü olan haber (deprem hariç) SON DAKİKA alır. Haritalı haber minimal
// panel, veri şablonu veri görseli, gerisi düz kart. Görselli çizim fırlatırsa görselsiz denenir; haber kartsız kalmaz.
import { yatayKartPng } from './tasarim/yatay.mjs';
import { VERI_GORSELLERI, sayiTr } from './tasarim/veri.mjs';

export const SON_DAKIKA_PUANI = 85;
const KATEGORILER = new Set(['TÜRKİYE', 'DÜNYA', 'EKONOMİ', 'SPOR']);
const saatTr = (ms, tz = 'Europe/Istanbul') => new Date(ms).toLocaleTimeString('tr-TR', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
const tarihTr = (ms) => new Date(ms).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', year: 'numeric' }).toLocaleUpperCase('tr');
const ekOku = (ek) => {
  try {
    return ek ? JSON.parse(ek) : {};
  } catch {
    return {};
  }
};
const kartBilgisi = (kart) => (Array.isArray(kart?.bilgi) ? kart.bilgi.slice(0, 1).map((b) => ({ etiket: b.etiket, deger: b.deger })) : []);

function gorselSec(h, saat) {
  if (h.deprem) {
    const d = ekOku(h.ek);
    const koord = Number.isFinite(d.enlem) && Number.isFinite(d.boylam);
    if (!d.il && !koord) return null;
    const buyukluk = Number.isFinite(d.buyukluk) ? sayiTr(d.buyukluk, 1) : null;
    return {
      tur: 'harita',
      girdi: { tur: 'deprem', il: d.il ?? null, enlem: d.enlem, boylam: d.boylam },
      // İl bulunamayıp en yakın il kullanıldıysa (denizde deprem) etiket bunu söyler; tahmin kesin bilgi gibi yazılmaz.
      bilgi: (yer) => [buyukluk && { etiket: 'BÜYÜKLÜK', deger: buyukluk, buyuk: true }, { etiket: 'SAAT', deger: saat }, { etiket: yer.tahmini ? 'EN YAKIN İL' : 'İL', deger: yer.ad }].filter(Boolean),
    };
  }
  const kart = h.yazi?.kart;
  if (!kart?.sablon) return null;
  if (kart.sablon === 'harita') return { tur: 'harita', girdi: { tur: 'il', il: kart.yer }, bilgi: [{ etiket: 'YER', deger: kart.yer }, ...kartBilgisi(kart), { etiket: 'SAAT', deger: saat }] };
  if (kart.sablon === 'dunya')
    return {
      tur: 'harita',
      girdi: { tur: 'dunya', ulke: kart.yer, sehir: kart.sehir },
      bilgi: (yer) => [
        { etiket: yer.sehir ? 'ŞEHİR' : 'ÜLKE', deger: yer.ad },
        ...kartBilgisi(kart),
        yer.saatDilimi ? { etiket: 'YEREL SAAT', deger: saatTr(h.yayin, yer.saatDilimi) } : { etiket: 'SAAT', deger: saat },
      ],
    };
  if (VERI_GORSELLERI[kart.sablon]) return { tur: 'veri', sablon: kart.sablon, kart };
  return null; // kaldırılmış ya da bilinmeyen şablon
}

export async function ciz(h) {
  const saat = saatTr(h.yayin);
  const kategori = h.deprem ? 'DEPREM' : KATEGORILER.has(h.yazi?.kategori) ? h.yazi.kategori : null;
  const ortak = {
    kategori,
    saat,
    sonDakika: !h.deprem && Number(h.puan) >= SON_DAKIKA_PUANI,
    // Dünya haberinde ya da dünya haritalı kartta (yanında YEREL SAAT olabilir) üst başlık saati TSİ diye belirtilir.
    tsi: kategori === 'DÜNYA' || h.yazi?.kart?.sablon === 'dunya',
    baslik: h.yazi?.baslik || h.baslik,
    tarih: tarihTr(h.yayin),
  };
  const gorsel = gorselSec(h, saat);
  if (gorsel) {
    try {
      return await yatayKartPng({ ...ortak, gorsel });
    } catch (e) {
      console.log(`görselli kart çizilemedi, düz kart: ${e.message}`);
    }
  }
  return yatayKartPng(ortak);
}
