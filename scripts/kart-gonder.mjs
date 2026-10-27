// GitHub Actions'ta çalışır: vesaire'deki kart kuyruğunu çeker, her haber için istihbar kartını çizer ve vesaire'ye
// yollar (Telegram'a vesaire gönderir; bot token'ı burada yok). Ortam: VESAIRE_URL, KART_ANAHTARI.
import { ciz } from './ciz.mjs';

const { VESAIRE_URL, KART_ANAHTARI } = process.env;
if (!VESAIRE_URL || !KART_ANAHTARI) throw new Error('VESAIRE_URL ve KART_ANAHTARI gerekli');
const yetki = { authorization: `Bearer ${KART_ANAHTARI}` };

// Çizim sürerken yeni haber kuyruğa girebilir: kuyruk boşalana kadar (en çok 5 tur) devam et.
let hata = 0;
for (let tur = 0; tur < 5; tur++) {
  const res = await fetch(`${VESAIRE_URL}/istihbar/kuyruk`, { headers: yetki });
  if (!res.ok) throw new Error(`kuyruk HTTP ${res.status}`);
  const haberler = await res.json();
  if (!haberler.length) break;
  for (const h of haberler) {
    const form = new FormData();
    form.set('url', h.url);
    form.set('kart', new Blob([await ciz(h)], { type: 'image/png' }), 'kart.png');
    const g = await fetch(`${VESAIRE_URL}/istihbar/kart`, { method: 'POST', headers: yetki, body: form });
    const { sonuc } = await g.json().catch(() => ({ sonuc: `HTTP ${g.status}` }));
    console.log(`${sonuc}: ${h.baslik}`);
    if (sonuc === 'hata' || !g.ok) hata++;
  }
}
if (hata) process.exitCode = 1;
