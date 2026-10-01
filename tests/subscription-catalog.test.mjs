import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

const result = await build({
  entryPoints: ["services/subscriptions/catalog.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const catalog = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);

test("the picker offers a broad, grouped subscription catalog", () => {
  assert.ok(catalog.subscriptionCatalog.length >= 70);
  assert.ok(catalog.subscriptionGroups.includes("TV & movies"));
  assert.ok(catalog.subscriptionGroups.includes("Shopping & delivery"));
  assert.ok(catalog.subscriptionGroups.includes("Fitness & wellness"));
  for (const service of [
    "Netflix",
    "Amazon Prime",
    "Apple Music",
    "iCloud+",
    "Planet Fitness",
    "Xbox Game Pass",
  ]) {
    assert.ok(catalog.subscriptionCatalog.some((item) => item.name === service));
  }
});

test("subscription identifiers and names are unique", () => {
  const ids = catalog.subscriptionCatalog.map((item) => item.id);
  const names = catalog.subscriptionCatalog.map((item) => item.name.toLowerCase());
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(names).size, names.length);
});

test("annual memberships default to yearly while services default monthly", () => {
  assert.equal(catalog.subscriptionOption("costco-membership").frequency, "yearly");
  assert.equal(catalog.subscriptionOption("netflix").frequency, "monthly");
  assert.equal(catalog.subscriptionOption("missing"), undefined);
});
