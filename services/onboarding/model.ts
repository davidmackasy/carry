import type { FinanceState, Frequency } from "../../types/finance";
import { addDays, monthDate, today } from "../finance/index";
import { subscriptionCatalog } from "../subscriptions/catalog";

export type SetupBill = {
  id: string;
  name: string;
  amount: string;
  date: string;
  frequency: Frequency;
  subscription: boolean;
  selected: boolean;
};
export type SetupIncome = {
  id: string;
  name: string;
  employer: string;
  amount: string;
  date: string;
  frequency: Frequency;
  payDays: number[];
};
export type SetupGoal = {
  id: string;
  name: string;
  target: string;
  saved: string;
  contribution: string;
  date: string;
  targetDate: string;
  icon: string;
};
export type SetupDraft = {
  step: number;
  slide?: number;
  name: string;
  timezone: string;
  cash: string;
  minimum: string;
  employment:
    | "employed"
    | "self-employed"
    | "student"
    | "retired"
    | "between-jobs"
    | "other";
  income: SetupIncome[];
  housing: "rent" | "mortgage" | "neither" | "";
  bills: SetupBill[];
  categories: { id: string; name: string; budget: string; icon: string }[];
  goals: SetupGoal[];
  reminders: {
    paydayEnabled: boolean;
    paydayDays: number;
    billsEnabled: boolean;
    billDays: number;
    emailEnabled: boolean;
    sendHour: number;
  };
};
export const billGroups = [
  {
    title: "Getting around",
    hint: "Do you have a vehicle or regular transport costs?",
    items: [
      ["car-payment", "Car payment"],
      ["car-insurance", "Car insurance"],
      ["transport", "Transit pass or parking"],
    ],
  },
  {
    title: "Keeping the lights on",
    hint: "Which household bills do you pay?",
    items: [
      ["electricity", "Electricity"],
      ["water", "Water & sewer"],
      ["heating", "Gas / heating"],
      ["internet", "Internet"],
      ["phone", "Phone"],
    ],
  },
  {
    title: "Loans & people you care for",
    hint: "Include the regular payment, not the entire loan balance.",
    items: [
      ["student-loan", "Student loan"],
      ["personal-loan", "Personal loan"],
      ["credit-card", "Credit card minimum"],
      ["childcare", "Childcare"],
      ["insurance", "Health / life insurance"],
    ],
  },
  {
    title: "Popular subscriptions",
    hint: "Choose each service separately so Gift can track its real price and due date.",
    items: subscriptionCatalog
      .filter((item) =>
        [
          "Netflix",
          "Hulu",
          "Disney+",
          "Max",
          "Amazon Prime",
          "Spotify",
          "Apple Music",
          "iCloud+",
          "Google One",
          "Xbox Game Pass",
          "PlayStation Plus",
          "Planet Fitness",
        ].includes(item.name),
      )
      .map((item) => [item.id, item.name]),
  },
  {
    title: "Subscriptions you may have forgotten",
    hint: "Delivery, news, fitness, security, and cloud plans can be easy to miss.",
    items: subscriptionCatalog
      .filter((item) =>
        [
          "Walmart+",
          "Instacart+",
          "DoorDash DashPass",
          "Uber One",
          "Audible",
          "Apple News+",
          "Kindle Unlimited",
          "Ring Protect",
          "Calm",
          "Headspace",
          "Microsoft 365",
          "Adobe Creative Cloud",
        ].includes(item.name),
      )
      .map((item) => [item.id, item.name]),
  },
  {
    title: "Other commitments",
    hint: "Add memberships or recurring bills that are not listed.",
    items: [
      ["gym", "Other gym membership"],
      ["other", "Other recurring bill"],
    ],
  },
];
const dollars = (n: number) => String(n / 100);
export function makeDraft(state: FinanceState): SetupDraft {
  const date = today(state.timezone);
  return {
    step: 0,
    name: state.name,
    timezone:
      state.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    cash: state.accounts.length ? dollars(state.accounts[0].balance) : "",
    minimum: dollars(state.protectedMinimum),
    employment: state.employment?.status ?? "employed",
    income: state.income.map((i) => ({
      id: i.id,
      name: i.name,
      employer: i.employer ?? "",
      amount: dollars(i.amount),
      date: i.date,
      frequency: i.frequency,
      payDays: i.payDays ?? [1, 15],
    })),
    housing: state.bills.some((b) => /rent/i.test(b.name))
      ? "rent"
      : state.bills.some((b) => /mortgage/i.test(b.name))
        ? "mortgage"
        : "",
    bills: state.bills.map((b) => ({
      id: b.id,
      name: b.name,
      amount: dollars(b.amount),
      date: b.date,
      frequency: b.frequency,
      subscription: b.subscription,
      selected: !b.paused,
    })),
    categories: state.categories.length
      ? state.categories.map((c) => ({ ...c, budget: dollars(c.budget) }))
      : [
          { id: "groceries", name: "Groceries", budget: "", icon: "leaf" },
          { id: "gas", name: "Gas / transport", budget: "", icon: "car" },
          { id: "living", name: "Everyday living", budget: "", icon: "coffee" },
        ],
    goals: state.goals.map((g) => ({
      ...g,
      target: dollars(g.target),
      saved: dollars(g.saved),
      contribution: dollars(g.contribution),
    })),
    reminders: state.reminders ?? {
      paydayEnabled: true,
      paydayDays: 2,
      billsEnabled: true,
      billDays: 3,
      emailEnabled: false,
      sendHour: 9,
    },
  };
}
export const parseAmount = (value: string, label: string, allowZero = true) => {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim()))
    throw new Error(
      `Enter ${label} as a dollar amount with at most two decimal places.`,
    );
  const amount = Math.round(Number(value) * 100);
  if (
    !Number.isSafeInteger(amount) ||
    amount > 100000000000 ||
    amount < (allowZero ? 0 : 1)
  )
    throw new Error(`Enter a valid ${label}.`);
  return amount;
};
const validDate = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !isNaN(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
export function validateStep(
  d: SetupDraft,
  step: number,
  date = today(d.timezone),
) {
  if (step === 0) {
    if (!d.name.trim()) throw new Error("What should we call you?");
    parseAmount(d.cash, "available balance");
    parseAmount(d.minimum, "cash buffer");
  }
  if (step === 1) {
    for (const i of d.income) {
      if (!i.name.trim()) throw new Error("Give each income source a name.");
      parseAmount(i.amount, "estimated take-home pay", false);
      if (!validDate(i.date) || i.date < date)
        throw new Error(
          "Choose today or a future date for your next expected payday.",
        );
      if (i.frequency === "semimonthly") {
        if (
          new Set(i.payDays).size !== 2 ||
          i.payDays.some((n) => !Number.isInteger(n) || n < 1 || n > 31)
        )
          throw new Error("Choose two different monthly pay days.");
        const day = Number(i.date.slice(-2)),
          last = new Date(
            Date.UTC(Number(i.date.slice(0, 4)), Number(i.date.slice(5, 7)), 0),
          ).getUTCDate();
        if (!i.payDays.some((n) => Math.min(n, last) === day))
          throw new Error(
            "Your next payday must match one of your twice-monthly pay days.",
          );
      }
    }
  }
  if (step === 2 && !d.housing)
    throw new Error(
      "Choose your housing situation so we know what to include.",
    );
  if (step === 2 || step === 3) {
    for (const b of d.bills.filter((b) => b.selected)) {
      if (!b.name.trim()) throw new Error("Give each bill a name.");
      parseAmount(b.amount, `${b.name} payment`, false);
      if (!validDate(b.date))
        throw new Error(`Choose a due date for ${b.name}.`);
    }
  }
  if (step === 4) {
    for (const c of d.categories) parseAmount(c.budget, `${c.name} budget`);
    for (const g of d.goals) {
      if (!g.name.trim()) throw new Error("Give your savings goal a name.");
      const target = parseAmount(g.target, "savings target", false),
        saved = parseAmount(g.saved, "already-saved amount");
      if (saved > target)
        throw new Error(
          "The savings target must be at least the amount already saved.",
        );
      parseAmount(g.contribution, "monthly savings contribution");
      if (!validDate(g.date) || !validDate(g.targetDate))
        throw new Error("Choose valid contribution and target dates.");
    }
  }
  if (step === 5) {
    for (const n of [d.reminders.paydayDays, d.reminders.billDays])
      if (!Number.isInteger(n) || n < 0 || n > 14)
        throw new Error("Reminder lead times must be between 0 and 14 days.");
    if (
      !Number.isInteger(d.reminders.sendHour) ||
      d.reminders.sendHour < 0 ||
      d.reminders.sendHour > 23
    )
      throw new Error("Choose a valid reminder hour.");
  }
}
export function completeSetup(
  base: FinanceState,
  d: SetupDraft,
  date = today(d.timezone),
): FinanceState {
  for (let step = 0; step < 6; step++) validateStep(d, step, date);
  const accounts = base.accounts.length
    ? base.accounts.map((a, i) =>
        i === 0 ? { ...a, balance: parseAmount(d.cash, "balance") } : a,
      )
    : [
        {
          id: "primary-cash",
          name: "Everyday checking",
          balance: parseAmount(d.cash, "balance"),
        },
      ];
  return {
    ...base,
    name: d.name.trim(),
    timezone: d.timezone,
    accounts,
    protectedMinimum: parseAmount(d.minimum, "buffer"),
    employment: { status: d.employment },
    income: d.income.map((i) => ({
      ...base.income.find((x) => x.id === i.id),
      id: i.id,
      name: i.name.trim(),
      employer: i.employer.trim(),
      amount: parseAmount(i.amount, "pay"),
      date: i.date,
      frequency: i.frequency,
      payDays: i.frequency === "semimonthly" ? i.payDays : undefined,
    })),
    bills: d.bills
      .filter((b) => b.selected || base.bills.some((x) => x.id === b.id))
      .map((b) => ({
        ...base.bills.find((x) => x.id === b.id),
        id: b.id,
        name: b.name.trim(),
        amount: parseAmount(b.amount, "bill"),
        date: b.date,
        frequency: b.frequency,
        subscription: b.subscription,
        paused: !b.selected,
        paidDates: base.bills.find((x) => x.id === b.id)?.paidDates ?? [],
      })),
    categories: d.categories.map((c) => ({
      ...c,
      name: c.name.trim(),
      budget: parseAmount(c.budget, "budget"),
    })),
    goals: d.goals.map((g) => ({
      ...g,
      name: g.name.trim(),
      target: parseAmount(g.target, "target"),
      saved: parseAmount(g.saved, "saved"),
      contribution: parseAmount(g.contribution, "contribution"),
    })),
    periodStart: base.onboarded ? base.periodStart : date,
    periodEnd: base.onboarded ? base.periodEnd : addDays(date, 29),
    reminders: d.reminders,
    onboarded: true,
    setupVersion: 2,
  };
}
