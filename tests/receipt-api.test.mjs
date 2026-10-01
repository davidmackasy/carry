import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

const mocks = {
  "@/app/chatgpt-auth":
    "export async function getChatGPTUser(){return globalThis.receiptUser}",
  "@/lib/billing/access":
    "export async function subscriptionRequired(){return globalThis.receiptDenied}",
  "@/services/receipts/openai":
    "export async function parseReceiptImage(){return globalThis.receiptDraft}",
};
const bundle = await build({
  entryPoints: ["app/api/receipts/parse/route.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  plugins: [
    {
      name: "mocks",
      setup(builder) {
        builder.onResolve({ filter: /^@\// }, (args) =>
          mocks[args.path] ? { path: args.path, namespace: "test" } : null,
        );
        builder.onLoad({ filter: /.*/, namespace: "test" }, (args) => ({
          contents: mocks[args.path],
        }));
      },
    },
  ],
});
const api = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

function request(origin = "https://gift.test") {
  return new Request("https://gift.test/api/receipts/parse", {
    method: "POST",
    headers: { origin, "Content-Type": "image/jpeg" },
    body: new Uint8Array([255, 216, 255, 0]),
  });
}

test("receipt parsing requires authentication and same-origin requests", async () => {
  globalThis.receiptUser = null;
  assert.equal((await api.POST(request())).status, 401);
  globalThis.receiptUser = { userId: "owner", email: "owner@example.test" };
  assert.equal((await api.POST(request("https://evil.test"))).status, 403);
});

test("receipt parsing returns structured purchase fields", async () => {
  globalThis.receiptUser = { userId: "owner", email: "owner@example.test" };
  globalThis.receiptDenied = null;
  globalThis.receiptDraft = {
    merchant: "Market",
    amount: "12.34",
    date: "2026-09-30",
    items: [{ name: "Milk", group: "Dairy & eggs", amount: "3.49" }],
  };
  const response = await api.POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), globalThis.receiptDraft);
});
