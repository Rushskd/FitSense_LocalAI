export const API_STORAGE_KEY = "fitsense.deepseek.config";
export const DEFAULT_CLIENT_MODEL = "deepseek-v4-flash";

const WEEK_DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function roundToOne(value) {
  return Math.round(value * 10) / 10;
}

function formatGrams(value) {
  return `${String(roundToOne(value)).replace(/\.0$/, "")}g`;
}

function countTags(week) {
  const counts = new Map();

  for (const day of week) {
    counts.set(day.tag, (counts.get(day.tag) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => `${count} ${tag}`)
    .join(" / ");
}

function buildMixedCarbWeek(weeklyWorkouts) {
  if (weeklyWorkouts >= 5) {
    return [
      { day: "周一", tag: "高碳日", title: "腿或背部重训", body: "把最多的主食留在训练前后，晚餐保留恢复所需碳水。" },
      { day: "周二", tag: "中碳日", title: "上肢训练", body: "维持训练表现，避免无计划加餐和饮料热量。" },
      { day: "周三", tag: "低碳日", title: "恢复或轻有氧", body: "主食回落，用蔬菜、瘦肉和鸡蛋撑住饱腹感。" },
      { day: "周四", tag: "高碳日", title: "第二个高强度训练日", body: "优先给最重的一次训练配足碳水，而不是全周平均分。" },
      { day: "周五", tag: "中碳日", title: "中等强度训练", body: "继续保留训练窗口碳水，其余餐次用更干净的主食来源。" },
      { day: "周六", tag: "中碳日", title: "补量训练或长步行", body: "碳水不必切太狠，重点是把食欲和疲劳维持在可控区间。" },
      { day: "周日", tag: "低碳日", title: "完全休息", body: "不需要硬塞高碳，用蔬菜、蛋白和少量脂肪完成恢复。" }
    ];
  }

  if (weeklyWorkouts >= 3) {
    return [
      { day: "周一", tag: "中碳日", title: "常规训练日", body: "主食集中在早餐和训练前后，其余餐次控制份量。" },
      { day: "周二", tag: "低碳日", title: "恢复日", body: "减少零食和夜宵，主食降到最低档即可。" },
      { day: "周三", tag: "高碳日", title: "高强度训练日", body: "把最重的一次力量训练放在今天，主食优先给训练窗口。" },
      { day: "周四", tag: "低碳日", title: "轻活动日", body: "优先保蛋白和蔬菜，主食不需要完全断掉。" },
      { day: "周五", tag: "中碳日", title: "常规训练日", body: "维持训练质量，不要把中碳日吃成放纵日。" },
      { day: "周六", tag: "高碳日", title: "第二个重点训练日", body: "如果周内还有腿背或长时间运动，今天适合再次拉高碳水。" },
      { day: "周日", tag: "低碳日", title: "完全休息", body: "主食回落，脂肪稍高一些也没问题，但别失控。" }
    ];
  }

  return [
    { day: "周一", tag: "中碳日", title: "训练准备日", body: "主食正常吃，不提前过度削减碳水。" },
    { day: "周二", tag: "低碳日", title: "恢复日", body: "控制主食和零食，晚餐以蛋白和蔬菜为主。" },
    { day: "周三", tag: "高碳日", title: "核心训练日", body: "把最完整的一次训练放在今天，主食主要给训练前后。" },
    { day: "周四", tag: "低碳日", title: "恢复日", body: "继续减掉无计划加餐，别把饥饿感拖到晚上爆发。" },
    { day: "周五", tag: "中碳日", title: "轻活动日", body: "主食适中即可，用步行和规律作息帮助恢复。" },
    { day: "周六", tag: "低碳日", title: "休息日", body: "高蛋白、低零食、少饮料，比硬断碳更重要。" },
    { day: "周日", tag: "低碳日", title: "休息日", body: "检查体重、围度和精神状态，再决定下周是否继续往下调。" }
  ];
}

function buildTrainRestWeek(weeklyWorkouts) {
  const trainingDays = Math.max(2, Math.min(weeklyWorkouts || 0, 5));
  const heavyIndices = trainingDays >= 4 ? new Set([1, 4]) : new Set([2]);

  return WEEK_DAYS.map((day, index) => {
    if (index < trainingDays) {
      const heavy = heavyIndices.has(index);

      return {
        day,
        tag: heavy ? "训练日" : "轻训练日",
        title: heavy ? "主项或大肌群训练" : "上肢、辅助或常规训练",
        body: heavy
          ? "碳水维持在训练日上限，主食集中在训练前后两餐。"
          : "继续保留主食，但不必像最重训练日那样拉满。"
      };
    }

    return {
      day,
      tag: "恢复日",
      title: "休息、散步或低强度有氧",
      body: "把主食降到恢复档，饱腹感更多交给蔬菜、瘦肉和少量优质脂肪。"
    };
  });
}

function buildKetoWeek() {
  return [
    { day: "周一", tag: "适应期", title: "去掉精制主食与含糖饮料", body: "前 48 小时最容易疲劳，训练量先别拉太高。" },
    { day: "周二", tag: "适应期", title: "补水与电解质", body: "盐、钾和镁跟上，比盲目加油脂更重要。" },
    { day: "周三", tag: "稳定期", title: "轻到中等强度训练", body: "把力量训练压在主项上，避免高容量爆量。" },
    { day: "周四", tag: "稳定期", title: "继续低碳执行", body: "碳水尽量来自蔬菜、坚果或少量奶制品，而不是作弊餐。" },
    { day: "周五", tag: "观察日", title: "看精神状态与训练表现", body: "如果明显发软或恢复变差，说明这套方法不适合当前阶段。" },
    { day: "周六", tag: "恢复日", title: "轻有氧或步行", body: "维持日常活动，不用再叠加长时间空腹高强度有氧。" },
    { day: "周日", tag: "复盘日", title: "检查体重、食欲和训练表现", body: "只要三项里有两项明显下滑，就应优先考虑退出严格生酮。" }
  ];
}

function detectNutritionDetailKey(methodName = "") {
  if (methodName.includes("生酮")) return "keto";
  if (methodName.includes("碳水循环")) return "carb_cycle";
  if (methodName.includes("碳水渐降")) return "carb_step_down";
  if (methodName.includes("中低碳")) return "moderate_low_carb";
  if (methodName.includes("增肌") || methodName.includes("训练窗口")) return "lean_bulk";
  return "balanced";
}

export function deriveConditionScore({ activityScore, bmiCategory }) {
  return clamp(activityScore + (bmiCategory === "正常" ? 18 : 0));
}

export function deriveTrainingScore({ activityScore, riskFlags }) {
  return clamp((activityScore * 0.75) + (riskFlags.includes("训练频率不足") ? 8 : 22));
}

export function getSourceMeta(source) {
  if (source === "deepseek") {
    return {
      pill: "DeepSeek 在线",
      status: "",
      live: true
    };
  }

  return {
    pill: "本地参考",
    status: "",
    live: false
  };
}

export function normalizeApiConfig(input = {}) {
  const apiKey = typeof input.apiKey === "string" ? input.apiKey.trim() : "";
  const model = typeof input.model === "string" && input.model.trim()
    ? input.model.trim()
    : DEFAULT_CLIENT_MODEL;

  return {
    apiKey,
    model,
    configured: Boolean(apiKey)
  };
}

export function getApiConnectionMeta({ serverConfigured, localConfigured, model }) {
  if (localConfigured) {
    return {
      badge: "浏览器 Key 已就绪",
      detail: "已保存当前浏览器内填写的 DeepSeek API Key，提交后会优先用它生成在线报告。",
      model,
      state: "live"
    };
  }

  if (serverConfigured) {
    return {
      badge: "服务端已连接",
      detail: "当前服务端环境变量里已经配置了 DeepSeek API Key，可以直接生成在线报告。",
      model,
      state: "live"
    };
  }

  return {
    badge: "等待配置",
    detail: "当前没有检测到可用的 DeepSeek API Key，你可以在右侧填写自己的 Key，或继续使用本地参考报告。",
    model,
    state: "idle"
  };
}

export function buildNutritionMethodDetail({ methodName, profile }) {
  const weight = Number(profile?.weight) || 70;
  const weeklyWorkouts = Number(profile?.weeklyWorkouts) || 3;
  const highCarb = weight * 2;
  const mediumCarb = weight * 1.5;
  const lowCarb = weight * 1;
  const protein = weight * 1.5;
  const higherProtein = weight * 1.6;
  const bulkCarb = weight * 3.5;
  const restCarb = weight * 2.8;
  const key = detectNutritionDetailKey(methodName);

  if (key === "carb_step_down" || key === "carb_cycle") {
    const week = buildMixedCarbWeek(weeklyWorkouts);

    return {
      title: methodName,
      subtitle: "按训练强度安排高 / 中 / 低碳日，把碳水优先留给表现最重要的训练窗口。",
      pattern: countTags(week),
      targets: [
        {
          label: "碳水阶梯",
          value: `${formatGrams(highCarb)} / ${formatGrams(mediumCarb)} / ${formatGrams(lowCarb)}`,
          note: "按高碳 / 中碳 / 低碳日估算，参考 2 / 1.5 / 1 g/kg。"
        },
        {
          label: "蛋白目标",
          value: formatGrams(protein),
          note: "先把蛋白守稳，再考虑继续压低主食。"
        },
        {
          label: "主食换算",
          value: `熟米饭约 ${Math.round(highCarb * 4)}g / 燕麦约 ${Math.round(highCarb * 2)}g`,
          note: "按高碳日粗略换算，不同主食吸水率会有差异。"
        }
      ],
      week,
      principles: [
        "不运动的日子通常不需要高碳，把高碳日留给腿、背或最长的一次训练。",
        "高碳日尽量搭配低脂，低碳日可以略高脂，但不建议把热量缺口全部交给坚果和奶茶。",
        "早餐与训练后优先吃主食，晚餐再根据当天训练强度决定要不要继续补。"
      ],
      trainingNotes: [
        "有氧优先放在低碳恢复日，40 分钟内中等强度通常更容易坚持。",
        "力量训练先保主项和总质量，不建议在减脂期一边低碳一边疯狂堆训练量。",
        "如果连续两周训练表现明显下滑，先回看睡眠与主食，而不是继续往下砍碳水。"
      ],
      supplements: [
        "肌酸可作为长期基础补剂，每天 3-5g 即可。",
        "蛋白粉更适合作为补足蛋白的工具，不必把所有蛋白集中到一餐。",
        "鱼油和复合维生素属于可选项，优先级低于规律吃饭和睡眠。"
      ],
      caution: "如果你本身偏瘦、训练量高，或存在肾病、糖代谢异常、进食障碍史，这套方案都不适合直接照搬。"
    };
  }

  if (key === "moderate_low_carb") {
    const week = buildTrainRestWeek(weeklyWorkouts);

    return {
      title: methodName,
      subtitle: "把主食压到中低水平，但不追求极低碳；训练日保表现，恢复日控食欲。",
      pattern: countTags(week),
      targets: [
        {
          label: "训练日碳水",
          value: formatGrams(mediumCarb),
          note: "训练前后优先分配，避免训练质量掉得太快。"
        },
        {
          label: "恢复日碳水",
          value: formatGrams(lowCarb),
          note: "主食降低即可，不需要完全断碳。"
        },
        {
          label: "蛋白目标",
          value: formatGrams(higherProtein),
          note: "建议分成 4-5 餐去吃，比单次猛灌更稳。"
        }
      ],
      week,
      principles: [
        "训练日主食更多给早餐、训练前和训练后，其余时段保持清淡但别空得太久。",
        "休息日主食下降，蔬菜和瘦肉上来，能减少晚间报复性进食的概率。",
        "先减少饮料、甜点和夜宵，比一上来砍掉所有米饭更容易执行。"
      ],
      trainingNotes: [
        "这套方法更适合减脂或控制食欲，不适合高容量增肌周。",
        "如果下午训练，午餐和训练后这两餐比早餐更值得保碳水。",
        "一旦出现头晕、发软或训练心率异常飙高，通常说明吃得太少而不是不够自律。"
      ],
      supplements: [
        "蛋白粉只补差额，不需要把它当正餐替代品。",
        "电解质和饮水量要跟上，尤其训练日出汗较多时。",
        "咖啡因可作为训练前提神工具，但不要用来掩盖长期低能量状态。"
      ],
      caution: "如果你连续高强度训练较多，中低碳只能短期使用，否则容易把恢复和表现一起压掉。"
    };
  }

  if (key === "keto") {
    const week = buildKetoWeek();

    return {
      title: methodName,
      subtitle: "严格低碳不该是默认首选，更适合短期体重管理测试，而不是高强度训练常规方案。",
      pattern: countTags(week),
      targets: [
        {
          label: "每日碳水上限",
          value: `${Math.min(40, Math.max(20, Math.round(weight * 0.4)))}g`,
          note: "通常需要压到极低，执行门槛明显高于普通控碳。"
        },
        {
          label: "蛋白目标",
          value: formatGrams(higherProtein),
          note: "蛋白不能太低，否则体重掉得快但训练和恢复更差。"
        },
        {
          label: "重点补给",
          value: "水 + 钠 + 钾 + 镁",
          note: "前期最常见的问题不是不够狠，而是电解质不足。"
        }
      ],
      week,
      principles: [
        "严格生酮不适合和大量 HIIT、爆发力训练同时进行。",
        "前几天体重下降往往主要来自糖原和水分，不代表脂肪真的快速减少。",
        "如果只是想少吃点主食，优先尝试碳水渐降或中低碳，而不是直接进入严格生酮。"
      ],
      trainingNotes: [
        "训练周优先保住基础力量和步行，不建议同时做大容量、高频率和长时间空腹有氧。",
        "主观疲劳、心率异常、睡眠变差或情绪起伏变大，都说明不适合继续硬顶。",
        "如果训练表现是你的核心目标，这套方法通常只适合短期尝试而非长期主线。"
      ],
      supplements: [
        "鱼油和电解质优先级高于各种脂肪燃烧类补剂。",
        "蛋白粉仍然可以喝，但要纳入总蛋白而不是额外堆高。",
        "若饮食单一，可考虑补一点复合维生素，但本质问题仍是食谱太窄。"
      ],
      caution: "高强度训练多、需要稳定输出、或本身就容易暴食反弹的人，并不适合把生酮当默认方案。"
    };
  }

  if (key === "lean_bulk") {
    const week = buildTrainRestWeek(weeklyWorkouts).map((day) => ({
      ...day,
      tag: day.tag === "恢复日" ? "恢复日" : "增肌训练日",
      body: day.tag === "恢复日"
        ? "主食略回落即可，不要因为休息日就把全天碳水压得太低。"
        : "主食优先给训练前后两餐，保证总热量和训练表现。"
    }));

    return {
      title: methodName,
      subtitle: "增肌期先守住总热量与训练质量，再在训练日和恢复日之间做轻微碳水波动。",
      pattern: countTags(week),
      targets: [
        {
          label: "训练日碳水",
          value: formatGrams(bulkCarb),
          note: "高于减脂方案很多，重点是喂饱训练而不是一味控重。"
        },
        {
          label: "恢复日碳水",
          value: formatGrams(restCarb),
          note: "只做轻微回落，不建议切到低碳档。"
        },
        {
          label: "蛋白目标",
          value: `${formatGrams(weight * 1.6)} - ${formatGrams(weight * 1.8)}`,
          note: "比总碳水更该优先守稳。"
        }
      ],
      week,
      principles: [
        "训练窗口主食要保住，早餐和训练后两餐通常最值得优先安排。",
        "如果体重 2-3 周完全不动，优先加 150-250 kcal，而不是先删掉主食。",
        "恢复日的目标是稳住食欲和恢复，不是把自己饿出更大的报复性进食。"
      ],
      trainingNotes: [
        "增肌期不建议把有氧做到影响力量训练恢复，轻步行或短时低强度即可。",
        "主项表现、睡眠和体重上升趋势，比体重当日波动更有参考价值。",
        "如果体脂增长过快，可以轻微收缩恢复日主食，而不是直接整周低碳。"
      ],
      supplements: [
        "肌酸依旧是优先级最高的基础补剂之一。",
        "蛋白粉只在正餐跟不上时补差额，优先还是正常吃饭。",
        "鱼油与多维可选，但不要指望补剂替代热量和训练计划。"
      ],
      caution: "增肌期如果长期把碳水压得过低，最先掉的通常不是脂肪，而是训练量、恢复和增肌效率。"
    };
  }

  const week = buildTrainRestWeek(weeklyWorkouts);

  return {
    title: methodName,
    subtitle: "把饮食执行做得更平稳，先守规律，再根据体重与训练反馈做轻微增减。",
    pattern: countTags(week),
    targets: [
      {
        label: "训练日碳水",
        value: formatGrams(mediumCarb),
        note: "主食优先给训练窗口。"
      },
      {
        label: "恢复日碳水",
        value: formatGrams(weight * 1.2),
        note: "轻微回落即可。"
      },
      {
        label: "蛋白目标",
        value: formatGrams(protein),
        note: "先把蛋白稳定在每天都能做到的水平。"
      }
    ],
    week,
    principles: [
      "先把三餐、步数、饮水和睡眠做稳，再追求更细的碳水技巧。",
      "只要训练表现和体重趋势都稳定，就不需要频繁改食谱。",
      "真正有效的方案是能坚持 6-8 周后仍然愿意执行的方案。"
    ],
    trainingNotes: [
      "主食分配围绕训练去做，比纠结某一种单品更重要。",
      "周内至少留 1 天完全恢复，别把每一天都做成减脂冲刺。",
      "如果两周内精神状态明显变差，优先回看总热量和睡眠。"
    ],
    supplements: [
      "补剂优先级永远低于总热量、蛋白和作息。",
      "蛋白粉、肌酸和鱼油都可以用，但只在基础饮食已经稳定时更有意义。"
    ],
    caution: "只要方案已经明显影响工作、睡眠、训练或情绪，就该先把执行强度降下来。"
  };
}
