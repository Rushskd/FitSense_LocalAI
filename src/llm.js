const DEFAULT_DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
const DEEPSEEK_TIMEOUT_MS = 45000;

const genderLabels = {
  male: "男",
  female: "女",
  other: "其他"
};

const activityLabels = {
  low: "活动较少",
  light: "轻度活动",
  moderate: "中等活动",
  high: "高活动量"
};

const goalLabels = {
  fat_loss: "减脂",
  muscle_gain: "增肌",
  endurance: "耐力提升",
  general_fitness: "综合健康"
};

const activityFactorMap = {
  low: 1.25,
  light: 1.4,
  moderate: 1.55,
  high: 1.75
};

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatProfileValue(labels, value) {
  return labels[value] || value;
}

function deriveCoachTargets(profile) {
  const weight = Number(profile.weight) || 0;
  const height = Number(profile.height) || 0;
  const age = Number(profile.age) || 0;
  const workoutCount = Number(profile.weeklyWorkouts) || 0;
  const isMale = profile.gender === "male";
  const activityFactor = activityFactorMap[profile.activityLevel] || 1.4;
  const bmr =
    height && weight && age
      ? Math.round((10 * weight) + (6.25 * height) - (5 * age) + (isMale ? 5 : -161))
      : 0;
  const tdee = bmr ? Math.round(bmr * activityFactor) : 0;
  const proteinLow = Math.round(weight * 1.6);
  const proteinHigh = Math.round(weight * 2.2);
  const fatFloor = Math.round(weight * 0.8);
  const trainingDayCarbs = Math.round(weight * (profile.goal === "endurance" ? 4 : profile.goal === "muscle_gain" ? 3.5 : 2.4));
  const restDayCarbs = Math.round(weight * (profile.goal === "endurance" ? 3 : profile.goal === "muscle_gain" ? 2.8 : 1.5));
  const calorieStrategy =
    profile.goal === "fat_loss"
      ? `${Math.max(tdee - 450, 1200)}-${Math.max(tdee - 250, 1300)} kcal`
      : profile.goal === "muscle_gain"
        ? `${tdee + 180}-${tdee + 320} kcal`
        : `${Math.max(tdee - 150, 1200)}-${tdee + 80} kcal`;
  const trainingLevel =
    workoutCount >= 5 ? "高频进阶" : workoutCount >= 3 ? "稳定训练中" : "训练基础待建立";
  const goalVelocity =
    profile.goal === "fat_loss"
      ? "建议每周体重变化 0.3-0.7kg"
      : profile.goal === "muscle_gain"
        ? "建议每月体重变化 0.8-1.5kg"
        : "优先看表现与恢复，不追求快速体重变化";

  return {
    age,
    bmr,
    calorieStrategy,
    fatFloor,
    height,
    proteinHigh,
    proteinLow,
    restDayCarbs,
    tdee,
    trainingDayCarbs,
    trainingLevel,
    goalVelocity,
    weight,
    workoutCount
  };
}

