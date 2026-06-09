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

test("homepage opens with a fullpage parallax intro before the workspace", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  const appJs = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  const introStart = html.indexOf('id="intro-section"');
  const workspaceStart = html.indexOf('id="workspace-section"');

  assert.ok(introStart > -1);
  assert.ok(workspaceStart > introStart);
  assert.match(html, /data-fullpage-section="intro"/);
  assert.match(html, /id="intro-enter"/);
  assert.match(html, /class="intro-parallax intro-grid"/);
  assert.match(html, /class="workspace-section fullpage-section"/);
  assert.match(css, /\.liquid-stage\s*\{[^}]*scroll-snap-type:\s*y mandatory;/s);
  assert.match(css, /\.fullpage-section\s*\{[^}]*min-height:\s*100svh;[^}]*scroll-snap-align:\s*start;/s);
  assert.match(css, /\.intro-section\s*\{[^}]*overflow:\s*hidden;/s);
  assert.match(css, /\.intro-copy\s*\{[^}]*--intro-copy-offset:\s*0px;[^}]*transform:\s*translate3d\(var\(--intro-copy-offset\),\s*0,\s*0\);/s);
  assert.match(css, /@media \(min-width:\s*901px\)\s*\{[\s\S]*\.intro-copy\s*\{[^}]*--intro-copy-offset:\s*clamp\(-34px,\s*-2\.8vw,\s*-18px\);[^}]*justify-self:\s*start;/);
  assert.match(css, /\.intro-parallax\s*\{[^}]*transform:/s);
  assert.match(css, /\.workspace-section\s*\{[^}]*padding:\s*28px 0 52px;/s);
  assert.match(appJs, /const introSection = document\.querySelector\("#intro-section"\);/);
  assert.match(appJs, /function initFullpageIntroScroll\(\)/);
  assert.match(appJs, /function scrollToWorkspace\(\)/);
  assert.match(appJs, /function scrollToIntro\(\)/);
  assert.match(appJs, /window\.addEventListener\("wheel", handleFullpageWheel,\s*\{\s*passive:\s*false\s*\}\);/s);
});

test("desktop intro owns the flowing point logo without leaking into workspace", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  const appJs = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
  const particleAsset = await readFile(new URL("../public/assets/GitHub_Invertocat_Black.png", import.meta.url));
  const introStart = html.indexOf('id="intro-section"');
  const canvasStart = html.indexOf('id="flowing-points-canvas"');
  const workspaceStart = html.indexOf('id="workspace-section"');

  assert.ok(canvasStart > introStart);
  assert.ok(canvasStart < workspaceStart);
  assert.match(html, /id="flowing-points-canvas"/);
  assert.match(html, /class="flowing-points-canvas"/);
  assert.match(html, /class="background-depth-bridge"/);
  assert.ok(particleAsset.length > 1000);
  assert.match(css, /\.intro-section\s+\.flowing-points-canvas\s*\{[^}]*position:\s*absolute;[^}]*mix-blend-mode:\s*screen;/s);
  assert.doesNotMatch(css, /\.flowing-points-canvas\s*\{[^}]*position:\s*fixed;/s);
  assert.match(css, /\.background-depth-bridge\s*\{[^}]*transform:\s*translate3d\(0,\s*var\(--bridge-shift,\s*0px\),\s*0\);/s);
  assert.match(css, /@media \(max-width:\s*900px\)\s*\{[\s\S]*\.flowing-points-canvas\s*\{[^}]*display:\s*none;/);
  assert.match(appJs, /const flowingPointsCanvas = document\.querySelector\("#flowing-points-canvas"\);/);
  assert.match(appJs, /const FLOWING_POINTS_IMAGE = "\.\/assets\/GitHub_Invertocat_Black\.png";/);
  assert.match(appJs, /function initFlowingPointsBackground\(\)/);
  assert.match(appJs, /function drawFlowingPointsBackground\(\)/);
  assert.match(appJs, /new Image\(\)/);
  assert.match(appJs, /if \(alpha < 48 \|\| darkness < 34\)/);
  assert.match(appJs, /const imageScale = Math\.min\(1\.5,\s*Math\.max\(1\.08,\s*state\.width \/ 1400\)\);/);
  assert.match(appJs, /const targetWidth = Math\.min\(500,\s*Math\.max\(340,\s*state\.width \* 0\.3\)\) \* imageScale;/);
  assert.match(appJs, /const logoCenterX = state\.width \* 0\.77;/);
  assert.match(appJs, /const logoCenterY = state\.height \* 0\.36;/);
  assert.match(appJs, /function updateFullpageParallax\(\)/);
  assert.match(appJs, /window\.addEventListener\("scroll", updateFullpageParallax,\s*\{\s*passive:\s*true\s*\}\);/s);
});

