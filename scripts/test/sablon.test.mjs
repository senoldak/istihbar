// Habere özel kart şablonları (vesaire spec 2026-10-28 §7.4): her şablon geçerli 1280x720 PNG üretir; çizim düşerse düz kart.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { ciz } from '../ciz.mjs';
import { ozelKartPng, ozelKartSvg } from '../sablon.mjs';
import { pngMi } from './yardimci.mjs';

const YAYIN = Date.parse('2026-10-27T08:03:00Z');
export const ORNEKLER = {
  meclis: { sablon: 'meclis', toplam: 250, ogeler: [{ ad: 'Öğrenci Listesi', deger: 140 }, { ad: 'Vučić · Birleşmiş Sırbistan', deger: 104 }, { ad: 'Diğer', deger: 6 }] },
  sonuc: { sablon: 'sonuc', ogeler: [{ ad: 'Öğrenci Listesi', deger: 52.7, birim: '%' }, { ad: 'Vučić listesi', deger: 39.1, birim: '%' }] },
  harita: { sablon: 'harita', yer: 'Antalya' },
  dunya: { sablon: 'dunya', yer: 'İsrail' },
  buyuk_rakam: { sablon: 'buyuk_rakam', sayi: 68, aciklama: 'şüpheli hakkında gözaltı kararı' },
  once_sonra: { sablon: 'once_sonra', once: { etiket: 'Ağustos', deger: 7.9 }, sonra: { etiket: 'Eylül', deger: 8.4 }, birim: '%', aciklama: 'İşsizlik oranı' },
  alinti: { sablon: 'alinti', soz: 'Hâlâ masumum, bu insanlardan korkmuyorum ve bağımsız federal yargıya inanmaya devam ediyorum.', kisi: 'James Comey', unvan: 'eski FBI Direktörü' },
  zaman: { sablon: 'zaman', olaylar: [{ tarih: '16 Ekim', metin: 'Belediye binasında arama' }, { tarih: '27 Ekim sabah', metin: 'İmar soruşturmasında operasyon' }, { tarih: '27 Ekim', metin: 'Başkan dahil 27 gözaltı' }] },
  oylama: { sablon: 'oylama', ogeler: [{ ad: 'Kabul', deger: 318 }, { ad: 'Ret', deger: 142 }, { ad: 'Çekimser', deger: 12 }] },
  zam: { sablon: 'zam', once: { etiket: 'Eski', deger: 46.2 }, sonra: { etiket: 'Yeni', deger: 47.35 }, birim: 'TL', aciklama: 'Benzin · litre · İstanbul' },
  geri_sayim: { sablon: 'geri_sayim', gun: 7, tarih: '3 Kasım 2026', aciklama: 'ABD ara seçimleri' },
  atama: { sablon: 'atama', kisi: 'İsmail Kartal', unvan: 'Fenerbahçe teknik direktörü', durum: 'GÖREVDEN AYRILDI' },
  karsilastirma: { sablon: 'karsilastirma', birim: '%', aciklama: 'Politika faizi', ogeler: [{ ad: 'Türkiye', deger: 39.5 }, { ad: 'Rusya', deger: 16.5 }, { ad: 'Brezilya', deger: 15 }, { ad: 'ABD', deger: 3.75 }] },
  siralama: { sablon: 'siralama', ogeler: [{ ad: 'İstanbul', deger: 4.2, birim: 'milyon' }, { ad: 'Ankara', deger: 1.1, birim: 'milyon' }, { ad: 'İzmir', deger: 920, birim: 'bin' }] },
};
const BASLIK = 'Sırbistan’da erken seçimi Öğrenci Listesi kazandı';

test('14 şablonun her biri örnek veriyle geçerli 1280x720 PNG üretir', async () => {
  assert.equal(Object.keys(ORNEKLER).length, 14);
  for (const [ad, kart] of Object.entries(ORNEKLER)) {
    const png = await ozelKartPng({ kart, baslik: BASLIK, yayin: YAYIN });
    assert.ok(pngMi(png), ad);
    const m = await sharp(png).metadata();
    assert.deepEqual([m.width, m.height], [1280, 720], ad);
  }
});

test('bilinmeyen il adında harita fırlatır', () => {
  assert.throws(() => ozelKartSvg({ kart: { sablon: 'harita', yer: 'Atlantis' }, baslik: BASLIK, yayin: YAYIN }));
});

test('ülke takma adı (ABD) dünya haritasında bulunur', () => {
  assert.doesNotThrow(() => ozelKartSvg({ kart: { sablon: 'dunya', yer: 'ABD' }, baslik: BASLIK, yayin: YAYIN }));
});

test('ciz: özel kart çizimi fırlatırsa düz karta düşer', async () => {
  const png = await ciz({ baslik: 'Kaynak başlığı', yayin: YAYIN, yazi: { baslik: BASLIK, metin: 'm', kart: { sablon: 'harita', yer: 'Atlantis' } } });
  assert.ok(pngMi(png));
});
