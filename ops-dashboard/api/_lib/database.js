const METRIC_TABLE = "dashboard_metric_snapshots";
const PRODUCT_TABLE = "dashboard_product_snapshots";

let sqlClient = null;
let tablesReady = false;

function getDatabaseUrl() {
  return (
    process.env.DASHBOARD_DATABASE_URL ||
    process.env.DASHBOARD_DATABASE_DATABASE_URL ||
    process.env.DASHBOARD_DATABASE_POSTGRES_URL ||
    process.env.DASHBOARD_DATABASE_POSTGRES_PRISMA_URL ||
    process.env.DASHBOARD_DATABASE_POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    ""
  );
}

function getDatabaseStatus() {
  return {
    enabled: Boolean(getDatabaseUrl()),
    provider: getDatabaseUrl() ? "postgres" : "none",
  };
}

async function getSql() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return null;
  if (sqlClient) return sqlClient;

  const { neon } = await import("@neondatabase/serverless");
  sqlClient = neon(databaseUrl);
  return sqlClient;
}

async function ensureTables() {
  if (tablesReady) return true;
  const sql = await getSql();
  if (!sql) return false;

  await sql`
    CREATE TABLE IF NOT EXISTS dashboard_metric_snapshots (
      id BIGSERIAL PRIMARY KEY,
      scope TEXT NOT NULL,
      range_name TEXT NOT NULL,
      captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      stale_after TIMESTAMPTZ NOT NULL,
      payload JSONB NOT NULL,
      source_status JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS dashboard_metric_snapshots_latest_idx
    ON dashboard_metric_snapshots (scope, range_name, captured_at DESC)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS dashboard_product_snapshots (
      id BIGSERIAL PRIMARY KEY,
      platform TEXT NOT NULL,
      captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      payload JSONB NOT NULL
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS dashboard_product_snapshots_latest_idx
    ON dashboard_product_snapshots (platform, captured_at DESC)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS dashboard_ads_audit_snapshots (
      id BIGSERIAL PRIMARY KEY,
      platform TEXT NOT NULL DEFAULT 'amazon_sp',
      captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      payload JSONB NOT NULL
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS dashboard_ads_audit_latest_idx
    ON dashboard_ads_audit_snapshots (platform, captured_at DESC)
  `;

  tablesReady = true;
  return true;
}

async function readLatestAdsAuditSnapshot(platform) {
  const sql = await getSql();
  if (!sql) return null;
  await ensureTables();

  const rows = await sql`
    SELECT payload, captured_at
    FROM dashboard_ads_audit_snapshots
    WHERE platform = ${platform}
    ORDER BY captured_at DESC
    LIMIT 1
  `;

  if (!rows.length) return null;
  return {
    payload: rows[0].payload,
    capturedAt: rows[0].captured_at,
  };
}

async function readLatestMetricSnapshot(scope, rangeName) {
  const sql = await getSql();
  if (!sql) return null;
  await ensureTables();

  const rows = await sql`
    SELECT payload, captured_at, stale_after
    FROM dashboard_metric_snapshots
    WHERE scope = ${scope} AND range_name = ${rangeName}
    ORDER BY captured_at DESC
    LIMIT 1
  `;

  if (!rows.length) return null;
  const row = rows[0];
  return {
    payload: row.payload,
    capturedAt: row.captured_at,
    staleAfter: row.stale_after,
    stale: new Date(row.stale_after).getTime() <= Date.now(),
  };
}

async function writeMetricSnapshot({ scope, rangeName, payload, staleAfter, sourceStatus }) {
  const sql = await getSql();
  if (!sql) return false;
  await ensureTables();

  await sql`
    INSERT INTO dashboard_metric_snapshots
      (scope, range_name, stale_after, payload, source_status)
    VALUES
      (${scope}, ${rangeName}, ${staleAfter.toISOString()}, ${JSON.stringify(payload)}::jsonb, ${JSON.stringify(sourceStatus)}::jsonb)
  `;
  return true;
}

async function readLatestProductSnapshot(platform) {
  const sql = await getSql();
  if (!sql) return null;
  await ensureTables();

  const rows = await sql`
    SELECT payload, captured_at
    FROM dashboard_product_snapshots
    WHERE platform = ${platform}
    ORDER BY captured_at DESC
    LIMIT 1
  `;

  if (!rows.length) return null;
  return {
    payload: rows[0].payload,
    capturedAt: rows[0].captured_at,
  };
}

async function writeAdsAuditSnapshot({ platform, payload }) {
  const sql = await getSql();
  if (!sql) return false;
  await ensureTables();

  await sql`
    INSERT INTO dashboard_ads_audit_snapshots
      (platform, payload)
    VALUES
      (${platform}, ${JSON.stringify(payload)}::jsonb)
  `;
  return true;
}

async function writeProductSnapshot({ platform, payload }) {
  const sql = await getSql();
  if (!sql) return false;
  await ensureTables();

  await sql`
    INSERT INTO dashboard_product_snapshots
      (platform, payload)
    VALUES
      (${platform}, ${JSON.stringify(payload)}::jsonb)
  `;
  return true;
}

module.exports = {
  getDatabaseStatus,
  readLatestMetricSnapshot,
  writeMetricSnapshot,
  readLatestProductSnapshot,
  writeProductSnapshot,
  readLatestAdsAuditSnapshot,
  writeAdsAuditSnapshot,
};
