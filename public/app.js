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
const heroGrid = document.querySelector(".hero-grid");
const introSection = document.querySelector("#intro-section");
const workspaceSection = document.querySelector("#workspace-section");
const introEnterButton = document.querySelector("#intro-enter");
const flowingPointsCanvas = document.querySelector("#flowing-points-canvas");
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
const precisionPanel = document.querySelector("#precision-panel");
const precisionRationale = document.querySelector("#precision-rationale");
const precisionCalories = document.querySelector("#precision-calories");
const precisionProtein = document.querySelector("#precision-protein");
const precisionCarbs = document.querySelector("#precision-carbs");
const precisionVolume = document.querySelector("#precision-volume");
const precisionRecovery = document.querySelector("#precision-recovery");
const precisionProgress = document.querySelector("#precision-progress");
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
let apiOrbWasDragged = false;
let apiOrbTouchTapHandled = false;

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
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const FLOWING_POINTS_IMAGE = "./assets/GitHub_Invertocat_Black.png";

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

function renderPrecisionPanel(structuredReport, source) {
  const precision = structuredReport?.precision;
  const isOnline = source === "deepseek";
  const hasPrecision = isOnline && precision && (
    precision.rationale ||
    precision.calorieTarget ||
    precision.proteinTarget ||
    precision.carbPlan ||
    precision.trainingVolume ||
    precision.recoveryFocus ||
    precision.progressChecks?.length
  );

  precisionPanel.hidden = !hasPrecision;

  if (!hasPrecision) {
    return;
  }

  precisionRationale.textContent = precision.rationale;
  precisionCalories.textContent = precision.calorieTarget;
  precisionProtein.textContent = precision.proteinTarget;
  precisionCarbs.textContent = precision.carbPlan;
  precisionVolume.textContent = precision.trainingVolume;
  precisionRecovery.textContent = precision.recoveryFocus;
  renderList(precisionProgress, precision.progressChecks || []);
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
  if (
    !reportTabsContainer ||
    !reportTabLens ||
    prefersReducedMotion.matches ||
    window.matchMedia("(pointer: coarse)").matches
  ) {
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

function updateFullpageParallax() {
  if (!introSection || !workspaceSection) {
    return;
  }

  const workspaceTop = Math.max(1, workspaceSection.offsetTop);
  const progress = Math.min(Math.max(window.scrollY / workspaceTop, 0), 1);
  const easedProgress = 1 - Math.pow(1 - progress, 2);
  const bridgeShift = (easedProgress - 0.5) * 92;
  const bridgeOpacity = 0.36 - Math.abs(progress - 0.5) * 0.28;
  const particleOpacity = 0.82 - progress * 0.46;

  document.documentElement.style.setProperty("--bridge-shift", `${bridgeShift.toFixed(1)}px`);
  document.documentElement.style.setProperty("--bridge-opacity", bridgeOpacity.toFixed(2));
  document.documentElement.style.setProperty("--particle-opacity", particleOpacity.toFixed(2));
  introSection.style.setProperty("--intro-scroll-y", `${(progress * 52).toFixed(1)}px`);
}

function initFlowingPointsBackground() {
  if (
    !flowingPointsCanvas ||
    prefersReducedMotion.matches ||
    !window.matchMedia("(min-width: 901px)").matches
  ) {
    updateFullpageParallax();
    return;
  }

  const context = flowingPointsCanvas.getContext("2d", { alpha: true });
  if (!context) {
    return;
  }

  const state = {
    animationFrame: 0,
    context,
    image: new Image(),
    mouseX: Number.POSITIVE_INFINITY,
    mouseY: Number.POSITIVE_INFINITY,
    particles: [],
    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.75),
    scrollLift: 0,
    width: 0,
    height: 0
  };

  const rebuildParticles = () => {
    const introRect = introSection?.getBoundingClientRect();
    state.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
    state.width = Math.round(introRect?.width || window.innerWidth);
    state.height = Math.round(introRect?.height || window.innerHeight);
    flowingPointsCanvas.width = Math.round(state.width * state.pixelRatio);
    flowingPointsCanvas.height = Math.round(state.height * state.pixelRatio);
    flowingPointsCanvas.style.width = `${state.width}px`;
    flowingPointsCanvas.style.height = `${state.height}px`;
    state.context.setTransform(state.pixelRatio, 0, 0, state.pixelRatio, 0, 0);

    if (!state.image.complete || !state.image.naturalWidth) {
      return;
    }

    const imageScale = Math.min(1.46, Math.max(1.04, state.width / 1440));
    const targetWidth = Math.min(460, Math.max(310, state.width * 0.28)) * imageScale;
    const targetHeight = targetWidth * (state.image.naturalHeight / state.image.naturalWidth);
    const sampleCanvas = document.createElement("canvas");
    const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!sampleContext) {
      return;
    }

    sampleCanvas.width = Math.round(targetWidth);
    sampleCanvas.height = Math.round(targetHeight);
    sampleContext.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);
    sampleContext.drawImage(state.image, 0, 0, sampleCanvas.width, sampleCanvas.height);
    const imageData = sampleContext.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);
    const points = [];
    const sampleStep = state.width > 1360 ? 8 : 10;
    const logoCenterX = state.width * 0.82;
    const logoCenterY = state.height * 0.31;
    const startX = logoCenterX - sampleCanvas.width / 2;
    const startY = logoCenterY - sampleCanvas.height / 2;

    for (let y = 0; y < sampleCanvas.height; y += sampleStep) {
      for (let x = 0; x < sampleCanvas.width; x += sampleStep) {
        const index = (y * sampleCanvas.width + x) * 4;
        const alpha = imageData.data[index + 3];
        const darkness = 255 - (imageData.data[index] + imageData.data[index + 1] + imageData.data[index + 2]) / 3;
        if (alpha < 48 || darkness < 34) {
          continue;
        }

        const originX = startX + x;
        const originY = startY + y;
        points.push({
          originX,
          originY,
          vx: 0,
          vy: 0,
          x: originX + (Math.random() - 0.5) * 18,
          y: originY + (Math.random() - 0.5) * 18
        });
      }
    }

    state.particles = points;
  };

  const handlePointerMove = (event) => {
    state.mouseX = event.clientX;
    state.mouseY = event.clientY;
  };

  const handlePointerLeave = () => {
    state.mouseX = Number.POSITIVE_INFINITY;
    state.mouseY = Number.POSITIVE_INFINITY;
  };

  const handleResize = () => {
    rebuildParticles();
    updateFullpageParallax();
  };

  const handleScroll = () => {
    const workspaceTop = Math.max(1, workspaceSection?.offsetTop || window.innerHeight);
    const progress = Math.min(Math.max(window.scrollY / workspaceTop, 0), 1);
    state.scrollLift = progress * -22;
    flowingPointsCanvas.style.opacity = progress > 0.94 ? "0" : "";
  };

  function drawFlowingPointsBackground() {
    state.context.clearRect(0, 0, state.width, state.height);
    state.context.save();
    state.context.globalCompositeOperation = "lighter";

    for (const particle of state.particles) {
      const targetX = particle.originX;
      const targetY = particle.originY + state.scrollLift;
      const dx = particle.x - state.mouseX;
      const dy = particle.y - state.mouseY;
      const distanceSquared = dx * dx + dy * dy;
      const repelRadius = 118;

      if (distanceSquared < repelRadius * repelRadius) {
        const distance = Math.sqrt(distanceSquared) || 1;
        const force = (1 - distance / repelRadius) * 4.8;
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
      }

      particle.vx += (targetX - particle.x) * 0.026;
      particle.vy += (targetY - particle.y) * 0.026;
      particle.vx *= 0.86;
      particle.vy *= 0.86;
      particle.x += particle.vx;
      particle.y += particle.vy;

      const glow = Math.min(1, Math.abs(particle.vx) + Math.abs(particle.vy));
      state.context.fillStyle = glow > 0.42 ? "rgba(243, 199, 131, 0.72)" : "rgba(141, 241, 255, 0.58)";
      state.context.beginPath();
      state.context.arc(particle.x, particle.y, glow > 0.42 ? 1.8 : 1.35, 0, Math.PI * 2);
      state.context.fill();
    }

    state.context.restore();
    state.animationFrame = requestAnimationFrame(drawFlowingPointsBackground);
  }

  state.image.addEventListener("load", () => {
    rebuildParticles();
    drawFlowingPointsBackground();
  }, { once: true });
  state.image.src = FLOWING_POINTS_IMAGE;

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerleave", handlePointerLeave);
  window.addEventListener("resize", handleResize);
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("scroll", updateFullpageParallax, { passive: true });
  updateFullpageParallax();
}

