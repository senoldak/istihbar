// Akaryakıt (vesaire spec 2026-10-28 §7.6): fiyat tablosunu okur, vesaire'ye bildirir; değişim kartında şirket adı yok.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import sharp from 'sharp';
import { akaryakitFiyatlari } from '../akaryakit.mjs';
import { kareCiz } from '../kare.mjs';
import { yaziKaydiBaslat, yaziKaydiBitir } from '../kimlik.mjs';

const ORNEK = fs.readFileSync(new URL('./ornek/po.html', import.meta.url), 'utf8');

test('fikstürden dört yerin benzin ve motorin fiyatı', () => {
  const f = akaryakitFiyatlari(ORNEK);
  assert.deepEqual(f, [
    { urun: 'benzin', yer: 'İstanbul Avrupa yakası', deger: 76.3 },
    { urun: 'motorin', yer: 'İstanbul Avrupa yakası', deger: 96.9 },
    { urun: 'benzin', yer: 'İstanbul Anadolu yakası', deger: 76.2 },
    { urun: 'motorin', yer: 'İstanbul Anadolu yakası', deger: 96.7 },
    { urun: 'benzin', yer: 'Ankara', deger: 77.3 },
    { urun: 'motorin', yer: 'Ankara', deger: 98 },
    { urun: 'benzin', yer: 'İzmir', deger: 77.6 },
    { urun: 'motorin', yer: 'İzmir', deger: 98.3 },
  ]);
});

test('bozuk sayfa fırlatır', () => {
  assert.throws(() => akaryakitFiyatlari('<html><body>bakım</body></html>'));
});

test('akaryakıt işi fiyatları vesaire\'ye bildirir, kart çizmez', async () => {
  const istekler = [];
  const fetchFn = async (url, ayar) => {
    istekler.push({ url: String(url), govde: ayar?.body });
    return String(url).includes('petrolofisi') ? new Response(ORNEK) : Response.json({ degisimler: [], anahtarlar: [] });
  };
  const sonuc = await kareCiz({ anahtar: 'akaryakit:sabah:2026-10-28', tur: 'akaryakit', veri: {}, ortam: { VESAIRE_URL: 'https://v.test', yetki: {}, fetchFn } });
  assert.equal(sonuc, null);
  const post = istekler.find((i) => i.url === 'https://v.test/istihbar/akaryakit');
  assert.equal(JSON.parse(post.govde).fiyatlar.length, 8);
  assert.equal(JSON.parse(post.govde).anahtar, 'akaryakit:sabah:2026-10-28');
});

test('zam kartı 1280x720, şirket adı yok', async () => {
  yaziKaydiBaslat();
  const png = await kareCiz({ anahtar: 'akaryakit:sabah:2026-10-28:benzin', tur: 'zam', veri: { urun: 'benzin', yer: 'İstanbul Avrupa yakası', eski: 76.3, yeni: 77.45, baslik: 'Benzine 1,15 lira zam' } });
  const yazilar = yaziKaydiBitir();
  const m = await sharp(png).metadata();
  assert.deepEqual([m.width, m.height], [1280, 720]);
  assert.ok(!yazilar.some((y) => /Petrol|Ofisi|PO\b/.test(y)));
});
