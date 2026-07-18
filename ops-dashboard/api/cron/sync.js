const {
  createMetricsPayload,
  saveMetricsSnapshot,
} = require("../metrics");
const {
  createProductComparisonPayload,
  saveProductComparisonSnapshot,
} = require("../products");
const {
  createAuditPayload,
  saveAuditSnapshot,
} = require("../audit");
const { getDatabaseStatus } = require("../_lib/database");

function isAuthorized(req) {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) {
    return {
      ok: false,
      status: 500,
      message: "CRON_SECRET is not configured",
    };
  }

  const header =
    req.headers.authorization ||
    req.headers.Authorization ||
    req.headers["x-cron-secret"] ||
    req.headers["X-Cron-Secret"] ||
    "";
  const bearer = (header.startsWith("Bearer ") ? header.slice("Bearer ".length) : header).trim();
  const querySecret = (req.query?.secret || "").trim();

  if (bearer !== secret && querySecret !== secret) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized",
    };
  }

  return { ok: true };
}

async function syncMetricRange(rangeName) {
  const payload = await createMetricsPayload(rangeName);
  const saved = await saveMetricsSnapshot(payload, "company");
  return {
    kind: "metrics",
    range: rangeName,
    saved,
    generatedAt: payload.generatedAt,
    sources: Object.fromEntries(
      Object.entries(payload.channels || {}).map(([key, source]) => [
        key,
        source.status || "unknown",
      ]),
    ),
  };
}

async function syncProducts() {
  const payload = await createProductComparisonPayload();
  const saved = await saveProductComparisonSnapshot(payload);
  return {
    kind: "products",
    saved,
    generatedAt: payload.generatedAt,
    rowCount: payload.rows.length,
    platforms: Object.fromEntries(
      Object.entries(payload.platforms || {}).map(([key, source]) => [
        key,
        source.status || "unknown",
      ]),
    ),
  };
}

async function syncAudit() {
  const payload = await createAuditPayload();
  const saved = await saveAuditSnapshot(payload);
  return {
    kind: "audit",
    saved,
    generatedAt: payload.captured_at,
    campaigns: payload.summary.campaigns,
    asins: payload.summary.asins,
  };
}

module.exports = async function handler(req, res) {
  const authorization = isAuthorized(req);
  if (!authorization.ok) {
    res.status(authorization.status).json({
      ok: false,
      message: authorization.message,
    });
    return;
  }

  const ranges = ["7d", "30d", "90d", "ytd"];
  const results = [];

  for (const rangeName of ranges) {
    try {
      results.push(await syncMetricRange(rangeName));
    } catch (error) {
      results.push({
        kind: "metrics",
        range: rangeName,
        saved: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  try {
    results.push(await syncProducts());
  } catch (error) {
    results.push({
      kind: "products",
      saved: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    results.push(await syncAudit());
  } catch (error) {
    results.push({
      kind: "audit",
      saved: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    generatedAt: new Date().toISOString(),
    database: getDatabaseStatus(),
    results,
  });
};
