// Bütün kart tiplerini gerçek çiziciyle PNG olarak üretir ve ornek/index.html'e dizer (sahibin onayı için; ornek/ gitignore).
// Haberler kanalın 24 Kasım 2026 mesajlarından; kanalda karşılığı olmayan tiplerde örnek veri (sayfada işaretli).
// Kullanım: node scripts/ornek-sayfa.mjs  (piyasalar kartı için ağ gerekir; yoksa o kart atlanır)
import fs from 'node:fs';
import { ciz } from './ciz.mjs';
import { kareCiz } from './kare.mjs';

const KLASOR = 'ornek';
const t = (saat) => Date.parse(`2026-11-24T${saat}:00+03:00`);
const yazili = (saat, baslik, ek = {}) => ({ url: baslik, baslik, yayin: t(saat), yazi: { baslik, metin: 'm', ...ek } });

const YATAY = [
  ['duz', 'Düz haber', false, yazili('22:11', '41 ilin valisi değişti, Polis Akademisi Başkanı görevden alındı', { kategori: 'TÜRKİYE' })],
  ['son-dakika', 'Son dakika', false, { ...yazili('22:18', 'Kolombiya’nın Cartagena kentinde süpermarkette rehin krizi', { kategori: 'DÜNYA' }), puan: 90 }],
  ['harita-il', 'Harita · il', false, yazili('19:30', 'Eskişehir’de askeri helikopter eğitim uçuşunda düştü', { kategori: 'TÜRKİYE', kart: { sablon: 'harita', yer: 'Eskişehir', bilgi: [{ etiket: 'ARAÇ', deger: 'AS-532' }] } })],
  ['harita-deprem', 'Harita · deprem', false, { url: 'd', baslik: 'Muğla’da 4,5 büyüklüğünde deprem', yayin: t('16:47'), deprem: true, ek: JSON.stringify({ il: 'Muğla', buyukluk: 4.5 }) }],
  ['harita-dunya', 'Harita · dünya', false, yazili('22:18', 'Kolombiya’nın Cartagena kentinde süpermarkette rehin krizi', { kategori: 'DÜNYA', kart: { sablon: 'dunya', yer: 'Kolombiya', sehir: 'Cartagena', bilgi: [{ etiket: 'REHİNE', deger: '~25 kişi' }] } })],
  ['meclis', 'Meclis dağılımı', true, yazili('23:40', 'Sırbistan’da Öğrenci Listesi meclis çoğunluğunu aldı', { kategori: 'DÜNYA', kart: { sablon: 'meclis', toplam: 250, ogeler: [{ ad: 'Öğrenci Listesi', deger: 140 }, { ad: 'Vučić · Birleşmiş Sırbistan', deger: 104 }, { ad: 'Diğer', deger: 6 }] } })],
  ['once-sonra', 'Önce → sonra', true, yazili('10:00', 'İşsizlik oranı eylülde yüzde 8,4’e çıktı', { kategori: 'EKONOMİ', kart: { sablon: 'once_sonra', once: { etiket: 'Ağustos', deger: 7.9 }, sonra: { etiket: 'Eylül', deger: 8.4 }, birim: '%', aciklama: 'İşsizlik oranı' } })],
  ['zam', 'Zam', true, yazili('19:00', 'Benzine 1,15 lira zam', { kategori: 'EKONOMİ', kart: { sablon: 'zam', once: { etiket: 'Eski', deger: 46.2 }, sonra: { etiket: 'Yeni', deger: 47.35 }, birim: 'TL', aciklama: 'Benzin · litre · İstanbul' } })],
  ['karsilastirma', 'Karşılaştırma', true, yazili('14:05', 'TCMB politika faizini yüzde 39,5’te sabit tuttu', { kategori: 'EKONOMİ', kart: { sablon: 'karsilastirma', birim: '%', ogeler: [{ ad: 'Türkiye', deger: 39.5 }, { ad: 'Rusya', deger: 16.5 }, { ad: 'Brezilya', deger: 15 }, { ad: 'ABD', deger: 3.75 }] } })],
  ['siralama', 'Sıralama', true, yazili('11:30', 'İllere göre sıralama (örnek)', { kategori: 'TÜRKİYE', kart: { sablon: 'siralama', ogeler: [{ ad: 'İstanbul', deger: 4.2, birim: 'milyon' }, { ad: 'Ankara', deger: 1.1, birim: 'milyon' }, { ad: 'İzmir', deger: 920, birim: 'bin' }] } })],
  ['zaman', 'Zaman çizelgesi', true, yazili('12:15', 'Belediye soruşturmasında başkan dahil 27 gözaltı', { kategori: 'TÜRKİYE', kart: { sablon: 'zaman', olaylar: [{ tarih: '16 Ekim', metin: 'Belediye binasında arama' }, { tarih: '27 Ekim sabah', metin: 'İmar soruşturmasında operasyon' }, { tarih: '27 Ekim', metin: 'Başkan dahil 27 gözaltı' }] } })],
];
const MADDE = ['41 ilin valisi değişti, Polis Akademisi Başkanı görevden alındı', 'Eskişehir’de askeri helikopter düştü', 'İsrail, ateşkese rağmen Lübnan’ın güneyini vurdu', 'AB’nin hibrit araç kotası Türkiye’yi de kapsıyor', 'NATO Genel Sekreteri Rutte, Florida’da Trump ile görüşecek'].map((baslik) => ({ baslik }));
const DIKEY = [
  ['bulten', 'Bülten', false, { tur: 'bulten', veri: { baslik: 'Akşam bülteni', tarih: '24 Kasım 2026 · 19:00', maddeler: MADDE } }],
  ['hafta', 'Haftanın özeti', true, { tur: 'hafta', veri: { baslik: 'Haftanın özeti', tarih: '17 – 23 Kasım 2026', maddeler: MADDE } }],
  ['piyasalar', 'Piyasalar (canlı veri)', false, { tur: 'ekonomi', veri: { baslik: 'Piyasalar', alt: 'Sabah · 25 Kasım 2026 · 08:00' } }],
  ['akaryakit', 'Akaryakıt zammı', true, { tur: 'zam', veri: { urun: 'benzin', yer: 'İstanbul (Avrupa)', eski: 46.2, yeni: 47.35, baslik: 'Benzine 1,15 lira zam', yayin: t('19:00'), yerler: [{ yer: 'İstanbul (Avrupa)', eski: 46.2, yeni: 47.35 }, { yer: 'Ankara', eski: 47.05, yeni: 48.2 }, { yer: 'İzmir', eski: 47.29, yeni: 48.44 }] } }],
  ['bugun', 'Bugün', true, { tur: 'bugun', veri: { tarih: '25 Kasım 2026', ogeler: [{ saat: 'TÜİK', metin: 'İşgücü istatistikleri' }, { saat: 'TCMB', metin: 'Para Politikası Kurulu faiz kararı' }] } }],
];

