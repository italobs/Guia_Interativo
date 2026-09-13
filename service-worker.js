const CACHE_NAME = 'parmenides-pwa-v1';

const ARQUIVOS_ESSENCIAIS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable-512.png'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return Promise.allSettled(
                ARQUIVOS_ESSENCIAIS.map(function (arquivo) {
                    return cache.add(arquivo);
                })
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (nomes) {
            return Promise.all(
                nomes
                    .filter(function (nome) {
                        return nome !== CACHE_NAME;
                    })
                    .map(function (nome) {
                        return caches.delete(nome);
                    })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (event) {
    const requisicao = event.request;

    if (requisicao.method !== 'GET') {
        return;
    }

    if (requisicao.mode === 'navigate') {
        event.respondWith(
            fetch(requisicao)
                .then(function (resposta) {
                    const copia = resposta.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put('./index.html', copia);
                    });
                    return resposta;
                })
                .catch(function () {
                    return caches.match('./index.html');
                })
        );
        return;
    }

    event.respondWith(
        caches.match(requisicao).then(function (armazenado) {
            if (armazenado) {
                return armazenado;
            }

            return fetch(requisicao).then(function (resposta) {
                if (resposta && (resposta.ok || resposta.type === 'opaque')) {
                    const copia = resposta.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(requisicao, copia);
                    });
                }
                return resposta;
            });
        })
    );
});
