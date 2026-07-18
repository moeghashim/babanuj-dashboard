const DEFAULT_MARKETPLACE_ID = "ATVPDKIKX0DER";
const DEFAULT_BASE_URL = "https://sellingpartnerapi-na.amazon.com";

function pickEnv(keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value.trim();
  }
  return "";
}

function sourceNeedsConfig(source, required) {
  return {
    source,
    status: "needs_config",
    message: `Missing ${required.join(", ")}`,
    metrics: {},
    rows: [],
  };
}

function sourceError(source, error) {
  return {
    source,
    status: "error",
    message: error instanceof Error ? error.message : String(error),
    metrics: {},
    rows: [],
  };
}

function getAmazonSellerConfig() {
  return {
    clientId: pickEnv(["AMAZON_SELLER_CLIENT_ID", "SP_API_LWA_CLIENT_ID"]),
    clientSecret: pickEnv(["AMAZON_SELLER_CLIENT_SECRET", "SP_API_LWA_CLIENT_SECRET"]),
    refreshToken: pickEnv(["AMAZON_SELLER_REFRESH_TOKEN", "SP_API_REFRESH_TOKEN"]),
    marketplaceId: process.env.AMAZON_SELLER_MARKETPLACE_ID?.trim() || DEFAULT_MARKETPLACE_ID,
    baseUrl: process.env.AMAZON_SELLER_SP_API_URL?.trim() || DEFAULT_BASE_URL,
  };
}

async function fetchAccessToken(config) {
  const response = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: config.refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error_description || json.error || "Amazon LWA refresh failed");
  }

  return json.access_token;
}

function getSummaryQuantity(summary) {
  const value = Number(summary.totalQuantity || 0);
  return Number.isFinite(value) ? value : 0;
}

function mapInventorySummary(summary) {
  const details = summary.inventoryDetails || {};
  const totalQuantity = getSummaryQuantity(summary);

  return {
    asin: summary.asin || null,
    sellerSku: summary.sellerSku || "",
    fnSku: summary.fnSku || null,
    productName: summary.productName || null,
    condition: summary.condition || null,
    totalQuantity,
    fulfillableQuantity: Number(details.fulfillableQuantity || 0),
    inboundWorkingQuantity: Number(details.inboundWorkingQuantity || 0),
    inboundShippedQuantity: Number(details.inboundShippedQuantity || 0),
    inboundReceivingQuantity: Number(details.inboundReceivingQuantity || 0),
    lastUpdatedTime: summary.lastUpdatedTime || null,
  };
}

function buildInventoryResponse(rows, marketplaceId, message) {
  const inStockSkus = rows.filter((row) => row.totalQuantity > 0).length;
  const totalQuantity = rows.reduce((sum, row) => sum + row.totalQuantity, 0);

  return {
    source: "amazonSeller",
    status: "live",
    message,
    metrics: {
      marketplaceId,
      skuCount: rows.length,
      inStockSkus,
      totalQuantity,
    },
    rows,
  };
}

async function fetchAmazonInventorySummaries(options = {}) {
  const config = getAmazonSellerConfig();
  const required = [];
  if (!config.clientId) required.push("AMAZON_SELLER_CLIENT_ID");
  if (!config.clientSecret) required.push("AMAZON_SELLER_CLIENT_SECRET");
  if (!config.refreshToken) required.push("AMAZON_SELLER_REFRESH_TOKEN");
  if (!config.marketplaceId) required.push("AMAZON_SELLER_MARKETPLACE_ID");

  if (required.length) return sourceNeedsConfig("amazonSeller", required);

  try {
    const maxPages = options.maxPages || 10;
    const accessToken = await fetchAccessToken(config);
    const rows = [];
    let nextToken = null;
    let page = 0;

    do {
      const params = new URLSearchParams({
        granularityType: "Marketplace",
        granularityId: config.marketplaceId,
        marketplaceIds: config.marketplaceId,
        details: "true",
      });
      if (nextToken) params.set("nextToken", nextToken);

      const response = await fetch(`${config.baseUrl}/fba/inventory/v1/summaries?${params}`, {
        headers: {
          accept: "application/json",
          "x-amz-access-token": accessToken,
        },
      });
      const json = await response.json();

      if (!response.ok) {
        const message =
          json.errors?.[0]?.message ||
          json.message ||
          `Amazon Seller API request failed with HTTP ${response.status}`;
        throw new Error(message);
      }

      rows.push(...(json.payload?.inventorySummaries || []).map(mapInventorySummary));
      nextToken = json.payload?.pagination?.nextToken || null;
      page += 1;
    } while (nextToken && page < maxPages);

    const suffix = nextToken ? " (first pages only)" : "";
    return buildInventoryResponse(
      rows,
      config.marketplaceId,
      `Live Amazon FBA Inventory API${suffix}`,
    );
  } catch (error) {
    return sourceError("amazonSeller", error);
  }
}

module.exports = {
  fetchAmazonInventorySummaries,
};
