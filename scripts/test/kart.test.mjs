// Kaynaksız kartlar (vesaire spec 2026-10-28 §7.1): haber ve deprem kartında kaynak adı ya da atıf yazısı yok.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { depremKartPng } from '../deprem-kart.mjs';
import { kartPng } from '../kart.mjs';
import { yaziKaydiBaslat, yaziKaydiBitir } from '../kimlik.mjs';
import { pngMi } from './yardimci.mjs';

const YAYIN = Date.parse('2026-10-27T10:33:00Z');

test('haber kartında kaynak yazısı yok', async () => {
  yaziKaydiBaslat();
  const png = await kartPng({ baslik: 'TÜİK eylül ayı iş gücü istatistiklerini açıkladı', kaynak: 'Independent Türkçe', yayin: YAYIN });
  const yazilar = yaziKaydiBitir();
  assert.ok(pngMi(png));
  assert.ok(yazilar.some((y) => y.includes('TÜİK')));
  assert.ok(!yazilar.some((y) => y.includes('Independent')));
});

test("deprem kartında 'Kaynak' ve 'Natural Earth' yok", async () => {
  yaziKaydiBaslat();
  const png = await depremKartPng({ enlem: 38.7, boylam: 35.5, buyukluk: 4.2, derinlik: 7, il: 'Kayseri', ilce: 'Kocasinan', kaynak: 'AFAD', yayin: YAYIN });
  const yazilar = yaziKaydiBitir();
  assert.ok(pngMi(png));
  assert.ok(!yazilar.some((y) => /Kaynak|Natural Earth|AFAD/.test(y)));
});
