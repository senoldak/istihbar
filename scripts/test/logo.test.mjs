// Logo paketi (spec 2026-11-26): Telgraf şeridi simgesi + küçük harf "istihbar"; kanal fotoğrafı kâğıt zeminde simge.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ikonSvg, isaretSvg, logoSvg } from '../logo-paketi.mjs';
import { yaziKaydiBaslat, yaziKaydiBitir } from '../tasarim/kimlik.mjs';

test('logo: simge + istihbar; kırmızı tek; koyu sürüm mürekkep zeminli, yazı kâğıt rengi', () => {
  yaziKaydiBaslat();
  const a = logoSvg(false);
  assert.deepEqual(yaziKaydiBitir(), ['istihbar']);
  assert.equal((a.match(/#d0211a/g) ?? []).length, 1);
  const k = logoSvg(true);
  assert.match(k, /<rect width="100%" height="100%" fill="#15181d"\/>/);
});

test('işaret: yalnız simge, yazı yok', () => {
  yaziKaydiBaslat();
  const s = isaretSvg(false);
  assert.deepEqual(yaziKaydiBitir(), []);
  assert.equal((s.match(/<circle /g) ?? []).length, 2);
});

test('ikon: 640×640 kâğıt zemin, simge Telegram daire kırpımının içinde ve ortalı', () => {
  const s = ikonSvg();
  assert.match(s, /width="640" height="640"/);
  assert.match(s, /<rect width="100%" height="100%" fill="#f4f2ed"\/>/);
  const m = s.match(/translate\(([\d.]+),([\d.]+)\) scale\(([\d.]+)\)/);
  const [x, y, k] = m.slice(1).map(Number);
  // Balonun kapladığı kutu (200 birimde kontur dahil x 7..193, y 27..186) merkezden 300 px'ten uzağa taşmaz;
  // görsel merkez (100, 107) kartın ortasına gelir.
  for (const [ux, uy] of [[7, 27], [193, 27], [7, 157], [193, 157], [46, 186]]) assert.ok(Math.hypot(x + ux * k - 320, y + uy * k - 320) < 300, `${ux},${uy}`);
  assert.ok(Math.abs(x + 100 * k - 320) < 6 && Math.abs(y + 107 * k - 320) < 6);
});
