const SHOPIFY_STOREFRONT_VERSION = "2024-10";
const SHOPIFY_ADMIN_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || "2026-04";
const GOOGLE_ADS_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v24";
const {
  getDatabaseStatus,
  readLatestMetricSnapshot,
  writeMetricSnapshot,
} = require("./_lib/database");
const { fetchAmazonInventorySummaries } = require("./_lib/amazon-seller");

function normalizeShopifyDomain(value) {
  if (!value) return "";
  return value.startsWith("http") ? value.replace(/\/$/, "") : `https://${value}`;
}

function cleanCustomerId(value) {
  return (value || "").replace(/-/g, "").trim();
}

function toYmd(date) {
  return date.toISOString().slice(0, 10);
}

function getRange(rangeName) {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);

  if (rangeName === "7d") start.setUTCDate(end.getUTCDate() - 6);
  else if (rangeName === "90d") start.setUTCDate(end.getUTCDate() - 89);
  else if (rangeName === "ytd") start.setUTCMonth(0, 1);
  else start.setUTCDate(end.getUTCDate() - 29);

  return {
    name: rangeName || "30d",
    startDate: toYmd(start),
    endDate: toYmd(end),
  };
}

function getStaleAfter(hours = 4) {
  const staleAfter = new Date();
  staleAfter.setHours(staleAfter.getHours() + hours);
  return staleAfter;
}

function sourceNeedsConfig(source, required) {
  return {
    source,
    status: "needs_config",
    message: `Missing ${required.join(", ")}`,
    metrics: {},
  };
}

function sourceError(source, error) {
  return {
    source,
    status: "error",
    message: error instanceof Error ? error.message : String(error),
    metrics: {},
  };
}

function money(value, currency = "USD") {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function number(value, options = {}) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return new Intl.NumberFormat("en-US", options).format(value);
}

