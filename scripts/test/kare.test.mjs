// Kare kartlar (vesaire spec 2026-10-28 §7.2): bülten, hafta, bugün; 1080x1080, başlıklar taşmaz.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { kareCiz, maddeYerlesim } from '../kare.mjs';
import { genislik, SANS } from '../kimlik.mjs';
import { pngMi } from './yardimci.mjs';

const MADDELER = [
  "TÜİK: işsizlik oranı eylülde yüzde 8,4'e çıktı",
  "Sırbistan'da erken seçimi Öğrenci Listesi kazandı",
  "Rusya, Kiev'de askeri tesisleri ve Güney Köprüsü'nü vurduğunu açıkladı",
  "AB'den Ukrayna'ya 4,9 milyar avroluk askeri destek",
  "SPK, Tera Yatırım'ın faaliyet izinlerini iptal etti",
].map((baslik) => ({ baslik }));
const olc = async (png) => {
  const m = await sharp(png).metadata();
  return [m.width, m.height];
};

test('bülten kartı 1-5 maddeyle geçerli 1080x1080 PNG', async () => {
  for (let n = 1; n <= 5; n++) {
    const png = await kareCiz({ anahtar: 'sabah:2026-10-28', tur: 'bulten', veri: { baslik: 'Sabah bülteni', tarih: '28 Ekim 2026 · 08:00', maddeler: MADDELER.slice(0, n) } });
    assert.ok(pngMi(png));
    assert.deepEqual(await olc(png), [1080, 1080]);
  }
});

test('iki satırı aşan başlık küçülür, taşmaz', () => {
  const uzun = 'Çok uzun bir başlık '.repeat(8).trim();
  const { boy, satirlar } = maddeYerlesim(uzun);
  assert.ok(satirlar.length <= 2);
  for (const s of satirlar) assert.ok(genislik(SANS, s, boy) <= 952, s);
});

test('hafta ve bugün kartları 1080x1080 PNG', async () => {
  const hafta = await kareCiz({ anahtar: 'hafta:2026-11-01', tur: 'hafta', veri: { baslik: 'Haftanın özeti', tarih: '26 Ekim – 1 Kasım 2026', maddeler: MADDELER } });
  assert.deepEqual(await olc(hafta), [1080, 1080]);
  const bugun = await kareCiz({ anahtar: 'bugun:2026-10-28', tur: 'bugun', veri: { tarih: '28 Ekim 2026', ogeler: [{ saat: '10:00', metin: 'TÜİK işgücü istatistikleri' }, { saat: '14:00', metin: 'TCMB faiz kararı' }] } });
  assert.deepEqual(await olc(bugun), [1080, 1080]);
});

test('bilinmeyen tür hata', async () => {
  await assert.rejects(() => kareCiz({ anahtar: 'x', tur: 'pasta', veri: {} }));
});
