// Dikey kartlar (spec 2026-11-25 §4.5, §5.3): 1080×1350, liste gövdeyi doldurur, tabanla kesişmez.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { DIKEY } from '../tasarim/dikey.mjs';
import { kutuKaydiBaslat, kutuKaydiBitir, yaziKaydiBaslat, yaziKaydiBitir } from '../tasarim/kimlik.mjs';
import { kesisir } from './yardimci.mjs';

const png = async (s) => sharp(Buffer.from(await s)).png().toBuffer();
const olc = async (b) => {
  const m = await sharp(b).metadata();
  return [m.width, m.height];
};
const MADDE = ["TÜİK: işsizlik oranı eylülde yüzde 8,4'e çıktı", "Sırbistan'da erken seçimi Öğrenci Listesi kazandı", "Rusya, Kiev'de askeri tesisleri ve Güney Köprüsü'nü vurduğunu açıkladı", "AB'den Ukrayna'ya 4,9 milyar avroluk askeri destek", "SPK, Tera Yatırım'ın faaliyet izinlerini iptal etti"].map((baslik) => ({ baslik }));
const BULTEN = { baslik: 'Akşam bülteni', tarih: '24 Kasım 2026 · 19:00', maddeler: MADDE };
// Sahte piyasa ağı: her sembol için 9 günlük düz seri, son gün %1 yukarı.
const ag = async () => {
  const t0 = Date.parse('2026-10-28T05:00:00Z') / 1000;
  const k = [100, 100, 100, 100, 100, 100, 100, 100, 101];
  return Response.json({ chart: { result: [{ timestamp: k.map((_, i) => t0 - (8 - i) * 86400), indicators: { quote: [{ close: k }] } }] } });
};
const ZAM = { urun: 'benzin', yer: 'İstanbul (Avrupa)', eski: 46.2, yeni: 47.35, baslik: 'Benzine 1,15 lira zam', yayin: Date.parse('2026-11-24T16:00:00Z'), yerler: [{ yer: 'İstanbul (Avrupa)', eski: 46.2, yeni: 47.35 }, { yer: 'Ankara', eski: 47.05, yeni: 48.2 }, { yer: 'İzmir', eski: 47.29, yeni: 48.44 }] };

test('beş tip 1080×1350 PNG', async () => {
  const isler = {
    bulten: [BULTEN],
    hafta: [{ baslik: 'Haftanın özeti', tarih: '17 – 23 Kasım 2026', maddeler: MADDE }],
    bugun: [{ tarih: '25 Kasım 2026', ogeler: [{ saat: 'TÜİK', metin: 'İşgücü istatistikleri' }, { saat: 'TCMB', metin: 'Faiz kararı' }] }],
    ekonomi: [{ baslik: 'Piyasalar', alt: 'Sabah · 25 Kasım 2026 · 08:00' }, { ortam: { fetchFn: ag } }],
    zam: [ZAM],
  };
  for (const [tur, [veri, is]] of Object.entries(isler)) assert.deepEqual(await olc(await png(DIKEY[tur](veri, is))), [1080, 1350], tur);
});

test('madde sayısı 1–5: liste tabanla kesişmez, tek madde gövdeyi doldurur', () => {
  for (const n of [1, 5]) {
    kutuKaydiBaslat();
    DIKEY.bulten({ ...BULTEN, maddeler: n === 5 ? MADDE.map((m) => ({ baslik: `${m.baslik} ${m.baslik}` })) : MADDE.slice(0, 1) });
    const k = kutuKaydiBitir();
    const liste = k.find((x) => x.ad === 'liste');
    const taban = k.find((x) => x.ad === 'taban');
    const govde = k.find((x) => x.ad === 'govde');
    assert.ok(!kesisir(liste, taban), `n=${n}`);
    if (n === 1) assert.ok(liste.h >= govde.h * 0.35, `${liste.h} / ${govde.h}`);
  }
});

test('ekonomi: tek değişim sütunu, haftalık yok, yatırım tavsiyesi notu var', async () => {
  yaziKaydiBaslat();
  await DIKEY.ekonomi({ baslik: 'Piyasalar', alt: 'Sabah · 25 Kasım 2026 · 08:00' }, { ortam: { fetchFn: ag } });
  const y = yaziKaydiBitir();
  assert.ok(!y.some((m) => /haftalık/i.test(m)));
  assert.ok(y.includes('Yatırım tavsiyesi değildir'));
  assert.ok(y.includes('Sabah piyasaları'));
});

test('zam: yerler tablosu her yer için satır yazar', () => {
  yaziKaydiBaslat();
  DIKEY.zam(ZAM);
  const y = yaziKaydiBitir();
  for (const s of ['İstanbul (Avrupa)', 'Ankara', 'İzmir', '48,44 TL']) assert.ok(y.includes(s), s);
  assert.ok(y.includes('Gece yarısından itibaren · litre fiyatı'));
});

test('üst başlıklar', () => {
  yaziKaydiBaslat();
  DIKEY.bulten(BULTEN);
  DIKEY.hafta({ baslik: 'Haftanın özeti', tarih: '17 – 23 Kasım 2026', maddeler: MADDE });
  const y = yaziKaydiBitir().join(' | ');
  assert.match(y, /BÜLTEN · 19:00/);
  assert.match(y, /HAFTA · PAZAR 20:00/);
  assert.match(y, /17 – 23 KASIM 2026/);
});
