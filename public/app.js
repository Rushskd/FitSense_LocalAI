import {
  API_STORAGE_KEY,
  buildNutritionMethodDetail,
  deriveConditionScore,
  deriveTrainingScore,
  getApiConnectionMeta,
  getSourceMeta,
  normalizeApiConfig
} from "./ui-state.js";

const form = document.querySelector("#health-form");
const apiConfigForm = document.querySelector("#api-config-form");
const apiKeyInput = document.querySelector("#api-key-input");
const clearApiKeyButton = document.querySelector("#clear-api-key");
const apiKeyStatus = document.querySelector("#api-key-status");
const apiBadge = document.querySelector("#api-badge");
const apiPanelToggle = document.querySelector("#api-panel-toggle");
const apiPanelBody = document.querySelector("#api-panel-body");
const modelName = document.querySelector("#model-name");
const apiDetail = document.querySelector("#api-detail");
const sourcePill = document.querySelector("#source-pill");
const statusText = document.querySelector("#status-text");

const bmiValue = document.querySelector("#bmi-value");
const bmiCategory = document.querySelector("#bmi-category");
const activityScore = document.querySelector("#activity-score");
const activityLabel = document.querySelector("#activity-label");
const goalTitle = document.querySelector("#goal-title");
const goalText = document.querySelector("#goal-text");
const conditionMeter = document.querySelector("#condition-meter");
const trainingMeter = document.querySelector("#training-meter");
const conditionScoreLabel = document.querySelector("#condition-score-label");
const trainingScoreLabel = document.querySelector("#training-score-label");
const riskFlags = document.querySelector("#risk-flags");

const reportSummary = document.querySelector("#report-summary");
const reportClosing = document.querySelector("#report-closing");
const trainingHeadline = document.querySelector("#training-headline");
const trainingOverview = document.querySelector("#training-overview");
const trainingSchedule = document.querySelector("#training-schedule");
const trainingActions = document.querySelector("#training-actions");
const trainingPresets = document.querySelector("#training-presets");
const nutritionStrategy = document.querySelector("#nutrition-strategy");
const nutritionStrategyPanel = document.querySelector("#nutrition-strategy-panel");
const nutritionOverview = document.querySelector("#nutrition-overview");
const nutritionOverviewPanel = document.querySelector("#nutrition-overview-panel");
const nutritionActions = document.querySelector("#nutrition-actions");
const nutritionMethods = document.querySelector("#nutrition-methods");
const nutritionCaution = document.querySelector("#nutrition-caution");
const reportTabs = Array.from(document.querySelectorAll("[data-report-tab]"));
const reportPanels = Array.from(document.querySelectorAll("[data-report-panel]"));
const reportTabsContainer = document.querySelector(".report-tabs");
const reportTabLens = document.querySelector(".report-tab-lens");

const detailView = document.querySelector("#nutrition-detail-view");
const detailTitle = document.querySelector("#detail-title");
const detailSubtitle = document.querySelector("#detail-subtitle");
const detailPattern = document.querySelector("#detail-pattern");
const detailTargets = document.querySelector("#detail-targets");
const detailWeek = document.querySelector("#detail-week");
const detailPrinciples = document.querySelector("#detail-principles");
const detailTrainingNotes = document.querySelector("#detail-training-notes");
const detailSupplements = document.querySelector("#detail-supplements");
const detailCaution = document.querySelector("#detail-caution");
const detailCloseButton = document.querySelector("#detail-close");
const detailBackButton = document.querySelector("#detail-back");
const detailCloseTargets = Array.from(document.querySelectorAll("[data-detail-close]"));

let serverReachable = true;
let serverConfig = {
  deepseekConfigured: false,
  model: "deepseek-v4-flash"
};
let localApiConfig = readStoredApiConfig();
let latestProfile = null;

const presetAccentMap = {
  "最推荐": "#1d5f4c",
  "同样适合": "#5870c1",
  "可替代": "#93896c",
  "进阶可选": "#b27642"
};

function readStoredApiConfig() {
  try {
    const raw = localStorage.getItem(API_STORAGE_KEY);
    return raw ? normalizeApiConfig(JSON.parse(raw)) : normalizeApiConfig();
  } catch {
    return normalizeApiConfig();
  }
}

