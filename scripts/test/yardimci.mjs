// Test yardımcıları.
const IMZA = [137, 80, 78, 71, 13, 10, 26, 10];
export const pngMi = (buf) => IMZA.every((b, i) => buf[i] === b);
// İki kutu ({x, y, g, h}) kesişiyor mu (kenar teması kesişme sayılmaz).
export const kesisir = (a, b) => a.x < b.x + b.g && b.x < a.x + a.g && a.y < b.y + b.h && b.y < a.y + a.h;
