import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET as getRssFeed } from "../app/feed.xml/route.js";
import { GET as getJsonFeed } from "../app/feed.json/route.js";
import { GET as getPricesApi, OPTIONS as optionsPricesApi } from "../app/api/prices/route.js";
import { getWeeklySummary } from "../lib/services/fuel-service.js";

describe("Feeds and Benchmarks Tests", () => {
  it("should provide WTI international benchmark in weekly summary", () => {
    const summary = getWeeklySummary();
    assert.ok(summary.wti, "WTI benchmark must be defined");
    assert.strictEqual(typeof summary.wti.priceUsd, "number");
    assert.ok(summary.wti.priceUsd > 0);
    assert.strictEqual(typeof summary.wti.changeUsd, "number");
    assert.ok(summary.wti.label.includes("WTI"));
  });

  it("should generate a valid RSS 2.0 XML feed with correct content-type", async () => {
    const response = await getRssFeed();
    assert.strictEqual(response.status, 200);
    assert.ok(
      response.headers.get("Content-Type")?.includes("application/rss+xml"),
      "Must have application/rss+xml header"
    );

    const xml = await response.text();
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes("<rss version=\"2.0\""));
    assert.ok(xml.includes("<title>subiólagasolina"));
    assert.ok(xml.includes("<item>"));
    assert.ok(xml.includes("Gasolina Premium"));
  });

  it("should generate a valid JSON Feed v1.1 with correct structure", async () => {
    const response = await getJsonFeed();
    assert.strictEqual(response.status, 200);
    assert.ok(
      response.headers.get("Content-Type")?.includes("application/feed+json"),
      "Must have application/feed+json header"
    );

    const json = await response.json();
    assert.strictEqual(json.version, "https://jsonfeed.org/version/1.1");
    assert.strictEqual(json.title, "subiólagasolina — Precios de Combustibles en República Dominicana");
    assert.ok(Array.isArray(json.items));
    assert.ok(json.items.length > 0);
    assert.ok(json.items[0].id.includes("subiolagasolina"));
    assert.ok(json.items[0].title.includes("Aviso MICM"));
  });

  it("should provide public /api/prices with edge CDN caching and metadata attribution", async () => {
    const fakeRequest = new Request("https://subiolagasolina.com/api/prices");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await getPricesApi(fakeRequest as any);
    assert.strictEqual(response.status, 200);

    const cacheHeader = response.headers.get("Cache-Control");
    assert.ok(cacheHeader?.includes("s-maxage=86400"), "Must cache on edge CDN for 24h");
    assert.ok(cacheHeader?.includes("stale-while-revalidate=604800"), "Must support background stale-while-revalidate");
    assert.strictEqual(response.headers.get("Access-Control-Allow-Origin"), "*");

    const data = await response.json();
    assert.ok(data._meta, "Response must include _meta attribution object");
    assert.ok(data._meta.attribution.includes("subiólagasolina"));
    assert.ok(data._meta.canonical.includes("subiolagasolina.com"));
    assert.ok(data._meta.license.includes("CC BY 4.0"));
    assert.ok(data._meta.supportUs);
    assert.ok(data.summary);
    assert.ok(data.current);
    assert.ok(data.verdict, "Response must include top-level verdict");
    assert.ok(data.scopes, "Response must include scopes breakdown");
    assert.ok(data.changes, "Response must include categorized changes");
  });


  it("should support OPTIONS preflight for /api/prices", async () => {
    const response = await optionsPricesApi();
    assert.strictEqual(response.status, 204);
    assert.strictEqual(response.headers.get("Access-Control-Allow-Origin"), "*");
  });
});

