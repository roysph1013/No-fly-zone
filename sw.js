// 禁航區繪製小工具 Service Worker
// 採「網路優先」：有網路時一律拿最新版（不會卡在舊版），沒網路時才用上次存下來的檔案。
// 地圖圖磚（Google／OSM）不存，避免佔用手機空間。
const CACHE_NAME = 'nofly-cache-v2';
const CACHEABLE_HOSTS = [self.location.host];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (!CACHEABLE_HOSTS.includes(url.host)) return;

    event.respondWith(
        fetch(req)
            .then(res => {
                if (res && (res.ok || res.type === 'opaque')) {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
                }
                return res;
            })
            .catch(() => caches.match(req, { ignoreSearch: url.host === self.location.host }))
    );
});
