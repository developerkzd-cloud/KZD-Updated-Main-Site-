/* KZD Solutions service worker: the offline fallback, nothing else.

   On install it caches /offline plus every file that page needs (the
   _next/static scripts and CSS it references, the fonts those stylesheets
   load, and the logo). When a page navigation fails because there is no
   connection, the cached /offline page is served in its place. Everything
   else goes straight to the network; static files fall back to the cache
   only when the network fails, so normal browsing is untouched. */

const CACHE = "kzd-offline-v1";
const OFFLINE = "/offline";

async function precache() {
  const cache = await caches.open(CACHE);
  const res = await fetch(OFFLINE, { cache: "reload" });
  if (!res.ok) return;
  const html = await res.clone().text();
  await cache.put(OFFLINE, res);

  const urls = new Set(["/Assets/logos/kzd-mark.png"]);
  for (const m of html.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+)"/g)) urls.add(m[1].replace(/&amp;/g, "&"));

  /* Fonts are referenced from the stylesheets, not the HTML. */
  for (const url of [...urls].filter((u) => u.endsWith(".css"))) {
    try {
      const css = await (await fetch(url)).text();
      for (const m of css.matchAll(/url\((\/_next\/static\/media\/[^)]+)\)/g)) urls.add(m[1]);
    } catch {
      /* best effort */
    }
  }
  await Promise.all([...urls].map((u) => cache.add(u).catch(() => {})));
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE).then((r) => r || Response.error())));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/Assets/logos/kzd-mark.png") {
    event.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || Response.error())));
  }
});
