// Leitor de códigos em segundo plano (zxing-cpp em WebAssembly).
// Roda fora da tela principal para a câmera não travar.
importScripts("zxing-wasm-reader.js");
const wasmUrl = new URL("zxing_reader.wasm", self.location.href).href;
const OPTS = {tryHarder: true, tryRotate: true, tryInvert: true, tryDownscale: true, maxNumberOfSymbols: 8};
ZXingWASM.prepareZXingModule({
  overrides: { locateFile: (path, prefix) => path.endsWith(".wasm") ? wasmUrl : prefix + path },
  fireImmediately: true
}).then(() => postMessage({type: "ready"}), err => postMessage({type: "error", message: String(err)}));

// Realça as barras (máscara de nitidez): ajuda com imagem tremida ou fora de foco.
function sharpen(img){
  const {width: w, height: h, data: d} = img, n = w * h;
  const g = new Float32Array(n), t = new Float32Array(n), b = new Float32Array(n), R = 2, k = 2 * R + 1;
  for (let i = 0, j = 0; i < n; i++, j += 4) g[i] = d[j] * 0.299 + d[j+1] * 0.587 + d[j+2] * 0.114;
  for (let y = 0; y < h; y++){ const o = y * w; let s = 0;
    for (let x = -R; x <= R; x++) s += g[o + Math.min(w-1, Math.max(0, x))];
    for (let x = 0; x < w; x++){ t[o + x] = s / k; s += g[o + Math.min(w-1, x + R + 1)] - g[o + Math.max(0, x - R)]; } }
  for (let x = 0; x < w; x++){ let s = 0;
    for (let y = -R; y <= R; y++) s += t[Math.min(h-1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++){ b[y * w + x] = s / k; s += t[Math.min(h-1, y + R + 1) * w + x] - t[Math.max(0, y - R) * w + x]; } }
  for (let i = 0, j = 0; i < n; i++, j += 4){ const v = Math.max(0, Math.min(255, g[i] + 2.5 * (g[i] - b[i]))); d[j] = d[j+1] = d[j+2] = v; d[j+3] = 255; }
  return img;
}
onmessage = async (e) => {
  const d = e.data;
  if (d.type !== "decode") return;
  try {
    const img = d.sharpen ? sharpen(d.imageData) : d.imageData;
    const res = await ZXingWASM.readBarcodes(img, OPTS);
    postMessage({type: "result", id: d.id, texts: res.filter(r => r.isValid !== false && r.text).map(r => r.text)});
  } catch (err) {
    postMessage({type: "result", id: d.id, texts: [], error: String(err)});
  }
};