fs.mkdirSync(KLASOR, { recursive: true });
const hucre = (ad, etiket, ornek, sinif) => `<figure class="${sinif}"><img src="${ad}.png" alt="${etiket}"><figcaption>${etiket}${ornek ? ' <em>örnek veri</em>' : ''}</figcaption></figure>`;
const yatay = [];
for (const [ad, etiket, ornek, h] of YATAY) {
  fs.writeFileSync(`${KLASOR}/${ad}.png`, await ciz(h));
  yatay.push(hucre(ad, etiket, ornek, 'y'));
}
const dikey = [];
for (const [ad, etiket, ornek, is] of DIKEY) {
  try {
    fs.writeFileSync(`${KLASOR}/${ad}.png`, await kareCiz({ anahtar: ad, ...is }));
    dikey.push(hucre(ad, etiket, ornek, 'd'));
  } catch (e) {
    console.log(`${ad} atlandı: ${e.message}`);
  }
}
fs.writeFileSync(
  `${KLASOR}/index.html`,
  `<!doctype html><meta charset="utf-8"><title>istihbar · örnek kartlar</title><style>body{background:#1b1d21;color:#cfd3da;font:14px system-ui;margin:28px}h1{font-weight:600;color:#fff}h2{font-weight:600;color:#fff;margin:30px 0 10px}.s{display:flex;flex-wrap:wrap;gap:22px}figure{margin:0}figure.y img{width:640px}figure.d img{width:360px}figcaption{margin-top:6px;color:#9aa0aa}em{font-style:normal;color:#c79a3a}</style>
<h1>istihbar · yeni kartlar (gerçek çizici)</h1><h2>Yatay kartlar · 1280×720</h2><div class="s">${yatay.join('')}</div><h2>Dikey kartlar · 1080×1350</h2><div class="s">${dikey.join('')}</div>`,
);
console.log(`${yatay.length + dikey.length} kart → ${KLASOR}/index.html`);
