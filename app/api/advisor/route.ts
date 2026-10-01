import { subscriptionRequired } from "@/lib/billing/access";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { readProfile } from "@/lib/store";
import { advisorAnswer, simulatePurchase } from "@/services/finance";
import { sampleState } from "@/services/finance/sample";
import { openAIAdvisor, type AdvisorMessage } from "@/services/advisor/openai";
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  const denied = await subscriptionRequired(user.userId, user.email);
  if (denied) return denied;
  try {
    const body = (await request.json()) as {
      demo?: boolean;
      amount?: number;
      question?: string;
      history?: AdvisorMessage[];
    };
    const state = body.demo
      ? sampleState()
      : (await readProfile(user.userId)).state;
    if (body.amount !== undefined) {
      if (
        !Number.isSafeInteger(body.amount) ||
        body.amount < 0 ||
        body.amount > 100000000000
      )
        return Response.json(
          { error: "Enter a valid amount." },
          { status: 400 },
        );
      return Response.json(simulatePurchase(state, body.amount));
    }
    if (
      typeof body.question !== "string" ||
      !body.question.trim() ||
      body.question.length > 1000
    )
      return Response.json(
        { error: "Enter a short question." },
        { status: 400 },
      );
    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (message): message is AdvisorMessage =>
              !!message &&
              (message.role === "user" || message.role === "assistant") &&
              typeof message.text === "string" &&
              message.text.length <= 1_000,
          )
          .slice(-8)
      : [];
    try {
      const answer = await openAIAdvisor(
        state,
        body.question.trim(),
        history,
        user.userId,
      );
      if (answer) return Response.json({ answer, source: "gpt-5" });
    } catch (error) {
      console.error("Gift Advisor model request failed", error);
    }
    return Response.json({
      answer: advisorAnswer(state, body.question),
      source: "calculation",
    });
  } catch {
    return Response.json(
      { error: "Unable to calculate this right now. Please retry." },
      { status: 503 },
    );
  }
}
