// Dikey kart dağıtımı (spec 2026-11-25 §4.5, §5.3): kare kuyruğundaki işler 1080×1350 PNG olur; bilinmeyen tür hata.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { kareCiz } from '../kare.mjs';
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

test('bülten kartı 1-5 maddeyle geçerli 1080×1350 PNG', async () => {
  for (let n = 1; n <= 5; n++) {
    const png = await kareCiz({ anahtar: 'sabah:2026-10-28', tur: 'bulten', veri: { baslik: 'Sabah bülteni', tarih: '28 Ekim 2026 · 08:00', maddeler: MADDELER.slice(0, n) } });
    assert.ok(pngMi(png));
    assert.deepEqual(await olc(png), [1080, 1350]);
  }
});

test('hafta ve bugün kartları 1080×1350 PNG', async () => {
  const hafta = await kareCiz({ anahtar: 'hafta:2026-11-01', tur: 'hafta', veri: { baslik: 'Haftanın özeti', tarih: '26 Ekim – 1 Kasım 2026', maddeler: MADDELER } });
  assert.deepEqual(await olc(hafta), [1080, 1350]);
  const bugun = await kareCiz({ anahtar: 'bugun:2026-10-28', tur: 'bugun', veri: { tarih: '28 Ekim 2026', ogeler: [{ saat: 'TÜİK', metin: 'İşgücü istatistikleri' }, { saat: 'TCMB', metin: 'Faiz kararı' }] } });
  assert.deepEqual(await olc(bugun), [1080, 1350]);
});

test('bilinmeyen tür hata', async () => {
  await assert.rejects(() => kareCiz({ anahtar: 'x', tur: 'pasta', veri: {} }));
});