function scrollToWorkspace() {
  workspaceSection?.scrollIntoView({
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    block: "start"
  });
}

function scrollToIntro() {
  introSection?.scrollIntoView({
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    block: "start"
  });
}

function initFullpageIntroScroll() {
  if (!introSection || !workspaceSection) {
    return;
  }

  let transitionLocked = false;
  let touchStartY = null;
  let parallaxFrame = 0;

  const lockTransition = () => {
    transitionLocked = true;
    window.setTimeout(() => {
      transitionLocked = false;
    }, prefersReducedMotion.matches ? 180 : 760);
  };

  const workspaceTop = () => workspaceSection.offsetTop;
  const isOnIntro = () => window.scrollY < workspaceTop() * 0.55;
  const isAtWorkspaceTop = () => Math.abs(window.scrollY - workspaceTop()) < 18;
  const shouldIgnoreTarget = (target) => target?.closest?.(".hero-grid, input, textarea, select, button, a, [role='dialog']");

  const goWorkspace = (event) => {
    event?.preventDefault?.();
    lockTransition();
    scrollToWorkspace();
  };

  const goIntro = (event) => {
    event?.preventDefault?.();
    lockTransition();
    scrollToIntro();
  };

  function handleFullpageWheel(event) {
    if (transitionLocked || document.body.classList.contains("detail-open")) {
      return;
    }

    if (isOnIntro() && event.deltaY > 18) {
      goWorkspace(event);
      return;
    }

    if (isAtWorkspaceTop() && event.deltaY < -18) {
      goIntro(event);
    }
  }

  const handleIntroPointerMove = (event) => {
    if (prefersReducedMotion.matches || parallaxFrame) {
      return;
    }

    parallaxFrame = requestAnimationFrame(() => {
      const rect = introSection.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
      introSection.style.setProperty("--intro-pointer-x", x.toFixed(2));
      introSection.style.setProperty("--intro-pointer-y", y.toFixed(2));
      parallaxFrame = 0;
    });
  };

  const handleFullpageKeydown = (event) => {
    if (transitionLocked || event.defaultPrevented || shouldIgnoreTarget(event.target)) {
      return;
    }

    const downKeys = ["ArrowDown", "PageDown", " "];
    const upKeys = ["ArrowUp", "PageUp"];
    if (isOnIntro() && downKeys.includes(event.key)) {
      goWorkspace(event);
      return;
    }

    if (isAtWorkspaceTop() && upKeys.includes(event.key)) {
      goIntro(event);
    }
  };

  const handleTouchStart = (event) => {
    if (transitionLocked || shouldIgnoreTarget(event.target)) {
      touchStartY = null;
      return;
    }

    touchStartY = event.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (event) => {
    if (transitionLocked || touchStartY === null) {
      return;
    }

    const endY = event.changedTouches[0]?.clientY;
    if (typeof endY !== "number") {
      touchStartY = null;
      return;
    }

    const deltaY = touchStartY - endY;
    touchStartY = null;

    if (isOnIntro() && deltaY > 34) {
      goWorkspace(event);
      return;
    }

    if (isAtWorkspaceTop() && deltaY < -34) {
      goIntro(event);
    }
  };

  introEnterButton?.addEventListener("click", scrollToWorkspace);
  introSection.addEventListener("pointermove", handleIntroPointerMove);
  window.addEventListener("wheel", handleFullpageWheel, { passive: false });
  window.addEventListener("keydown", handleFullpageKeydown);
  window.addEventListener("touchstart", handleTouchStart, { passive: true });
  window.addEventListener("touchend", handleTouchEnd, { passive: false });
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
  renderPrecisionPanel(structuredReport, source);

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
    precisionPanel.hidden = true;
    closeNutritionDetail();
    activateReportTab("overview");
  }
}

