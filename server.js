import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  analyzeHealthProfile,
  buildStructuredPlan,
  createFallbackReport
} from "./src/analyze.js";
import { loadEnvFile } from "./src/env.js";
import { generateAiReport, resolveDeepSeekConfig } from "./src/llm.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

loadEnvFile(__dirname);

const port = process.env.PORT || 3000;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function validateProfile(profile) {
  const requiredFields = [
    "age",
    "gender",
    "height",
    "weight",
    "activityLevel",
    "goal",
    "weeklyWorkouts"
  ];

  for (const field of requiredFields) {
    if (profile[field] === undefined || profile[field] === null || profile[field] === "") {
      return `Missing field: ${field}`;
    }
  }

  return null;
}

function sanitizeClientApiConfig(apiConfig = {}) {
  return {
    apiKey: typeof apiConfig.apiKey === "string" ? apiConfig.apiKey.trim() : "",
    model: typeof apiConfig.model === "string" ? apiConfig.model.trim() : "",
    apiUrl: typeof apiConfig.apiUrl === "string" ? apiConfig.apiUrl.trim() : ""
  };
}

async function parseJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
}

async function serveStaticFile(requestPath, response) {
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(publicDir, safePath);

  try {
    const data = await readFile(filePath);
    const extension = path.extname(filePath);

    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream"
    });
    response.end(data);
  } catch {
    sendJson(response, 404, { error: "Not found" });
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "POST" && url.pathname === "/api/analyze") {
    try {
      const body = await parseJsonBody(request);
      const error = validateProfile(body);

      if (error) {
        return sendJson(response, 400, { error });
      }

      const analysis = analyzeHealthProfile(body);
      const structuredPlan = buildStructuredPlan(body, analysis);
      const fallbackReport = createFallbackReport({
        profile: body,
        analysis
      });
      const configOverrides = sanitizeClientApiConfig(body.apiConfig);

      let aiResult;

      try {
        aiResult = await generateAiReport({
          profile: body,
          analysis,
          fallbackReport,
          fallbackPlan: structuredPlan,
          configOverrides
        });
      } catch {
        aiResult = {
          report: `${fallbackReport}\n\nDeepSeek 暂时不可用，已自动切换为本地回退报告。`,
          source: "fallback",
          structuredReport: structuredPlan
        };
      }

      return sendJson(response, 200, {
        analysis,
        report: aiResult.report,
        source: aiResult.source,
        structuredReport: aiResult.structuredReport
      });
    } catch {
      return sendJson(response, 400, { error: "Invalid JSON body." });
    }
  }

  if (request.method === "GET" && url.pathname === "/api/status") {
    const config = resolveDeepSeekConfig();

    return sendJson(response, 200, {
      apiUrl: config.apiUrl,
      deepseekConfigured: config.configured,
      model: config.model,
      supportsClientKey: true
    });
  }

  return serveStaticFile(url.pathname, response);
});

server.listen(port, () => {
  console.log(`FitSense AI is running at http://localhost:${port}`);
});
