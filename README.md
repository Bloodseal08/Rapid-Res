# Rapid Res

Tailor your resume and cover letter to any job ad, right from your phone. Rapid Res reads a
posting (link, pasted text, photo, or shared from another app), then reorganizes and rewrites
your resume to target that specific role and drafts a tight two-paragraph cover letter — without
ever inventing skills or experience you don't have. Both come out as editable Word (`.docx`) files
named `YourName_Position_Company`.

## Features

- **Four ways to load a job ad** — paste a link, paste the text, snap a photo / pick a screenshot, or **Share** a posting straight from the LinkedIn or Indeed app into Rapid Res.
- **Honest tailoring** — the AI may cut, reword, reorder, and rewrite your summary and cover letter, but it can never add a skill, credential, or job you didn't list. Your master resume is the single source of truth.
- **Edit anything on screen** — tap *Edit*, change the wording, tap *Done*; your edits flow into the saved Word file.
- **Real `.docx` output** — proper headings, bullets, and spacing; opens in Word, Google Docs, or anything else.
- **Installs like a real app** — add it to your home screen and it runs full-screen, offline-capable, with its own icon.
- **Private by design** — your resume and API key are stored only on your device; nothing is sent anywhere except the AI request to Anthropic.

## Install on Android (Galaxy S26 Ultra)

Rapid Res is a Progressive Web App (PWA) — a web app the phone can install and run like a native
app. Android installs a PWA from a HyperText Transfer Protocol Secure (HTTPS) link — the secure,
padlock web address — so you host the folder once, then install from the browser.

1. **Host the files** (free, ~5 min): create a public GitHub repo named `rapid-res`, upload the
   5 files (`index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`) via
   `github.com/YOUR-USERNAME/rapid-res/upload/main`, then enable **Settings → Pages → Deploy from
   branch → main / root**. Your link becomes `https://YOUR-USERNAME.github.io/rapid-res/`.
   (Netlify Drop — app.netlify.com/drop — works too: drag the folder in.)
2. **Get an API key**: an Application Programming Interface (API) key is your password for letting
   the app talk to Anthropic's service. At console.anthropic.com, create an API key and add a few
   dollars of credit
   (each tailoring run costs only cents).
3. **Install**: open your link in Chrome → menu (⋮) → **Add to Home screen** → **Install**.
4. **Activate**: open Rapid Res → **06 // Settings** → paste your API key → **Save key on this device**.

## Usage

1. Load the job ad (Share from a job app is easiest; link or paste also work).
2. Tap **Tailor resume + cover letter**.
3. Review the detected Position and Company (edit if needed), then review the resume and letter.
4. Tap **Edit** to tweak anything, then **Save .docx** for each. Files land in your Downloads folder.

To update your master resume as you gain experience: **02 // Your Resume → View / edit master
resume**. It auto-saves on your device.

## Known limitation: LinkedIn / Indeed / Glassdoor links

These boards hide full postings behind a login, so a raw link often can't be read automatically
(the site sends a "sign in" page instead of the job).
Two reliable workarounds, both built in:

- In their app, open the job → **Share** → **Rapid Res** (sends the text directly), **or**
- Select the description text and paste it, or scan a screenshot.

Company career pages and Applicant Tracking System (ATS) links — the hiring software many companies
use, such as Greenhouse, Lever, and Workday — usually fetch fine from a link.

## Updating the app

Upload the new files over the old ones at `github.com/YOUR-USERNAME/rapid-res/upload/main` and
commit. Wait ~2 minutes, then fully close and reopen Rapid Res — the new version loads itself.
(The cache version in `sw.js` is bumped on each release so phones know to refresh.)

## Files

| File | Purpose |
|------|---------|
| `index.html` | The app's structure and styling (the user interface, or UI). |
| `app.js` | All the app's behavior — input handling, AI calls, Word export. |
| `manifest.json` | Makes it installable; defines name, icons, and the Share target. |
| `sw.js` | Service worker — offline caching and update control. |
| `icon-192.png`, `icon-512.png` | Home-screen icons. |

## Tech

Plain HyperText Markup Language (HTML, page structure), Cascading Style Sheets (CSS, styling), and
JavaScript (behavior) — no build step, no framework. It uses Anthropic's API for the tailoring, the
`docx` library (loaded from a Content Delivery Network, or CDN — a fast global file host) for Word
export, and standard PWA features (the manifest, a background service-worker script, and the Web
Share Target) for the installable, app-like experience.
