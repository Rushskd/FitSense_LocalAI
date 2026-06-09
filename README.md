# FitSense LocalAI

![Node.js](https://img.shields.io/badge/Runtime-Node.js-1f7a4d?style=for-the-badge)
![DeepSeek](https://img.shields.io/badge/AI-DeepSeek%20Ready-1d6fe8?style=for-the-badge)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-24292f?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-c7a75b?style=for-the-badge)

FitSense LocalAI 是一个面向个人训练、饮食和恢复规划的本地优先健康分析工作台。它用全屏开场页、清晰的身体数据输入、结构化训练模块、饮食策略推荐和 DeepSeek 中文报告生成，把“我该怎么练、怎么吃、怎么坚持”整理成可执行的一页式方案。

在线预览：[https://rushskd.github.io/FitSense_LocalAI/](https://rushskd.github.io/FitSense_LocalAI/)

> GitHub Pages 版本用于静态界面预览。完整的 `/api/analyze`、DeepSeek 代理和服务端 `.env` 配置能力需要运行本地 Node 服务，或接入独立后端。

## 项目亮点

| 能力 | 说明 |
| --- | --- |
| 本地优先分析 | 即使没有 DeepSeek API Key，也能基于本地规则生成 BMI、活动评分、训练方向和饮食建议。 |
| 全屏开场页 | 首页先呈现带轻量视差层的开场页，向下滚动一次进入数据统计工作台，在工作台顶端向上滚动一次返回首页。 |
| DeepSeek 增强报告 | 支持服务端 `.env` API Key，也支持用户在浏览器临时填写自己的 Key，通过本地代理生成结构化中文报告。 |
| 鲸鱼悬浮入口 | DeepSeek 接入状态收纳为可拖动的鲸鱼悬浮球，点击后直接打开详情，减少对主页面布局的干扰。 |
| 移动端吸附体验 | 移动端悬浮球保留边缘吸附、轻量淡入和无冗余方形底框，降低滑动与点击时的卡顿感。 |
| 训练与饮食分 tab | 报告拆分为总览、训练预设、饮食策略三个 tab，避免大段文本堆叠。 |
| 多套训练预设 | 根据减脂、增肌、耐力、综合健康等目标生成不同训练计划和推荐程度。 |
| 科学饮食方法 | 内置碳水渐降、中低碳高蛋白、生酮饮食等方法，并给出适用边界和谨慎提示。 |
| 一周饮食详情 | 每种饮食策略都可以打开详情页，查看一周执行安排、原则、训练配合和风险提醒。 |
| Liquid Glass 视觉 | 使用 SVG filter、玻璃拟态、动态折射和柔和背景纹理，保留更接近现代 iOS 风格的界面体验。 |
| 零前端框架 | 使用原生 HTML、CSS、JavaScript 和 Node.js，结构直观，部署轻量，适合继续二次开发。 |

## 视觉与交互

FitSense LocalAI 的界面不是传统表单工具，而是一个偏产品化的健康分析仪表台。

| 区域 | 设计目标 |
| --- | --- |
| 开场页 | 用全屏滚动、网格视差、轨道光效和进入按钮建立项目展示感，用户向下滑动后再进入具体功能界面。 |
| Hero 区 | 用大标题、液态玻璃胶囊和柔和背景纹理建立第一视觉焦点。 |
| 输入区 | 保留核心身体数据字段，降低用户填写成本。 |
| 概览区 | 将 BMI、活动评分、目标方向等基础指标卡片化。 |
| 报告区 | 用 tab 拆分总览、训练和饮食内容，并加大上下间距，避免信息过度紧凑。 |
| DeepSeek 悬浮球 | 默认保持小型鲸鱼图标入口，点击直接展开详情；移动端去掉多余方形背景并吸附屏幕边缘。 |
| 饮食详情页 | 每个饮食方法都有独立详情层，适合展示更完整的一周计划。 |

## 工作流程

```mermaid
flowchart LR
  A["填写基础身体数据"] --> B["本地规则分析"]
  B --> C["生成结构化基础方案"]
  C --> D{"DeepSeek 可用？"}
  D -- "可用" --> E["调用 DeepSeek 生成中文 JSON 报告"]
  D -- "不可用" --> F["使用本地 fallback 报告"]
  E --> G["渲染总览 / 训练 / 饮食 tab"]
  F --> G
  G --> H["打开饮食方法详情，查看一周安排"]
```

## 技术架构

```mermaid
flowchart TB
  UI["public/index.html + styles.css + app.js"] --> API["Node HTTP Server"]
  API --> Analyze["src/analyze.js 本地健康分析"]
  API --> LLM["src/llm.js DeepSeek 请求与结构化解析"]
  API --> Env["src/env.js .env 读取"]
  UI --> State["public/ui-state.js 前端状态与饮食详情生成"]
  LLM --> DeepSeek["DeepSeek Chat Completions API"]
```

| 路径 | 作用 |
| --- | --- |
| `public/index.html` | 页面结构、全屏开场页、SVG 玻璃滤镜、报告 tab、饮食详情弹层和 DeepSeek 入口。 |
| `public/styles.css` | Liquid Glass 视觉系统、开场页视差层、响应式布局、tab 间距、移动端性能优化和悬浮球样式。 |
| `public/app.js` | 全屏开场滚动、表单提交、API 状态、报告渲染、tab 切换、悬浮球拖拽/点击和饮食详情交互。 |
| `public/ui-state.js` | 前端派生状态、评分逻辑、饮食方法一周详情。 |
| `src/analyze.js` | 本地 BMI、训练建议、饮食策略和 fallback 结构化计划。 |
| `src/llm.js` | DeepSeek 配置解析、请求体构建、JSON 报告解析和兜底。 |
| `src/env.js` | 读取 `.env` 并合并到运行环境。 |
| `server.js` | 静态资源服务、`/api/status` 和 `/api/analyze`。 |
| `test/` | Node 原生测试，覆盖分析逻辑、DeepSeek 请求、布局约束和 UI 状态。 |

## 本地运行

环境要求：

| 工具 | 版本建议 |
| --- | --- |
| Node.js | 18 或更高版本，推荐 20+ |
| npm | 仅用于运行脚本，本项目没有第三方依赖 |

启动项目：

```bash
git clone https://github.com/Rushskd/FitSense_LocalAI.git
cd FitSense_LocalAI
npm start
```

打开浏览器访问：

```text
http://localhost:3000/
```

运行测试：

```bash
npm test
```

如果当前环境 npm 不可用，也可以直接运行：

```bash
node --test
```

## DeepSeek 配置

项目支持两种 API Key 使用方式。

| 方式 | 适合场景 | 说明 |
| --- | --- | --- |
| 服务端 `.env` | 自己本地长期使用 | Key 放在本地 `.env`，由 Node 服务代理请求，不暴露到页面源码。 |
| 浏览器填写 | 临时体验或让用户自备 Key | Key 存在当前浏览器 localStorage，提交分析时传给本地 Node 代理。 |

创建 `.env`：

```bash
cp .env.example .env
```

填写配置：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
PORT=3000
```

接口说明：

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/api/status` | `GET` | 返回 DeepSeek 是否已配置、当前模型、是否支持浏览器 Key。 |
| `/api/analyze` | `POST` | 接收身体数据，返回本地分析、报告来源和结构化报告。 |

## 部署说明

当前仓库已经配置 GitHub Pages 自动部署。

| 文件 | 作用 |
| --- | --- |
| `.github/workflows/pages.yml` | push 到 `main` 后，将 `public/` 上传为 GitHub Pages 静态站点。 |
| `index.html` | 根目录静态跳转，用于兼容仓库根路径访问。 |
| `public/` | 实际前端页面与静态资源。 |

静态部署适合展示界面、交互动效和页面结构。由于 GitHub Pages 不运行 Node 服务，在线地址默认不能提供 `/api/analyze` 后端能力。若要让外网完整调用 DeepSeek，可以继续部署一个 Node 后端到 Render、Railway、Vercel Serverless、Cloudflare Workers 或自己的服务器，再把前端 API 地址指向该后端。

## 安全与边界

FitSense LocalAI 是健康规划辅助工具，不是医疗诊断系统。

| 边界 | 说明 |
| --- | --- |
| API Key | 不要把真实 Key 提交到 GitHub；`.env` 已被 `.gitignore` 忽略。 |
| 浏览器 Key | 用户在页面填写的 Key 仅保存在当前浏览器 localStorage，但仍应只在可信环境中使用。 |
| 健康建议 | 报告适合训练和饮食规划参考，不替代医生、营养师或康复师建议。 |
| 特殊人群 | 孕期、慢性病、肾病、糖尿病、进食障碍、长期服药等情况，应先咨询专业人士。 |
| 生酮与低碳 | 页面会给出谨慎提示，不把生酮作为默认推荐，尤其不建议高强度训练较多时贸然采用。 |

## 测试覆盖

当前测试重点覆盖：

| 测试文件 | 覆盖内容 |
| --- | --- |
| `test/analyze.test.js` | BMI、目标判断、本地结构化训练与饮食方案。 |
| `test/llm.test.js` | DeepSeek 配置解析、请求体构建、结构化 JSON 解析和 fallback。 |
| `test/ui-state.test.js` | 前端评分、报告来源状态、饮食详情一周计划。 |
| `test/report-layout.test.js` | 全屏开场页、原始回包隐藏、饮食详情入口、GitHub Pages 路径、tab 间距、字体加载和悬浮球布局约束。 |

最近一次完整验证：

```bash
node --test
```

结果：33 个测试全部通过。

## 路线图

| 优先级 | 方向 |
| --- | --- |
| P1 | 增加真实外网后端部署，让 GitHub Pages 预览也能完整生成 DeepSeek 报告。 |
| P1 | 增加报告导出为 Markdown、PDF 或图片卡片。 |
| P2 | 支持更多训练目标，如塑形、体态改善、康复后恢复训练。 |
| P2 | 增加用户历史记录、本地多方案对比和周期化训练追踪。 |
| P3 | 为饮食模块加入更多可配置参数，如餐次、忌口、预算、外食频率。 |

## License

本项目基于 [MIT License](./LICENSE) 开源。
