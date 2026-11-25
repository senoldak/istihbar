// Logo paketi (spec 2026-11-25 §7): blok logo ve kanal fotoğrafı (kırmızı kare, ortada beyaz İ).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ikonSvg, logoSvg } from '../logo-paketi.mjs';
import { yaziKaydiBaslat, yaziKaydiBitir } from '../tasarim/kimlik.mjs';

test('logo: vurgu bloğunda İSTİHBAR; koyu zemin sürümü mürekkep zeminli', () => {
  yaziKaydiBaslat();
  const a = logoSvg(false);
  assert.deepEqual(yaziKaydiBitir(), ['İSTİHBAR']);
  assert.match(a, /#d0211a/);
  assert.ok(!a.includes('#15181d'));
  assert.match(logoSvg(true), /fill="#15181d"/);
});

test('ikon: 640×640 kırmızı zemin, beyaz İ daire içinde ortalı', () => {
  yaziKaydiBaslat();
  const s = ikonSvg();
  assert.deepEqual(yaziKaydiBitir(), ['İ']);
  assert.match(s, /width="640" height="640"/);
  assert.match(s, /<rect width="100%" height="100%" fill="#d0211a"\/>/);
  const sayilar = [...s.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const xs = sayilar.map((p) => p[0]);
  const ys = sayilar.map((p) => p[1]);
  const orta = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  assert.ok(Math.abs(orta[0] - 320) < 8 && Math.abs(orta[1] - 320) < 8, JSON.stringify(orta));
  for (const [x, y] of sayilar) assert.ok(Math.hypot(x - 320, y - 320) < 300, 'harf daire kırpımının içinde');
});
