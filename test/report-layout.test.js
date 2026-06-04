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
});

test("hero api entry and report spacing follow the annotated layout", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  const heroStart = html.indexOf('<section class="hero-grid">');
  const mastheadEnd = html.indexOf("</header>");

  assert.ok(heroStart > -1);
  assert.ok(heroStart < mastheadEnd);
  assert.match(css, /\.hero-grid\s*\{[^}]*position:\s*absolute;[^}]*right:\s*34px;[^}]*bottom:\s*26px;/s);
  assert.doesNotMatch(css, /\.hero-grid\s*\{[^}]*top:\s*260px;/s);
  assert.match(css, /\.report-tabs\s*\{[^}]*gap:\s*10px;/s);
  assert.match(css, /\.report-panel\s*\{[^}]*margin-top:\s*56px;/s);
  assert.match(css, /\.overview-grid,\s*\.training-detail-grid\s*\{[^}]*gap:\s*50px;/s);
  assert.match(css, /\.masthead:has\(\.control-panel\.is-open\)\s*\{[^}]*overflow:\s*visible;/s);
  assert.match(css, /\.api-panel-body\s*\{[^}]*position:\s*absolute;[^}]*top:\s*calc\(100% \+ 12px\);/s);
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
