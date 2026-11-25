// Son gözden geçirmenin bulguları (25 Kasım): uzun ülke adı, taşan değerler, dünya kartında TSİ, denizde deprem.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ciz } from '../ciz.mjs';
import { haritaSvg } from '../tasarim/harita.mjs';
import { BASLIK, genislik, yaziKaydiBaslat, yaziKaydiBitir } from '../tasarim/kimlik.mjs';
import { yatayKartSvg } from '../tasarim/yatay.mjs';

const A = { g: 660, y: 624 };
const SOL_SINIR = 96 + 40; // kâğıda erime bölgesi + kenar payı

test('uzun ülke adı haritanın görünür alanında kalır (ABD, DR Kongo, Orta Afrika)', () => {
  for (const ulke of ['ABD', 'Demokratik Kongo Cumhuriyeti', 'Orta Afrika Cumhuriyeti']) {
    const { etiketler } = haritaSvg({ tur: 'dunya', ulke }, A);
    for (const e of etiketler) assert.ok(e.x >= SOL_SINIR && e.x + e.g <= A.g - 40, `${ulke}: ${e.ad} ${Math.round(e.x)}..${Math.round(e.x + e.g)}`);
  }
});

test('komşu şehir etiketi kâğıda erime bölgesine girmez (Edirne)', () => {
  const { etiketler } = haritaSvg({ tur: 'il', il: 'Edirne' }, A);
  for (const e of etiketler) assert.ok(e.x >= SOL_SINIR, `${e.ad} ${Math.round(e.x)}`);
});

// SVG'deki yol koordinatlarının en büyük x'i (metin yolları; dikdörtgenler hariç).
const enSagX = (svg) => {
  let en = 0;
  for (const m of svg.matchAll(/ d="([^"]+)"/g)) {
    const sayilar = m[1].match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    for (let i = 0; i < sayilar.length; i += 2) en = Math.max(en, sayilar[i]);
  }
  return en;
};
const veriKarti = (kart) => yatayKartSvg({ saat: '10:00', tarih: '24 KASIM 2026', kategori: 'EKONOMİ', baslik: 'Başlık', gorsel: { tur: 'veri', sablon: kart.sablon, kart } });

test('önce → sonra: büyük değerler ve uzun birim kartın içinde kalır, sayı kesilmez', () => {
  yaziKaydiBaslat();
  const s = veriKarti({ sablon: 'once_sonra', once: { etiket: '2025', deger: 1234567.8 }, sonra: { etiket: '2026', deger: 2345678.9 }, birim: 'milyar dolar', aciklama: 'İhracat' });
  const y = yaziKaydiBitir();
  assert.ok(y.includes('2.345.678,9 milyar dolar'), y.join('|'));
  assert.ok(enSagX(s) <= 1217, String(enSagX(s)));
});

test('karşılaştırma: uzun birimli değerler çubuğa binmez, kartın içinde kalır', () => {
  const s = veriKarti({ sablon: 'karsilastirma', birim: 'milyar dolar', ogeler: [{ ad: 'Türkiye', deger: 1234.5 }, { ad: 'Almanya', deger: 4567.8 }] });
  assert.ok(enSagX(s) <= 1217, String(enSagX(s)));
  // En uzun çubuğun sağ ucu, en geniş değer yazısının solunda kalmalı (34 px'te ölçülür; yazı küçülürse daha da geniş pay kalır).
  const cubukSag = Math.max(...[...s.matchAll(/<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)" height="32"/g)].map((m) => Number(m[1]) + Number(m[2])));
  const enGenisDeger = Math.max(...['1.234,5 milyar dolar', '4.567,8 milyar dolar'].map((d) => genislik(BASLIK, d, 34)));
  assert.ok(cubukSag <= 1216 - enGenisDeger, `${cubukSag} > ${1216 - enGenisDeger}`);
});

test('dünya kartında üst başlık saati kategori ne olursa olsun TSİ', async () => {
  yaziKaydiBaslat();
  await ciz({ url: 'u', baslik: 'b', yayin: Date.parse('2026-11-24T16:30:00Z'), yazi: { baslik: 'Kolombiya’da faiz kararı', metin: 'm', kategori: 'EKONOMİ', kart: { sablon: 'dunya', yer: 'Kolombiya', sehir: 'Cartagena' } } });
  assert.ok(yaziKaydiBitir().some((m) => m.includes('19:30 TSİ')));
});

test('il bulunamayan deprem (denizde) en yakın il olarak etiketlenir', async () => {
  yaziKaydiBaslat();
  await ciz({ url: 'd', baslik: 'Akdeniz’de 4,1 büyüklüğünde deprem', yayin: Date.parse('2026-11-24T16:30:00Z'), deprem: true, ek: JSON.stringify({ il: 'Akdeniz', enlem: 36.3, boylam: 28.6, buyukluk: 4.1 }) });
  const y = yaziKaydiBitir();
  assert.ok(y.includes('EN YAKIN İL'), y.join('|'));
  assert.ok(!y.includes('İL'));
});