function buildPrecisionFallback(profile, analysis) {
  if (!profile || !analysis) {
    return {
      rationale: "",
      calorieTarget: "",
      proteinTarget: "",
      carbPlan: "",
      trainingVolume: "",
      recoveryFocus: "",
      progressChecks: []
    };
  }

  const targets = deriveCoachTargets(profile);
  const progressChecks = [];

  if (targets.goalVelocity) {
    progressChecks.push(targets.goalVelocity);
  }

  if (profile.goal === "muscle_gain") {
    progressChecks.push("两周内至少有 2 个核心动作的重量、次数或总训练量保持上升。");
    progressChecks.push("如果体重长期不动但训练也没有提升，优先小幅补热量而不是继续硬练。");
  } else if (profile.goal === "fat_loss") {
    progressChecks.push("两周内围度、体重或照片至少有一项缓慢变化，而不是只盯单日体重。");
    progressChecks.push("若训练表现连续下降，先回看睡眠、蛋白和碳水，而不是继续加大热量缺口。");
  } else if (profile.goal === "endurance") {
    progressChecks.push("优先看配速、心率或主观强度是否更稳定，而不是只看体重。");
    progressChecks.push("如果高强度日后恢复越来越差，说明训练量和碳水补给需要同步调整。");
  } else {
    progressChecks.push("先看训练完成率和睡眠是否稳定，再决定是否进阶。");
    progressChecks.push("如果一周里疲劳感明显上升，就先稳节奏，不要同时加训练量和控饮食。");
  }

  return {
    rationale:
      profile.goal === "muscle_gain"
        ? "当前最该优先的是把训练频率、渐进负荷和温和热量盈余稳定住，而不是过早切到更激进的饮食法。"
        : profile.goal === "fat_loss"
          ? "当前更该优先用稳定热量缺口和保肌训练换取可持续下降，而不是一开始就把饮食切得很极端。"
          : profile.goal === "endurance"
            ? "当前更该优先保障训练表现和恢复，再在不影响输出的前提下微调体重管理。"
            : "当前最重要的是先把训练规律和进食结构做稳定，再决定是否进入更明确的专项阶段。",
    calorieTarget: targets.tdee ? `${targets.calorieStrategy}（估算 TDEE ${targets.tdee} kcal）` : "请根据实际饮食记录微调总热量。",
    proteinTarget: `${targets.proteinLow}-${targets.proteinHigh} g/天，优先均分到 3-5 餐。`,
    carbPlan: `训练日约 ${targets.trainingDayCarbs} g，休息日约 ${targets.restDayCarbs} g，优先放在训练前后。`,
    trainingVolume:
      profile.goal === "muscle_gain"
        ? "建议每个大肌群每周 10-16 组有效训练量，先稳住 3-4 练再继续加量。"
        : profile.goal === "fat_loss"
          ? "建议每个大肌群每周 8-14 组有效训练量，减脂期优先保训练质量而不是盲目堆量。"
          : profile.goal === "endurance"
            ? "建议每周 2-3 次主线有氧 + 1-2 次力量支撑，避免高强度日连着堆。"
            : `当前阶段判断为${targets.trainingLevel}，先把每周 ${Math.max(targets.workoutCount, 3)} 次训练执行稳定。`,
    recoveryFocus:
      analysis.riskFlags.includes("训练频率不足")
        ? "先把每周节奏做稳定，再谈进阶；恢复重点是睡眠时长、步数和训练间隔。"
        : "恢复重点放在睡眠、训练日碳水补给和连续两周的疲劳管理，不要只看单次状态。",
    progressChecks
  };
}

function sanitizeList(list, fallbackList) {
  if (!Array.isArray(list) || !list.length) {
    return fallbackList;
  }

  return list
    .map((item) => cleanString(typeof item === "string" ? item : ""))
    .filter(Boolean)
    .slice(0, Math.max(fallbackList.length, 5));
}

function sanitizeMethods(methods, fallbackMethods) {
  if (!Array.isArray(methods) || !methods.length) {
    return fallbackMethods;
  }

  const normalized = methods
    .map((item) => ({
      name: cleanString(item?.name),
      fit: cleanString(item?.fit),
      note: cleanString(item?.note)
    }))
    .filter((item) => item.name && item.note);

  return normalized.length ? normalized : fallbackMethods;
}

function sanitizePresets(presets, fallbackPresets) {
  if (!Array.isArray(presets) || !presets.length) {
    return fallbackPresets;
  }

  const normalized = presets
    .map((item) => ({
      name: cleanString(item?.name),
      recommendation: cleanString(item?.recommendation),
      cadence: cleanString(item?.cadence),
      summary: cleanString(item?.summary),
      focus: cleanString(item?.focus)
    }))
    .filter((item) => item.name && item.summary);

  return normalized.length ? normalized : fallbackPresets;
}

function tryParseJson(rawText) {
  const directText = cleanString(rawText);

  if (!directText) {
    return null;
  }

  try {
    return JSON.parse(directText);
  } catch {
    const fenced = directText.match(/```(?:json)?\s*([\s\S]*?)```/i);

    if (fenced) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        return null;
      }
    }

    const start = directText.indexOf("{");
    const end = directText.lastIndexOf("}");

    if (start !== -1 && end > start) {
      try {
        return JSON.parse(directText.slice(start, end + 1));
      } catch {
        return null;
      }
    }

    return null;
  }
}

export function resolveDeepSeekConfig(env = process.env, overrides = {}) {
  const overrideApiUrl = cleanString(overrides.apiUrl);
  const overrideApiKey = cleanString(overrides.apiKey);
  const overrideModel = cleanString(overrides.model);

  const envApiUrl = cleanString(env.DEEPSEEK_API_URL);
  const envApiKey = cleanString(env.DEEPSEEK_API_KEY);
  const envModel = cleanString(env.DEEPSEEK_MODEL);

  const apiUrl = overrideApiUrl || envApiUrl || DEFAULT_DEEPSEEK_API_URL;
  const apiKey = overrideApiKey || envApiKey;
  const model = overrideModel || envModel || DEFAULT_DEEPSEEK_MODEL;

  return {
    apiUrl,
    apiKey,
    model,
    configured: Boolean(apiKey)
  };
}

