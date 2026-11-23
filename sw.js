const CACHE='tokyo-guide-v21';
const CORE=['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    await Promise.allSettled(CORE.map(path=>cache.add(path)));
  }));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('tokyo-guide-')&&key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(req.mode==='navigate'){
      try{
        const response=await fetch(req);
        if(response.ok)await cache.put('./index.html',response.clone());
        return response;
      }catch(e){
        return await cache.match('./index.html')||await cache.match('./')||Response.error();
      }
    }
    const cached=await cache.match(req);
    if(cached)return cached;
    try{
      const response=await fetch(req);
      if(response.ok)cache.put(req,response.clone()).catch(()=>{});
      return response;
    }catch(e){return Response.error()}
  })());
});