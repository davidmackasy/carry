const CACHE='carry-shell-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/offline.html','/favicon.svg','/icon-192.png','/icon-512.png'])));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
// Never cache authenticated documents, API responses, or financial records on a shared device.
self.addEventListener('fetch',event=>{if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')))});
