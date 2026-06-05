import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("report layout hides raw reply tab and includes nutrition detail view", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

  assert.doesNotMatch(html, /data-report-tab="raw"/);
  assert.doesNotMatch(html, /data-report-panel="raw"/);
  assert.match(html, /id="nutrition-detail-view"/);
  assert.match(html, /id="detail-week"/);
  assert.match(html, /id="glass-distortion"/);
  assert.match(html, /class="liquid-stage"/);
  assert.doesNotMatch(html, /global-liquid-cursor/);
  assert.match(html, /class="report-tab-lens liquidGlass-wrapper"/);
  assert.match(html, /id="api-panel-toggle"/);
  assert.match(html, /id="api-panel-body" class="api-panel-body" hidden/);
  assert.match(html, /id="precision-panel"/);
  assert.match(html, /id="precision-progress"/);
});

test("hero api entry and report spacing follow the annotated layout", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  const heroStart = html.indexOf('<section class="hero-grid"');
  const mastheadEnd = html.indexOf("</header>");

  assert.ok(heroStart > -1);
  assert.ok(heroStart > mastheadEnd);
  assert.match(css, /\.hero-grid\s*\{[^}]*position:\s*fixed;[^}]*right:\s*clamp\(16px,\s*3vw,\s*34px\);[^}]*bottom:\s*clamp\(16px,\s*3vw,\s*28px\);/s);
  assert.doesNotMatch(css, /\.hero-grid\s*\{[^}]*top:\s*260px;/s);
  assert.match(css, /\.report-tabs\s*\{[^}]*gap:\s*16px;/s);
  assert.match(css, /\.report-tab\s*\{[^}]*padding:\s*13px 24px;/s);
  assert.match(css, /\.report-panel\s*\{[^}]*margin-top:\s*56px;/s);
  assert.match(css, /\.overview-grid,\s*\.training-detail-grid\s*\{[^}]*gap:\s*50px;/s);
  assert.doesNotMatch(css, /\.masthead:has\(\.control-panel\.is-open\)/);
  assert.match(css, /\.hero-grid:has\(\.control-panel\.is-open\)\s*\{[^}]*width:\s*min\(340px,\s*calc\(100vw - 32px\)\);/s);
  assert.match(css, /\.hero-grid:has\(\.control-panel\.is-open\)::before\s*\{[^}]*opacity:\s*0\.82;[^}]*filter:\s*blur\(34px\) saturate\(190%\);[^}]*animation:\s*floatingHalo/s);
  assert.match(css, /\.api-panel-body\s*\{[^}]*position:\s*static;[^}]*margin-top:\s*8px;/s);
  assert.doesNotMatch(css, /\.api-panel-body\s*\{[^}]*position:\s*absolute;/s);
});

test("mobile layout removes the hero lens and uses a phone-first rhythm", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

  assert.doesNotMatch(html, /hero-lens/);
  assert.doesNotMatch(html, /hero-lens-copy/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.masthead\s*\{[^}]*min-height:\s*300px;[^}]*padding:\s*24px 20px 28px;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.content-grid\s*\{[^}]*gap:\s*18px;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.report-tabs\s*\{[^}]*width:\s*100%;[^}]*overflow-x:\s*auto;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.hero-grid\s*\{[^}]*bottom:\s*calc\(10px \+ env\(safe-area-inset-bottom\)\);/);
  assert.match(css, /@media \(max-width:\s*520px\)\s*\{[\s\S]*\.masthead h1\s*\{[^}]*font-size:\s*clamp\(2\.72rem,\s*17vw,\s*4\.15rem\);/);
});

test("mobile layout trims expensive effects while keeping the signature look", async () => {
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  const appJs = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

  assert.match(css, /\.report-panel,\s*\.preset-card,\s*\.method-card,\s*\.detail-target-card,\s*\.week-card,\s*\.detail-card,\s*\.overview-card,\s*\.module-card,\s*\.report-box\s*\{[^}]*content-visibility:\s*auto;[^}]*contain-intrinsic-size:\s*320px;/s);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*:root\s*\{[^}]*--font-display:\s*"PingFang SC"[^}]*--font-body:\s*"PingFang SC"/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*body\s*\{[^}]*animation:\s*none;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.hero-spectrum\s*\{[^}]*animation:\s*none;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.report-tab-lens\s*\{[^}]*display:\s*none;/);
  assert.match(appJs, /window\.matchMedia\("\(pointer:\s*coarse\)"\)\.matches/);
});