function persistApiConfig(nextConfig) {
  const normalized = normalizeApiConfig(nextConfig);

  if (normalized.configured) {
    localStorage.setItem(API_STORAGE_KEY, JSON.stringify(normalized));
  } else {
    localStorage.removeItem(API_STORAGE_KEY);
  }

  return normalized;
}

function updateApiPanel() {
  if (!serverReachable) {
    apiBadge.textContent = "服务离线";
    apiBadge.dataset.state = "offline";
    modelName.textContent = localApiConfig.model || "状态未知";
    apiDetail.textContent = "本地服务尚未启动或接口不可达，等服务恢复后即可继续使用。";
    return;
  }

  const meta = getApiConnectionMeta({
    serverConfigured: serverConfig.deepseekConfigured,
    localConfigured: localApiConfig.configured,
    model: localApiConfig.model || serverConfig.model
  });

  apiBadge.textContent = meta.badge;
  apiBadge.dataset.state = meta.state;
  modelName.textContent = meta.model;
  apiDetail.textContent = meta.detail;
}

async function loadApiStatus() {
  try {
    const response = await fetch("/api/status");
    const data = await response.json();

    serverReachable = true;
    serverConfig = {
      deepseekConfigured: data.deepseekConfigured,
      model: data.model
    };
    localApiConfig = normalizeApiConfig({
      ...localApiConfig,
      model: data.model
    });
    updateApiPanel();
  } catch {
    serverReachable = false;
    updateApiPanel();
  }
}

function readProfile(formData) {
  return {
    age: Number(formData.get("age")),
    gender: formData.get("gender"),
    height: Number(formData.get("height")),
    weight: Number(formData.get("weight")),
    activityLevel: formData.get("activityLevel"),
    weeklyWorkouts: Number(formData.get("weeklyWorkouts")),
    goal: formData.get("goal")
  };
}

function buildPayload(formData) {
  const profile = readProfile(formData);
  const payload = { ...profile };

  if (localApiConfig.configured) {
    payload.apiConfig = {
      apiKey: localApiConfig.apiKey,
      model: localApiConfig.model
    };
  }

  return payload;
}

function updateFlags(flags) {
  riskFlags.innerHTML = "";

  for (const flag of flags) {
    const node = document.createElement("span");
    node.className = "chip";
    node.textContent = flag;
    riskFlags.appendChild(node);
  }
}

function renderList(container, items) {
  container.innerHTML = "";

  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    container.appendChild(li);
  }
}

function openNutritionDetail(method) {
  if (!latestProfile) {
    return;
  }

  const detail = buildNutritionMethodDetail({
    methodName: method.name,
    profile: latestProfile
  });

  detailTitle.textContent = detail.title;
  detailSubtitle.textContent = detail.subtitle;
  detailPattern.textContent = detail.pattern;
  detailCaution.textContent = detail.caution;

  detailTargets.innerHTML = "";
  for (const target of detail.targets) {
    const article = document.createElement("article");
    article.className = "detail-target-card";

    const label = document.createElement("p");
    label.className = "detail-target-label";
    label.textContent = target.label;

    const value = document.createElement("strong");
    value.className = "detail-target-value";
    value.textContent = target.value;

    const note = document.createElement("p");
    note.className = "detail-target-note";
    note.textContent = target.note;

    article.append(label, value, note);
    detailTargets.appendChild(article);
  }

  detailWeek.innerHTML = "";
  for (const day of detail.week) {
    const article = document.createElement("article");
    article.className = "week-card";

    const top = document.createElement("div");
    top.className = "week-card-head";

    const dayLabel = document.createElement("strong");
    dayLabel.textContent = day.day;

    const band = document.createElement("span");
    band.className = "week-band";
    band.textContent = day.tag;

    top.append(dayLabel, band);

    const title = document.createElement("p");
    title.className = "week-card-title";
    title.textContent = day.title;

    const body = document.createElement("p");
    body.className = "week-card-body";
    body.textContent = day.body;

    article.append(top, title, body);
    detailWeek.appendChild(article);
  }

  renderList(detailPrinciples, detail.principles);
  renderList(detailTrainingNotes, detail.trainingNotes);
  renderList(detailSupplements, detail.supplements);

  detailView.hidden = false;
  document.body.classList.add("detail-open");
}

