// Akaryakıt fiyatları (vesaire spec 2026-10-28 §7.6): bir dağıtıcının il il pompa fiyatı tablosu (KDV'li). Kartta ve mesajda
// şirket adı geçmez; yer yazılır. Değişimi vesaire hesaplar (D1'de son değer): bu modül yalnız okur ve bildirir.

export const FIYAT_SAYFASI = 'https://www.petrolofisi.com.tr/akaryakit-fiyatlari';
// Sayfadaki satır adı → kartta görünen yer.
const YERLER = {
  'ISTANBUL (AVRUPA)': 'İstanbul Avrupa yakası',
  'ISTANBUL (ANADOLU)': 'İstanbul Anadolu yakası',
  ANKARA: 'Ankara',
  IZMIR: 'İzmir',
};
// Satırdaki sütun sırası: benzin, motorin, gazyağı, kalorifer yakıtı, fuel oil, otogaz.
const URUNLER = ['benzin', 'motorin'];

/** HTML → [{ urun, yer, deger }]. Bir yer ya da ürün okunamazsa fırlatır (sayfa düzeni değişmiş olabilir). */
export function akaryakitFiyatlari(html) {
  const tek = html.replace(/\s+/g, ' ');
  const sonuc = [];
  for (const [ad, yer] of Object.entries(YERLER)) {
    const i = tek.indexOf(`data-disctrict-name="${ad}"`);
    if (i < 0) throw new Error(`akaryakıt: ${ad} satırı yok`);
    const satir = tek.slice(i, tek.indexOf('</tr>', i));
    const degerler = [...satir.matchAll(/class="with-tax">\s*([\d.,]+)\s*</g)].map((m) => Number(m[1].replace(',', '.')));
    URUNLER.forEach((urun, j) => {
      if (!Number.isFinite(degerler[j]) || degerler[j] <= 0) throw new Error(`akaryakıt: ${ad} ${urun} okunamadı`);
      sonuc.push({ urun, yer, deger: degerler[j] });
    });
  }
  return sonuc;
}

/** Kare iş 'akaryakit': sayfayı okur, vesaire'ye bildirir; kartı vesaire açarsa ('zam' işi) sonraki turda çizilir. */
export async function akaryakitBildir(is) {
  const { VESAIRE_URL, yetki, fetchFn = fetch } = is.ortam ?? {};
  const r = await fetchFn(FIYAT_SAYFASI, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; istihbar)', 'accept-language': 'tr' }, signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error(`akaryakıt sayfası HTTP ${r.status}`);
  const fiyatlar = akaryakitFiyatlari(await r.text());
  const b = await fetchFn(`${VESAIRE_URL}/istihbar/akaryakit`, {
    method: 'POST',
    headers: { ...yetki, 'content-type': 'application/json' },
    body: JSON.stringify({ anahtar: is.anahtar, fiyatlar }),
  });
  if (!b.ok) throw new Error(`akaryakıt bildirimi HTTP ${b.status}`);
  const { degisimler = [] } = await b.json();
  console.log(`akaryakıt: ${fiyatlar.length} fiyat, ${degisimler.length} değişim`);
  return null;
}
