// Test yardımcıları.
const IMZA = [137, 80, 78, 71, 13, 10, 26, 10];
export const pngMi = (buf) => IMZA.every((b, i) => buf[i] === b);
