ArenaPlus PWA landing page - deploy notes
==========================================
1. Upload EVERYTHING in this folder so that index.html is served at  https://arenaplus.app/mktapp/  (HTTPS required).
   Keep the folder structure (assets/ fonts/ icons/ img/ sw.js manifest.json). Pure static files, no backend.
2. Share links as  https://arenaplus.app/mktapp/?<any parameters>   (keep the trailing slash), e.g. your Adjust links:
   https://arenaplus.app/mktapp/?adj_t=..&adj_campaign=..&adj_adgroup=..&adj_creative=..&adjust_referrer=..&adj_label=palcode_XXXX&adj_redirect=..

PARAMETERS
  - The installed app opens  https://arenaplus.app/?<the SAME query string as the landing link>  - exactly as received:
    nothing added, removed, re-ordered or re-encoded (only this page's own test switches pwadebug / pwareset are left out).
    adj_redirect stays percent-encoded, so Adjust can read it and forward to arenaplus.ph/?palcode=...
  - KEEP = '*' at the top of the second <script> means "every parameter"; a list (e.g. ['adj_t','adj_redirect']) restricts it.
  - The last ad click is stored (localStorage 'mktapp_params'), so the app has it even though it opens without a query.
    A new ad click replaces it. Every app launch uses it. The browser page itself never redirects.
  - Check which version a phone runs: add &pwadebug=1 -> the panel shows "build: ..." and "app opens: ...".

SERVER REQUIREMENTS for the /mktapp/ path (same domain as the main site)
  - /mktapp/ must be served as static files BEFORE any SPA/app fallback of the main site.
  - /mktapp (no slash) -> 301 -> /mktapp/ keeping the query string (?palcode=...).
  - Never strip or rewrite the query string.
  - Correct types: .json application/json, .js JavaScript, .woff2, .webp, .png.
  - sw.js, manifest.json and index.html: Cache-Control: no-cache.
  - No CSP / security header on /mktapp/ that blocks inline scripts. Behind Cloudflare: turn off Rocket Loader and any
    bot/JS challenge for /mktapp/*, so sw.js and manifest.json are not challenged.
  - The service worker is scoped to /mktapp/ only, so it does not affect the main site.
3. Visitor taps anywhere (or the button). NO redirect happens from this page.
     Android / desktop Chrome -> button becomes  "Installing... NN%"  (real signals + smooth ramp, ~1-2 s) and the
         browser's install prompt then opens BY ITSELF at 100%. After accepting: "Installing..." -> "Open app".
         - dismissed prompt -> button goes back to "Sign up now"
         - very slow browser (prompt only ready after the tap expired) -> button shows "Install app", one more tap installs
         - after accepting, the button stays "Installing..." for at least 10 s (MIN_INSTALL), and at least 3 s (GRACE) after the
           browser reports the install finished, then it becomes "Open app" and an "ArenaPlus is installed" card appears.
         - "Open app" TRIES to open the installed app: it opens the app's own address in a new tab WITHOUT a referrer
           (+ an internal pwalaunch=1 marker), so Chrome can hand it to the app. If Chrome keeps it in a tab instead, that
           tab closes itself and the original page shows "open it from your home screen" (no reload, no stray tab).
           Not guaranteed: Chrome keeps same-site links in the browser on some phones. Stronger option: set OPEN_VIA
           (top of the second <script>) to a URL on ANOTHER domain that 302-redirects back to this page keeping the query,
           e.g. https://arenaplus.app/open-mktapp -> https://arenaplus.ph/mktapp/?<same query>  (needs DevOps).
         - the page REMEMBERS the install (localStorage 'mktapp_installed', shared with the installed app on Android):
           if the page reloads while installing it keeps showing "Installing..." for the rest of the install; afterwards
           it shows "Open app", never "Sign up now"; tapping then shows where the app is instead of re-running the install. If the browser offers install again (app was uninstalled), the page
           forgets and goes back to "Sign up now". To retest on a phone add &pwareset=1 to the URL.
         - if the browser never offers install (12 s): sheet with the manual steps + a "Why:" line
         - in-app browsers (Facebook, TikTok, Lark ...): sheet with "Open in Chrome" (reopens this page in Chrome)
     iOS -> sheet: Share > Add Bookmark (or Add to Home Screen)
4. The installed app opens this page in standalone mode and jumps straight to
   https://arenaplus.app/?<same parameters>  (an installed app's start address is fixed, it cannot carry each ad click's parameters, so this one jump is required).

SPEED (why the install offer now comes ~3 s after load instead of ~40 s on a 4 Mbps phone)
  Browsers only offer install after the page has finished loading. The saved page loaded 108 script files (18 MB) first.
  - The 95 saved ad/analytics tag scripts (Google tags with many IDs, Facebook, TikTok, Bing ...) are NOT removed: they now load
    right after the install offer is ready (never while the Installing NN% progress is running). Their tracking still runs,
    about 1 s later than before. To make the page even lighter, delete tags you do not need for this page.
  - Hidden carousel images and below-the-fold images load after that; the visible banner shows a blurred preview first.
  - Own images are WebP, Poppins is subset to Latin, unused cross-site preload hints were removed.

Testing on a phone (IMPORTANT - browsers only offer install on a secure origin):
  - Use an https:// address. Opening index.html from the phone's storage (content:// or file://), or http://192.168.x.x
    (a laptop on your Wi-Fi), will NEVER offer install - the page itself will say so.
  - Quickest HTTPS test without touching the real domain: drag this folder onto Netlify Drop or a Cloudflare Pages project.
  - Local options:  (a) deploy to arenaplus.app/mktapp/, (b) an HTTPS tunnel (Cloudflare Tunnel / ngrok) to your local server,
    (c) USB: run  adb reverse tcp:PORT tcp:PORT  then open  http://localhost:PORT  on the phone (localhost counts as secure),
    (d) Chrome on the phone: chrome://flags/#unsafely-treat-insecure-origin-as-secure -> add http://YOUR-IP:PORT -> relaunch.
  - Open the link directly in Chrome: not inside a chat app, and not in an Incognito/private tab (install is disabled there).
  - Chrome offers install only after the page has finished loading. The Installing NN% progress waits up to 12 s,
    then shows the manual steps plus a "Why: ..." line explaining what is blocking it.
  - Chrome does not offer install if the app is already installed or the prompt was dismissed recently
    (uninstall the app / clear site data in Chrome to test again).
  - Add &pwadebug=1 to the URL for an on-screen status panel (service worker, install event, in-app browser, button state ...).

Settings: top of the second <script> in index.html -> SITE (destination), KEEP (passed-on parameters), PKEY ('mktapp_params').
manifest.json -> related_applications uses a RELATIVE url, so it is correct on any host/path (no edit needed);
                 it lets the page recognise an already-installed app.
Icons: icons/*.png were generated from the small logo file in your saved page. Replace with official
       192x192 / 512x512 PNGs (same filenames; icon-maskable-512.png needs ~20% padding around the logo).
Fonts: Poppins (open source, SIL OFL) is included in fonts/ because the saved page pointed to /cdn/... paths that weren't saved.
Note:  iOS Safari has no API to add a bookmark automatically, so the sheet shows the steps instead.
