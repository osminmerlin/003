const CACHE_NAME = 'smoke-tracker-stable-v1';
const urlsToCache = [
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// 安装Service Worker
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('缓存已打开');
                return cache.addAll(urlsToCache);
            })
    );
});

// 激活Service Worker
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('删除旧缓存');
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 拦截请求
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                
                return fetch(event.request).catch(function() {
                    return caches.match('./index.html');
                });
            })
    );
});