function handleDetailKeydown(event) {
  if (event.key === "Escape" && !detailView.hidden) {
    closeNutritionDetail();
  }
}

function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampApiOrbToViewport() {
  if (!heroGrid || !heroGrid.style.left || !heroGrid.style.top) {
    return;
  }

  const rect = heroGrid.getBoundingClientRect();
  const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
  const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
  heroGrid.style.left = `${clampValue(rect.left, 8, maxLeft)}px`;
  heroGrid.style.top = `${clampValue(rect.top, 8, maxTop)}px`;
  heroGrid.style.right = "auto";
  heroGrid.style.bottom = "auto";
}

function snapApiOrbToMobileEdge() {
  if (!heroGrid || !window.matchMedia("(max-width: 720px)").matches) {
    return;
  }

  const rect = heroGrid.getBoundingClientRect();
  const edgeInset = 10;
  const maxLeft = Math.max(edgeInset, window.innerWidth - rect.width - edgeInset);
  const maxTop = Math.max(edgeInset, window.innerHeight - rect.height - edgeInset);
  const shouldSnapLeft = rect.left + rect.width / 2 < window.innerWidth / 2;
  heroGrid.style.left = `${shouldSnapLeft ? edgeInset : maxLeft}px`;
  heroGrid.style.top = `${clampValue(rect.top, edgeInset, maxTop)}px`;
  heroGrid.style.right = "auto";
  heroGrid.style.bottom = "auto";
}

