const CACHE_NAME = 'agendacdcm-v1';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/utils.js',
    './js/data-model.js',
    './js/storage-service.js',
    './js/state-manager.js',
    './js/components/sidebar.js',
    './js/components/topbar.js',
    './js/components/form-modal.js',
    './js/views/calendar.js',
    './js/views/kanban.js',
    './js/views/list.js',
    './js/views/paint.js',
    './js/app.js',
    './assets/icon.svg',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ASSETS);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            );
        })
    );
});