test("github pages can serve the static app from a project subpath", async () => {
  const rootHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

  assert.match(rootHtml, /url=\.\/public\//);
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.doesNotMatch(html, /(href|src)="\//);
  assert.doesNotMatch(css, /url\("\//);
});

test("site branding links to the project github with logo placements", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

  assert.match(html, /class="masthead-brandbar"/);
  assert.match(html, /class="site-logo"/);
  assert.match(html, /class="site-footer glass-panel"/);
  assert.match(html, /由 Rushskd 制作/);
  assert.match(html, /https:\/\/github\.com\/Rushskd\/FitSense_LocalAI/g);
  assert.match(css, /\.masthead-brandbar\s*\{[^}]*justify-content:\s*space-between;/s);
  assert.match(css, /\.site-logo\s*\{[^}]*backdrop-filter:\s*blur\(20px\) saturate\(165%\);/s);
  assert.match(css, /\.site-footer\s*\{[^}]*margin-top:\s*26px;/s);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.site-footer\s*\{[^}]*flex-direction:\s*column;/);
});

test("report tabs use a fast font path while preserving the display title font", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

  assert.match(html, /rel="preload" href="\.\/assets\/fonts\/ZhuoTeYueDongHei-2\.otf" as="font" type="font\/otf" crossorigin/);
  assert.match(css, /--font-ui-fast:\s*"Segoe UI Variable Text",\s*"Microsoft YaHei UI",\s*"PingFang SC",\s*"Noto Sans SC",\s*sans-serif;/);
  assert.match(css, /\.report-tab\s*\{[^}]*font-family:\s*var\(--font-ui-fast\);/s);
  assert.doesNotMatch(css, /\.report-tab\s*\{[^}]*font-family:\s*var\(--font-body\);/s);
});

test("mobile keeps the glass look with cheaper scrolling effects", async () => {
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*body::before\s*\{[^}]*display:\s*none;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.liquid-stage::before\s*\{[^}]*position:\s*absolute;[^}]*height:\s*520px;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.glass-panel,\s*\.glass-subpanel,\s*\.glass-mini-card,[\s\S]*backdrop-filter:\s*blur\(10px\) saturate\(126%\);/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.report-tabs\s*\{[^}]*backdrop-filter:\s*blur\(10px\) saturate\(126%\);/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.report-tab\s*\{[^}]*backdrop-filter:\s*none;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.liquidGlass-effect\s*\{[^}]*filter:\s*none;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.hero-grid\s*\{[^}]*contain:\s*layout paint style;/);
});

test("deepseek entry is a draggable whale orb before details expand", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  const appJs = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  const deepseekLogo = await readFile(new URL("../public/assets/deepseek-color.svg", import.meta.url), "utf8");

  assert.match(html, /class="hero-grid"[^>]*data-draggable="deepseek-orb"/);
  assert.match(html, /aria-label="展开 DeepSeek 在线能力详情"/);
  assert.match(html, /class="deepseek-orb-icon"/);
  assert.match(html, /class="deepseek-whale-logo"\s+src="\.\/assets\/deepseek-color\.svg"/);
  assert.match(deepseekLogo, /<title>DeepSeek<\/title>/);
  assert.match(deepseekLogo, /fill="#4D6BFE"/);
  assert.match(css, /--deepseek-orb-size:\s*76px;/);
  assert.match(css, /\.hero-grid\s*\{[^}]*width:\s*var\(--deepseek-orb-size\);/s);
  assert.match(css, /\.control-panel\.is-collapsed\s*\{[^}]*width:\s*var\(--deepseek-orb-size\);[^}]*height:\s*var\(--deepseek-orb-size\);[^}]*border-radius:\s*var\(--pill\);/s);
  assert.match(css, /\.control-panel\.is-collapsed\s+\.status-head\s*\{[^}]*opacity:\s*0;/s);
  assert.match(css, /\.api-panel-toggle\s*\{[^}]*touch-action:\s*none;/s);
  assert.match(css, /\.hero-grid\.is-dragging\s*\{[^}]*transition:\s*none;/s);
  assert.match(appJs, /const heroGrid = document\.querySelector\("\.hero-grid"\);/);
  assert.match(appJs, /function initApiOrbDrag\(\)/);
  assert.match(appJs, /event\.pointerType === "mouse" && event\.button !== 0/);
  assert.match(appJs, /setPointerCapture\(event\.pointerId\)/);
  assert.match(appJs, /addEventListener\("touchstart"/);
  assert.match(appJs, /addEventListener\("touchmove"/);
  assert.match(appJs, /addEventListener\("touchend"/);
  assert.match(appJs, /addEventListener\("mousedown"/);
  assert.match(appJs, /addEventListener\("mousemove"/);
  assert.match(appJs, /addEventListener\("mouseup"/);
  assert.match(appJs, /apiOrbWasDragged/);
});

test("mobile deepseek orb removes square backing, snaps to edges, and opens smoothly", async () => {
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  const appJs = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.control-panel\.is-collapsed\s*\{[^}]*padding:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;[^}]*backdrop-filter:\s*none;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.control-panel\.is-collapsed\s+\.api-panel-toggle\s*\{[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;[^}]*backdrop-filter:\s*none;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.deepseek-orb-icon\s*\{[^}]*overflow:\s*hidden;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.api-panel-body\s*\{[^}]*animation:\s*apiPanelReveal 220ms/);
  assert.match(css, /@keyframes apiPanelReveal\s*\{[^}]*opacity:\s*0;[^}]*transform:\s*translate3d\(0,\s*6px,\s*0\)\s*scale\(0\.98\);/s);
  assert.match(appJs, /function snapApiOrbToMobileEdge\(\)/);
  assert.match(appJs, /window\.matchMedia\("\(max-width:\s*720px\)"\)\.matches/);
  assert.match(appJs, /snapApiOrbToMobileEdge\(\);/);
});
