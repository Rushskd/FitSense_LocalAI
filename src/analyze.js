const activityScores = {
  low: 32,
  light: 48,
  moderate: 68,
  high: 86
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

function roundToOne(value) {
  return Math.round(value * 10) / 10;
}

function getBmiCategory(bmi) {
  if (bmi < 18.5) return "偏瘦";
  if (bmi < 25) return "正常";
  if (bmi < 30) return "超重";
  return "肥胖";
}

function getHealthStatus(bmiCategory, activityLevel, weeklyWorkouts) {
  if (bmiCategory === "正常" && (activityLevel === "moderate" || activityLevel === "high")) {
    return "你的整体身体状态比较稳定，体重和活动量处于相对健康的平衡状态。";
  }

  if (bmiCategory === "偏瘦") {
    return "你更需要在保证训练安全的前提下增加肌肉量，并适当提高能量摄入。";
  }

  if (bmiCategory === "超重" || bmiCategory === "肥胖") {
    return "你可以通过更规律的运动与更稳定的饮食控制，逐步改善身体成分。";
  }

  if (weeklyWorkouts <= 1 || activityLevel === "low") {
    return "如果能建立更规律的每周训练习惯，整体健康状态还有明显提升空间。";
  }

  return "你当前的身体状态总体还可以，但训练习惯和目标规划仍有提升空间。";
}

function getTrainingFocus(goal) {
  if (goal === "fat_loss") {
    return "建议将全身力量训练与中等强度有氧结合，优先保证每周稳定消耗。";
  }

  if (goal === "muscle_gain") {
    return "建议重点放在渐进式力量训练、复合动作表现和充足恢复上。";
  }

  if (goal === "endurance") {
    return "建议通过稳定有氧和间歇训练配合少量力量训练，提升心肺和运动经济性。";
  }

  return "建议保持力量训练、有氧训练和灵活性练习的均衡搭配。";
}

function getWeeklyGoal(goal, weeklyWorkouts) {
  if (goal === "muscle_gain") {
    return weeklyWorkouts >= 4
      ? "保持每周 4 到 5 次有针对性的力量训练。"
      : "建议逐步增加到每周 4 到 5 次力量训练。";
  }

  if (goal === "fat_loss") {
    return weeklyWorkouts >= 4
      ? "保持每周 4 到 6 次运动，并尽量提高日常步数。"
      : "建议每周达到 4 到 6 次有效运动。";
  }

  if (goal === "endurance") {
    return weeklyWorkouts >= 3
      ? "保持每周 3 到 5 次以耐力为主的训练。"
      : "建议逐步建立每周 3 到 5 次耐力训练。";
  }

  return weeklyWorkouts >= 3
    ? "保持每周 3 到 4 次均衡训练。"
    : "建议每周至少达到 3 次均衡训练。";
}

function getCalorieHint(goal, weight) {
  const baseProtein = roundToOne(weight * 1.6);

  if (goal === "muscle_gain") {
    return `建议保持轻微热量盈余，并将每日蛋白质摄入控制在约 ${baseProtein}g。`;
  }

  if (goal === "fat_loss") {
    return `建议保持适度热量缺口，并将每日蛋白质摄入控制在约 ${baseProtein}g。`;
  }

  return `建议保持总热量摄入稳定，并将每日蛋白质摄入控制在约 ${baseProtein}g。`;
}

function getRiskFlags(bmiCategory, activityLevel, weeklyWorkouts) {
  const flags = [];

  if (bmiCategory === "偏瘦") flags.push("体重偏低");
  if (bmiCategory === "超重" || bmiCategory === "肥胖") flags.push("需要关注体脂管理");
  if (activityLevel === "low") flags.push("活动量偏低");
  if (weeklyWorkouts <= 1) flags.push("训练频率不足");

  return flags.length ? flags : ["基础状态良好"];
}

function recommend(active, fallback = "可替代") {
  return active ? "最推荐" : fallback;
}

function buildTrainingPresets(goal, weeklyWorkouts) {
  if (goal === "muscle_gain") {
    return [
      {
        name: "三练全身基础版",
        recommendation: recommend(weeklyWorkouts <= 3),
        cadence: "周一 / 周三 / 周六",
        summary: "先把复合动作做稳，适合训练频率一般、希望持续推进重量和动作质量的人。",
        focus: "深蹲、卧推、划船、硬拉变式轮换，确保恢复跟得上。"
      },
      {
        name: "四练上下肢进阶版",
        recommendation: recommend(weeklyWorkouts >= 4, "同样适合"),
        cadence: "上肢 / 下肢 / 休 / 上肢 / 下肢",
        summary: "更适合已经能稳定每周 4 练，想提高训练量和部位刺激密度的人。",
        focus: "主项表现和辅助训练并行，增肌效率通常更高。"
      },
      {
        name: "五练推拉腿高频版",
        recommendation: "进阶可选",
        cadence: "推 / 拉 / 腿 / 上肢补强 / 下肢补强",
        summary: "适合睡眠、饮食和恢复都很稳定的人，不建议直接从高频开始。",
        focus: "通过更高频率做细分刺激，但恢复成本更高。"
      }
    ];
  }

  if (goal === "fat_loss") {
    return [
      {
        name: "三练全身保肌版",
        recommendation: recommend(weeklyWorkouts <= 3),
        cadence: "周一 / 周三 / 周六",
        summary: "适合减脂起步期，先守住力量训练和步数，不急着把训练堆得过满。",
        focus: "每次覆盖推、拉、下肢和核心，训练后追加少量轻有氧。"
      },
      {
        name: "四练力量 + 有氧混合版",
        recommendation: recommend(weeklyWorkouts >= 4, "同样适合"),
        cadence: "力量 / 有氧 / 力量 / 有氧",
        summary: "大多数减脂人群最均衡的长期模板，兼顾肌肉保留和消耗提升。",
        focus: "力量日保住训练质量，有氧日控制强度不过度透支。"
      },
      {
        name: "五练分化进阶版",
        recommendation: "进阶可选",
        cadence: "上肢 / 下肢 / 有氧 / 上肢 / 下肢",
        summary: "适合恢复能力更好、愿意更细致管理疲劳的人。",
        focus: "通过更高频的力量分化稳住表现，但睡眠和饮食必须跟上。"
      }
    ];
  }

  if (goal === "endurance") {
    return [
      {
        name: "三练耐力基础版",
        recommendation: recommend(weeklyWorkouts <= 3),
        cadence: "稳定有氧 / 节奏训练 / 长距离",
        summary: "适合当前频率不高的人，先把耐力训练节奏建立起来。",
        focus: "只保留一次较高强度，其余训练重在稳定完成。"
      },
      {
        name: "四练有氧 + 力量版",
        recommendation: recommend(weeklyWorkouts >= 4, "同样适合"),
        cadence: "稳定有氧 / 力量 / 间歇 / 长距离",
        summary: "更适合想提升跑步、骑行或划船表现，同时减少伤病风险的人。",
        focus: "把力量训练当支撑模块，不与高强度有氧硬碰硬。"
      },
      {
        name: "五练分层进阶版",
        recommendation: "进阶可选",
        cadence: "恢复有氧 / 力量 / 节奏 / 稳态 / 长距离",
        summary: "适合训练经验更足、能稳定管理强度区间和恢复节奏的人。",
        focus: "通过更细分的强度日安排提升耐力质量。"
      }
    ];
  }

  return [
    {
      name: "三练均衡基础版",
      recommendation: recommend(weeklyWorkouts <= 3),
      cadence: "力量 / 有氧 / 灵活性",
      summary: "适合作息忙碌但希望建立稳定健康习惯的人。",
      focus: "每周把推、拉、下肢、心肺和活动恢复都覆盖到。"
    },
    {
      name: "四练均衡提升版",
      recommendation: recommend(weeklyWorkouts >= 4, "同样适合"),
      cadence: "上肢 / 下肢 / 有氧 / 全身整合",
      summary: "适合已经有一定训练基础，希望把规律做得更完整的人。",
      focus: "让力量和心肺都稳定进步，而不是偏到某一项。"
    },
    {
      name: "五练表现导向版",
      recommendation: "进阶可选",
      cadence: "力量 3 天 + 有氧 2 天",
      summary: "适合恢复条件更好、对阶段性表现有更高要求的人。",
      focus: "更重视周期安排和疲劳管理。"
    }
  ];
}

function buildTrainingModule(goal, weeklyWorkouts) {
  if (goal === "fat_loss") {
    return {
      headline: "力量保肌 + 稳定消耗",
      overview: "减脂期训练重点不是把自己练废，而是在保留肌肉量的同时，把整体活动消耗稳定拉高。",
      schedule: [
        "每周 3 次全身力量训练，动作以深蹲、推、拉、髋主导为主。",
        weeklyWorkouts >= 4 ? "额外加入 1 到 2 次中等强度有氧，控制在可恢复范围。" : "优先先把每周训练频率稳定到 4 次以上。",
        "非训练日尽量保持 8000 到 10000 步日常活动。"
      ],
      actions: [
        "力量训练时保留 1 到 2 次余力，避免长期过度疲劳。",
        "有氧优先选可长期坚持的方式，如快走、骑车、划船机。",
        "体重下降过快时先检查睡眠、蛋白质和恢复，而不是一味继续减量。"
      ],
      presets: buildTrainingPresets(goal, weeklyWorkouts)
    };
  }

  if (goal === "muscle_gain") {
    return {
      headline: "力量优先的分化训练",
      overview: "把训练质量放在第一位，优先复合动作表现，并为恢复留出足够空间。",
      schedule: [
        weeklyWorkouts >= 4 ? "采用上下肢或推拉腿分化，更容易堆出有效训练量。" : "每周 3 次全身力量训练，逐步增加动作总量。",
        "每个大肌群每周争取 10 到 16 组有效训练量。",
        "用训练日志追踪重量、次数和主观疲劳。"
      ],
      actions: [
        "优先保证动作标准，再推进重量或训练量。",
        "训练后安排 5 到 10 分钟拉伸和轻度放松。",
        "每周至少 1 天完全恢复或仅做轻活动。"
      ],
      presets: buildTrainingPresets(goal, weeklyWorkouts)
    };
  }

  if (goal === "endurance") {
    return {
      headline: "有氧主线 + 少量力量支撑",
      overview: "把心肺耐力作为主线，同时保留基础力量训练来维持经济性和抗伤能力。",
      schedule: [
        "每周 2 到 3 次稳定有氧，1 次间歇或节奏训练。",
        "每周 1 到 2 次基础力量训练，重点练臀腿、核心和上背。",
        "高强度日和恢复日错开安排，避免连续堆叠疲劳。"
      ],
      actions: [
        "长时有氧日不要再叠大量下肢力量训练。",
        "用心率、配速或主观强度记录训练负荷。",
        "恢复周可以把总训练量下调 20% 左右。"
      ],
      presets: buildTrainingPresets(goal, weeklyWorkouts)
    };
  }

  return {
    headline: "均衡训练模板",
    overview: "把力量、有氧和灵活性练习都保留在计划里，重点是让训练习惯长期稳定地运行。",
    schedule: [
      "每周 2 到 3 次力量训练，覆盖推、拉、下肢和核心。",
      "每周 2 次中等强度有氧，支持心肺和恢复。",
      "每周安排 1 次灵活性或轻运动恢复日。"
    ],
    actions: [
      "每月检查一次训练节奏是否过于松散或过载。",
      "把步数、睡眠和训练完成率一起看，不只看体重。",
      "优先守住规律，再追求进阶细节。"
    ],
    presets: buildTrainingPresets(goal, weeklyWorkouts)
  };
}

function buildNutritionMethods(goal, activityLevel, weeklyWorkouts) {
  const methods = [
    {
      name: "碳水渐降",
      fit: "推荐优先",
      note: goal === "fat_loss"
        ? "先从晚餐主食、零食饮料和精制碳水开始逐步减量，通常比突然断碳更容易坚持。"
        : "如果你当前碳水摄入偏高，可以先温和减量，把碳水更多留给训练前后。"
    },
    {
      name: "中低碳高蛋白",
      fit: "食欲管理更重要时",
      note: "适合想控制食欲、减少零食和外卖频率的人，但仍建议保留蔬果与训练窗口碳水。"
    },
    {
      name: "生酮饮食（谨慎）",
      fit: weeklyWorkouts >= 4 || activityLevel === "high" ? "不作为当前首选" : "仅作可选方案",
      note: weeklyWorkouts >= 4 || activityLevel === "high"
        ? "当你有较多高强度训练时，严格生酮可能影响训练质量与恢复，不建议作为第一选择。"
        : "如果你更看重食欲控制且能严格执行，生酮可作为短期方案，但要关注可持续性和营养均衡。"
    }
  ];

  if (goal === "muscle_gain") {
    methods[0].note = "训练日前后保留足够碳水，其他时段再做温和缩减，避免影响训练表现和恢复。";
    methods[1].fit = "不宜过低";
    methods[1].note = "增肌期不建议把碳水压得太低，否则训练量和恢复都可能下降。";
  }

  if (goal === "endurance") {
    methods[0].fit = "仅作体重管理微调";
    methods[0].note = "耐力目标下不建议大幅削减碳水，更适合先减少精制碳水和无计划加餐。";
    methods[1].fit = "谨慎使用";
    methods[1].note = "中低碳可以短期控重，但高训练量周仍要补回必要碳水。";
  }

  return methods;
}

function buildNutritionModule(profile) {
  const proteinTarget = roundToOne(profile.weight * 1.6);
  const methods = buildNutritionMethods(profile.goal, profile.activityLevel, profile.weeklyWorkouts);

  if (profile.goal === "fat_loss") {
    return {
      strategy: "碳水渐降",
      overview: "先用更容易执行的饮食结构做出热量缺口，再决定是否需要更激进的低碳方案，通常比一上来严格断碳更稳。",
      actions: [
        `每日蛋白质先守住约 ${proteinTarget}g，优先来自瘦肉、蛋、奶和豆制品。`,
        "先减少含糖饮料、夜宵、甜点和大份精制主食，再逐步缩小晚餐主食份量。",
        "训练前后保留一小段碳水窗口，避免减脂期间训练质量明显下滑。"
      ],
      methods,
      caution: "如有糖尿病、肾病、妊娠、长期服药或进食障碍史，调整低碳或生酮方案前应先咨询医生或营养师。"
    };
  }

  if (profile.goal === "muscle_gain") {
    return {
      strategy: "训练窗口保留碳水",
      overview: "增肌期更重要的是保证总热量、蛋白质和训练质量，不建议把碳水切得过低。",
      actions: [
        `每日蛋白质先守住约 ${proteinTarget}g，并把主食更多安排在训练前后。`,
        "训练日碳水可以更高，休息日再做轻微回落，而不是全周都吃得很低。",
        "如果体重 2 到 3 周完全不动，再微调总热量，而不是先大砍主食。"
      ],
      methods,
      caution: "若训练表现连续下降、恢复变差或晚上饥饿感明显增加，通常说明碳水压得过低。"
    };
  }

  if (profile.goal === "endurance") {
    return {
      strategy: "优先保障训练碳水",
      overview: "耐力目标更依赖碳水供能，体重管理更适合从精制碳水和零食开始减，而不是全面压低主食。",
      actions: [
        `每日蛋白质保持约 ${proteinTarget}g，帮助恢复与肌肉维持。`,
        "长时有氧和间歇训练日前后优先保证米面薯类等主食摄入。",
        "如果想控重，先减少奶茶、甜点、油炸零食和无计划加餐。"
      ],
      methods,
      caution: "高训练量阶段不建议贸然采用严格生酮，否则可能影响速度、输出和恢复。"
    };
  }

  return {
    strategy: "均衡高蛋白 + 温和控碳",
    overview: "先保证总热量稳定、蛋白质足够，再用碳水渐降或中低碳做轻度结构优化，通常更适合长期坚持。",
    actions: [
      `每日蛋白质保持约 ${proteinTarget}g，主食与蔬菜分配尽量规律。`,
      "先把晚间零食、含糖饮料和大份外卖控制住，再考虑进一步缩减主食。",
      "如果体重和围度都没有变化，再小幅调整主食份量。"
    ],
    methods,
    caution: "任何饮食法都应优先考虑可持续性、营养均衡和你的生活节奏。"
  };
}

export function analyzeHealthProfile(profile) {
  const heightInMeters = profile.height / 100;
  const bmi = roundToOne(profile.weight / (heightInMeters * heightInMeters));
  const bmiCategory = getBmiCategory(bmi);
  const activityScore = activityScores[profile.activityLevel] ?? 48;
  const activityLabel = activityLabels[profile.activityLevel] ?? activityLabels.light;
  const goalLabel = goalLabels[profile.goal] ?? goalLabels.general_fitness;

  return {
    bmi,
    bmiCategory,
    activityScore,
    activityLabel,
    goalLabel,
    healthStatus: getHealthStatus(bmiCategory, profile.activityLevel, profile.weeklyWorkouts),
    trainingFocus: getTrainingFocus(profile.goal),
    weeklyGoal: getWeeklyGoal(profile.goal, profile.weeklyWorkouts),
    calorieHint: getCalorieHint(profile.goal, profile.weight),
    riskFlags: getRiskFlags(bmiCategory, profile.activityLevel, profile.weeklyWorkouts)
  };
}

export function buildStructuredPlan(profile, analysis) {
  const training = buildTrainingModule(profile.goal, profile.weeklyWorkouts);
  const nutrition = buildNutritionModule(profile);

  return {
    summary: `${analysis.goalLabel}方向下，你当前的 BMI 为 ${analysis.bmi}，活动状态为${analysis.activityLabel}。${analysis.healthStatus}`,
    training,
    nutrition,
    closing: "先把训练频率、蛋白质、睡眠和总热量稳定住，再去追求更复杂的饮食技巧。"
  };
}

export function createFallbackReport({ profile, analysis }) {
  const plan = buildStructuredPlan(profile, analysis);

  return [
    plan.summary,
    `训练模块：${plan.training.headline}。${plan.training.overview}`,
    `饮食模块：${plan.nutrition.strategy}。${plan.nutrition.overview}`,
    plan.closing
  ].join("\n");
}