async function postJson(url, headers, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const json = await response.json();

  if (!response.ok || json.errors) {
    const message =
      json.error?.message ||
      json.errors?.[0]?.message ||
      `Request failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  return json;
}

async function fetchShopifyCatalog() {
  const domain = normalizeShopifyDomain(
    process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  );
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!domain || !token) {
    return sourceNeedsConfig("shopifyCatalog", [
      "SHOPIFY_STORE_DOMAIN",
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN",
    ]);
  }

  try {
    let after = null;
    let productCount = 0;
    let availableProducts = 0;
    let pricedProducts = 0;
    let priceTotal = 0;
    let minPrice = null;
    let maxPrice = null;
    let currency = "USD";
    let page = 0;
    const query = `#graphql
      query DashboardProducts($after: String) {
        products(first: 250, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              availableForSale
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `;

    while (page < 10) {
      const json = await postJson(
        `${domain}/api/${SHOPIFY_STOREFRONT_VERSION}/graphql.json`,
        { "x-shopify-storefront-access-token": token },
        { query, variables: { after } },
      );
      const products = json.data.products;
      productCount += products.edges.length;
      availableProducts += products.edges.filter((edge) => edge.node.availableForSale).length;
      for (const edge of products.edges) {
        const range = edge.node.priceRange;
        const low = Number(range?.minVariantPrice?.amount);
        const high = Number(range?.maxVariantPrice?.amount);
        if (!Number.isFinite(low)) continue;
        pricedProducts += 1;
        priceTotal += low;
        minPrice = minPrice === null ? low : Math.min(minPrice, low);
        maxPrice = maxPrice === null ? high : Math.max(maxPrice, Number.isFinite(high) ? high : low);
        currency = range?.minVariantPrice?.currencyCode || currency;
      }

      if (!products.pageInfo.hasNextPage) break;
      after = products.pageInfo.endCursor;
      page += 1;
    }

    return {
      source: "shopifyCatalog",
      status: "live",
      message: "Live Shopify Storefront API",
      metrics: {
        productCount,
        availableProducts,
        averagePrice: pricedProducts ? priceTotal / pricedProducts : null,
        minPrice,
        maxPrice,
        currency,
      },
    };
  } catch (error) {
    return sourceError("shopifyCatalog", error);
  }
}

async function fetchShopifyOrders(range) {
  const domain = normalizeShopifyDomain(
    process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  );
  const token =
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

  if (!domain || !token) {
    return sourceNeedsConfig("shopifyOrders", [
      "SHOPIFY_STORE_DOMAIN",
      "SHOPIFY_ADMIN_ACCESS_TOKEN",
    ]);
  }

  try {
    let after = null;
    let page = 0;
    let orders = 0;
    let revenue = 0;
    let currency = "USD";
    const orderQuery = `created_at:>=${range.startDate} created_at:<=${range.endDate}`;
    const query = `#graphql
      query DashboardOrders($after: String, $query: String!) {
        orders(first: 100, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              currentTotalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `;

    while (page < 10) {
      const json = await postJson(
        `${domain}/admin/api/${SHOPIFY_ADMIN_VERSION}/graphql.json`,
        { "x-shopify-access-token": token },
        { query, variables: { after, query: orderQuery } },
      );
      const connection = json.data.orders;
      for (const edge of connection.edges) {
        orders += 1;
        const amount = edge.node.currentTotalPriceSet?.shopMoney;
        revenue += Number(amount?.amount || 0);
        currency = amount?.currencyCode || currency;
      }

      if (!connection.pageInfo.hasNextPage) break;
      after = connection.pageInfo.endCursor;
      page += 1;
    }

    return {
      source: "shopifyOrders",
      status: "live",
      message: "Live Shopify Admin API",
      metrics: {
        orders,
        revenue,
        averageOrderValue: orders ? revenue / orders : 0,
        currency,
      },
    };
  } catch (error) {
    return sourceError("shopifyOrders", error);
  }
}

async function fetchGoogleAccessToken() {
  const required = [
    "GOOGLE_ADS_OAUTH_CLIENT_ID",
    "GOOGLE_ADS_OAUTH_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
  ];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) throw new Error(`Missing ${missing.join(", ")}`);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_OAUTH_CLIENT_ID.trim(),
      client_secret: process.env.GOOGLE_ADS_OAUTH_CLIENT_SECRET.trim(),
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN.trim(),
      grant_type: "refresh_token",
    }),
  });
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error_description || json.error || "Google OAuth refresh failed");
  }

  return json.access_token;
}

async function fetchGoogleAds(range) {
  const customerId = cleanCustomerId(
    process.env.GOOGLE_ADS_CUSTOMER_ID || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  );
  const required = [
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_OAUTH_CLIENT_ID",
    "GOOGLE_ADS_OAUTH_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
  ];
  if (!customerId) required.push("GOOGLE_ADS_CUSTOMER_ID");
  const missing = required.filter((key) => !process.env[key]?.trim());

  if (missing.length) return sourceNeedsConfig("googleAds", missing);

  try {
    const accessToken = await fetchGoogleAccessToken();
    const query = `
      SELECT
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.clicks,
        metrics.impressions
      FROM campaign
      WHERE segments.date BETWEEN '${range.startDate}' AND '${range.endDate}'
        AND campaign.status != 'REMOVED'
    `;
    const loginCustomerId = cleanCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
    const explicitCustomerIds = (process.env.GOOGLE_ADS_CUSTOMER_IDS || "")
      .split(",")
      .map(cleanCustomerId)
      .filter(Boolean);
    const initialCustomerIds = explicitCustomerIds.length ? explicitCustomerIds : [customerId];
    let result = await fetchGoogleAdsMetricsForCustomers({
      accessToken,
      customerIds: initialCustomerIds,
      loginCustomerId,
      managerCustomerId: explicitCustomerIds.length ? loginCustomerId : "",
      query,
    });

    if (!result.liveAccountCount && result.managerAccountCount && !explicitCustomerIds.length) {
      const accessibleCustomerIds = await listAccessibleGoogleCustomers(accessToken);
      result = await fetchGoogleAdsMetricsForCustomers({
        accessToken,
        customerIds: accessibleCustomerIds,
        loginCustomerId: customerId,
        managerCustomerId: customerId,
        query,
      });
    }

    if (!result.liveAccountCount && result.lastError) throw result.lastError;

    const metrics = result.metrics;

    return {
      source: "googleAds",
      status: "live",
      message:
        result.liveAccountCount > 1
          ? `Live Google Ads API across ${result.liveAccountCount} accounts`
          : "Live Google Ads API",
      metrics: {
        ...metrics,
        cpa: metrics.conversions ? metrics.spend / metrics.conversions : null,
        roas: metrics.spend ? metrics.conversionValue / metrics.spend : null,
        accountCount: result.liveAccountCount,
      },
    };
  } catch (error) {
    return sourceError("googleAds", error);
  }
}

function createGoogleHeaders(accessToken, loginCustomerId) {
  const headers = {
    authorization: `Bearer ${accessToken}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN.trim(),
  };
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;
  return headers;
}

function getGoogleErrorCode(json) {
  const payload = Array.isArray(json) ? json[0] : json;
  return (
    payload.error?.details?.[0]?.errors?.[0]?.errorCode?.requestError ||
    payload.error?.details?.[0]?.errors?.[0]?.errorCode?.authorizationError ||
    payload.error?.details?.[0]?.errors?.[0]?.errorCode?.queryError ||
    ""
  );
}

function getGoogleErrorMessage(json, status) {
  const payload = Array.isArray(json) ? json[0] : json;
  return (
    payload.error?.details?.[0]?.errors?.[0]?.message ||
    payload.error?.message ||
    `Google Ads request failed with HTTP ${status}`
  );
}

async function listAccessibleGoogleCustomers(accessToken) {
  const response = await fetch(
    `https://googleads.googleapis.com/${GOOGLE_ADS_VERSION}/customers:listAccessibleCustomers`,
    {
      headers: createGoogleHeaders(accessToken),
    },
  );
  const json = await response.json();

  if (!response.ok) {
    throw new Error(getGoogleErrorMessage(json, response.status));
  }

  return (json.resourceNames || [])
    .map((resourceName) => cleanCustomerId(resourceName.replace("customers/", "")))
    .filter(Boolean);
}

async function requestGoogleAdsRows({ accessToken, customerId, loginCustomerId, query }) {
  const response = await fetch(
    `https://googleads.googleapis.com/${GOOGLE_ADS_VERSION}/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...createGoogleHeaders(accessToken, loginCustomerId),
      },
      body: JSON.stringify({ query }),
    },
  );
  const json = await response.json();

  if (!response.ok || json.errors || json.error) {
    const error = new Error(getGoogleErrorMessage(json, response.status));
    error.code = getGoogleErrorCode(json);
    throw error;
  }

  return Array.isArray(json) ? json.flatMap((chunk) => chunk.results || []) : json.results || [];
}

function addGoogleRowsToMetrics(metrics, rows) {
  for (const row of rows) {
    const rowMetrics = row.metrics || {};
    metrics.spend += Number(rowMetrics.costMicros || 0) / 1000000;
    metrics.conversions += Number(rowMetrics.conversions || 0);
    metrics.conversionValue += Number(rowMetrics.conversionsValue || 0);
    metrics.clicks += Number(rowMetrics.clicks || 0);
    metrics.impressions += Number(rowMetrics.impressions || 0);
  }
}

async function fetchGoogleAdsMetricsForCustomers({
  accessToken,
  customerIds,
  loginCustomerId,
  managerCustomerId,
  query,
}) {
  const metrics = { spend: 0, conversions: 0, conversionValue: 0, clicks: 0, impressions: 0 };
  let liveAccountCount = 0;
  let managerAccountCount = 0;
  let lastError = null;

  for (const customerId of customerIds) {
    const effectiveLoginCustomerId =
      managerCustomerId && customerId !== managerCustomerId ? managerCustomerId : loginCustomerId;
    try {
      const rows = await requestGoogleAdsRows({
        accessToken,
        customerId,
        loginCustomerId: effectiveLoginCustomerId,
        query,
      });
      addGoogleRowsToMetrics(metrics, rows);
      liveAccountCount += 1;
    } catch (error) {
      if (error.code === "REQUESTED_METRICS_FOR_MANAGER") {
        managerAccountCount += 1;
        lastError = error;
        continue;
      }
      if (effectiveLoginCustomerId && error.code === "USER_PERMISSION_DENIED") {
        try {
          const rows = await requestGoogleAdsRows({
            accessToken,
            customerId,
            loginCustomerId: "",
            query,
          });
          addGoogleRowsToMetrics(metrics, rows);
          liveAccountCount += 1;
          continue;
        } catch (retryError) {
          lastError = retryError;
          continue;
        }
      }
      lastError = error;
    }
  }

  return { metrics, liveAccountCount, managerAccountCount, lastError };
}

function unavailableSource(source, label, required) {
  return {
    source,
    status: "needs_config",
    message: `${label} is not connected yet. Required: ${required.join(", ")}`,
    metrics: {},
  };
}

function buildResponse(range, sources) {
  const shopifyOrders = sources.shopifyOrders;
  const shopifyCatalog = sources.shopifyCatalog;
  const googleAds = sources.googleAds;
  const amazonSeller = sources.amazonSeller;
  const currency = shopifyOrders.metrics.currency || "USD";
  const revenue = shopifyOrders.metrics.revenue;
  const adSpend = googleAds.metrics.spend;
  const roas =
    typeof revenue === "number" && typeof adSpend === "number" && adSpend > 0
      ? revenue / adSpend
      : null;
  const tacos =
    typeof revenue === "number" && typeof adSpend === "number" && revenue > 0
      ? (adSpend / revenue) * 100
      : null;

  return {
    generatedAt: new Date().toISOString(),
    cache: {
      mode: "direct",
      database: getDatabaseStatus(),
      stale: false,
    },
    range,
    summary: {
      netRevenue: {
        label: "Net Revenue",
        display: money(revenue, currency) || "Needs Admin key",
        status: shopifyOrders.status,
      },
      adSpend: {
        label: "Ad Spend",
        display: money(adSpend, "USD") || "Needs Ads key",
        status: googleAds.status,
      },
      blendedRoas: {
        label: "Blended ROAS",
        display: roas ? `${number(roas, { maximumFractionDigits: 1 })}x` : "Needs revenue + spend",
        status: roas ? "live" : "needs_config",
      },
      tacos: {
        label: "TACOS",
        display: tacos ? `${number(tacos, { maximumFractionDigits: 1 })}%` : "Needs revenue + spend",
        status: tacos ? "live" : "needs_config",
      },
      liveProducts: {
        label: "Live Products",
        display:
          typeof shopifyCatalog.metrics.productCount === "number"
            ? number(shopifyCatalog.metrics.productCount)
            : "Needs Storefront key",
        status: shopifyCatalog.status,
      },
      availableProducts: {
        label: "Available Products",
        display:
          typeof shopifyCatalog.metrics.availableProducts === "number"
            ? number(shopifyCatalog.metrics.availableProducts)
            : "Needs Storefront key",
        status: shopifyCatalog.status,
      },
      averageShopifyPrice: {
        label: "Avg Shopify Price",
        display: money(shopifyCatalog.metrics.averagePrice, shopifyCatalog.metrics.currency || "USD") || "Needs prices",
        status: shopifyCatalog.status,
      },
      shopifyPriceRange: {
        label: "Price Range",
        display:
          typeof shopifyCatalog.metrics.minPrice === "number" &&
          typeof shopifyCatalog.metrics.maxPrice === "number"
            ? `${money(shopifyCatalog.metrics.minPrice, shopifyCatalog.metrics.currency || "USD")} - ${money(shopifyCatalog.metrics.maxPrice, shopifyCatalog.metrics.currency || "USD")}`
            : "Needs prices",
        status: shopifyCatalog.status,
      },
    },
    channels: {
      shopify: {
        label: "Shopify Store",
        status: shopifyCatalog.status === "live" && shopifyOrders.status !== "live" ? "partial" : shopifyCatalog.status,
        message:
          shopifyOrders.status === "live"
            ? shopifyOrders.message
            : `${shopifyCatalog.message}; orders need Shopify Admin API`,
        metrics: {
          revenue: money(shopifyOrders.metrics.revenue, currency),
          orders: number(shopifyOrders.metrics.orders),
          products: number(shopifyCatalog.metrics.productCount),
          availableProducts: number(shopifyCatalog.metrics.availableProducts),
          averagePrice: money(shopifyCatalog.metrics.averagePrice, shopifyCatalog.metrics.currency || "USD"),
          priceRange:
            typeof shopifyCatalog.metrics.minPrice === "number" &&
            typeof shopifyCatalog.metrics.maxPrice === "number"
              ? `${money(shopifyCatalog.metrics.minPrice, shopifyCatalog.metrics.currency || "USD")} - ${money(shopifyCatalog.metrics.maxPrice, shopifyCatalog.metrics.currency || "USD")}`
              : null,
          averageOrderValue: money(shopifyOrders.metrics.averageOrderValue, currency),
        },
      },
      amazonAds: {
        label: "Amazon Seller",
        status: amazonSeller.status,
        message: amazonSeller.message,
        metrics: {
          skus: number(amazonSeller.metrics.skuCount),
          inStockSkus: number(amazonSeller.metrics.inStockSkus),
          units: number(amazonSeller.metrics.totalQuantity),
          marketplace: amazonSeller.metrics.marketplaceId || null,
        },
      },
      googleAds: {
        label: "Google Ads",
        status: googleAds.status,
        message: googleAds.message,
        metrics: {
          spend: money(googleAds.metrics.spend, "USD"),
          conversions: number(googleAds.metrics.conversions, { maximumFractionDigits: 1 }),
          cpa: money(googleAds.metrics.cpa, "USD"),
          roas: googleAds.metrics.roas
            ? `${number(googleAds.metrics.roas, { maximumFractionDigits: 1 })}x`
            : null,
          clicks: number(googleAds.metrics.clicks),
          impressions: number(googleAds.metrics.impressions),
        },
      },
      searchConsole: unavailableSource("searchConsole", "Search Console", [
        "GOOGLE_SEARCH_CONSOLE_SITE_URL",
        "GOOGLE_SERVICE_ACCOUNT_EMAIL",
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
      ]),
      meta: unavailableSource("meta", "Meta", [
        "META_AD_ACCOUNT_ID",
        "META_ACCESS_TOKEN",
      ]),
    },
  };
}

async function createMetricsPayload(rangeName) {
  const range = getRange(rangeName || "30d");
  const [shopifyCatalog, shopifyOrders, googleAds, amazonSeller] = await Promise.all([
    fetchShopifyCatalog(),
    fetchShopifyOrders(range),
    fetchGoogleAds(range),
    fetchAmazonInventorySummaries(),
  ]);

  return buildResponse(range, {
    shopifyCatalog,
    shopifyOrders,
    googleAds,
    amazonSeller,
  });
}

function getSourceStatus(payload) {
  return Object.fromEntries(
    Object.entries(payload.channels || {}).map(([key, value]) => [
      key,
      value.status || "unknown",
    ]),
  );
}

async function saveMetricsSnapshot(payload, scope = "company") {
  const written = await writeMetricSnapshot({
    scope,
    rangeName: payload.range.name,
    payload: {
      ...payload,
      cache: {
        mode: "snapshot",
        database: getDatabaseStatus(),
        stale: false,
      },
    },
    staleAfter: getStaleAfter(4),
    sourceStatus: getSourceStatus(payload),
  });

  return written;
}

function withCacheMetadata(payload, snapshot) {
  return {
    ...payload,
    cache: {
      mode: "snapshot",
      database: getDatabaseStatus(),
      capturedAt: snapshot.capturedAt,
      staleAfter: snapshot.staleAfter,
      stale: snapshot.stale,
    },
  };
}

async function handler(req, res) {
  const rangeName = req.query?.range || "30d";
  const scope = req.query?.scope || "company";
  const forceRefresh = req.query?.refresh === "1" || req.query?.refresh === "true";
  const database = getDatabaseStatus();

  if (database.enabled && !forceRefresh) {
    const snapshot = await readLatestMetricSnapshot(scope, rangeName);
    if (snapshot) {
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(withCacheMetadata(snapshot.payload, snapshot));
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      generatedAt: new Date().toISOString(),
      cache: {
        mode: "empty",
        database,
        stale: true,
      },
      range: getRange(rangeName),
      summary: {},
      channels: {},
      message: "No cached dashboard snapshot exists yet. Run /api/cron/sync or /api/metrics?refresh=1.",
    });
    return;
  }

  const payload = await createMetricsPayload(rangeName);
  let saved = false;
  if (database.enabled) {
    saved = await saveMetricsSnapshot(payload, scope);
  }

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ...payload,
    cache: {
      mode: forceRefresh ? "refresh" : "direct",
      database,
      saved,
      stale: false,
    },
  });
}

module.exports = handler;
module.exports.createMetricsPayload = createMetricsPayload;
module.exports.saveMetricsSnapshot = saveMetricsSnapshot;
module.exports.getRange = getRange;
