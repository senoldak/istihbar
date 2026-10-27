// Piyasa verisi (vesaire spec 2026-10-28 §7.3): günlük ve haftalık değişim, boşluklar atlanır, eksik satır tire.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { kareCiz } from '../kare.mjs';
import { piyasaVerisi, SEMBOLLER } from '../piyasa.mjs';

const GUN = 86_400;
const BUGUN = Date.parse('2026-10-28T05:00:00Z') / 1000;
// Yahoo chart yanıtı: kapanışlar en eskiden en yeniye, son değer bugün.
const yahoo = (kapanislar) => ({
  chart: {
    result: [
      {
        timestamp: kapanislar.map((_, i) => BUGUN - (kapanislar.length - 1 - i) * GUN),
        indicators: { quote: [{ close: kapanislar }] },
      },
    ],
  },
});
function sahteAg(seriler) {
  return async (url) => {
    const s = decodeURIComponent(String(url).match(/chart\/([^?]+)/)?.[1] ?? '');
    if (!(s in seriler)) return new Response('yok', { status: 404 });
    return Response.json(yahoo(seriler[s]));
  };
}
const TAM = {
  'USDTRY=X': [40, 40, 40, 40, 40, 40, 40, 40.0, 40.4],
  'EURTRY=X': [48, 48, 48, 48, 48, 48, 48, 48, 48],
  'JPY=X': [150, 150, 150, 150, 150, 150, 150, 150, 152.34],
  'GC=F': [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000],
  'XU100.IS': [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10400, 10284],
  '^NDX': [25000, 25000, 25000, 25000, 25000, 25000, 25000, 25000, 25110],
  '^KS11': [3900, 3900, 3900, 3900, 3900, 3900, 3900, 3940, 3981],
  '^HSI': [25500, 25500, 25500, 25500, 25500, 25500, 25500, 25500, 25402],
  '^TNX': [4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.09, 4.06],
  'BZ=F': [66, 66, 66, 66, 66, 66, 66, 65.52, 64.8],
};

test('on satır sırayla', () => {
  assert.deepEqual(SEMBOLLER.map((s) => s.ad), ['Dolar / TL', 'Avro / TL', 'Dolar / Yen', 'Gram altın', 'BIST 100', 'Nasdaq 100', 'KOSPI', 'Hang Seng', 'ABD 10 yıllık', 'Brent']);
});

test('gram altın hesabı (GC=F 2000, USDTRY 40 → 2.572 TL)', async () => {
  const v = await piyasaVerisi(sahteAg({ ...TAM, 'USDTRY=X': TAM['USDTRY=X'].map(() => 40) }));
  assert.equal(v.satirlar.find((s) => s.ad === 'Gram altın').deger, '2.572 TL');
});

test('10 yıllık değişimi bp (4,09→4,06 → 3 bp aşağı)', async () => {
  const s = (await piyasaVerisi(sahteAg(TAM))).satirlar.find((x) => x.ad === 'ABD 10 yıllık');
  assert.equal(s.deger, '%4,06');
  assert.equal(s.birim, 'bp');
  assert.equal(Math.round(s.gunluk), -3);
});

test('haftalık 7 takvim günü önceki son kapanışa göre', async () => {
  const s = (await piyasaVerisi(sahteAg(TAM))).satirlar.find((x) => x.ad === 'BIST 100');
  assert.equal(s.deger, '10.284');
  assert.equal(s.gunluk.toFixed(2), '-1.12');
  assert.equal(s.haftalik.toFixed(2), '2.84');
});

test('null kapanışlar atlanır, eksik satır tire olur', async () => {
  const v = await piyasaVerisi(sahteAg({ ...TAM, '^HSI': [25500, 25500, 25500, 25500, 25500, 25500, 25500, null, 25402], '^KS11': undefined }));
  const hsi = v.satirlar.find((x) => x.ad === 'Hang Seng');
  assert.equal(hsi.gunluk.toFixed(2), '-0.38');
  const kospi = v.satirlar.find((x) => x.ad === 'KOSPI');
  assert.deepEqual([kospi.deger, kospi.gunluk, kospi.haftalik], ['—', null, null]);
  assert.equal(v.eksik, 1);
  for (const s of v.satirlar) for (const x of [s.gunluk, s.haftalik]) assert.ok(x === null || Number.isFinite(x));
});

test('ekonomi kartı 1080x1080 PNG; yarıdan fazlası eksikse fırlatır', async () => {
  const ortam = { fetchFn: sahteAg(TAM) };
  const png = await kareCiz({ anahtar: 'ekonomi:sabah:2026-10-28', tur: 'ekonomi', veri: { baslik: 'Piyasalar', alt: 'Sabah · 28 Ekim 2026 · 08:00' }, ortam });
  const m = await sharp(png).metadata();
  assert.deepEqual([m.width, m.height], [1080, 1080]);
  await assert.rejects(() => kareCiz({ anahtar: 'x', tur: 'ekonomi', veri: { baslik: 'Piyasalar', alt: '' }, ortam: { fetchFn: sahteAg({}) } }));
});
