import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeHealthProfile,
  buildStructuredPlan,
  createFallbackReport
} from "../src/analyze.js";
import { parseEnvText } from "../src/env.js";

test("analyzeHealthProfile calculates BMI and labels overweight users", () => {
  const result = analyzeHealthProfile({
    age: 22,
    gender: "male",
    height: 175,
    weight: 82,
    activityLevel: "light",
    goal: "fat_loss",
    weeklyWorkouts: 2
  });

  assert.equal(result.bmi.toFixed(1), "26.8");
  assert.equal(result.bmiCategory, "超重");
  assert.match(result.healthStatus, /改善身体成分/);
});

test("analyzeHealthProfile creates muscle gain targets for active users", () => {
  const result = analyzeHealthProfile({
    age: 20,
    gender: "female",
    height: 168,
    weight: 56,
    activityLevel: "moderate",
    goal: "muscle_gain",
    weeklyWorkouts: 4
  });

  assert.equal(result.bmiCategory, "正常");
  assert.match(result.trainingFocus, /力量训练/);
  assert.match(result.weeklyGoal, /4 到 5/);
});

test("buildStructuredPlan separates training and nutrition modules", () => {
  const profile = {
    age: 28,
    gender: "male",
    height: 178,
    weight: 86,
    activityLevel: "moderate",
    goal: "fat_loss",
    weeklyWorkouts: 4
  };
  const analysis = analyzeHealthProfile(profile);
  const plan = buildStructuredPlan(profile, analysis);

  assert.match(plan.summary, /BMI/);
  assert.equal(plan.training.headline, "力量保肌 + 稳定消耗");
  assert.equal(plan.training.presets.length, 3);
  assert.equal(plan.training.presets[1].recommendation, "最推荐");
  assert.equal(plan.nutrition.strategy, "碳水渐降");
  assert.equal(plan.nutrition.methods[0].name, "碳水渐降");
  assert.match(plan.nutrition.caution, /糖尿病|肾病|营养师/);
});

test("createFallbackReport returns a readable module-based summary", () => {
  const profile = {
    age: 24,
    gender: "male",
    height: 180,
    weight: 68,
    activityLevel: "low",
    goal: "endurance",
    weeklyWorkouts: 1
  };
  const analysis = analyzeHealthProfile(profile);
  const report = createFallbackReport({ profile, analysis });

  assert.match(report, /训练模块/);
  assert.match(report, /饮食模块/);
  assert.match(report, /耐力提升/);
});

test("parseEnvText reads simple env assignments", () => {
  const env = parseEnvText(`
# comment
DEEPSEEK_API_KEY=test-key
DEEPSEEK_MODEL=deepseek-v4-flash
PORT=3000
  `);

  assert.equal(env.DEEPSEEK_API_KEY, "test-key");
  assert.equal(env.DEEPSEEK_MODEL, "deepseek-v4-flash");
  assert.equal(env.PORT, "3000");
});
