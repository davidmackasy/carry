import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

globalThis.advisorEnv = {};

const result = await build({
  entryPoints: ["services/advisor/openai.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  plugins: [
    {
      name: "worker-env",
      setup(builder) {
        builder.onResolve({ filter: /^cloudflare:workers$/ }, () => ({
          path: "worker-env",
          namespace: "test",
        }));
        builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({
          contents: "export const env=globalThis.advisorEnv",
        }));
      },
    },
  ],
});
const { openAIAdvisor } = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);

const state = {
  name: "Private Name",
  timezone: "America/Los_Angeles",
  accounts: [{ id: "a", name: "Checking", balance: 100000 }],
  income: [],
  bills: [],
  categories: [],
  transactions: [
    {
      id: "t",
      merchant: "Sensitive Merchant",
      amount: 1000,
      date: "2026-09-30",
      categoryId: "c",
      excluded: false,
      recurring: false,
    },
  ],
  goals: [],
  purchases: [],
  protectedMinimum: 0,
  periodStart: "2026-09-01",
  periodEnd: "2026-09-30",
  snapshots: [],
  notificationSettings: { bills: true, budget: true, goals: true },
  onboarded: true,
};

test("advisor uses GPT-5 without sending identity or raw transactions", async () => {
  globalThis.advisorEnv.OPENAI_API_KEY = "test-key";
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (_url, init) => {
    request = JSON.parse(init.body);
    return Response.json({
      output: [
        { content: [{ type: "output_text", text: "A useful answer." }] },
      ],
    });
  };
  try {
    assert.equal(
      await openAIAdvisor(
        state,
        "Can I afford dinner?",
        [{ role: "assistant", text: "What amount?" }],
        "private-user-id",
      ),
      "A useful answer.",
    );
    assert.equal(request.model, "gpt-5");
    assert.equal(request.store, false);
    assert.equal(request.reasoning.effort, "minimal");
    assert.equal(request.text.verbosity, "low");
    assert.equal(request.max_output_tokens, 4_000);
    assert.equal(request.input[0].role, "assistant");
    assert.equal(typeof request.safety_identifier, "string");
    assert.notEqual(request.safety_identifier, "private-user-id");
    const serialized = JSON.stringify(request);
    assert.doesNotMatch(serialized, /Private Name/);
    assert.doesNotMatch(serialized, /Sensitive Merchant/);
    assert.doesNotMatch(serialized, /private-user-id/);
  } finally {
    globalThis.fetch = originalFetch;
    delete globalThis.advisorEnv.OPENAI_API_KEY;
  }
});

test("advisor reports unavailable when the server key is absent", async () => {
  delete globalThis.advisorEnv.OPENAI_API_KEY;
  assert.equal(await openAIAdvisor(state, "Hello", [], "user"), null);
});
