import { env } from "cloudflare:workers";
import type { FinanceState } from "@/types/finance";
import { money, summarize, today } from "@/services/finance";

export type AdvisorMessage = { role: "user" | "assistant"; text: string };

function financialContext(state: FinanceState) {
  const date = today(state.timezone);
  const summary = summarize(state, date);
  return {
    asOf: date,
    currency: "USD",
    availableAccountBalance: money(summary.balance, 2),
    protectedMinimum: money(state.protectedMinimum, 2),
    projectedRunwayDays: summary.runway.days,
    runwayProjectionCapped: summary.runway.capped,
    safeToSpendToday: money(summary.safe.remaining, 2),
    freeUntilNextPayday: money(summary.free, 2),
    nextPayday: summary.payday
      ? {
          date: summary.payday.date,
          estimatedAmount: money(summary.payday.amount, 2),
        }
      : null,
    upcomingBills: summary.bills.slice(0, 20).map((bill) => ({
      name: bill.name,
      due: bill.due,
      amount: money(bill.amount, 2),
      days: bill.days,
    })),
    spendingCategories: summary.categories.map((category) => ({
      name: category.name,
      budget: money(category.budget, 2),
      spent: money(category.spent, 2),
      remaining: money(category.remaining, 2),
      status: category.status,
    })),
    goals: state.goals.map((goal) => ({
      name: goal.name,
      target: money(goal.target, 2),
      saved: money(goal.saved, 2),
      plannedMonthlyContribution: money(goal.contribution, 2),
      targetDate: goal.targetDate,
    })),
  };
}

async function safetyIdentifier(userId: string) {
  const bytes = new TextEncoder().encode(userId);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function outputText(response: {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
}) {
  if (response.output_text?.trim()) return response.output_text.trim();
  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" && item.text)
      .map((item) => item.text)
      .join("\n")
      .trim() ?? ""
  );
}

export async function openAIAdvisor(
  state: FinanceState,
  question: string,
  history: AdvisorMessage[],
  userId: string,
) {
  const config = env as unknown as Record<string, string | undefined>;
  if (!config.OPENAI_API_KEY) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.OPENAI_ADVISOR_MODEL ?? "gpt-5",
        store: false,
        // GPT-5's output budget includes reasoning tokens. Keep reasoning light
        // so a concise user-facing answer is still produced reliably.
        reasoning: { effort: "minimal" },
        text: { verbosity: "low" },
        max_output_tokens: 4_000,
        safety_identifier: await safetyIdentifier(userId),
        instructions:
          "You are Gift AI, a warm, practical budgeting assistant. Use only the supplied Gift budget summary for personal claims. Clearly distinguish recorded facts from estimates. Never claim money arrived, a bill was paid, or a transaction occurred unless the summary says so. Do not provide investment, tax, legal, credit, or debt-settlement advice. Do not instruct the user to borrow, gamble, or make a financial product purchase. Give concise, specific next steps and show the relevant dollar figures. If data is missing, say what the user should add to Gift. End material projections with a brief reminder that this is a planning estimate, not financial advice.",
        input: [
          ...history.slice(-8).map((message) => ({
            role: message.role,
            content: message.text,
          })),
          {
            role: "user",
            content: `My question: ${question}\n\nCurrent Gift budget summary:\n${JSON.stringify(financialContext(state))}`,
          },
        ],
      }),
    });
    if (!response.ok) throw new Error(`OpenAI returned ${response.status}.`);
    const answer = outputText(await response.json());
    if (!answer) throw new Error("OpenAI returned an empty response.");
    return answer;
  } finally {
    clearTimeout(timeout);
  }
}
