import "./load-env.js";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, hasGemini, hasOpenAI, hasChatProvider } from "./config.js";
import { handleChat } from "./chat.js";
import { listLessons } from "./lessons.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  try {
    if (req.method === "GET" && req.url === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        geminiConfigured: hasGemini(),
        openaiConfigured: hasOpenAI(),
        chatProvider: config.chatProvider,
        geminiModel: config.gemini.model,
        openaiModel: config.openai.model,
        chatReady: hasChatProvider(),
      });
      return;
    }

    if (req.method === "GET" && req.url === "/api/lessons") {
      sendJson(res, 200, { lessons: listLessons() });
      return;
    }

    if (req.method === "POST" && req.url === "/api/chat") {
      const raw = await readBody(req);
      const body = JSON.parse(raw || "{}");
      const result = await handleChat({
        sessionId: body.sessionId,
        message: body.message,
        targetLanguage: body.targetLanguage || "en",
        cefrLevel: body.cefrLevel || "A1",
        mode: body.mode || "chat",
        correctionStyle: body.correctionStyle || "end",
        lessonUnitId: body.lessonUnitId || null,
        strictTargetLanguageOnly: Boolean(body.strictTargetLanguageOnly),
        supportLanguage: body.supportLanguage || "en",
        chatProvider: body.chatProvider || null,
      });
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "GET") {
      serveStatic(req, res);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message.includes("not configured") || message.includes("not set")
        ? 503
        : 400;
    sendJson(res, status, { error: message });
  }
});

server.listen(config.port, () => {
  console.log(`Language Practice Partner running at http://127.0.0.1:${config.port}`);
  if (!hasChatProvider()) {
    console.warn(
      "Warning: Set GOOGLE_API_KEY and/or OPENAI_API_KEY in .env for chat.",
    );
  } else {
    console.log(`Chat provider mode: ${config.chatProvider}`);
  }
});
