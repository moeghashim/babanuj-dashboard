const {
  getDatabaseStatus,
  readLatestProductSnapshot,
  writeProductSnapshot,
} = require("./_lib/database");
const { fetchAmazonInventorySummaries } = require("./_lib/amazon-seller");

const SHOPIFY_STOREFRONT_VERSION = "2024-10";

function normalizeShopifyDomain(value) {
  if (!value) return "";
  return value.startsWith("http") ? value.replace(/\/$/, "") : `https://${value}`;
}

function money(value, currency = "USD") {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
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

function sourceNeedsConfig(source, required) {
  return {
    source,
    status: "needs_config",
    message: `Missing ${required.join(", ")}`,
  };
}

function sourceError(source, error) {
  return {
    source,
    status: "error",
    message: error instanceof Error ? error.message : String(error),
  };
}

function getVariantPrice(product) {
  const variants = product.variants.edges.map((edge) => edge.node);
  const priced = variants
    .map((variant) => ({
      ...variant,
      amount: Number(variant.price.amount),
      currency: variant.price.currencyCode || "USD",
    }))
    .filter((variant) => Number.isFinite(variant.amount));

  return priced.sort((a, b) => a.amount - b.amount)[0] || null;
}

async function fetchShopifyProducts() {
  const domain = normalizeShopifyDomain(
    process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  );
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!domain || !token) {
    return {
      status: sourceNeedsConfig("shopify", [
        "SHOPIFY_STORE_DOMAIN",
        "SHOPIFY_STOREFRONT_ACCESS_TOKEN",
      ]),
      products: [],
    };
  }

  try {
    let after = null;
    let page = 0;
    const products = [];
    const query = `#graphql
      query DashboardProductPrices($after: String) {
        products(first: 250, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              handle
              title
              vendor
              productType
              availableForSale
              variants(first: 20) {
                edges {
                  node {
                    id
                    sku
                    title
                    availableForSale
                    price {
                      amount
                      currencyCode
                    }
                  }
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
      const connection = json.data.products;
      products.push(...connection.edges.map((edge) => edge.node));

      if (!connection.pageInfo.hasNextPage) break;
      after = connection.pageInfo.endCursor;
      page += 1;
    }

    return {
      status: {
        source: "shopify",
        status: "live",
        message: "Live Shopify Storefront API",
      },
      products,
    };
  } catch (error) {
    return {
      status: sourceError("shopify", error),
      products: [],
    };
  }
}

function normalizeSku(value) {
  return (value || "").trim().toLowerCase();
}

function buildAmazonSkuMap(amazonResult) {
  return new Map(
    (amazonResult.rows || [])
      .filter((row) => row.sellerSku)
      .map((row) => [normalizeSku(row.sellerSku), row]),
  );
}

function buildProductComparison(shopifyResult, amazonResult) {
  const amazonBySku = buildAmazonSkuMap(amazonResult);
  const rows = shopifyResult.products.map((product) => {
    const variants = product.variants.edges.map((edge) => edge.node);
    const sku = variants.find((variant) => variant.sku)?.sku || "";
    const price = getVariantPrice(product);
    const amazonListing = sku ? amazonBySku.get(normalizeSku(sku)) : null;

    return {
      key: sku || product.handle,
      title: product.title,
      sku,
      vendor: product.vendor,
      shopify: {
        productId: product.id,
        handle: product.handle,
        available: product.availableForSale,
        price: price ? price.amount : null,
        priceDisplay: price ? money(price.amount, price.currency) : null,
        currency: price?.currency || "USD",
        sales: null,
      },
      amazon: {
        asin: amazonListing?.asin || null,
        available:
          typeof amazonListing?.totalQuantity === "number"
            ? amazonListing.totalQuantity > 0
            : null,
        price: null,
        priceDisplay: null,
        sales:
          typeof amazonListing?.totalQuantity === "number"
            ? `${amazonListing.totalQuantity} units`
            : null,
        status: amazonListing ? amazonResult.status : "not_matched",
      },
      deltas: {
        price: null,
        sales: null,
      },
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    cache: {
      mode: "direct",
      database: getDatabaseStatus(),
      stale: false,
    },
    platforms: {
      shopify: {
        ...shopifyResult.status,
        productCount: shopifyResult.products.length,
      },
      amazon: {
        ...amazonResult,
        rows: undefined,
      },
    },
    rows,
  };
}

function withCacheMetadata(payload, snapshot) {
  return {
    ...payload,
    cache: {
      mode: "snapshot",
      database: getDatabaseStatus(),
      capturedAt: snapshot.capturedAt,
      stale: false,
    },
  };
}

async function createProductComparisonPayload() {
  const [shopifyResult, amazonResult] = await Promise.all([
    fetchShopifyProducts(),
    fetchAmazonInventorySummaries(),
  ]);
  return buildProductComparison(shopifyResult, amazonResult);
}

async function saveProductComparisonSnapshot(payload) {
  return writeProductSnapshot({
    platform: "product-comparison",
    payload: {
      ...payload,
      cache: {
        mode: "snapshot",
        database: getDatabaseStatus(),
        stale: false,
      },
    },
  });
}

async function handler(req, res) {
  const forceRefresh = req.query?.refresh === "1" || req.query?.refresh === "true";
  const database = getDatabaseStatus();

  if (database.enabled && !forceRefresh) {
    const snapshot = await readLatestProductSnapshot("product-comparison");
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
      platforms: {},
      rows: [],
      message: "No cached product snapshot exists yet. Run /api/cron/sync or /api/products?refresh=1.",
    });
    return;
  }

  const payload = await createProductComparisonPayload();
  let saved = false;
  if (database.enabled) {
    saved = await saveProductComparisonSnapshot(payload);
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
module.exports.createProductComparisonPayload = createProductComparisonPayload;
module.exports.saveProductComparisonSnapshot = saveProductComparisonSnapshot;
