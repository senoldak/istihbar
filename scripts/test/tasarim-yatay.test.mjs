// Yatay kart iskeleti (spec 2026-11-25 §4.4, §5.2): üst başlık, başlık, görsel ya da panel, taban; hiçbir öğe binmez.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { kutuKaydiBaslat, kutuKaydiBitir, yaziKaydiBaslat, yaziKaydiBitir } from '../tasarim/kimlik.mjs';
import { yatayKartPng, yatayKartSvg } from '../tasarim/yatay.mjs';
import { kesisir } from './yardimci.mjs';

const ORTAK = { saat: '19:30', tarih: '24 KASIM 2026' };
const HARITA = { tur: 'harita', girdi: { tur: 'il', il: 'Eskişehir' }, bilgi: [{ etiket: 'YER', deger: 'Tepebaşı' }, { etiket: 'ARAÇ', deger: 'AS-532' }, { etiket: 'SAAT', deger: '19:30' }] };
const binmez = (k) => {
  for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) assert.ok(!kesisir(k[i], k[j]), `${k[i].ad}/${k[j].ad}`);
};

test('düz ve harita kartı 1280×720 PNG', async () => {
  for (const gorsel of [null, HARITA]) {
    const m = await sharp(await yatayKartPng({ ...ORTAK, kategori: 'TÜRKİYE', baslik: 'Eskişehir’de askeri helikopter eğitim uçuşunda düştü', gorsel })).metadata();
    assert.deepEqual([m.width, m.height], [1280, 720]);
  }
});

test('düz kart: üst başlık, başlık, taban binmez', () => {
  kutuKaydiBaslat();
  yatayKartSvg({ ...ORTAK, kategori: 'TÜRKİYE', baslik: '41 ilin valisi değişti, Polis Akademisi Başkanı görevden alındı' });
  const k = kutuKaydiBitir();
  assert.deepEqual(k.map((x) => x.ad), ['ustBaslik', 'baslik', 'taban']);
  binmez(k);
});

test('ana öğeler üst üste binmez (panel)', () => {
  kutuKaydiBaslat();
  yatayKartSvg({ ...ORTAK, kategori: 'TÜRKİYE', baslik: 'Eskişehir’de askeri helikopter eğitim uçuşunda düştü', gorsel: HARITA });
  const k = kutuKaydiBitir();
  assert.deepEqual(k.map((x) => x.ad), ['ustBaslik', 'baslik', 'bilgi', 'harita', 'taban']);
  binmez(k);
});

test('panel: bilgi şeridi en çok 3 sütun, boş değer çizilmez', () => {
  yaziKaydiBaslat();
  yatayKartSvg({ ...ORTAK, baslik: 'x', gorsel: { tur: 'harita', girdi: { tur: 'il', il: 'Muğla' }, bilgi: [{ etiket: 'AA', deger: '1' }, { etiket: 'BB', deger: '' }, { etiket: 'CC', deger: '3' }, { etiket: 'DD', deger: '4' }, { etiket: 'EE', deger: '5' }] } });
  const y = yaziKaydiBitir();
  assert.ok(y.includes('AA') && y.includes('CC') && y.includes('DD'));
  assert.ok(!y.includes('BB') && !y.includes('EE'));
});

test('panel: bilgi yer bilgisinden üretilebilir', () => {
  yaziKaydiBaslat();
  yatayKartSvg({ ...ORTAK, baslik: 'x', gorsel: { tur: 'harita', girdi: { tur: 'dunya', ulke: 'Kolombiya', sehir: 'Cartagena' }, bilgi: (yer) => [{ etiket: 'ŞEHİR', deger: yer.ad }] } });
  assert.ok(yaziKaydiBitir().includes('Cartagena'));
});

test('üst başlık: kategori yoksa yalnız saat; son dakika; TSİ', () => {
  yaziKaydiBaslat();
  yatayKartSvg({ ...ORTAK, baslik: 'x' });
  const a = yaziKaydiBitir();
  assert.ok(a.includes('19:30'));
  assert.ok(!a.some((m) => m.includes('·')));
  yaziKaydiBaslat();
  yatayKartSvg({ ...ORTAK, sonDakika: true, kategori: 'DÜNYA', tsi: true, baslik: 'x' });
  const y = yaziKaydiBitir().join(' ');
  assert.match(y, /SON DAKİKA/);
  assert.match(y, /19:30 TSİ/);
});

test('uzun başlık kesilir, binmez', () => {
  for (const gorsel of [null, { tur: 'harita', girdi: { tur: 'il', il: 'Muğla' }, bilgi: [{ etiket: 'İL', deger: 'Muğla' }] }]) {
    kutuKaydiBaslat();
    yatayKartSvg({ ...ORTAK, kategori: 'TÜRKİYE', baslik: `${'Uzunkelime'.repeat(30)} ${'çok uzun başlık '.repeat(15)}`, gorsel });
    binmez(kutuKaydiBitir());
  }
});

test('kaynak adı yok', () => {
  yaziKaydiBaslat();
  yatayKartSvg({ ...ORTAK, baslik: 'x' });
  assert.ok(!yaziKaydiBitir().some((m) => /kaynak/i.test(m)));
});

test('panel haritası kendi alanına kırpılır (sütunun ve tabanın arkasına taşmaz)', () => {
  const s = yatayKartSvg({ ...ORTAK, baslik: 'x', gorsel: HARITA });
  assert.match(s, /<svg x="620" y="0" width="660" height="624"[^>]*overflow="hidden"/);
  assert.ok(!s.includes('translate(620,0)'));
});

test('kart tabanında yeni logo: küçük harf istihbar, kırmızı blok yok', () => {
  yaziKaydiBaslat();
  const s = yatayKartSvg({ ...ORTAK, baslik: 'x' });
  const y = yaziKaydiBitir();
  assert.ok(y.includes('istihbar') && !y.includes('İSTİHBAR'));
  assert.ok(!/<rect x="64" y="648"/.test(s));
});
