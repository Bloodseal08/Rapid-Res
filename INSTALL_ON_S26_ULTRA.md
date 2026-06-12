# Resume Tailor — Install on your Galaxy S26 Ultra

This folder is a complete Progressive Web App (PWA). Installed via Chrome it gets its
own icon in your app drawer, opens full-screen with no browser bars, and behaves like
any Play Store app.

## Step 1 — Host the folder (one time, free, ~5 minutes)

Android only installs PWAs served over HTTPS, so the folder needs to live at a URL.
Easiest free option — GitHub Pages:

1. Create a free account at github.com (skip if you have one)
2. New repository → name it `resume-tailor` → Public → Create
3. "Uploading an existing file" → drag in ALL 5 files from this folder
   (index.html, manifest.json, sw.js, icon-192.png, icon-512.png) → Commit
4. Repo Settings → Pages → Source: "Deploy from a branch" → Branch: main / root → Save
5. After ~1 minute your app is live at:
   https://YOUR-USERNAME.github.io/resume-tailor/

(Netlify Drop — app.netlify.com/drop — works too: just drag the folder in, done.)

## Step 2 — Get an API key (one time)

Outside of Claude, the AI engine needs your own Anthropic API key:

1. console.anthropic.com → sign in → API Keys → Create Key
2. Add a few dollars of credit (each tailoring run costs only cents)
3. Copy the key (starts with sk-ant-)

## Step 3 — Install on the phone

1. Open the URL from Step 1 in Chrome on your S26 Ultra
2. Chrome menu (⋮) → "Add to Home screen" → **Install**
   (Samsung Internet works too: menu → Add page to → Home screen)
3. Launch Resume Tailor from your app drawer
4. Scroll to "06 // Settings" → paste your API key → Save key on this device
   (stored only on your phone; your edited master resume auto-saves there too)

Done. Camera scanning, tailoring, editing, and .docx downloads all run natively on
the phone. Downloads land in your Downloads folder.

## Updating the app later

Edit index.html (e.g. the MASTER_RESUME block), re-upload to the repo, and bump the
cache name in sw.js (resume-tailor-v1 → v2) so phones pull the new version.