export function buildDeepSeekRequestBody({ profile, analysis, model, fallbackPlan }) {
  const targets = deriveCoachTargets(profile);
  const referencePlan = {
    trainingHeadline: fallbackPlan.training.headline,
    nutritionStrategy: fallbackPlan.nutrition.strategy,
    riskFlags: analysis.riskFlags,
    priority: "只把这份本地信息当作方向参考，不要复用原句，不要逐字段照抄。"
  };
  const prompt = [
    "请根据以下用户信息，返回一份比本地参考结果明显更细、更像真人教练方案的中文健康报告。",
    "必须只返回一个合法 JSON 对象，不要输出 Markdown，不要写额外解释。",
    "你需要同时做到：",
    "1. 比本地参考稿更具体，不能只是同义改写。",
    "2. 结合训练目标、训练频率、BMI、活动量和恢复压力，给出更像 4-8 周执行方案的建议。",
    "3. 至少在训练和饮食模块里给出多个带数字锚点的建议，例如频率、组数区间、蛋白范围、热量区间、训练日/休息日碳水思路。",
    "4. 如果某种饮食方法不适合作为当前第一选择，要明确写出为什么不适合。",
    "JSON 结构必须严格包含以下字段：",
    "{",
    '  "summary": "2到3句总体判断，需要包含当前状态、主要限制和未来4到8周的优先级",',
    '  "training": {',
    '    "headline": "训练模块标题，最好能体现当前主线",',
    '    "overview": "训练总述，需要写出为什么这样安排、频率是否够用、先抓什么后抓什么",',
    '    "schedule": ["至少给出 4 条、最多 5 条周安排或训练处方，尽量带频率/容量/强度锚点"],',
    '    "actions": ["至少给出 4 条、最多 5 条执行提醒，优先写最影响结果的动作"],',
    '    "presets": [',
    '      {',
    '        "name": "计划名称",',
        '        "recommendation": "最推荐/同样适合/进阶可选",',
        '        "cadence": "训练频率或周节奏，需要足够具体",',
        '        "summary": "适合谁的简短说明，要写清和其他预设的区别",',
        '        "focus": "执行重点，最好包含组数、保留次数或恢复重点等锚点"',
    "      }",
    "    ]",
    "  },",
    '  "nutrition": {',
    '    "strategy": "饮食主策略名称，需要体现为什么它是当前第一选择",',
    '    "overview": "饮食总述，需要包含热量思路、蛋白优先级、碳水安排逻辑",',
    '    "actions": ["至少给出 4 条、最多 5 条执行建议，优先写用户每天真的能照做的动作"],',
    '    "methods": [',
    '      { "name": "方法名", "fit": "适用场景", "note": "简短说明，但要写出适合人群、代价或使用边界" }',
    "    ],",
    '    "caution": "一句风险提示或适用边界"',
    "  },",
    '  "precision": {',
    '    "rationale": "1到2句解释为什么当前主推这套方案，而不是别的方案",',
    '    "calorieTarget": "热量策略区间，最好带估算依据",',
    '    "proteinTarget": "蛋白目标区间或最低线",',
    '    "carbPlan": "训练日/休息日碳水思路",',
    '    "trainingVolume": "训练量、频率或强度安排锚点",',
    '    "recoveryFocus": "恢复重点",',
    '    "progressChecks": ["2到3条未来两周要观察的指标"]',
    "  },",
    '  "closing": "1到2句收束建议，告诉用户先抓哪两件事最划算"',
    "}",
    "写作要求：",
    "1. 语气专业、克制、像真正懂训练和营养的中文教练，不要鸡汤，不要空话。",
    "2. 训练模块和饮食模块必须明显分开，前端要拿去做 tab 和卡片展示。",
    "3. 训练部分除了当前推荐，还要给出多套预设计划和推荐程度，并说明为什么主推这一套。",
    "4. 减脂方向下可以涉及碳水渐降、中低碳、生酮等方案，但必须体现适用边界、训练兼容性和可持续性。",
    "5. 生酮不是默认推荐，尤其高强度训练较多时要明确写出不宜作为首选的原因。",
    "6. 不要输出泛泛的“清淡饮食、规律作息、坚持运动”式废话，必须尽可能把建议落到量化区间或执行顺序。",
    "7. 可以参考下面的计算锚点，但不要机械复述，重点是基于这些锚点做更具体的取舍判断。",
    `年龄: ${targets.age}`,
    `性别: ${formatProfileValue(genderLabels, profile.gender)}`,
    `身高: ${targets.height} cm`,
    `体重: ${targets.weight} kg`,
    `活动水平: ${formatProfileValue(activityLabels, profile.activityLevel)}`,
    `每周训练次数: ${targets.workoutCount}`,
    `目标: ${formatProfileValue(goalLabels, profile.goal)}`,
    `BMI: ${analysis.bmi} (${analysis.bmiCategory})`,
    `健康状态: ${analysis.healthStatus}`,
    `训练重点: ${analysis.trainingFocus}`,
    `每周目标: ${analysis.weeklyGoal}`,
    `饮食建议: ${analysis.calorieHint}`,
    `风险提示: ${analysis.riskFlags.join("、")}`,
    "教练计算锚点：",
    `- Mifflin-St Jeor 估算 BMR: ${targets.bmr || "未知"} kcal`,
    `- 估算 TDEE: ${targets.tdee || "未知"} kcal`,
    `- 当前更合适的热量策略区间: ${targets.tdee ? targets.calorieStrategy : "请根据用户信息自行合理估算"}`,
    `- 蛋白目标建议区间: ${targets.proteinLow || "未知"}-${targets.proteinHigh || "未知"} g/天`,
    `- 脂肪下限建议: ${targets.fatFloor || "未知"} g/天`,
    `- 训练日碳水参考: ${targets.trainingDayCarbs || "未知"} g/天`,
    `- 休息日碳水参考: ${targets.restDayCarbs || "未知"} g/天`,
    `- 当前训练阶段判断: ${targets.trainingLevel}`,
    `- 目标推进速度提示: ${targets.goalVelocity}`,
    "下面是本地版本当前的方向参考，只可参考方向，不能直接复用措辞：",
    JSON.stringify(referencePlan)
  ].join("\n");

  return {
    model,
    messages: [
      {
        role: "system",
        content: "你是一名资深中文健身教练兼运动营养顾问，擅长把用户的基础身体数据转换成适合网页展示的高质量结构化健康方案 JSON。请优先输出具体、可执行、带锚点的建议，而不是泛泛而谈。"
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: {
      type: "json_object"
    },
    max_tokens: 1800,
    temperature: 0.45
  };
}

export function parseStructuredReport(rawText, fallbackPlan, context = {}) {
  const parsed = tryParseJson(rawText);
  const fallbackPrecision = buildPrecisionFallback(context.profile, context.analysis);

  if (!parsed || typeof parsed !== "object") {
    return {
      ...fallbackPlan,
      precision: fallbackPrecision
    };
  }

  return {
    summary: cleanString(parsed.summary) || fallbackPlan.summary,
    training: {
      headline: cleanString(parsed.training?.headline) || fallbackPlan.training.headline,
      overview: cleanString(parsed.training?.overview) || fallbackPlan.training.overview,
      schedule: sanitizeList(parsed.training?.schedule, fallbackPlan.training.schedule),
      actions: sanitizeList(parsed.training?.actions, fallbackPlan.training.actions),
      presets: sanitizePresets(parsed.training?.presets, fallbackPlan.training.presets)
    },
    nutrition: {
      strategy: cleanString(parsed.nutrition?.strategy) || fallbackPlan.nutrition.strategy,
      overview: cleanString(parsed.nutrition?.overview) || fallbackPlan.nutrition.overview,
      actions: sanitizeList(parsed.nutrition?.actions, fallbackPlan.nutrition.actions),
      methods: sanitizeMethods(parsed.nutrition?.methods, fallbackPlan.nutrition.methods),
      caution: cleanString(parsed.nutrition?.caution) || fallbackPlan.nutrition.caution
    },
    precision: {
      rationale: cleanString(parsed.precision?.rationale) || fallbackPrecision.rationale,
      calorieTarget: cleanString(parsed.precision?.calorieTarget) || fallbackPrecision.calorieTarget,
      proteinTarget: cleanString(parsed.precision?.proteinTarget) || fallbackPrecision.proteinTarget,
      carbPlan: cleanString(parsed.precision?.carbPlan) || fallbackPrecision.carbPlan,
      trainingVolume: cleanString(parsed.precision?.trainingVolume) || fallbackPrecision.trainingVolume,
      recoveryFocus: cleanString(parsed.precision?.recoveryFocus) || fallbackPrecision.recoveryFocus,
      progressChecks: sanitizeList(parsed.precision?.progressChecks, fallbackPrecision.progressChecks)
    },
    closing: cleanString(parsed.closing) || fallbackPlan.closing
  };
}

export async function generateAiReport({
  profile,
  analysis,
  fallbackReport,
  fallbackPlan,
  configOverrides
}) {
  const config = resolveDeepSeekConfig(process.env, configOverrides);

  if (!config.configured) {
    return {
      report: fallbackReport,
      source: "fallback",
      structuredReport: fallbackPlan
    };
  }

  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(
      buildDeepSeekRequestBody({
        profile,
        analysis,
        model: config.model,
        fallbackPlan
      })
    ),
    signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT_MS)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const report = data?.choices?.[0]?.message?.content?.trim();

  if (!report) {
    throw new Error("DeepSeek response did not include a report.");
  }

  return {
    report,
    source: "deepseek",
    structuredReport: parseStructuredReport(report, fallbackPlan, { profile, analysis })
  };
}