function initApiOrbDrag() {
  if (!heroGrid || !apiPanelToggle) {
    return;
  }

  let dragState = null;

  const isInteractiveTarget = (target) => target.closest("input, textarea, select");

  const startDrag = ({ clientX, clientY, pointerId = null, touchId = null }) => {
    const rect = heroGrid.getBoundingClientRect();
    dragState = {
      dragging: false,
      left: rect.left,
      pointerId,
      startX: clientX,
      startY: clientY,
      top: rect.top,
      touchId
    };
  };

  const moveDrag = ({ clientX, clientY, event }) => {
    if (!dragState) {
      return;
    }

    const dx = clientX - dragState.startX;
    const dy = clientY - dragState.startY;
    if (!dragState.dragging && Math.hypot(dx, dy) < 5) {
      return;
    }

    dragState.dragging = true;
    heroGrid.classList.add("is-dragging");
    const rect = heroGrid.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
    heroGrid.style.left = `${clampValue(dragState.left + dx, 8, maxLeft)}px`;
    heroGrid.style.top = `${clampValue(dragState.top + dy, 8, maxTop)}px`;
    heroGrid.style.right = "auto";
    heroGrid.style.bottom = "auto";
    event.preventDefault();
  };

  const finishDrag = (event) => {
    if (!dragState) {
      return;
    }

    if (dragState.dragging) {
      apiOrbWasDragged = true;
      window.setTimeout(() => {
        apiOrbWasDragged = false;
      }, 240);
    }

    heroGrid.classList.remove("is-dragging");
    if (Number.isInteger(event?.pointerId)) {
      apiPanelToggle.releasePointerCapture?.(event.pointerId);
    }
    if (dragState.dragging) {
      snapApiOrbToMobileEdge();
    }
    dragState = null;
  };

  apiPanelToggle.addEventListener("pointerdown", (event) => {
    if ((event.pointerType === "mouse" && event.button !== 0) || dragState || isInteractiveTarget(event.target)) {
      return;
    }

    startDrag({
      clientX: event.clientX,
      clientY: event.clientY,
      pointerId: event.pointerId
    });
    if (Number.isInteger(event.pointerId)) {
      apiPanelToggle.setPointerCapture(event.pointerId);
    }
  });

  apiPanelToggle.addEventListener("pointermove", (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    moveDrag({
      clientX: event.clientX,
      clientY: event.clientY,
      event
    });
  });

  apiPanelToggle.addEventListener("pointerup", finishDrag);
  apiPanelToggle.addEventListener("pointercancel", finishDrag);

  apiPanelToggle.addEventListener("touchstart", (event) => {
    if (dragState || isInteractiveTarget(event.target)) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    startDrag({
      clientX: touch.clientX,
      clientY: touch.clientY,
      touchId: touch.identifier
    });
  }, { passive: false });

  apiPanelToggle.addEventListener("touchmove", (event) => {
    if (!dragState) {
      return;
    }

    const touch = [...event.touches].find((item) => item.identifier === dragState.touchId) ?? event.touches[0];
    if (!touch) {
      return;
    }

    moveDrag({
      clientX: touch.clientX,
      clientY: touch.clientY,
      event
    });
  }, { passive: false });

  function handleApiOrbTouchEnd(event) {
    if (dragState && !dragState.dragging) {
      event.preventDefault();
      finishDrag(event);
      apiOrbTouchTapHandled = true;
      toggleApiPanel();
      window.setTimeout(() => {
        apiOrbTouchTapHandled = false;
      }, 260);
      return;
    }

    finishDrag(event);
  }

  apiPanelToggle.addEventListener("touchend", handleApiOrbTouchEnd);
  apiPanelToggle.addEventListener("touchcancel", finishDrag);

  apiPanelToggle.addEventListener("mousedown", (event) => {
    if (event.button !== 0 || dragState || isInteractiveTarget(event.target)) {
      return;
    }

    startDrag({
      clientX: event.clientX,
      clientY: event.clientY
    });

    const handleMouseMove = (moveEvent) => {
      moveDrag({
        clientX: moveEvent.clientX,
        clientY: moveEvent.clientY,
        event: moveEvent
      });
    };

    const handleMouseUp = (upEvent) => {
      window.removeEventListener("mousemove", handleMouseMove);
      finishDrag(upEvent);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp, { once: true });
  });
  window.addEventListener("resize", clampApiOrbToViewport);
}

