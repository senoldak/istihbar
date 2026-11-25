// Harita görseli (spec 2026-11-25 §5.2, minimal panel): yer tablosu, olay noktası, etiket kuralları.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { haritaSvg } from '../tasarim/harita.mjs';
import { ilBul, sehirBul, ulkeBul, yakinSehirler } from '../tasarim/yer.mjs';
import { kesisir } from './yardimci.mjs';

const A = { g: 660, y: 624 };

test('yer: il, ülke takma adı ve şehir bulunur', () => {
  assert.equal(ilBul('MUĞLA').ad, 'Muğla');
  assert.equal(ilBul('Kahramanmaraş').ad, 'Kahramanmaraş');
  assert.equal(ilBul('Atlantis'), null);
  assert.equal(ulkeBul('ABD').kod, 'USA');
  assert.equal(ulkeBul('Kolombiya').kod, 'COL');
  assert.equal(sehirBul('Cartagena', 'COL').saatDilimi, 'America/Bogota');
  assert.equal(sehirBul('Yokşehir', 'COL'), null);
});

test('yakın şehirler: hariç tutulan atlanır, en yakın önce', () => {
  const s = yakinSehirler(ilBul('Eskişehir').nokta, { haric: ['Eskişehir'], adet: 2 });
  assert.equal(s.length, 2);
  assert.ok(!s.some((x) => x.ad === 'Eskişehir'));
  assert.ok(['Bilecik', 'Kütahya'].includes(s[0].ad), s[0].ad);
});

test('olay noktası yatayda %50, dikeyde %46', () => {
  const r = haritaSvg({ tur: 'il', il: 'Eskişehir' }, A);
  assert.ok(Math.abs(r.nokta.x - 330) < 30 && Math.abs(r.nokta.y - 287) < 30, JSON.stringify(r.nokta));
});

test('deprem olay adı yalnız il; koordinat noktayı belirler', () => {
  const r = haritaSvg({ tur: 'deprem', il: 'Muğla', enlem: 37.22, boylam: 28.36, buyukluk: 4.5 }, A);
  assert.ok(r.etiketler.some((e) => e.ad === 'MUĞLA'));
  assert.equal(r.yer.ad, 'Muğla');
});

test('kırmızı yalnız olay noktası ve halkası; deniz zemin rengi; il ağı yok', () => {
  const r = haritaSvg({ tur: 'il', il: 'Eskişehir' }, A);
  assert.equal((r.ic.match(/#d0211a/g) ?? []).length, 2);
  assert.match(r.ic, /fill="#f4f2ed"/);
  assert.ok((r.ic.match(/<path/g) ?? []).length < 40);
});

test('kenardaki olay: etiketler kenara 40 px yakın değil, birbirine binmez', () => {
  for (const girdi of [
    { tur: 'il', il: 'Hakkari' },
    { tur: 'il', il: 'Edirne' },
    { tur: 'deprem', il: 'Hatay', enlem: 36.2, boylam: 36.16, buyukluk: 5.1 },
    { tur: 'dunya', ulke: 'Şili' },
    { tur: 'dunya', ulke: 'Kolombiya', sehir: 'Cartagena' },
  ]) {
    const { etiketler } = haritaSvg(girdi, A);
    assert.ok(etiketler.length >= 1);
    for (const e of etiketler) assert.ok(e.x >= 40 && e.y >= 40 && e.x + e.g <= 620 && e.y + e.h <= 584, `${JSON.stringify(girdi)} ${JSON.stringify(e)}`);
    for (const a of etiketler) for (const b of etiketler) if (a !== b) assert.ok(!kesisir(a, b), `${a.ad}/${b.ad}`);
  }
});

test('dünya: şehir bulunursa adı ve saat dilimi döner, bulunmazsa ülke adı', () => {
  const s = haritaSvg({ tur: 'dunya', ulke: 'Kolombiya', sehir: 'Cartagena' }, A);
  assert.equal(s.yer.saatDilimi, 'America/Bogota');
  assert.ok(s.etiketler.some((e) => e.ad === 'CARTAGENA'));
  const r = haritaSvg({ tur: 'dunya', ulke: 'Kolombiya', sehir: 'Yokşehir' }, A);
  assert.ok(r.etiketler.some((e) => e.ad === 'KOLOMBİYA'));
  assert.equal(r.yer.saatDilimi ?? null, null);
});

test('il bulunamazsa ama koordinat varsa deprem en yakın ile düşer', () => {
  const r = haritaSvg({ tur: 'deprem', il: null, enlem: 39.78, boylam: 30.52, buyukluk: 3.9 }, A);
  assert.equal(r.yer.ad, 'Eskişehir');
});

test('bilinmeyen il ve ülke fırlatır', () => {
  assert.throws(() => haritaSvg({ tur: 'il', il: 'Atlantis' }, A));
  assert.throws(() => haritaSvg({ tur: 'dunya', ulke: 'Atlantis' }, A));
});
