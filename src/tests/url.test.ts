import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getBaseUrl,
  getAbsoluteUrl,
  normalizeUrl,
  isLocalhost,
  PRIMARY_DOMAIN,
  VERCEL_DOMAIN,
} from "../lib/utils/url.js";

describe("URL Utilities and Domain Resolution", () => {
  it("should correctly identify localhost addresses", () => {
    assert.strictEqual(isLocalhost("http://localhost:3000"), true);
    assert.strictEqual(isLocalhost("http://127.0.0.1:8080"), true);
    assert.strictEqual(isLocalhost("localhost:3000"), true);
    assert.strictEqual(isLocalhost("https://subiolagasolina.com"), false);
    assert.strictEqual(isLocalhost("https://subiolagasolina.vercel.app"), false);
  });

  it("should normalize URLs correctly", () => {
    assert.strictEqual(normalizeUrl("subiolagasolina.vercel.app"), "https://subiolagasolina.vercel.app");
    assert.strictEqual(normalizeUrl("http://subiolagasolina.vercel.app/"), "https://subiolagasolina.vercel.app");
    assert.strictEqual(normalizeUrl("https://subiolagasolina.com///"), "https://subiolagasolina.com");
  });

  it("should resolve Vercel deployment URLs when environment variables are set", () => {
    const origVercelUrl = process.env.VERCEL_URL;
    try {
      process.env.VERCEL_URL = "subiolagasolina.vercel.app";
      const resolved = getBaseUrl();
      assert.strictEqual(resolved, "https://subiolagasolina.vercel.app");
    } finally {
      process.env.VERCEL_URL = origVercelUrl;
    }
  });

  it("should resolve VERCEL_PROJECT_PRODUCTION_URL with priority", () => {
    const origProjUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    try {
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "subiolagasolina.vercel.app";
      const resolved = getBaseUrl();
      assert.strictEqual(resolved, "https://subiolagasolina.vercel.app");
    } finally {
      process.env.VERCEL_PROJECT_PRODUCTION_URL = origProjUrl;
    }
  });

  it("should produce valid absolute URLs with getAbsoluteUrl", () => {
    const abs = getAbsoluteUrl("/feed.xml");
    assert.ok(abs.endsWith("/feed.xml"));
    assert.ok(abs.startsWith("http"));
  });
});
