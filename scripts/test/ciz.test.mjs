// Kuyruk satırı → kart yönlendirmesi (spec 2026-11-25 §5, §6.2, §6.3): üst başlık, son dakika, harita paneli, alt seçenekler.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { ciz } from '../ciz.mjs';
import { yaziKaydiBaslat, yaziKaydiBitir } from '../tasarim/kimlik.mjs';

const YAYIN = Date.parse('2026-11-24T16:30:00Z'); // 19:30 TSİ
const olc = async (b) => {
  const m = await sharp(b).metadata();
  return [m.width, m.height];
};
const yazilar = async (h) => {
  yaziKaydiBaslat();
  const png = await ciz(h);
  return { png, y: yaziKaydiBitir() };
};
const yazili = (ek = {}) => ({ url: 'u', baslik: 'Kaynak başlığı', kaynak: 'Örnek Kaynak', yayin: YAYIN, yazi: { baslik: 'Eskişehir’de askeri helikopter eğitim uçuşunda düştü', metin: 'm', ...ek } });

test('eski satır: kategori ve puan yok, kaldırılmış şablon → düz kart, üst başlık yalnız saat', async () => {
  const { png, y } = await yazilar(yazili({ kart: { sablon: 'alinti', soz: 's', kisi: 'k' } }));
  assert.deepEqual(await olc(png), [1280, 720]);
  assert.ok(y.includes('19:30'));
  assert.ok(!y.some((m) => m.includes('·')));
});

test('kaynak adı ve kaynak başlığı karta girmez', async () => {
  const { y } = await yazilar(yazili());
  assert.ok(!y.some((m) => /Örnek Kaynak|Kaynak başlığı/.test(m)));
});

test('kategori üst başlığa girer', async () => {
  const { y } = await yazilar(yazili({ kategori: 'EKONOMİ' }));
  assert.ok(y.includes('EKONOMİ'));
});

test('puan 85 ve üstü SON DAKİKA; deprem son dakika olmaz', async () => {
  assert.ok((await yazilar({ ...yazili({ kategori: 'TÜRKİYE' }), puan: 90 })).y.includes('SON DAKİKA'));
  assert.ok(!(await yazilar({ ...yazili({ kategori: 'TÜRKİYE' }), puan: 80 })).y.includes('SON DAKİKA'));
  const d = await yazilar({ url: 'd', baslik: 'Muğla’da 4,5 büyüklüğünde deprem', yayin: YAYIN, deprem: true, puan: 95, ek: JSON.stringify({ enlem: 37.22, boylam: 28.36, derinlik: 7, il: 'Muğla', ilce: 'Merkez', buyukluk: 4.5 }) });
  assert.ok(d.y.includes('DEPREM') && !d.y.includes('SON DAKİKA'));
  assert.ok(d.y.includes('BÜYÜKLÜK') && d.y.includes('4,5') && d.y.includes('MUĞLA'));
  assert.ok(!d.y.some((m) => /AFAD|Kandilli/.test(m)));
});

test('il haritası: YER, kart bilgisi ve SAAT şeridi', async () => {
  const { y } = await yazilar(yazili({ kategori: 'TÜRKİYE', kart: { sablon: 'harita', yer: 'Eskişehir', bilgi: [{ etiket: 'ARAÇ', deger: 'AS-532' }] } }));
  for (const s of ['YER', 'Eskişehir', 'ARAÇ', 'AS-532', 'SAAT']) assert.ok(y.includes(s), s);
});

test('dünya haritası: şehir ve yerel saat', async () => {
  const { y } = await yazilar(yazili({ kategori: 'DÜNYA', kart: { sablon: 'dunya', yer: 'Kolombiya', sehir: 'Cartagena' } }));
  assert.ok(y.includes('ŞEHİR') && y.includes('Cartagena') && y.includes('YEREL SAAT') && y.includes('11:30'));
  assert.ok(y.some((m) => m.includes('19:30 TSİ')));
});

test('eksik veride alt seçenek', async () => {
  // deprem: il yok, koordinat var → en yakın il
  const d = await yazilar({ url: 'd', baslik: 'Deprem', yayin: YAYIN, deprem: true, ek: JSON.stringify({ enlem: 39.78, boylam: 30.52, buyukluk: 3.9 }) });
  assert.ok(d.y.includes('ESKİŞEHİR'));
  // deprem: ne il ne koordinat → görselsiz
  assert.deepEqual(await olc((await yazilar({ url: 'd', baslik: 'Deprem', yayin: YAYIN, deprem: true, ek: JSON.stringify({ buyukluk: 3.9 }) })).png), [1280, 720]);
  // dünya: şehir tabloda yok → ülke
  assert.ok((await yazilar(yazili({ kart: { sablon: 'dunya', yer: 'Kolombiya', sehir: 'Yokşehir' } }))).y.includes('KOLOMBİYA'));
  // meclis tutarsız → görselsiz, haber yine çizilir
  const m = await yazilar(yazili({ kart: { sablon: 'meclis', toplam: 10, ogeler: [{ ad: 'A', deger: 8 }, { ad: 'B', deger: 8 }] } }));
  assert.deepEqual(await olc(m.png), [1280, 720]);
  assert.ok(!m.y.some((s) => s.includes('sandalye')));
  // bilinmeyen il → görselsiz
  assert.deepEqual(await olc((await yazilar(yazili({ kart: { sablon: 'harita', yer: 'Atlantis' } }))).png), [1280, 720]);
});