function closeNutritionDetail() {
  detailView.hidden = true;
  document.body.classList.remove("detail-open");
}

function renderMethods(methods) {
  nutritionMethods.innerHTML = "";

  for (const [index, method] of methods.entries()) {
    const article = document.createElement("article");
    article.className = "method-card";
    article.style.animationDelay = `${index * 80}ms`;

    const head = document.createElement("div");
    head.className = "method-head";

    const name = document.createElement("strong");
    name.textContent = method.name;

    const fit = document.createElement("span");
    fit.className = "method-fit";
    fit.textContent = method.fit;

    head.append(name, fit);

    const note = document.createElement("p");
    note.textContent = method.note;

    const footer = document.createElement("div");
    footer.className = "method-card-footer";

    const detailButton = document.createElement("button");
    detailButton.type = "button";
    detailButton.className = "detail-button";
    detailButton.textContent = "查看一周安排";
    detailButton.addEventListener("click", () => openNutritionDetail(method));

    footer.append(detailButton);
    article.append(head, note, footer);
    nutritionMethods.appendChild(article);
  }
}

function renderTrainingPresets(presets) {
  trainingPresets.innerHTML = "";

  for (const [index, preset] of presets.entries()) {
    const article = document.createElement("article");
    article.className = "preset-card";
    article.style.animationDelay = `${index * 90}ms`;
    article.style.setProperty("--preset-accent", presetAccentMap[preset.recommendation] || "#1d5f4c");

    const head = document.createElement("div");
    head.className = "preset-head";

    const name = document.createElement("strong");
    name.textContent = preset.name;

    const recommendation = document.createElement("span");
    recommendation.className = "recommendation-pill";
    recommendation.dataset.level = preset.recommendation;
    recommendation.textContent = preset.recommendation;

    head.append(name, recommendation);

    const cadence = document.createElement("p");
    cadence.className = "preset-cadence";
    cadence.textContent = preset.cadence;

    const summary = document.createElement("p");
    summary.className = "preset-summary";
    summary.textContent = preset.summary;

    const focus = document.createElement("p");
    focus.className = "preset-focus";
    focus.textContent = preset.focus;

    article.append(head, cadence, summary, focus);
    trainingPresets.appendChild(article);
  }
}

function activateReportTab(tabId) {
  for (const tab of reportTabs) {
    const isActive = tab.dataset.reportTab === tabId;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  }

  for (const panel of reportPanels) {
    const isActive = panel.dataset.reportPanel === tabId;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);

    if (isActive) {
      panel.style.animation = "none";
      void panel.offsetWidth;
      panel.style.animation = "";
    }
  }

  syncReportTabLens(tabId);
}

function moveReportTabLens(tab, options = {}) {
  if (!reportTabsContainer || !reportTabLens || !tab) {
    return;
  }

  const containerRect = reportTabsContainer.getBoundingClientRect();
  const tabRect = tab.getBoundingClientRect();
  const pointerX = options.pointerX ?? tabRect.left + tabRect.width / 2;
  const pointerY = options.pointerY ?? tabRect.top + tabRect.height / 2;
  const magneticX = (pointerX - (tabRect.left + tabRect.width / 2)) * 0.12;
  const magneticY = (pointerY - (tabRect.top + tabRect.height / 2)) * 0.16;
  const nextX = tabRect.left - containerRect.left + magneticX;
  const nextY = tabRect.top - containerRect.top + magneticY;
  const currentX = Number.parseFloat(reportTabLens.dataset.x || String(nextX));
  const direction = nextX >= currentX ? 1 : -1;

  reportTabLens.dataset.x = String(nextX);
  reportTabLens.style.setProperty("--tab-lens-x", `${nextX.toFixed(2)}px`);
  reportTabLens.style.setProperty("--tab-lens-y", `${nextY.toFixed(2)}px`);
  reportTabLens.style.setProperty("--tab-lens-w", `${tabRect.width.toFixed(2)}px`);
  reportTabLens.style.setProperty("--tab-lens-h", `${tabRect.height.toFixed(2)}px`);
  reportTabLens.style.setProperty("--tab-lens-opacity", "1");
  reportTabLens.style.setProperty("--tab-lens-stretch", options.press ? "0.94" : direction === 1 ? "1.08" : "1.04");
  reportTabLens.style.setProperty("--tab-lens-squash", options.press ? "1.08" : "0.97");

  window.setTimeout(() => {
    reportTabLens.style.setProperty("--tab-lens-stretch", "1");
    reportTabLens.style.setProperty("--tab-lens-squash", "1");
  }, 180);
}

