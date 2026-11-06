/* =====================================================
   TASKFLOW - SERVICE WORKER
   Cache dos arquivos principais e suporte offline
===================================================== */

const CACHE_NAME = "taskflow-shell-v1";

const ARQUIVOS_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./style.css?v=9",
    "./script.js",
    "./script.js?v=6",
    "./manifest.json",
    "./icons/taskflow-icon.svg"
];

/* INSTALAÇÃO */

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ARQUIVOS_CACHE))
            .then(() => self.skipWaiting())
    );
});

/* ATIVAÇÃO */

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(nomes => {
                return Promise.all(
                    nomes
                        .filter(nome =>
                            nome.startsWith("taskflow-shell-") &&
                            nome !== CACHE_NAME
                        )
                        .map(nome => caches.delete(nome))
                );
            })
            .then(() => self.clients.claim())
    );
});

/* REQUISIÇÕES */

self.addEventListener("fetch", event => {
    const requisicao = event.request;

    // Somente requisições GET são armazenadas.
    if (requisicao.method !== "GET") {
        return;
    }

    const url = new URL(requisicao.url);

    // Não intercepta requisições externas.
    if (url.origin !== self.location.origin) {
        return;
    }

    // Navegação: tenta a rede e usa o HTML salvo se estiver offline.
    if (requisicao.mode === "navigate") {
        event.respondWith(
            fetch(requisicao)
                .then(resposta => {
                    if (resposta && resposta.ok) {
                        const copia = resposta.clone();

                        caches.open(CACHE_NAME).then(cache => {
                            cache.put("./index.html", copia);
                        });
                    }

                    return resposta;
                })
                .catch(() => {
                    return caches.match("./index.html")
                        .then(respostaSalva => {
                            return respostaSalva || new Response(
                                "O TaskFlow está temporariamente indisponível. Conecte-se à internet para acessá-lo pela primeira vez.",
                                {
                                    status: 503,
                                    headers: {
                                        "Content-Type": "text/plain; charset=utf-8"
                                    }
                                }
                            );
                        });
                })
        );

        return;
    }

    // Arquivos estáticos: primeiro tenta o cache.
    event.respondWith(
        caches.match(requisicao)
            .then(respostaSalva => {
                if (respostaSalva) {
                    return respostaSalva;
                }

                return fetch(requisicao)
                    .then(resposta => {
                        if (
                            resposta &&
                            resposta.ok &&
                            resposta.type === "basic"
                        ) {
                            const copia = resposta.clone();

                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(requisicao, copia);
                            });
                        }

                        return resposta;
                    });
            })
    );
});