test("intro github card stays compact and fully visible on the first screen", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

  assert.match(html, /class="intro-dashboard intro-repo-card"/);
  assert.match(html, /href="https:\/\/github\.com\/Rushskd\/FitSense_LocalAI"/);
  assert.match(html, /aria-label="打开 FitSense LocalAI GitHub 仓库"/);
  assert.match(html, /GitHub Repository/);
  assert.match(html, /Rushskd \/ FitSense_LocalAI/);
  assert.match(css, /\.intro-dashboard\s*\{[^}]*bottom:\s*clamp\(96px,\s*14vh,\s*156px\);[^}]*width:\s*min\(310px,\s*32vw\);[^}]*min-height:\s*92px;/s);
  assert.match(css, /\.intro-repo-mark\s*\{[^}]*width:\s*42px;[^}]*height:\s*42px;/s);
  assert.match(css, /\.intro-repo-copy strong\s*\{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s);
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
  assert.match(css, /\.report-tabs\s*\{[^}]*gap:\s*18px;/s);
  assert.match(css, /\.report-tab\s*\{[^}]*min-height:\s*50px;[^}]*padding:\s*15px 26px;/s);
  assert.match(css, /\.report-panel\s*\{[^}]*margin-top:\s*64px;/s);
  assert.match(css, /\.overview-grid,\s*\.training-detail-grid\s*\{[^}]*gap:\s*54px;/s);
  assert.doesNotMatch(css, /\.masthead:has\(\.control-panel\.is-open\)/);
  assert.match(css, /\.hero-grid:has\(\.control-panel\.is-open\)\s*\{[^}]*width:\s*min\(340px,\s*calc\(100vw - 32px\)\);/s);
  assert.doesNotMatch(css, /\.hero-grid:has\(\.control-panel\.is-open\)::before\s*\{[^}]*animation:\s*floatingHalo/s);
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
  assert.match(css, /\.api-panel-body\s*\{[^}]*animation:\s*apiPanelFade 140ms ease both;/s);
  assert.match(css, /@keyframes apiPanelFade\s*\{[\s\S]*opacity:\s*0;[\s\S]*opacity:\s*1;/);
  assert.doesNotMatch(css, /apiPanelReveal/);
  assert.match(appJs, /function snapApiOrbToMobileEdge\(\)/);
  assert.match(appJs, /window\.matchMedia\("\(max-width:\s*720px\)"\)\.matches/);
  assert.match(appJs, /snapApiOrbToMobileEdge\(\);/);
  assert.match(appJs, /let apiOrbTouchTapHandled = false;/);
  assert.match(appJs, /function handleApiOrbTouchEnd/);
});

test("report tabs and data cards keep breathable spacing without heavy backdrop blocks", async () => {
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

  assert.match(css, /\.report-card::before,\s*\.report-card::after\s*\{[^}]*display:\s*none;/s);
  assert.match(css, /\.report-card\s*\{[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;[^}]*backdrop-filter:\s*none;/s);
  assert.match(css, /\.report-box\s*\{[^}]*background:\s*linear-gradient\(180deg,\s*rgba\(255,\s*255,\s*255,\s*0\.3\),\s*rgba\(255,\s*255,\s*255,\s*0\.18\)\);/s);
  assert.doesNotMatch(css, /rgba\(21,\s*33,\s*55,\s*0\.7\)/);
  assert.doesNotMatch(css, /rgba\(35,\s*53,\s*83,\s*0\.58\)/);
  assert.match(css, /\.report-panel\s*\{[^}]*margin-top:\s*64px;/s);
  assert.match(css, /\.report-panel\[data-report-panel="overview"\]\s*>\s*\.overview-grid\s*\{[^}]*margin-top:\s*72px;/s);
  assert.match(css, /\.preset-grid\s*\{[^}]*margin-top:\s*40px;/s);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.report-tab\s*\{[^}]*min-height:\s*46px;[^}]*padding:\s*12px 20px;/);
  assert.match(css, /@media \(max-width:\s*520px\)\s*\{[\s\S]*\.report-tab\s*\{[^}]*padding-inline:\s*20px;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.report-panel\s*\{[^}]*margin-top:\s*44px;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.report-panel\[data-report-panel="overview"\]\s*>\s*\.overview-grid\s*\{[^}]*margin-top:\s*44px;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.overview-grid,\s*\.training-detail-grid\s*\{[^}]*gap:\s*30px;/);
});

test("report surfaces glow in place on hover instead of lifting from the backdrop", async () => {
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

  assert.match(css, /\.report-tab:hover\s*\{[^}]*transform:\s*none;[^}]*box-shadow:/s);
  assert.match(css, /\.summary-band:hover,\s*\.overview-card:hover,\s*\.module-card:hover,\s*\.preset-card:hover,\s*\.method-card:hover,\s*\.report-box:hover\s*\{[^}]*transform:\s*none;[^}]*box-shadow:/s);
  assert.doesNotMatch(css, /\.report-tab:hover\s*\{[^}]*translateY/s);
  assert.doesNotMatch(css, /\.summary-band:hover,\s*\.overview-card:hover,\s*\.module-card:hover,\s*\.preset-card:hover,\s*\.method-card:hover,\s*\.report-box:hover\s*\{[^}]*translateY/s);
});

test("detail report tabs keep generous vertical rhythm between card groups", async () => {
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

  assert.match(css, /\.preset-grid\s*\{[^}]*gap:\s*30px;[^}]*margin-top:\s*40px;/s);
  assert.match(css, /\.preset-grid\s*\+\s*\.training-detail-grid\s*\{[^}]*margin-top:\s*58px;/s);
  assert.match(css, /\.module-card-wide\s*>\s*\.module-copy\s*\+\s*\.detail-block\s*\{[^}]*margin-top:\s*38px;/s);
  assert.match(css, /\.module-card-wide\s*>\s*\.detail-block\s*\+\s*\.detail-block\s*\{[^}]*margin-top:\s*46px;/s);
  assert.match(css, /\.method-grid\s*\{[^}]*gap:\s*30px;[^}]*margin-top:\s*28px;/s);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.preset-grid\s*\{[^}]*gap:\s*26px;[^}]*margin-top:\s*30px;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.preset-grid\s*\+\s*\.training-detail-grid\s*\{[^}]*margin-top:\s*36px;/);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.method-grid\s*\{[^}]*gap:\s*24px;[^}]*margin-top:\s*22px;/);
});