function syncReportTabLens(tabId) {
  const activeTab =
    reportTabs.find((tab) => tab.dataset.reportTab === tabId) ||
    reportTabs.find((tab) => tab.classList.contains("is-active")) ||
    reportTabs[0];

  requestAnimationFrame(() => moveReportTabLens(activeTab));
}

function initReportTabLiquid() {
  if (!reportTabsContainer || !reportTabLens || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  syncReportTabLens();

  for (const tab of reportTabs) {
    tab.addEventListener("pointerenter", (event) => {
      moveReportTabLens(tab, { pointerX: event.clientX, pointerY: event.clientY });
    });

    tab.addEventListener("pointermove", (event) => {
      moveReportTabLens(tab, { pointerX: event.clientX, pointerY: event.clientY });
    });

    tab.addEventListener("pointerdown", () => {
      reportTabsContainer.classList.add("is-pressing");
      moveReportTabLens(tab, { press: true });
    });
  }

  reportTabsContainer.addEventListener("pointerleave", () => syncReportTabLens());
  reportTabsContainer.addEventListener("pointerup", () => {
    reportTabsContainer.classList.remove("is-pressing");
    syncReportTabLens();
  });

  window.addEventListener("resize", () => syncReportTabLens());
}

function setStatus(text = "", state = "normal") {
  if (!text) {
    statusText.hidden = true;
    statusText.textContent = "";
    statusText.dataset.state = state;
    return;
  }

  statusText.hidden = false;
  statusText.textContent = text;
  statusText.dataset.state = state;
}

function renderStructuredReport(structuredReport) {
  reportSummary.textContent = structuredReport.summary;
  reportClosing.textContent = structuredReport.closing;

  trainingHeadline.textContent = structuredReport.training.headline;
  trainingOverview.textContent = structuredReport.training.overview;
  renderTrainingPresets(structuredReport.training.presets);
  renderList(trainingSchedule, structuredReport.training.schedule);
  renderList(trainingActions, structuredReport.training.actions);

  nutritionStrategy.textContent = structuredReport.nutrition.strategy;
  nutritionStrategyPanel.textContent = structuredReport.nutrition.strategy;
  nutritionOverview.textContent = structuredReport.nutrition.overview;
  nutritionOverviewPanel.textContent = structuredReport.nutrition.overview;
  renderList(nutritionActions, structuredReport.nutrition.actions);
  renderMethods(structuredReport.nutrition.methods);
  nutritionCaution.textContent = structuredReport.nutrition.caution;
}

function renderResult(data) {
  const { analysis, source, structuredReport } = data;
  const conditionScore = deriveConditionScore(analysis);
  const trainingScore = deriveTrainingScore(analysis);
  const sourceMeta = getSourceMeta(source);

  bmiValue.textContent = analysis.bmi.toFixed(1);
  bmiCategory.textContent = analysis.bmiCategory;
  activityScore.textContent = String(analysis.activityScore);
  activityLabel.textContent = analysis.activityLabel;
  goalTitle.textContent = analysis.goalLabel;
  goalText.textContent = analysis.weeklyGoal;
  conditionMeter.style.width = `${conditionScore}%`;
  trainingMeter.style.width = `${trainingScore}%`;
  conditionScoreLabel.textContent = `${conditionScore}%`;
  trainingScoreLabel.textContent = `${trainingScore}%`;

  renderStructuredReport(structuredReport);

  sourcePill.textContent = sourceMeta.pill;
  sourcePill.classList.toggle("live", sourceMeta.live);
  setStatus(sourceMeta.status);

  updateFlags(analysis.riskFlags);
  closeNutritionDetail();
  activateReportTab("overview");
}

function saveApiKey(event) {
  event.preventDefault();

  localApiConfig = persistApiConfig({
    apiKey: apiKeyInput.value,
    model: serverConfig.model
  });

  if (localApiConfig.configured) {
    apiKeyStatus.textContent = "已保存到当前浏览器。提交分析时会优先使用这把 Key。";
  } else {
    apiKeyStatus.textContent = "没有检测到可保存的 Key，请先输入后再保存。";
  }

  updateApiPanel();
}

function clearApiKey() {
  apiKeyInput.value = "";
  localApiConfig = persistApiConfig({});
  apiKeyStatus.textContent = "浏览器中的 API Key 已清除。";
  updateApiPanel();
}

async function submitProfile(event) {
  event.preventDefault();
  setStatus("正在生成报告...", "loading");
  sourcePill.textContent = "分析中";
  sourcePill.classList.remove("live");

  const formData = new FormData(form);
  const payload = buildPayload(formData);
  latestProfile = readProfile(formData);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "请求失败。");
    }

    renderResult(data);
  } catch (error) {
    sourcePill.textContent = "错误";
    sourcePill.classList.remove("live");
    setStatus("生成失败，请检查配置后重试。", "error");
    reportSummary.textContent = error.message;
    reportClosing.textContent = "修正 API 配置或稍后重试后，再重新生成报告。";
    closeNutritionDetail();
    activateReportTab("overview");
  }
}

