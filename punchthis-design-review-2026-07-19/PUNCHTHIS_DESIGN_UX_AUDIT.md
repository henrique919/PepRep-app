# PunchThis Marketing Website — Design, UX and Frontend Audit

Date: 19 July 2026  
Audit target: [punchthis.app](https://punchthis.app/) and the current PunchThis app web build  
Source reviewed: `henrique919/punchthis-website` at commit `458152b` plus the app source in this workspace

## Executive verdict

The brand foundation is already credible: the logo, graphite/cobalt palette, Space Grotesk + Hanken Grotesk pairing, field-oriented language and core headline all fit the product. The website feels “AI-basic” for a different reason: it repeats feature claims, uses simulated SVG screens instead of undeniable product proof, and has no operating trust ladder around the app.

The redesign should keep the current brand and headline, then shift the page from **feature brochure** to **evidence-led product funnel**:

1. Show one real issue moving from photo → markup → responsibility → report.
2. Let visitors inspect a real sample report and a short product recording.
3. State only capabilities that exist in the current app.
4. Make early access a real, low-friction conversion.
5. Add confidence through product truth, performance, legal pages and visible release maturity.

## Audit scope and evidence

- Live desktop and mobile landing page.
- Core marketing routes and live route structure.
- Early-access funnel.
- Active app dashboard, project view, capture workspace and issue detail.
- Marketing React/Vite implementation, tokens, route structure, SEO metadata, animations and current production bundle.
- Comparator review: Site Audit Pro, Site Report Pro, Sitemate, BuildPass and SafetyCulture.
- Accessibility findings are a risk review, not a WCAG certification. Screen-reader output, native camera flows and physical-device behavior still require testing.

## Captured flow and health

1. **Desktop landing hero — Good visual foundation / Medium funnel health.** Clear promise, strong headline and prominent CTA; proof is illustrative rather than verifiable.
2. **Mobile landing hero — Medium.** CTA remains clear, but the page horizontally overflows and the product proof begins below the first viewport.
3. **Feature pages — Medium.** Logical structure and consistent visual language, but content largely repeats the homepage and inherits generic metadata.
4. **Early-access page — Critical.** The form opens a mail client instead of recording a lead and exposes implementation status to prospects.
5. **App dashboard and project view — Good phone-first information design / High desktop risk.** The app is visually coherent, but web layouts stretch across the viewport without a useful desktop shell or maximum reading width.
6. **Active audit and issue record — Good product proof / Medium handoff risk.** The working product is more credible than the website mockups; the website currently describes workflow states the app does not implement.

## What is already working

- “Mark it on site. Prove it in the report.” is specific, memorable and worth keeping.
- The cobalt CTA is visually prominent against the dark hero.
- Brand typography and color are consistent between the marketing site and app.
- The marketing code has a sensible component breakdown and a central content file.
- The static Vite build has good raw performance potential: about 293 KB of JavaScript and 4.5 KB of CSS before compression, with no heavy raster hero payload today.
- The app has strong proof points the website can exploit: offline/local-first messaging, real photo capture, markup, report presets, report preview and a clean issue structure.

## Critical issues

### C-01 — The primary conversion is not a real form

**Evidence:** `EarlyAccess.jsx` validates only the email, then navigates to a `mailto:` URL. The page tells visitors that no endpoint is configured; after submission it exposes `EarlyAccess.jsx` and implementation language.

**Impact:** Mobile users may not have a configured mail client, attribution is lost, submissions are not stored, and the most important CTA ends in developer-facing copy. This is the largest direct funnel failure.

**Recommendation:**

- Submit to a real endpoint with server-side validation, rate limiting and explicit consent handling.
- Use one required email field above the fold. Collect name, role and company progressively after the first successful save.
- Return a normal success state with expected next steps and no implementation details.
- Add analytics events: `early_access_view`, `early_access_start`, `early_access_success`, `early_access_error`.
- Provide an accessible error summary, `aria-invalid`, inline field errors and a recoverable retry state.

### C-02 — Sign-in and legal links are false affordances

**Evidence:** `NAV.signInUrl` and all footer legal URLs are `#`. In production, they resolve to the current route. The live DOM confirms Sign in, Privacy, Terms and Cookie links do not reach their promised destinations.

**Impact:** This reads as unfinished or deceptive during purchase inspection and removes essential trust from a product handling site photos, people, addresses and reports.

**Recommendation:**

- Remove Sign in until the production web authentication destination is ready, or link it to the real authenticated app.
- Publish Privacy, Terms, Support and account/data-deletion routes before promoting sign-up.
- Add version/release status and a support contact in the footer.
- Add automated link checks to CI so no production navigation resolves to `#`.

### C-03 — Marketing claims and mock screens do not match the current app

**Evidence:** The website repeatedly describes `Open → Assigned → In Progress → For Review → Verified`, says a contractor marks work done, and presents SVG screen recreations with those states. The current app model implements only `open`, `assigned`, `in_progress` and `completed`. The marketing repository explicitly describes its screens as SVG recreations.

**Impact:** A buyer comparing the site with the app can conclude the product is staged, AI-generated or misleading. This is especially damaging because trust in evidence and reports is the product promise.

**Recommendation:**

- Create a product-truth matrix sourced from the release branch: `Shipped`, `Beta`, `Planned`, `Do not claim`.
- Immediately change website lifecycle language to the states that actually ship, or ship the two-step review/verification workflow before making the claim.
- Replace recreated screens with captures from a versioned release build and label demo/sample data honestly.
- Never invent testimonials, metrics, customer logos or collaboration behavior.

## High-priority issues

### H-01 — The site has no trust ladder

**Evidence:** There is no product video, sample PDF, downloadable example, real interface gallery, customer proof, founder context, pricing signal, release notes or status page. Nearly every section is another claim made by PunchThis about PunchThis.

**Competitor context:**

- [Site Audit Pro](https://siteauditpro.com/) leads with app-store access, sign-in, usage metrics, pricing/release/support routes and a three-step product story.
- [Site Report Pro](https://www.sitereportpro.co.uk/) looks visually older but earns credibility with a preview video, extensive real interface gallery, sample reports and user reviews.
- [Sitemate](https://sitemate.com/) uses outcome-led copy, customer logos, quantified case studies, a demo path and a free trial.
- [BuildPass](https://www.buildpass.ai/) combines product modules with customer videos, clear audience language and a direct demo path.
- [SafetyCulture](https://safetyculture.com/) reinforces authority with organization counts, templates, brand proof, product tours and self-serve sign-up.

**Recommendation:** Add a proof sequence before expanding visual effects:

1. A 30–45 second real product recording in the hero.
2. A “View sample report” secondary CTA and in-browser report preview.
3. An interactive original/markup comparison using a real issue photo.
4. A “What ships today” module.
5. Genuine beta feedback and metrics only after they exist.

### H-02 — Mobile horizontal overflow is live

**Evidence:** At the captured mobile breakpoint, the document client width was 375 px and scroll width was 436 px. The report showcase and second report phone exceeded the viewport, producing a visible horizontal scrollbar.

**Recommendation:**

- Make every section’s grid child `min-width: 0` and constrain media with `width: min(100%, ...)`.
- Use container-relative widths instead of `vw` inside padded containers.
- Add `overflow-x: clip` to the page shell only as a safety guard, not as the primary fix.
- Add visual regression checks at 320, 375, 390, 768, 1024 and 1440 px; assert `scrollWidth === clientWidth`.

### H-03 — Reveal animation can hide page content completely

**Evidence:** `.reveal` starts at `opacity: 0` and depends on `IntersectionObserver` adding `.visible`. Fresh deep-route captures showed a blank hero while the accessible DOM contained the full page; computed heading opacity was `0`.

**Recommendation:** Render content visible by default. Add an enhancement class from JavaScript before applying hidden reveal states, provide an observer timeout/fallback, and keep all content visible when JavaScript, observers or background-tab scheduling fail.

### H-04 — Route SEO and social sharing are structurally weak

**Evidence:** Every SPA route inherits the homepage title, description, canonical and Open Graph URL. The page references `/og-image.png`, but that asset is absent from `public` and `dist`. There is no route-level metadata, schema markup or 404 route.

**Recommendation:**

- Prerender the seven public routes or migrate the marketing shell to Astro/another static-first renderer.
- Give each route its own title, description, canonical, OG image and breadcrumb/product schema.
- Add the real 1200×630 OG image and `twitter:image`.
- Add audience/search-intent pages only when they contain distinct, useful content.
- Add a real 404 and route-level error handling.

### H-05 — The funnel offers only one commitment level

**Evidence:** Nearly every prominent CTA says “Get early access.” Visitors cannot inspect a report, watch the app, see pricing intent or try a guided product story before surrendering contact details.

**Recommendation:** Use a two-path CTA system:

- Primary: `Join the beta` or `Get early access`.
- Secondary: `View a sample report` or `Watch the 45-second walkthrough`.

Track both and use the lower-commitment path to build confidence before asking for an email.

### H-06 — The mobile conversion page delays the form

**Evidence:** On mobile, the headline, status chip and four-benefit list occupy the first viewport; the actual form begins below the fold.

**Recommendation:** Place the email capture immediately after the promise, then move benefits and longer qualification fields below the success step. Keep the page header CTA from linking redundantly to the current route.

### H-07 — Desktop app layouts are stretched rather than designed

**Evidence:** The dashboard, project view, capture workspace and issue detail span the full 1600 px viewport, leaving long information lines and large dead areas. This weakens any future Sign in → web app handoff.

**Recommendation:** Until a true desktop workspace exists, constrain operational content to a deliberate width. For the mature desktop experience, introduce a project sidebar, a bounded main canvas and a detail rail rather than scaling phone layouts to full width.

### H-08 — Several brand colors miss normal-text contrast targets

Measured pairs:

- White on `#4C82FF`: **3.53:1**.
- `#7E8B96` on white: **3.49:1**.
- `#4E5D6A` on `#12181F`: **2.63:1**.

**Recommendation:** Use the existing deeper cobalt `#2F6BFF` for primary button backgrounds (**4.50:1** with white), darken steel text on light surfaces, and raise footer microcopy contrast. Recheck hover, focus, disabled and visited states.

## Medium-priority issues

### M-01 — The page is long because it repeats the same story

Markup, workflow, benefits, differentiation, audiences and FAQ repeatedly restate capture → markup → assign → report. This creates the “AI brochure” feeling.

**Recommendation:** Reduce the homepage to six deliberate acts:

1. Outcome + real product proof.
2. One issue, end to end.
3. Markup before/after.
4. Report preview.
5. Product truth and buyer confidence.
6. FAQ + conversion.

Move detailed feature copy to the feature routes and remove duplicated generic statements.

### M-02 — Positioning is too broad for a prelaunch product

The hero targets inspections, snagging, punch lists and handovers across three regions, while audience cards address nearly every site role.

**Recommendation:** Lead with the strongest initial wedge: a solo inspector/site manager who needs a marked-up, professional PDF before leaving site. Use localized search pages for “snagging,” “punch list” and regional terminology without diluting the main promise.

### M-03 — Visual rules are scattered across CSS, inline objects and component `<style>` blocks

**Recommendation:** Keep the current tokens, but move reusable component styles into CSS modules or a consistent styling layer. Define button, card, section, phone media, form and navigation variants with documented states. Avoid one-off inline values for responsive layout.

### M-04 — Real product media will drift unless it is versioned

**Recommendation:** Add a media manifest with the source app version, route/state, viewport, capture date, alt text and destination. Automate screenshots from the release build and fail CI if required marketing assets are missing.

### M-05 — No visible analytics or experiment contract

**Recommendation:** Define events for hero CTA, sample report, video completion, navigation, form start/success/error and outbound app/store clicks. Record CTA copy and page variant with each event; do not add intrusive tracking without the matching consent/legal work.

### M-06 — The single route bundle carries every simulated screen

The current JavaScript bundle is still modest, but all feature pages and SVG recreations ship on first load.

**Recommendation:** Route-split non-home pages and lazy-load below-fold media. Set budgets before adding video: LCP ≤2.5 s, CLS ≤0.1, INP ≤200 ms, initial JS ≤150 KB gzip, hero poster ≤500 KB and optional video ≤2 MB.

## Low-priority polish

- Increase the 40×40 mobile menu button to at least 44×44 px.
- Reduce reliance on 11 px uppercase microcopy, particularly in the app and footer.
- Self-host/subset the two brand fonts to remove third-party font DNS and improve consistency.
- Add a skip link to `#main-content`.
- Add `aria-invalid` and a clear error summary to the form.
- Avoid centered multi-paragraph mobile sections when left alignment improves scanning.

## Recommended visual direction

Use the existing **graphite blueprint + cobalt field tool** system, but make it editorial and evidence-led:

- Keep the logo, colors, fonts and current hero headline.
- Replace the three equal phone mockups with one large real device recording and two small proof callouts.
- Introduce real construction texture sparingly through the app’s verified seed/site imagery, not generic stock photography.
- Make the signature interaction an original/annotated evidence slider with the exact report page generated from that issue.
- Use restrained motion: a real cursor/touch path through markup is more impressive than generic scroll reveals.
- Use numbered engineering-style callouts around the product media so the site itself demonstrates the precision the app promises.
- End major proof sections with the relevant action, not another generic “learn more.”

## Developer handoff assessment

### What is ready

- Central content configuration.
- Reusable React components.
- Existing CSS variables for brand colors, fonts, radii and shadows.
- Clear route map and a small dependency surface.

### What must be added

1. **Product truth matrix:** release-backed list of shipped/beta/planned claims.
2. **Shared brand tokens:** one JSON/TS source that generates marketing CSS variables and Expo theme values.
3. **Component state contracts:** default, hover, focus, disabled, loading, error, success and responsive behavior.
4. **Media manifest:** real screenshot/video source, version, viewport, state and alt text.
5. **Acceptance matrix:** 320/375/390/768/1024/1440 layouts, keyboard journey, contrast, reduced motion, no overflow and no dead links.
6. **Visual regression:** baseline screenshots for the homepage, early access and every core route.
7. **Conversion telemetry:** event names, expected properties and privacy handling.

## Recommended implementation order

1. Correct product claims and remove false affordances.
2. Make early-access submission real.
3. Fix mobile overflow and reveal fallbacks.
4. Replace simulated screens with versioned product proof.
5. Restructure the homepage around proof and a two-level CTA.
6. Add route metadata, OG assets, prerendering and 404 handling.
7. Repair contrast and accessibility states.
8. Consolidate handoff contracts, tests, analytics and performance budgets.

## Evidence limits

- Native camera permissions, real PDF sharing, email composition, haptics and physical-device performance were not tested in this run.
- The active app was inspected through its web build; native layout may differ.
- No early-access submission was sent because doing so would create an external side effect.
- Competitor features and claims were taken from their current official websites and should be rechecked before public comparison copy is published.

