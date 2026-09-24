/** Verificación AAA de pares texto/fondo del design system (WCAG 2.2).
 * Uso: bun run scripts/check-contrast.mjs (falla si algún par < 7:1).
 * Ratios calculados con luminancia relativa sRGB.
 */
function lum(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const [R, G, B] = [r, g, b].map(f);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
// [fg, bg, etiqueta] — todos deben ser >= 7.0 (AAA texto normal)
const PAIRS = [
  ['#1a1a18', '#f5f5f0', 'standard texto/canvas'],
  ['#4e4e49', '#f5f5f0', 'standard muted/canvas'],
  ['#1a1a18', '#ffd23f', 'standard sobre amarillo'],
  ['#1a1a18', '#7de8f0', 'standard sobre cyan activo'],
  ['#0b4f8a', '#ffffff', 'standard azul tinta/surface'],
  ['#0a4d2e', '#ffffff', 'standard verde tinta/surface'],
  ['#8a1f1f', '#ffffff', 'standard rojo tinta/surface (red-letters)'],
  ['#000000', '#ff6b6b', 'standard sobre coral'],
  ['#3f4750', '#f7f4ed', 'calma muted/canvas'],
  ['#222831', '#ffeaa7', 'calma sobre amarillo pastel'],
  ['#000000', '#ffff00', 'HC sobre amarillo puro'],
  ['#000000', '#00ffff', 'HC sobre cyan'],
  ['#004e89', '#ffffff', 'HC azul tinta/surface'],
  ['#433422', '#f4ecd8', 'sepia texto/canvas'],
  ['#4a3f30', '#f4ecd8', 'sepia muted/canvas'],
  ['#2e2114', '#e8c872', 'sepia sobre amarillo'],
  ['#f5f5f0', '#1a1a18', 'dark texto/canvas'],
  ['#c9c9c9', '#1a1a18', 'dark muted/canvas'],
  ['#1a1a18', '#ffd23f', 'dark tinta oscura sobre amarillo'],
  ['#a8d4ff', '#242422', 'dark azul tinta/surface'],
  ['#ffb4ab', '#242422', 'dark rojo tinta/surface + red-letters'],
  ['#f5f5f0', '#242422', 'dark marca Aletheia/surface (brand-btn)'],
  ['#c9c9c9', '#242422', 'dark subtitulo muted/surface (brand-btn)'],
  ['#ffffff', '#000000', 'oled texto/canvas'],
  ['#c9c9c9', '#000000', 'oled muted/canvas'],
  ['#a8d4ff', '#0a0a0a', 'oled azul tinta/surface'],
  ['#ffffff', '#0a0a0a', 'oled marca Aletheia/surface (brand-btn)'],
  ['#c9c9c9', '#0a0a0a', 'oled subtitulo muted/surface (brand-btn)'],
  ['#8a1f1f', '#ffffff', 'error solido claro: #fff sobre #8a1f1f (invertido)'],
  ['#ffffff', '#8a1f1f', 'error solido claro bg'],
  ['#1a1a18', '#ffb4ab', 'error solido oscuro bg'],
];
let failed = 0;
for (const [fg, bg, label] of PAIRS) {
  const r = ratio(fg, bg);
  const ok = r >= 7.0;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${r.toFixed(2)}:1 ${label} (${fg} sobre ${bg})`);
}
if (failed > 0) {
  console.error(`\n${failed} par(es) bajo AAA (7:1).`);
  process.exit(1);
} else {
  console.log('\nTodos los pares cumplen AAA (7:1).');
}
