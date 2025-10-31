const CACHE_NAME = 'smoke-tracker-v1.3';
const urlsToCache = [
    './',
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

// 拦截请求 - 修复404问题
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // 缓存命中，返回响应
                if (response) {
                    return response;
                }
                
                // 处理主屏幕图标打开的根路径请求
                if (event.request.url.endsWith('/') || event.request.url.endsWith('/index.html')) {
                    return caches.match('./index.html');
                }
                
                // 处理其他请求
                return fetch(event.request).catch(function() {
                    // 网络失败时返回缓存的index.html
                    return caches.match('./index.html');
                });
            })
    );
});