function handleDetailKeydown(event) {
  if (event.key === "Escape" && !detailView.hidden) {
    closeNutritionDetail();
  }
}

function toggleApiPanel() {
  if (!apiPanelToggle || !apiPanelBody) {
    return;
  }

  const expanded = apiPanelToggle.getAttribute("aria-expanded") === "true";
  const nextExpanded = !expanded;
  apiPanelToggle.setAttribute("aria-expanded", String(nextExpanded));
  apiPanelBody.hidden = !nextExpanded;
  apiPanelToggle.querySelector(".api-toggle-hint").textContent = nextExpanded ? "点击收起" : "点击展开";
  apiPanelToggle.closest(".control-panel")?.classList.toggle("is-open", nextExpanded);
  apiPanelToggle.closest(".control-panel")?.classList.toggle("is-collapsed", !nextExpanded);
}

function initLiquidHeroMotion() {
  const masthead = document.querySelector(".masthead");
  const lens = document.querySelector(".hero-lens");

  if (!masthead || !lens || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let targetRotate = -4;
  let currentRotate = -4;
  let targetScale = 1;
  let currentScale = 1;

  function tick() {
    currentX += (targetX - currentX) * 0.09;
    currentY += (targetY - currentY) * 0.09;
    currentRotate += (targetRotate - currentRotate) * 0.08;
    currentScale += (targetScale - currentScale) * 0.08;

    lens.style.setProperty("--lens-x", `${currentX.toFixed(2)}px`);
    lens.style.setProperty("--lens-y", `${currentY.toFixed(2)}px`);
    lens.style.setProperty("--lens-rotate", `${currentRotate.toFixed(2)}deg`);
    lens.style.setProperty("--lens-scale", currentScale.toFixed(3));

    requestAnimationFrame(tick);
  }

  masthead.addEventListener("pointermove", (event) => {
    const rect = masthead.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    targetX = x * 42;
    targetY = y * 28;
    targetRotate = -4 + x * 10;
    targetScale = 1.035;
  });

  masthead.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
    targetRotate = -4;
    targetScale = 1;
  });

  requestAnimationFrame(tick);
}

apiKeyInput.value = localApiConfig.apiKey;
initLiquidHeroMotion();
initReportTabLiquid();
loadApiStatus();
apiPanelToggle?.addEventListener("click", toggleApiPanel);
apiConfigForm.addEventListener("submit", saveApiKey);
clearApiKeyButton.addEventListener("click", clearApiKey);
form.addEventListener("submit", submitProfile);
for (const tab of reportTabs) {
  tab.addEventListener("click", () => activateReportTab(tab.dataset.reportTab));
}
detailCloseButton.addEventListener("click", closeNutritionDetail);
detailBackButton.addEventListener("click", closeNutritionDetail);
for (const target of detailCloseTargets) {
  target.addEventListener("click", closeNutritionDetail);
}
document.addEventListener("keydown", handleDetailKeydown);
