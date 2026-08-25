# Hero Slider — Go-Live Runbook (AEM author backend)

This is the exact sequence to get the hero-slider rendering on your site.
Steps marked **[You]** happen in your browser (logged into Adobe); **[Me]** I do from here.

Project facts:
- Repo: `eds-as-2026/aem-ui-training`
- Content source (author): `https://author-p8803-e21945.adobeaemcloud.com/bin/franklin.delivery/eds-as-2026/aem-ui-training/main`
- Preview: `https://main--aem-ui-training--eds-as-2026.aem.page/`
- Live: `https://main--aem-ui-training--eds-as-2026.aem.live/`

---

## STEP 1 — Fix Code Sync  [You]  ⚠️ blocker for everything

Nothing you push (block code, fonts, styling) reaches `aem.page` until this works.
Symptom we confirmed: commit status stuck `pending`, `codeBus: null`.

1. Go to **https://github.com/apps/aem-code-sync** → **Configure**.
2. Choose the **eds-as-2026** org.
3. Under *Repository access*, ensure **`aem-ui-training`** is included (or "All repositories"). Save.
4. Tell me **"code sync fixed"** — I'll push a small commit to trigger a build and confirm the
   new CSS (with the Kia font) is live on `aem.page`.

Verify (optional, yourself): open
`https://main--aem-ui-training--eds-as-2026.aem.page/blocks/hero-slider/hero-slider.css`
— it should be ~8 KB and contain `@font-face ... kia-signature`. If it's ~2 KB, sync hasn't run.

---

## STEP 2 — Upload assets to AEM Assets (DAM)  [You]

The 24 assets are zipped at: `.migration/downloads/hero-slider-dam-assets.zip` (27 MB).

1. Open your AEM author instance in the browser (logged into Adobe IMS).
2. Go to **Assets → Files**.
3. Create/enter the folder that matches your page paths. You have two consistent options —
   pick ONE and use it everywhere:
   - **`/content/dam/aem-ui-gallery/`**  (matches the page that threw the earlier 404), or
   - **`/content/dam/aem-ui-training/hero-slider/`** (matches the paste-ready file)
4. **Create → Files**, drag in all 24 files from the unzipped folder.
5. Wait for asset processing/renditions to finish.

> Note: I earlier uploaded these to the *da.live* store, which your AEM pages do NOT read from.
> This step puts them in the real AEM DAM. This is the copy that matters.

---

## STEP 3 — Author the page in Universal Editor  [You]

1. Open the target page in Universal Editor (Sidekick → Edit, or
   `…/bin/franklin.delivery/eds-as-2026/aem-ui-training/main/<path>?cmd=open`).
2. Add a section → insert the **Hero Slider** block.
3. Add one **Slide** item per row below. For each, set:
   - **Desktop media**: pick the desktop asset via the asset picker
   - **Mobile media**: pick the mobile asset
   - **Content**: type the title (as a heading), tagline (paragraph), and a link for the CTA
   - **Disclaimer**: only where noted
4. **Preview** the page (Sidekick → Preview) so it publishes to `aem.page`.

### Per-slide asset + copy mapping
(Video slides use the .mp4; image slides use the .jpg. Pick from your chosen DAM folder.)

| # | Desktop asset | Mobile asset | Title | Tagline | CTA link | Disclaimer |
|---|---|---|---|---|---|---|
| 1 | sorento-desktop.mp4 | sorento-mobile.mp4 | The Kia Sorento | Global Icon. India Bound. | /in/our-vehicles/sorento/teaser.html | — |
| 2 | syros-ev-desktop.jpg | syros-ev-mobile.jpg | The Kia Syros EV | Superior beyond belief. | /in/our-vehicles/syros-ev/showroom.html | — |
| 3 | seltos-bncap-desktop.jpg | seltos-bncap-mobile.jpg | (none — CTA only) | — | /in/our-vehicles/seltos/showroom.html | — |
| 4 | syros-2026-desktop.jpg | syros-2026-mobile.jpg | Presenting The 2026 Kia Syros. | Made for your world. And everyone in it. | /in/our-vehicles/syros/showroom.html | — |
| 5 | seltos-desktop.jpg | seltos-mobile.jpg | The all-new Seltos | Badass. Forever. / Starting at ₹10 99 900… | /in/our-vehicles/seltos/showroom.html | — |
| 6 | carens-clavis-ev-desktop.mp4 | carens-clavis-ev-mobile.mp4 | The Carens Clavis EV | It's an E.We | /in/our-vehicles/carens-clavis-ev/showroom.html | — |
| 7 | carens-clavis-desktop.jpg | carens-clavis-mobile.jpg | The Carens Clavis | For epic journeys. | /in/our-vehicles/carens-clavis/showroom.html | — |
| 8 | ev9-desktop.mp4 | ev9-mobile.mp4 | The Kia EV9 | The World's Most Inspiring Electric. Ever. | /in/our-vehicles/ev9/showroom.html | Disclaimer: representation only… |
| 9 | carnival-desktop.mp4 | carnival-mobile.mp4 | The new Kia Carnival Limousine | Your own luxury liner. | /in/our-vehicles/carnival/showroom.html | Disclaimer: representation only… |
| 10 | sonet-desktop.mp4 | sonet-mobile.mp4 | New Sonet | The Wild. Reborn. | /in/our-vehicles/sonet/showroom.html | #T&C Apply. Ex-showroom price all India |
| 11 | carens-desktop.jpg | carens-mobile.jpg | Kia Carens | From a different world. | /in/our-vehicles/carens/showroom.html | — |
| 12 | ev6-desktop.mp4 | ev6-mobile.mp4 | Kia EV6 | The Electric Superstar | /in/our-vehicles/ev6/showroom.html | — |

---

## STEP 4 — Verify & polish  [Me]

Once Steps 1–3 are done, tell me the page path (e.g. `/hero` or wherever you added it).
I will:
- Load it on `aem.page`, confirm zero 404s (assets resolve) and zero console errors
- Check the Kia font, circular arrows, alternating CTA, per-breakpoint sizing at 375/768/1440
- Fix any remaining visual gaps against the Kia reference

---

## Common gotchas (so you don't get stuck)
- **Asset 404 on aem.page** → the page path doesn't match the DAM folder. Keep folder names
  identical between Step 2 and Step 3.
- **Styling not updating** → Code Sync (Step 1) hasn't deployed; or browser cache — hard refresh
  (Cmd/Ctrl+Shift+R).
- **Video not playing** → expected on some browsers until the slide is active; it's muted+inline
  and lazy by design.
