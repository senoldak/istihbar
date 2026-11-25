// Yeni kimlik modülü (spec 2026-11-25 §4): renkler, Archivo dar kesimleri, sığdırma, logo bloğu, kutu kaydı.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BASLIK, ETIKET, genislik, KELIME, kutuKaydet, kutuKaydiBaslat, kutuKaydiBitir, logoTelgraf, RENK, sigdir, svg, telgrafSimge, yazi, yaziKaydiBaslat, yaziKaydiBitir } from '../tasarim/kimlik.mjs';

test('renkler spec §4.2 değerlerinde', () => {
  assert.equal(RENK.zemin, '#f4f2ed');
  assert.equal(RENK.murekkep, '#15181d');
  assert.equal(RENK.vurgu, '#d0211a');
  assert.equal(RENK.trKara, '#e2ddd2');
  assert.equal(RENK.komsuKara, '#ebe7df');
});

test('Türkçe harfler yazı tipinde', () => {
  for (const f of [BASLIK, ETIKET]) for (const h of 'İıŞşĞğÜüÖöÇç') assert.notEqual(f.charToGlyph(h).index, 0, h);
});

test('sigdir: sığan başlık büyük boyda kalır', () => {
  const r = sigdir(BASLIK, 'Muğla’da 4,5 büyüklüğünde deprem', { boy: 60, enAz: 44, enGenis: 1152, enCokSatir: 2 });
  assert.equal(r.boy, 60);
  assert.equal(r.satirlar.length, 1);
  assert.equal(r.kesildi, false);
});

test('sigdir: uzun başlık küçülür, en azda da sığmazsa … ile kesilir', () => {
  const r = sigdir(BASLIK, 'Çok uzun başlık '.repeat(20), { boy: 60, enAz: 44, enGenis: 1152, enCokSatir: 2 });
  assert.equal(r.boy, 44);
  assert.equal(r.satirlar.length, 2);
  assert.ok(r.satirlar[1].endsWith('…'));
  assert.equal(r.kesildi, true);
  for (const s of r.satirlar) assert.ok(genislik(BASLIK, s, 44) <= 1152, s);
});

test('sigdir: satıra sığmayan tek kelime de kesilir', () => {
  const r = sigdir(BASLIK, 'Uzunkelime'.repeat(30), { boy: 60, enAz: 44, enGenis: 600, enCokSatir: 2 });
  for (const s of r.satirlar) assert.ok(genislik(BASLIK, s, r.boy) <= 600, s);
  assert.equal(r.kesildi, true);
});

test('yazi harf aralığıyla genişler', () => {
  assert.ok(genislik(ETIKET, 'DEPREM', 23, { aralik: 0.14 }) > genislik(ETIKET, 'DEPREM', 23));
  assert.match(yazi(ETIKET, 'DEPREM', 0, 20, 23, RENK.ikincil, { aralik: 0.14 }), /^<path d="M/);
});

test('balonda telgraf simgesi: konturlu balon, içinde nokta · çizgi · nokta, kırmızı yalnız ilk nokta', () => {
  for (const boy of [16, 32, 200]) {
    const s = telgrafSimge(0, 0, boy);
    assert.equal((s.match(/<path [^>]*fill="none"[^>]*stroke="#15181d"/g) ?? []).length, 1, `${boy}: balon konturu`);
    assert.equal((s.match(/<rect /g) ?? []).length, 1, String(boy));
    assert.equal((s.match(/<circle /g) ?? []).length, 2, String(boy));
    assert.equal((s.match(/#d0211a/g) ?? []).length, 1, String(boy));
  }
  assert.ok(!telgrafSimge(0, 0, 200, { koyu: true }).includes('#15181d'));
});

test('logoTelgraf: simge + küçük harf istihbar; koyu sürümde mürekkep yok', () => {
  yaziKaydiBaslat();
  const l = logoTelgraf(64, 600, 48);
  assert.deepEqual(yaziKaydiBitir(), ['istihbar']);
  assert.equal((l.ic.match(/#d0211a/g) ?? []).length, 1);
  assert.ok(l.genislik > 150 && l.genislik < 400, String(l.genislik));
  const k = logoTelgraf(0, 0, 48, { koyu: true });
  assert.ok(!k.ic.includes('#15181d'));
  assert.match(k.ic, /#f4f2ed/);
});

test('kelime yazı tipi normal genişlik (dar başlık kesiminden geniş)', () => {
  assert.ok(genislik(KELIME, 'istihbar', 100) > genislik(BASLIK, 'istihbar', 100) * 1.1);
});

test('kutu kaydı yerleşen öğeleri toplar', () => {
  kutuKaydiBaslat();
  kutuKaydet('baslik', 64, 100, 500, 60);
  assert.deepEqual(kutuKaydiBitir(), [{ ad: 'baslik', x: 64, y: 100, g: 500, h: 60 }]);
  kutuKaydet('x', 0, 0, 1, 1); // kayıt kapalıyken sessiz
});

test('svg zemin rengiyle sarar', () => {
  assert.match(svg(1280, 720, ''), /fill="#f4f2ed"/);
});
