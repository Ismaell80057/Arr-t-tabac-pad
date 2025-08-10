const CACHE='anti-tabac-mvp-v1';
const ASSETS=[
  '/', '/index.html', '/app.html',
  '/css/style.css',
  '/js/app.js',
  '/apple-touch-icon.png',
  '/favicon.png',
  '/manifest.json'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
