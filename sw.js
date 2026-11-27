// Guarda o app no aparelho para abrir rápido e funcionar sem internet.
const CACHE = "bipou-v9";
const FILES = ["./", "index.html", "manifest.webmanifest", "zxing.min.js", "xlsx.mini.min.js", "jspdf.umd.min.js", "decoder-worker.js", "zxing-wasm-reader.js", "zxing_reader.wasm", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: "reload"})))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Rede primeiro (pega atualizações); sem internet, usa o que está guardado.
  e.respondWith(fetch(e.request, {cache: "no-cache"}).then(r => { if (r.ok && new URL(e.request.url).origin === location.origin){ const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; })
    .catch(() => caches.match(e.request, {ignoreSearch:true}).then(r => r || caches.match("index.html"))));
});
