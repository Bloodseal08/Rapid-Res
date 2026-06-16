# Rapid Res — Builder's Guide (for Scott)

This is the "how and why" companion to the project. It walks through every moving part of Rapid Res
so you can read your own app fluently and reuse these patterns in your next tool. Given your
security background, there's a dedicated hardening section at the end that treats the app as an
attack surface.

**A note on jargon:** every acronym is written out in full the first time it appears, with the short
form in parentheses and a quick line on what it does. After that I use whichever form people
actually say in the field — sometimes the abbreviation, sometimes the full phrase.

Everything here describes code that is actually in your `index.html`, `app.js`, `manifest.json`, and
`sw.js`.

---

## 1. The big picture

Rapid Res is a small **web app** — a program written in the same three languages a web page uses and
run by the browser, rather than a traditional installed program. It's built from:

- **HyperText Markup Language (HTML)** — the *structure*: headings, buttons, text boxes. Think of it
  as the skeleton of the page.
- **Cascading Style Sheets (CSS)** — the *styling*: colors, spacing, fonts. The skin over the
  skeleton.
- **JavaScript (JS)** — the *behavior*: what happens when you tap a button. The muscle that makes it
  move.

There is no server you run, no "build step" that compiles the code, and no framework. That's a
deliberate choice with real consequences:

- **Upside:** trivial to host, trivial to read top to bottom, nothing to compile, almost no
  dependencies to keep patched.
