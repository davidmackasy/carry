import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
async function load(path) {
  const r = await build({
    entryPoints: [path],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
  });
  return import(
    "data:text/javascript;base64," +
      Buffer.from(r.outputFiles[0].text).toString("base64")
  );
}
const { receiptDraft } = await load("lib/lifestyle/receipt.ts");
const { remindersFor } = await load("services/notifications/index.ts");
const { forecastBalance } = await load("services/finance/index.ts");
const base = () => ({
  name: "Test",
  accounts: [{ id: "a", name: "Cash", balance: 100000 }],
  categories: [{ id: "g", name: "Groceries", budget: 36000, icon: "leaf" }],
  transactions: [],
  income: [],
  bills: [],
  goals: [],
  purchases: [],
  snapshots: [],
  protectedMinimum: 0,
  periodStart: "2026-09-01",
  periodEnd: "2026-09-30",
  notificationSettings: { budget: true, bills: true, goals: true },
  reminders: {
    paydayEnabled: true,
    paydayDays: 2,
    billsEnabled: true,
    billDays: 3,
    emailEnabled: true,
    sendHour: 9,
    smartEnabled: true,
  },
  onboarded: true,
});
test("receipt draft extracts merchant, total, date, and purchased items while excluding tax", () => {
  const d = receiptDraft(
    "Market\n09/30/2026 10:42 AM\nMilk 3.49\nSUBTOTAL 3.49\nTAX 0.30\nTOTAL $3.79",
  );
  assert.equal(d.merchant, "Market");
  assert.equal(d.amount, "3.79");
  assert.equal(d.date, "2026-09-30");
  assert.deepEqual(d.items, [
    { name: "Milk", group: "Dairy & eggs", amount: "3.49" },
  ]);
  assert.equal(receiptDraft("Unreadable").amount, "");
});
test("receipt draft handles named dates, comma totals, and multiple item groups", () => {
  const d = receiptDraft(
    "Fresh Foods\nSeptember 8, 2026\n2 Apples $4.20\nLaundry Detergent 12.50\nAMOUNT PAID 1,016.70",
  );
  assert.equal(d.date, "2026-09-08");
  assert.equal(d.amount, "1016.70");
  assert.deepEqual(d.items, [
    { name: "Apples", group: "Produce", amount: "4.20" },
    { name: "Laundry Detergent", group: "Household", amount: "12.50" },
  ]);
});
test("forecast opening balance reconciles every movement, with no actual balance mutation", () => {
  const s = base();
  s.bills = [
    {
      id: "b",
      name: "Phone",
      amount: 5000,
      date: "2026-09-29",
      frequency: "once",
      paidDates: [],
      paused: false,
    },
  ];
  s.income = [
    {
      id: "p",
      name: "Pay",
      amount: 20000,
      date: "2026-09-30",
      frequency: "once",
    },
  ];
  const rows = forecastBalance(s, "2026-09-29", 2);
  for (const r of rows)
    assert.equal(
      r.balance,
      r.openingBalance +
        r.income -
        r.bills -
        r.goals -
        r.spending -
        r.purchases,
    );
  assert.equal(rows[1].openingBalance, rows[0].balance);
  assert.equal(s.accounts[0].balance, 100000);
});
test("restock suggestions require three distinct consistent purchase dates and opt-in", () => {
  const s = base();
  s.transactions = ["2026-09-15", "2026-09-20", "2026-09-25"].map(
    (date, i) => ({
      id: String(i),
      merchant: "Shop",
      amount: 1000,
      date,
      categoryId: "g",
      excluded: false,
      items: [{ name: "Milk", group: "Dairy & eggs" }],
    }),
  );
  assert.equal(
    remindersFor(s, "2026-09-30").filter((r) => r.kind === "restock").length,
    1,
  );
  assert.equal(
    remindersFor(s, "2026-09-29").filter((r) => r.kind === "restock").length,
    0,
  );
  s.reminders.smartEnabled = false;
  assert.equal(
    remindersFor(s, "2026-09-30").filter((r) => r.kind === "restock").length,
    0,
  );
});
test("budget alert keeps stable deduplication key across repeated daily scans", () => {
  const s = base();
  s.transactions = [
    {
      id: "t",
      merchant: "Shop",
      amount: 37000,
      date: "2026-09-28",
      categoryId: "g",
      excluded: false,
    },
  ];
  const a = remindersFor(s, "2026-09-29").find((r) => r.kind === "budget"),
    b = remindersFor(s, "2026-09-30").find((r) => r.kind === "budget");
  assert.ok(a);
  assert.equal(a.id, b.id);
  assert.equal(
    remindersFor(s, "2026-10-01").filter((r) => r.kind === "budget").length,
    0,
  );
});