function toggleApiPanel() {
  if (!apiPanelToggle || !apiPanelBody) {
    return;
  }

  const expanded = apiPanelToggle.getAttribute("aria-expanded") === "true";
  const nextExpanded = !expanded;
  apiPanelToggle.setAttribute("aria-expanded", String(nextExpanded));
  apiPanelToggle.setAttribute("aria-label", nextExpanded ? "收起 DeepSeek 在线能力详情" : "展开 DeepSeek 在线能力详情");
  apiPanelBody.hidden = !nextExpanded;
  apiPanelToggle.querySelector(".api-toggle-hint").textContent = nextExpanded ? "点击收起" : "点击展开";
  apiPanelToggle.closest(".control-panel")?.classList.toggle("is-open", nextExpanded);
  apiPanelToggle.closest(".control-panel")?.classList.toggle("is-collapsed", !nextExpanded);
  requestAnimationFrame(clampApiOrbToViewport);
}

function handleApiPanelToggleClick(event) {
  if (apiOrbTouchTapHandled) {
    event.preventDefault();
    apiOrbTouchTapHandled = false;
    return;
  }

  if (apiOrbWasDragged) {
    event.preventDefault();
    apiOrbWasDragged = false;
    return;
  }

  toggleApiPanel();
}

apiKeyInput.value = localApiConfig.apiKey;
initFlowingPointsBackground();
initFullpageIntroScroll();
initReportTabLiquid();
initApiOrbDrag();
loadApiStatus();
apiPanelToggle?.addEventListener("click", handleApiPanelToggleClick);
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
