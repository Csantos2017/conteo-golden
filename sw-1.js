// Service Worker para Conteo · Golden
// Permite que la app se instale y abra rápido

var CACHE = 'conteo-v1';
var ARCHIVOS = [
  './conteo.html',
  './manifest.json'
];

// Al instalar, guarda los archivos base
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ARCHIVOS).catch(function(){ /* si falla alguno, no rompe */ });
    })
  );
});

// Al activar, limpia versiones viejas del cache
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(claves){
      return Promise.all(claves.map(function(k){
        if(k !== CACHE) return caches.delete(k);
      }));
    })
  );
  self.clients.claim();
});

// Estrategia: primero la red (para datos frescos), si falla usa el cache
self.addEventListener('fetch', function(e){
  // Solo manejar peticiones GET del mismo origen; dejar pasar Supabase y CDNs directo a la red
  var url = e.request.url;
  if(e.request.method !== 'GET'){ return; }
  if(url.indexOf('supabase') >= 0 || url.indexOf('cdn.') >= 0 || url.indexOf('jsdelivr') >= 0){
    return; // deja que vayan directo a la red
  }
  e.respondWith(
    fetch(e.request).then(function(resp){
      // Guardar copia fresca en cache
      var copia = resp.clone();
      caches.open(CACHE).then(function(cache){ cache.put(e.request, copia).catch(function(){}); });
      return resp;
    }).catch(function(){
      // Sin red: usar cache
      return caches.match(e.request);
    })
  );
});
