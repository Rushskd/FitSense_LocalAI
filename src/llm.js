const DEFAULT_DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

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

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatProfileValue(labels, value) {
  return labels[value] || value;
}

function sanitizeList(list, fallbackList) {
  if (!Array.isArray(list) || !list.length) {
    return fallbackList;
  }

  return list
    .map((item) => cleanString(typeof item === "string" ? item : ""))
    .filter(Boolean)
    .slice(0, Math.max(fallbackList.length, 3));
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
  const prompt = [
    "请根据以下用户信息，返回一份适合网页展示的中文健康建议。",
    "必须只返回一个合法 JSON 对象，不要输出 Markdown，不要写额外解释。",
    "JSON 结构必须严格包含以下字段：",
    "{",
    '  "summary": "1到2句总体判断",',
    '  "training": {',
    '    "headline": "训练模块标题",',
    '    "overview": "训练总述",',
    '    "schedule": ["3条以内的周安排"],',
    '    "actions": ["3条以内的执行提醒"],',
    '    "presets": [',
    '      {',
    '        "name": "计划名称",',
    '        "recommendation": "最推荐/同样适合/进阶可选",',
    '        "cadence": "训练频率或周节奏",',
    '        "summary": "适合谁的简短说明",',
    '        "focus": "执行重点"',
    "      }",
    "    ]",
    "  },",
    '  "nutrition": {',
    '    "strategy": "饮食主策略名称",',
    '    "overview": "饮食总述",',
    '    "actions": ["3条以内的执行建议"],',
    '    "methods": [',
    '      { "name": "方法名", "fit": "适用场景", "note": "简短说明" }',
    "    ],",
    '    "caution": "一句风险提示或适用边界"',
    "  },",
    '  "closing": "一句收束建议"',
    "}",
    "要求：",
    "1. 语气清晰、克制、实用，不要夸张，不要做医疗诊断。",
    "2. 训练模块和饮食模块必须分开写，便于前端做 tab 和卡片展示。",
    "3. 训练部分除了当前推荐，还要给出多套预设计划和推荐程度。",
    "4. 减脂方向下可以涉及碳水渐降、中低碳、生酮等方案，但必须体现适用边界与谨慎提示。",
    "5. 生酮不是默认推荐，尤其高强度训练较多时要明确写出不宜作为首选。",
    "6. 输出内容要短而密，不要长篇大论。",
    `年龄: ${profile.age}`,
    `性别: ${formatProfileValue(genderLabels, profile.gender)}`,
    `身高: ${profile.height} cm`,
    `体重: ${profile.weight} kg`,
    `活动水平: ${formatProfileValue(activityLabels, profile.activityLevel)}`,
    `每周训练次数: ${profile.weeklyWorkouts}`,
    `目标: ${formatProfileValue(goalLabels, profile.goal)}`,
    `BMI: ${analysis.bmi} (${analysis.bmiCategory})`,
    `健康状态: ${analysis.healthStatus}`,
    `训练重点: ${analysis.trainingFocus}`,
    `每周目标: ${analysis.weeklyGoal}`,
    `饮食建议: ${analysis.calorieHint}`,
    `风险提示: ${analysis.riskFlags.join("、")}`,
    "你可以参考下面这份本地结构化草稿，但请根据用户信息进一步润色和优化：",
    JSON.stringify(fallbackPlan)
  ].join("\n");

  return {
    model,
    messages: [
      {
        role: "system",
        content: "你负责为教学演示生成结构清晰、适合网页呈现的中文健康建议 JSON。"
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7
  };
}

export function parseStructuredReport(rawText, fallbackPlan) {
  const parsed = tryParseJson(rawText);

  if (!parsed || typeof parsed !== "object") {
    return fallbackPlan;
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
    signal: AbortSignal.timeout(20000)
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
    structuredReport: parseStructuredReport(report, fallbackPlan)
  };
}
