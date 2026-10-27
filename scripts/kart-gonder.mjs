// GitHub Actions'ta çalışır: vesaire'deki kart kuyruğunu çeker, her haber için istihbar kartını çizer ve vesaire'ye
// yollar (Telegram'a vesaire gönderir; bot token'ı burada yok). Ortam: VESAIRE_URL, KART_ANAHTARI.
// Önce kare işler (bülten, ekonomi …; vesaire src/kare.js), sonra haber kartları.
import { ciz } from './ciz.mjs';
import { kareCiz } from './kare.mjs';

const { VESAIRE_URL, KART_ANAHTARI } = process.env;
if (!VESAIRE_URL || !KART_ANAHTARI) throw new Error('VESAIRE_URL ve KART_ANAHTARI gerekli');
const yetki = { authorization: `Bearer ${KART_ANAHTARI}` };
const ortam = { VESAIRE_URL, yetki };

// Çizim sürerken yeni iş kuyruğa girebilir: iki kuyruk da boşalana kadar (en çok 5 tur) devam et.
let hata = 0;
for (let tur = 0; tur < 5; tur++) {
  const kr = await fetch(`${VESAIRE_URL}/istihbar/kare-kuyruk`, { headers: yetki });
  // 404: vesaire henüz kare kuyruğu olmayan sürümde (deploy arası); haber kartları yine çizilir.
  if (!kr.ok && kr.status !== 404) throw new Error(`kare kuyruğu HTTP ${kr.status}`);
  const isler = kr.ok ? await kr.json() : [];
  for (const is of isler) {
    let png = null;
    try {
      png = await kareCiz({ ...is, ortam });
    } catch (e) {
      // Çizilemeyen iş vesaire'de zaman aşımına düşer (bülten düz metinle gider).
      console.log(`kare çizilemedi (${is.anahtar}): ${e.message}`);
      hata++;
      continue;
    }
    if (!png) {
      await fetch(`${VESAIRE_URL}/istihbar/kare-bos`, { method: 'POST', headers: { ...yetki, 'content-type': 'application/json' }, body: JSON.stringify({ anahtar: is.anahtar }) });
      console.log(`bos: ${is.anahtar}`);
      continue;
    }
    const form = new FormData();
    form.set('anahtar', is.anahtar);
    form.set('kart', new Blob([png], { type: 'image/png' }), 'kart.png');
    const g = await fetch(`${VESAIRE_URL}/istihbar/kare`, { method: 'POST', headers: yetki, body: form });
    const { sonuc } = await g.json().catch(() => ({ sonuc: `HTTP ${g.status}` }));
    console.log(`${sonuc}: ${is.anahtar}`);
    if (sonuc === 'hata' || !g.ok) hata++;
  }

  const res = await fetch(`${VESAIRE_URL}/istihbar/kuyruk`, { headers: yetki });
  if (!res.ok) throw new Error(`kuyruk HTTP ${res.status}`);
  const haberler = await res.json();
  if (!haberler.length && !isler.length) break;
  for (const h of haberler) {
    const form = new FormData();
    form.set('url', h.url);
    form.set('kart', new Blob([await ciz(h)], { type: 'image/png' }), 'kart.png');
    const g = await fetch(`${VESAIRE_URL}/istihbar/kart`, { method: 'POST', headers: yetki, body: form });
    const { sonuc } = await g.json().catch(() => ({ sonuc: `HTTP ${g.status}` }));
    // Herkese açık Actions kaydına kaynağın başlığı değil, istihbar'ın başlığı yazılır.
    console.log(`${sonuc}: ${h.yazi?.baslik ?? h.baslik}`);
    if (sonuc === 'hata' || !g.ok) hata++;
  }
}
if (hata) process.exitCode = 1;
