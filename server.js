import dotenv from "dotenv";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import compress from "@fastify/compress";
import fastifyCookie from "@fastify/cookie";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { logging, server as wisp } from "@mercuryworkshop/wisp-js/server";
import { createBareServer } from "@tomphttp/bare-server-node";
import { MasqrMiddleware } from "./masqr.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.PORT || 2345;
const NVIDIA_API_KEY =
  process.env.NVIDIA_API_KEY ||
  "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";
const NVIDIA_CHAT_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "microsoft/phi-3.5-mini-instruct";
const server = createServer();
const bare = process.env.BARE !== "false" ? createBareServer("/seal/") : null;
logging.set_level(logging.NONE);

Object.assign(wisp.options, {
  dns_method: "resolve",
  dns_servers: ["1.1.1.3", "1.0.0.3"],
  dns_result_order: "ipv4first"
});

server.on("upgrade", (req, sock, head) =>
  bare?.shouldRoute(req)
    ? bare.routeUpgrade(req, sock, head)
    : req.url.endsWith("/wisp/")
      ? wisp.routeRequest(req, sock, head)
      : sock.end()
);

const app = Fastify({
  serverFactory: h => (
    server.on("request", (req, res) =>
      bare?.shouldRoute(req) ? bare.routeRequest(req, res) : h(req, res)
    ),
    server
  ),
  logger: false,
  keepAliveTimeout: 30000,
  connectionTimeout: 60000,
  forceCloseConnections: true
});

await app.register(fastifyCookie);
await app.register(compress, { global: true, encodings: ['gzip','deflate','br'] });

app.register(fastifyStatic, {
  root: join(__dirname, "dist"),
  prefix: "/",
  decorateReply: true,
  etag: true,
  lastModified: true,
  cacheControl: true,
  setHeaders(res, path) {
    if (path.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
    } else if (/\.[a-f0-9]{8,}\./.test(path)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      res.setHeader("Cache-Control", "public, max-age=3600");
    }
  }
});

if (process.env.MASQR === "true")
  app.addHook("onRequest", MasqrMiddleware);

const proxy = (url, type = "application/javascript") => async (req, reply) => {
  try {
    const res = await fetch(url(req));
    if (!res.ok) return reply.code(res.status).send();

    const hop = [
      "connection",
      "keep-alive",
      "proxy-authenticate",
      "proxy-authorization",
      "te",
      "trailer",
      "transfer-encoding",
      "upgrade",
      "content-encoding"
    ];
    for (const [k, v] of res.headers) {
      if (!hop.includes(k.toLowerCase())) reply.header(k, v);
    }

    if (res.headers.getSetCookie) {
      const cookies = res.headers.getSetCookie();
      if (cookies.length) reply.header("set-cookie", cookies);
    }

    if (!res.headers.get("content-type")) reply.type(type);

    return reply.send(res.body);
  } catch {
    return reply.code(500).send();
  }
};

app.get("/assets/img/*", proxy(req => `https://dogeub-assets.pages.dev/img/${req.params["*"]}`, ""));
app.get("/assets-fb/*", proxy(req => `https://dogeub-assets.pages.dev/img/server/${req.params["*"]}`, ""));
app.get("/js/script.js", proxy(() => "https://byod.privatedns.org/js/script.js"));
app.get("/ds", (req, res) => res.redirect("https://discord.gg/ZBef7HnAeg"));
app.get("/return", async (req, reply) =>
  req.query?.q
    ? fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(req.query.q)}`)
        .then(r => r.json())
        .catch(() => reply.code(500).send({ error: "request failed" }))
    : reply.code(401).send({ error: "query parameter?" })
);

app.get("/api/ip/meta", async (req, reply) => {
  const neutralMeta = {
    timezone: "UTC",
    latitude: 0,
    longitude: 0,
    city: "",
  };

  const host = String(req.hostname || "").toLowerCase();
  if (["localhost", "127.0.0.1", "::1"].includes(host)) {
    return reply.send(neutralMeta);
  }

  const providers = [
    {
      url: "https://ipapi.co/json/",
      parse: (payload) => ({
        timezone: String(payload?.timezone || ""),
        latitude: Number(payload?.latitude),
        longitude: Number(payload?.longitude),
        city: String(payload?.city || ""),
      }),
    },
    {
      url: "https://ipwho.is/",
      parse: (payload) => ({
        timezone: String(
          typeof payload?.timezone === "string" ? payload.timezone : payload?.timezone?.id || "",
        ),
        latitude: Number(payload?.latitude),
        longitude: Number(payload?.longitude),
        city: String(payload?.city || ""),
      }),
    },
    {
      url: "https://ipinfo.io/json",
      parse: (payload) => {
        const loc = String(payload?.loc || "").split(",");
        return {
          timezone: String(payload?.timezone || ""),
          latitude: Number(loc[0]),
          longitude: Number(loc[1]),
          city: String(payload?.city || ""),
        };
      },
    },
  ];

  const isValid = (meta) =>
    !!meta &&
    Number.isFinite(meta.latitude) &&
    Number.isFinite(meta.longitude) &&
    meta.latitude >= -90 &&
    meta.latitude <= 90 &&
    meta.longitude >= -180 &&
    meta.longitude <= 180;

  try {
    for (const provider of providers) {
      try {
        const response = await fetch(provider.url, { headers: { "user-agent": "GhostProxy/1.0" } });
        if (!response.ok) continue;
        const data = await response.json();
        const parsed = provider.parse(data);
        if (!isValid(parsed)) continue;
        return reply.send(parsed);
      } catch {
        continue;
      }
    }

    return reply.send(neutralMeta);
  } catch {
    return reply.send(neutralMeta);
  }
});

app.options("/api/ai/chat", async (_req, reply) => {
  reply
    .header("Access-Control-Allow-Origin", "*")
    .header("Access-Control-Allow-Methods", "POST, OPTIONS")
    .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    .code(204)
    .send();
});

app.post("/api/ai/chat", async (req, reply) => {
  try {
    reply
      .header("Access-Control-Allow-Origin", "*")
      .header("Access-Control-Allow-Methods", "POST, OPTIONS")
      .header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const incoming = Array.isArray(body.messages) ? body.messages : [];

    const messages = [
      { role: "system", content: "You are Ghost AI, concise, helpful, and accurate." },
      ...incoming
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-24)
        .map((m) => ({ role: m.role, content: m.content })),
    ];

    const upstream = await fetch(NVIDIA_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages,
        temperature: 0.5,
        top_p: 0.9,
        max_tokens: 1024,
        stream: false,
      }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return reply.code(upstream.status).type("application/json").send({
        error: "nvidia_request_failed",
        status: upstream.status,
        details: text.slice(0, 400),
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return reply.code(502).send({ error: "invalid_nvidia_response" });
    }

    const content = parsed?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return reply.code(502).send({ error: "empty_nvidia_response" });
    }

    return reply.send({ content });
  } catch {
    return reply.code(500).send({ error: "ai_proxy_failed" });
  }
});

app.setNotFoundHandler((req, reply) =>
  req.raw.method === "GET" && req.headers.accept?.includes("text/html")
    ? reply.sendFile("index.html")
    : reply.code(404).send({ error: "Not Found" })
);

app.listen({ port }).then(() => console.log(`Server running on ${port}`));
