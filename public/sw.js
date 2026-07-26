/**
 * Service worker i faqes.
 *
 * Qëllimi kryesor nuk është shpejtësia por disponueshmëria: orari është i futur
 * brenda paketës JS, prandaj pasi faqja hapet një herë, ajo punon plotësisht edhe
 * pa internet — pikërisht rasti i dikujt që kërkon barnatoren kujdestare natën me
 * sinjal të dobët.
 *
 * Dy rreshtat e mëposhtëm zëvendësohen pas ndërtimit nga
 * `scripts/pergatit-sw.mjs`, sepse emrat e skedarëve te `/assets/` kanë hash dhe
 * nuk dihen para se të ndërtohet. Pa listën e saktë, gjithçka do të ruhej vetëm
 * pasi service worker-i të merrte kontrollin — domethënë kurrë gjatë vizitës së
 * parë, e cila është pikërisht ajo që duhet të mbijetojë pa rrjet.
 */
const VERSIONI = 'kujdestaria-dev'; /* __VERSIONI__ */
const PARACACHE = ['/']; /* __PARACACHE__ */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSIONI)
      // Një skedar që mungon të mos e rrëzojë tërë instalimin.
      .then((cache) => Promise.all(PARACACHE.map((u) => cache.add(u).catch(() => {}))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((celesat) =>
        Promise.all(celesat.filter((k) => k !== VERSIONI).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Analytics-i i Vercel-it nuk duhet të kalojë nëpër cache.
  if (url.pathname.startsWith('/_vercel/')) return;

  // Navigimet: rrjeti i pari, që orari i ri të merret sapo ka lidhje, por me
  // kthim te kopja e ruajtur në vend të faqes së gabimit.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((pergjigja) => {
          const kopja = pergjigja.clone();
          caches.open(VERSIONI).then((cache) => cache.put('/', kopja));
          return pergjigja;
        })
        .catch(() => caches.match('/').then((e) => e ?? Response.error())),
    );
    return;
  }

  // Pjesa tjetër e njësoj-origjinës: cache-i i pari. Skedarët te /assets/ kanë
  // hash në emër, prandaj kopja e ruajtur nuk vjetrohet kurrë gabimisht.
  event.respondWith(
    caches.match(request).then(
      (eRuajtur) =>
        eRuajtur ??
        fetch(request).then((pergjigja) => {
          if (pergjigja.ok) {
            const kopja = pergjigja.clone();
            caches.open(VERSIONI).then((cache) => cache.put(request, kopja));
          }
          return pergjigja;
        }),
    ),
  );
});