- **Downside:** everything the app knows lives in the browser — including your Application Programming
  Interface (API) key. ("API" is just a defined way for one program to talk to another; the *key* is
  your password for talking to Anthropic's API.) We'll come back to what browser-side secrets mean
  for security.

The flow is a straight pipeline, and each stage is a small function — read them in this order and the
whole app makes sense:

```
job ad (link / text / photo / shared)  ->  normalize into text or image
        ->  build a strict prompt + master resume
        ->  send to the Anthropic API
        ->  parse the structured reply
        ->  show an editable preview
        ->  export a Word document
```

---

## 2. Anatomy of the app

A web app like this has three zones:

1. **The `<head>` and `<style>` block** — page metadata, the security policy (Section 7), and all the
   CSS. The styling uses *custom properties* (the `:root { --bg: ... }` lines) so the whole color
   scheme is defined once by name and reused everywhere. Change one value, the whole app re-themes.
2. **The `<body>`** — the visible structure: header, the numbered step cards (`01 // Job Ad`, etc.),
   and a hidden results section that appears after tailoring.
3. **`app.js`** — all the behavior, kept in its own file (more on why in the security section).

### The `$` helper
```js
const $ = id => document.getElementById(id);
```
This is a one-character nickname for "get me the on-screen element with this identifier." So
`$("jobAd")` instead of the long `document.getElementById("jobAd")` everywhere. Frameworks largely
exist to avoid writing this kind of plumbing; at this size it's clearer to do by hand.

### State
"State" just means "data the app remembers while it's running." Yours is two named variables at the
top — the captured ad images, and the parsed result from the model. Keeping state in a couple of
clearly named spots, instead of scattered around, is exactly what a framework's "store" does, minus
the ceremony.

---

## 3. Getting the job ad in (the four input paths)

This is the most interesting part, because it's where real-world messiness lives.

### Path A — pasted text
Whatever is in the text box *is* the ad. Nothing to do.

### Path B — a pasted link
```js
function extractUrl(text){
  const m = text.match(/https?:\/\/[^\s"'<>]+/i);
  return m ? m[0].replace(/[).,;]+$/,"") : null;
}
```
A **regular expression** (regex) — a compact pattern-matching language for finding text — locates the
first `http(s)://...` chunk. The trailing trim removes punctuation that clings to a pasted link.
Regex is worth genuinely learning: it's the same skill whether you're pulling a Uniform Resource
Locator (URL — a web address) out of a text box here, or hunting an indicator of compromise (IOC) in
a log file.

Once we have the address we try to fetch the page. Here's the part that trips everyone up:

> A browser cannot freely read other websites' pages. A rule called the **Same-Origin Policy**, and
> its companion **Cross-Origin Resource Sharing (CORS)** — the system that decides whether site A is
> allowed to read responses from site B — stops `your-site` from reading `linkedin` unless LinkedIn
> explicitly permits it. It doesn't.

So `fetchJobPage` tries three things in order: the address directly, then two **CORS relays**. A CORS
relay is a helper server that fetches the page *for* you and re-sends it with permissive CORS headers,
so your browser is now allowed to read it. We then strip the page down to readable text with the
**Document Object Model parser (DOMParser)** — a built-in tool that turns a raw HTML string into a
navigable document. ("DOM," the Document Object Model, is just the browser's live, in-memory tree of
everything on the page.) We walk that tree and delete menus, scripts, and footers so only the posting
text remains.

**Why this still fails on LinkedIn and Indeed:** those sites detect not-logged-in or automated
requests and hand back a "sign in to continue" shell instead of the job. No browser-side trick beats
a login wall — that's their design, not a flaw in your app. So we *detect* the wall and stop
pretending we got the job.

### Path C — the model's web search fallback
If every fetch fails, we hand the address to the model with its **web search tool** switched on and
let it go find the posting. Nice pattern: when your own code can't reach something, a model with
tools sometimes can.

### Path D — Android Share Target (the real LinkedIn/Indeed fix)
Instead of *pulling* the page (blocked by the login wall), we let the user *push* the text to us from
inside the LinkedIn or Indeed app via Android's Share menu.

In `manifest.json`, the `share_target` block registers Rapid Res in Android's system Share sheet. When
the user taps **Share → Rapid Res**, Android relaunches the app with the shared content tacked onto
the web address as query parameters (extra `key=value` bits after a `?`). We read them on startup with
**URLSearchParams** — a built-in helper for pulling those values apart — drop them into the job box,
then scrub them out of the address bar so a refresh doesn't re-fire. This is the cleanest mobile
workaround: it routes *around* the login wall because the user is already signed in inside the source
app and is simply handing you the text.

### Path E — camera or gallery (the model reads the image)
Photos are resized on a `<canvas>` (an off-screen drawing surface) to stay under the API's size
limits, then converted to **Base64** — a way of writing binary data, like an image, as plain text so
it can ride inside a text request. The model reads the words in the image directly, so no separate
**Optical Character Recognition (OCR)** library — software that extracts text from pictures — is
needed.

---

## 4. Talking to the model

### The prompt is the program
The single most important string in the app is the prompt. Notice how much work the **rules** do:
Rule 1 is the only hard constraint — never invent a skill, credential, employer, or date; everything
must trace back to your master resume. The rest grant freedom to cut, reword, reorder, and write
original prose. Transferable lesson: with a large language model (LLM) — the kind of artificial
intelligence (AI) that generates text, which is what's doing the tailoring — your "logic" is often
just plain English. State the one thing that must never happen, then grant latitude for the rest.

### Forcing structured output
We don't want prose back, we want data we can render. So the prompt demands the reply be **only**
**JavaScript Object Notation (JSON)** — a simple, universal text format for structured data, written
as labeled fields and lists — in a fixed shape. Then we parse it defensively, because models
sometimes wrap JSON in chatter or code fences: we hunt for the first `{`, try to read to the last `}`,
and walk inward on failure. Never assume a model's output is clean; always parse inside a "try and
catch the error" guard and have a fallback. Same defensive mindset you'd apply to any untrusted input.

### The request
When you supply your own key, three headers go out with the request. One carries the key, one names
the API version, and one is literally named `anthropic-dangerous-direct-browser-access` — Anthropic
warning you in plain text that calling the API straight from a browser means the key lives in the
browser. More on that in Section 7.

---

## 5. Showing, editing, and exporting

### Editable preview
The resume and cover letter render as on-screen cards. The Edit button flips a single built-in
attribute, `contentEditable`, to `true` — and any element becomes a live editor. No editor library
required; the browser already has one.

### Export reads the screen, not the original data
Subtle but important: when you tap **Save**, we don't export the model's original reply — we re-read
the *current on-screen content*, so your manual edits are included. The on-screen DOM is the source of
truth at export time. A library called **docx** (named for the Word file extension `.docx`) then turns
those blocks into a real Microsoft Word document, and a temporary download link saves it.

### Escaping — which is also a security control
Before injecting any model- or web-derived text into the page, we run it through a small `esc()`
function that converts characters like `<` and `>` into harmless display-only versions. Skip this and
a malicious posting containing a `<script>` tag could *run* inside your app — that's **Cross-Site
Scripting (XSS)**, an attack where hostile text smuggled into a page executes as code. Escaping is the
fix.

---

## 6. What makes it an installable app

Rapid Res is a **Progressive Web App (PWA)** — a web app that, given a few standard ingredients, the
phone can install and run like a native app. Three pieces do it:

1. **`manifest.json`** — a small description file: the app's name, icons, "run full-screen with no
   browser bars," and the Share target. Android reads this to offer "Add to Home screen."
2. **`sw.js`, the service worker** — a script the browser keeps running quietly in the background. It
   caches the app's files so it opens offline, and it controls updates. The line `const CACHE =
   "rapid-res-v4"` is the version stamp; bump that number and phones know to re-download.
3. **HyperText Transfer Protocol Secure (HTTPS)** — the encrypted version of the web's transfer
   protocol, shown by the padlock in the address bar. Service workers and installation only work over
   HTTPS, which is why you host the files (GitHub Pages or Netlify) rather than opening them off the
   phone's storage.

A PWA is not an **Android Package (APK)** — the traditional installable file format delivered through
the Play Store. It's the web's own "installable app" path: no store review, no signing, update by
re-uploading a file. For a personal tool, that's the right trade.

---

## 7. Security hardening (the part you'll care about most)

The app is small, but it still has a real attack surface. Here's the threat model, what's been done,
and what you could add. Nothing here disables a feature.

### Threat 1 — XSS from untrusted job-ad content
A job posting, especially fetched HTML, is **untrusted input**. Unescaped, it could carry script that
runs in your app and reads your stored key.

- **In place:** every model/web-derived string passes through `esc()` before it touches the page, and
  fetched pages are reduced to plain text (which never executes).
- **In place, belt-and-suspenders:** a **Content-Security-Policy (CSP)** — a browser-enforced
  allow-list declaring exactly where code and data may come from — sits at the top of `index.html`.
  Read it as: "load scripts only from myself and the one named library host; only allow network
  connections to these three addresses." Even if an injection slipped through, the browser would
  refuse to run outside script *and* refuse to send your key to an attacker's server, because that
  server isn't on the `connect-src` list.

### Threat 2 — the key lives in the browser
With your own key, the browser's local storage holds it and the request sends it. Anyone with your
unlocked phone, or a successful XSS, could read it.

- **Why it's acceptable here:** it's your key, on your device, and local storage is walled off to this
  one app's web address — other sites can't read it. The CSP blocks the leak path.
- **Damage control you own:** keep that key on a low, capped budget at the Anthropic console, and
  rotate it (delete and recreate) if a device is ever lost. Treat it as a scoped, disposable
  credential.
- **The "correct" architecture, and a great next project:** a tiny backend **proxy** — a small server
  of your own that sits in the middle. It holds the key as a server-side secret; the app calls *your*
  server, and your server calls Anthropic. The key never reaches the browser at all.

### Threat 3 — third-party CORS relays see your traffic
When a link is fetched through a relay, the job address passes through that third party, who could log
it. No resume or key is ever sent through them — only the public job link — so the exposure is minor,
but real. The direct fetch is tried first (no relay), and the Share path uses no relay at all. For
maximum privacy, prefer Share or paste-text.

### Threat 4 — supply chain (the CDN script)
The docx library loads from a **Content Delivery Network (CDN)** — a globally distributed file host
that serves common libraries fast (here, cdnjs). If that host were compromised, it could serve
malicious code.

- **Hardening you can add:** **Subresource Integrity (SRI)** — a fingerprint of the expected file.
  You pin the library to a known **Secure Hash Algorithm 384-bit (SHA-384)** hash (a hash being a
  fixed-length fingerprint of a file's exact contents); the browser refuses to run the file if its
  fingerprint doesn't match, defeating a tampered CDN. The mechanism is already wired into the loader
  (Section 8) — you just add the hash. Even stronger: download the library into your own repository so
  there's no third-party fetch at all.

### Threat 5 — clickjacking
- **In place:** `frame-ancestors 'none'` in the CSP stops any other site from loading Rapid Res inside
  a hidden frame to trick you into clicking things.

### A reusable checklist for any web tool
1. Escape **all** untrusted input before it reaches the page.
2. Add a **CSP** allow-list; aim to avoid the `'unsafe-inline'` relaxation by keeping JS in its own
   file.
3. Keep secrets **off the client** where possible; if not, scope, cap, and rotate them.
4. Pin third-party scripts with **SRI**, or download them into your own project.
5. Set **`frame-ancestors 'none'`** unless you truly need to be embedded.
6. Parse all external and model output **defensively**.
7. Prefer paths that avoid third-party middlemen (here: Share and paste over relays).

---

## 8. What's now applied vs. what's left for you

**Applied in this build (done for you):**

- **JavaScript externalized** — all logic now lives in `app.js`, loaded by `index.html`. The one
  inline button handler (the image-remove ✕) was rewritten using **event delegation**: instead of an
  action attribute on every chip, one listener on the container reads a `data-rm` marker. Inline
  handlers count as inline script, so removing them is what let us tighten the CSP.
- **CSP hardened** — the script rule no longer allows `'unsafe-inline'`, the relaxation that permits
  inline or injected scripts. The browser now refuses them outright, closing the main XSS-to-key-theft
  path. (Inline *styles* are still allowed — lower risk; removing them is a fine future exercise.)
- **SRI mechanism wired in** — the docx loader now carries an `sri` field per address and applies it
  when present. See below to finish it.

**Left for you (with exact steps):**

1. **Add the real SRI fingerprints.** I couldn't compute them in the build environment (no internet
   access there), and a *wrong* fingerprint silently breaks the Word export, so I left the `sri`
   fields blank. On any machine with internet:
   ```
   curl -s https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js \
     | openssl dgst -sha384 -binary | openssl base64 -A
   ```
   Prefix the result with `sha384-` and paste it into the matching `sri` field in `app.js`. (cdnjs
   also shows a copy-ready SRI string on each library page.) Pin whichever address you like; the rest
   can stay blank.
2. **Externalize the styles too** (optional) — move the `<style>` block into its own `app.css` file,
   switch any JavaScript that sets styles directly to toggling CSS classes instead, then remove the
   inline-style relaxation from the CSP. Now the policy is strict on both axes.
3. **Build the key-proxy** — the one upgrade that needs a server. A roughly 20-line **serverless
   function** (a small piece of code a host like Cloudflare or Vercel runs on demand, with no server
   for you to maintain) holds the key as an environment secret, receives the app's request, forwards
   it to Anthropic, and returns the reply. The app then calls *your* endpoint with no key in it at
   all. This is the single most important pattern for shipping anything that talks to a paid API —
   worth doing as its own small project.

---

## 9. Ideas for your next iteration

- **Finish the strict CSP** by externalizing styles (step 2 above) — best security-per-effort change
  remaining on the client.
- **Add SRI fingerprints**, or download the docx library into the repository so there's no CDN fetch.
- **Build the backend key-proxy** — the best way to internalize how real apps keep secrets, and it'd
  let you share Rapid Res with other people without sharing your key.
- **Multiple resume profiles** — store more than one master resume and pick per job.
- **A "diff" view** — highlight exactly what changed versus the master resume, so you can confirm
  nothing was invented before you send it.

You now have the full mental model: input normalization, prompt-as-logic, structured output,
screen-as-source-of-truth rendering, and the installable-app shell — plus a security lens to apply to
all of it. That's a real, reusable toolmaking toolkit.
