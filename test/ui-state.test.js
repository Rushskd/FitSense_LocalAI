import test from "node:test";
import assert from "node:assert/strict";

import {
  buildNutritionMethodDetail,
  deriveConditionScore,
  deriveTrainingScore,
  getApiConnectionMeta,
  getSourceMeta
} from "../public/ui-state.js";

test("deriveConditionScore rewards users in the normal BMI range", () => {
  assert.equal(
    deriveConditionScore({
      activityScore: 68,
      bmiCategory: "正常"
    }),
    86
  );
});

test("deriveTrainingScore reacts to the Chinese low-frequency risk flag", () => {
  assert.equal(
    deriveTrainingScore({
      activityScore: 68,
      riskFlags: ["训练频率不足"]
    }),
    59
  );
});

test("getSourceMeta keeps report status copy minimal", () => {
  assert.deepEqual(getSourceMeta("deepseek"), {
    pill: "DeepSeek 在线",
    status: "",
    live: true
  });

  assert.deepEqual(getSourceMeta("fallback"), {
    pill: "本地参考",
    status: "",
    live: false
  });
});

test("buildNutritionMethodDetail creates a 7-day carb reduction detail view", () => {
  const detail = buildNutritionMethodDetail({
    methodName: "碳水渐降",
    profile: {
      weight: 75,
      weeklyWorkouts: 5,
      goal: "fat_loss"
    }
  });

  assert.equal(detail.title, "碳水渐降");
  assert.equal(detail.week.length, 7);
  assert.equal(detail.targets[0].value, "150g / 112.5g / 75g");
  assert.equal(detail.targets[1].value, "112.5g");
  assert.equal(detail.week.filter((day) => day.tag === "高碳日").length, 2);
  assert.equal(detail.week.filter((day) => day.tag === "中碳日").length, 3);
  assert.equal(detail.week.filter((day) => day.tag === "低碳日").length, 2);
});

test("buildNutritionMethodDetail creates a cautious keto detail view", () => {
  const detail = buildNutritionMethodDetail({
    methodName: "生酮饮食（谨慎）",
    profile: {
      weight: 75,
      weeklyWorkouts: 4,
      goal: "fat_loss"
    }
  });

  assert.equal(detail.title, "生酮饮食（谨慎）");
  assert.equal(detail.targets[0].value, "30g");
  assert.equal(detail.week[0].tag, "适应期");
  assert.match(detail.caution, /默认方案|高强度训练/);
});

test("getApiConnectionMeta prefers a browser-saved API key when present", () => {
  assert.deepEqual(
    getApiConnectionMeta({
      serverConfigured: false,
      localConfigured: true,
      model: "deepseek-v4-flash"
    }),
    {
      badge: "浏览器 Key 已就绪",
      detail: "已保存当前浏览器内填写的 DeepSeek API Key，提交后会优先用它生成在线报告。",
      model: "deepseek-v4-flash",
      state: "live"
    }
  );
});

test("getApiConnectionMeta falls back to waiting copy when no API key exists", () => {
  assert.deepEqual(
    getApiConnectionMeta({
      serverConfigured: false,
      localConfigured: false,
      model: "deepseek-v4-flash"
    }),
    {
      badge: "等待配置",
      detail: "当前没有检测到可用的 DeepSeek API Key，你可以在右侧填写自己的 Key，或继续使用本地参考报告。",
      model: "deepseek-v4-flash",
      state: "idle"
    }
  );
});
