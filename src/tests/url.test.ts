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
      if (origVercelUrl === undefined) {
        delete process.env.VERCEL_URL;
      } else {
        process.env.VERCEL_URL = origVercelUrl;
      }
    }
  });

  it("should resolve VERCEL_PROJECT_PRODUCTION_URL when configured with a custom domain", () => {
    const origProjUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    try {
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "www.subiolagasolina.com";
      const resolved = getBaseUrl();
      assert.strictEqual(resolved, "https://www.subiolagasolina.com");
    } finally {
      if (origProjUrl === undefined) {
        delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      } else {
        process.env.VERCEL_PROJECT_PRODUCTION_URL = origProjUrl;
      }
    }
  });

  it("should default to PRIMARY_DOMAIN in production when Vercel provides default vercel.app", () => {
    const origEnv = process.env.NODE_ENV;
    const origProjUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    try {
      (process.env as Record<string, string>).NODE_ENV = "production";
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "subiolagasolina.vercel.app";
      const resolved = getBaseUrl();
      assert.strictEqual(resolved, `https://${PRIMARY_DOMAIN}`);
    } finally {
      (process.env as Record<string, string>).NODE_ENV = origEnv || "test";
      if (origProjUrl === undefined) {
        delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      } else {
        process.env.VERCEL_PROJECT_PRODUCTION_URL = origProjUrl;
      }
    }
  });

  it("should produce valid absolute URLs with getAbsoluteUrl", () => {
    const abs = getAbsoluteUrl("/feed.xml");
    assert.ok(abs.endsWith("/feed.xml"));
    assert.ok(abs.startsWith("http"));
  });
});
