import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDeepSeekRequestBody,
  parseStructuredReport,
  resolveDeepSeekConfig
} from "../src/llm.js";

const fallbackPlan = {
  summary: "基础总结",
  training: {
    headline: "训练标题",
    overview: "训练总述",
    schedule: ["训练安排 1", "训练安排 2", "训练安排 3"],
    actions: ["训练提醒 1", "训练提醒 2", "训练提醒 3"],
    presets: [
      {
        name: "全身力量基础版",
        recommendation: "最推荐",
        summary: "每周 3 练的稳妥方案。",
        cadence: "周一 / 周三 / 周六",
        focus: "优先深蹲、推、拉和核心。"
      },
      {
        name: "力量 + 有氧混合版",
        recommendation: "可替代",
        summary: "兼顾力量和消耗。",
        cadence: "周二 / 周四 / 周六 / 周日",
        focus: "适合减脂期稳定执行。"
      },
      {
        name: "高频进阶版",
        recommendation: "进阶可选",
        summary: "适合恢复能力更强的人。",
        cadence: "每周 5 练",
        focus: "需要更稳定的睡眠和恢复。"
      }
    ]
  },
  nutrition: {
    strategy: "碳水渐降",
    overview: "饮食总述",
    actions: ["饮食提醒 1", "饮食提醒 2", "饮食提醒 3"],
    methods: [
      { name: "碳水渐降", fit: "推荐优先", note: "渐进减量更容易坚持。" },
      { name: "中低碳高蛋白", fit: "食欲管理更重要时", note: "仍要保留训练窗口碳水。" },
      { name: "生酮饮食（谨慎）", fit: "仅作可选方案", note: "不适合作为默认首选。" }
    ],
    caution: "有基础疾病时请先咨询医生。"
  },
  closing: "结尾提醒"
};

test("resolveDeepSeekConfig returns the current default DeepSeek endpoint and model", () => {
  const config = resolveDeepSeekConfig({});

  assert.equal(config.apiUrl, "https://api.deepseek.com/chat/completions");
  assert.equal(config.model, "deepseek-v4-flash");
  assert.equal(config.configured, false);
});

test("resolveDeepSeekConfig accepts request-scoped API key overrides", () => {
  const config = resolveDeepSeekConfig(
    {},
    {
      apiKey: " browser-key ",
      model: " deepseek-v4-pro "
    }
  );

  assert.equal(config.apiKey, "browser-key");
  assert.equal(config.model, "deepseek-v4-pro");
  assert.equal(config.configured, true);
});

test("resolveDeepSeekConfig prefers request overrides over server env values", () => {
  const config = resolveDeepSeekConfig(
    {
      DEEPSEEK_API_KEY: "server-key",
      DEEPSEEK_MODEL: "deepseek-v4-flash"
    },
    {
      apiKey: "client-key"
    }
  );

  assert.equal(config.apiKey, "client-key");
  assert.equal(config.model, "deepseek-v4-flash");
  assert.equal(config.configured, true);
});

test("buildDeepSeekRequestBody requests structured json and gradual carb reduction guidance", () => {
  const body = buildDeepSeekRequestBody({
    profile: {
      age: 21,
      gender: "male",
      height: 175,
      weight: 70,
      activityLevel: "moderate",
      weeklyWorkouts: 3,
      goal: "muscle_gain"
    },
    analysis: {
      bmi: 22.9,
      bmiCategory: "正常",
      healthStatus: "整体状态稳定。",
      trainingFocus: "重点进行力量训练。",
      weeklyGoal: "每周训练 4 到 5 次。",
      calorieHint: "保证充足蛋白质摄入。",
      riskFlags: ["基础状态良好"]
    },
    model: "deepseek-v4-flash",
    fallbackPlan
  });

  assert.equal(body.model, "deepseek-v4-flash");
  assert.match(body.messages[1].content, /只返回一个合法 JSON 对象/);
  assert.match(body.messages[1].content, /碳水渐降/);
  assert.match(body.messages[1].content, /生酮不是默认推荐/);
  assert.match(body.messages[1].content, /presets/);
  assert.match(body.messages[1].content, /性别: 男/);
});

test("parseStructuredReport keeps valid sections from ai output", () => {
  const structured = parseStructuredReport(
    JSON.stringify({
      summary: "新的总览",
      training: {
        headline: "新的训练标题",
        overview: "新的训练总述",
        schedule: ["周一力量", "周三有氧", "周五全身"],
        actions: ["动作标准优先", "记录训练量", "保留恢复日"],
        presets: [
          {
            name: "三练基础版",
            recommendation: "最推荐",
            summary: "适合当前频率。",
            cadence: "周一 / 周三 / 周六",
            focus: "保留力量训练质量。"
          }
        ]
      },
      nutrition: {
        strategy: "中低碳高蛋白",
        overview: "新的饮食总述",
        actions: ["优先蛋白质", "减少夜宵", "训练前后保留碳水"],
        methods: [
          { name: "碳水渐降", fit: "推荐优先", note: "先从晚餐主食减起。" }
        ],
        caution: "如有基础疾病请先咨询医生。"
      },
      closing: "新的收束建议"
    }),
    fallbackPlan
  );

  assert.equal(structured.summary, "新的总览");
  assert.equal(structured.training.headline, "新的训练标题");
  assert.equal(structured.training.presets[0].name, "三练基础版");
  assert.equal(structured.nutrition.strategy, "中低碳高蛋白");
  assert.equal(structured.nutrition.methods[0].name, "碳水渐降");
});

test("parseStructuredReport falls back when ai output is not valid json", () => {
  const structured = parseStructuredReport("这不是 JSON", fallbackPlan);

  assert.deepEqual(structured, fallbackPlan);
});
