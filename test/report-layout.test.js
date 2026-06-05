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
