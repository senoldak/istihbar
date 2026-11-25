// Veri görselleri (spec 2026-11-25 §5.1): kalan 6 şablon, alan adları vesaire src/kart-sablon.js ile aynı.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { kutuKaydiBaslat, kutuKaydiBitir, yaziKaydiBaslat, yaziKaydiBitir } from '../tasarim/kimlik.mjs';
import { yatayKartPng, yatayKartSvg } from '../tasarim/yatay.mjs';
import { kesisir } from './yardimci.mjs';

export const ORNEKLER = {
  meclis: { sablon: 'meclis', toplam: 250, ogeler: [{ ad: 'Öğrenci Listesi', deger: 140 }, { ad: 'Vučić · Birleşmiş Sırbistan', deger: 104 }, { ad: 'Diğer', deger: 6 }] },
  once_sonra: { sablon: 'once_sonra', once: { etiket: 'Ağustos', deger: 7.9 }, sonra: { etiket: 'Eylül', deger: 8.4 }, birim: '%', aciklama: 'İşsizlik oranı' },
  zam: { sablon: 'zam', once: { etiket: 'Eski', deger: 46.2 }, sonra: { etiket: 'Yeni', deger: 47.35 }, birim: 'TL', aciklama: 'Benzin · litre · İstanbul' },
  karsilastirma: { sablon: 'karsilastirma', birim: '%', aciklama: 'Politika faizi', ogeler: [{ ad: 'Türkiye', deger: 39.5 }, { ad: 'Rusya', deger: 16.5 }, { ad: 'Brezilya', deger: 15 }, { ad: 'ABD', deger: 3.75 }] },
  siralama: { sablon: 'siralama', ogeler: [{ ad: 'İstanbul', deger: 4.2, birim: 'milyon' }, { ad: 'Ankara', deger: 1.1, birim: 'milyon' }, { ad: 'İzmir', deger: 920, birim: 'bin' }] },
  zaman: { sablon: 'zaman', olaylar: [{ tarih: '16 Ekim', metin: 'Belediye binasında arama' }, { tarih: '27 Ekim sabah', metin: 'İmar soruşturmasında operasyon' }, { tarih: '27 Ekim', metin: 'Başkan dahil 27 gözaltı' }] },
};
const kart = (k, baslik = 'Sırbistan’da erken seçimi Öğrenci Listesi kazandı') => ({ saat: '23:05', tarih: '24 KASIM 2026', kategori: 'DÜNYA', baslik, gorsel: { tur: 'veri', sablon: k.sablon, kart: k } });

test('6 şablonun her biri 1280×720 PNG üretir, ana öğeler binmez', async () => {
  for (const [ad, k] of Object.entries(ORNEKLER)) {
    const m = await sharp(await yatayKartPng(kart(k))).metadata();
    assert.deepEqual([m.width, m.height], [1280, 720], ad);
    kutuKaydiBaslat();
    yatayKartSvg(kart(k, 'Çok uzun bir başlık '.repeat(6)));
    const b = kutuKaydiBitir();
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) assert.ok(!kesisir(b[i], b[j]), `${ad}: ${b[i].ad}/${b[j].ad}`);
  }
});

test('sayılar Türkçe biçimde yazılır', () => {
  yaziKaydiBaslat();
  yatayKartSvg(kart(ORNEKLER.zam));
  const y = yaziKaydiBitir();
  assert.ok(y.includes('46,20 TL') && y.includes('47,35 TL'), y.join('|'));
  yaziKaydiBaslat();
  yatayKartSvg(kart(ORNEKLER.karsilastirma));
  assert.ok(yaziKaydiBitir().includes('%39,5'));
});

test('meclis: sandalye toplamı meclisten büyükse fırlatır', () => {
  assert.throws(() => yatayKartSvg(kart({ sablon: 'meclis', toplam: 100, ogeler: [{ ad: 'A', deger: 80 }, { ad: 'B', deger: 40 }] })));
});

test('meclis: çoğunluk satırı yazılır', () => {
  yaziKaydiBaslat();
  yatayKartSvg(kart(ORNEKLER.meclis));
  assert.ok(yaziKaydiBitir().some((m) => m.includes('250 sandalye') && m.includes('çoğunluk 126')));
});

test('karşılaştırma 6 öğede ilk 5’i çizer', () => {
  yaziKaydiBaslat();
  yatayKartSvg(kart({ sablon: 'karsilastirma', ogeler: ['A1', 'B2', 'C3', 'D4', 'E5', 'F6'].map((ad, i) => ({ ad, deger: 10 - i })) }));
  const y = yaziKaydiBitir();
  assert.ok(y.includes('E5') && !y.includes('F6'));
});

test('zaman çizelgesi en çok 4 olay', () => {
  yaziKaydiBaslat();
  yatayKartSvg(kart({ sablon: 'zaman', olaylar: ['1', '2', '3', '4', '5'].map((t) => ({ tarih: `${t} Ekim`, metin: `Olay ${t}` })) }));
  const y = yaziKaydiBitir();
  assert.ok(y.includes('Olay 4') && !y.includes('Olay 5'));
});
