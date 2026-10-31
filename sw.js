/* sw.js — Service Worker 离线缓存 */
var CACHE_NAME = 'echo-hanzi-v2';
var PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './i18n.js',
  './share.js',
  './speech-rec.js',
  './pinyin.js',
  './ime.js',
  './custom.js',
  './dict.js',
  './collection.js',
  './license.js',
  './course.js',
  './achievements.js',
  './t9.js',
  './tutor.js',
  './pron.js',
  './stories.js',
  './data.js',
  './audio.js',
  './srs.js',
  './stats.js',
  './app.js',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  // 只处理 GET 请求
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  // 忽略外部跨域、或者带有测试特有 query 的请求
  if (url.origin !== self.location.origin) return;
  if (url.searchParams.has('retry') || url.searchParams.has('diag')) return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(req, clone);
        });
        return res;
      }).catch(function () {
        // 离线且资源没匹配到时，如果请求的是页面，降级返回 index.html
        if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
