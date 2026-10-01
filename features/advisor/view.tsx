"use client";
import { useState } from "react";
import { ArrowUp, ArrowUpRight, MessageCircle } from "lucide-react";
import type { FinanceState } from "@/types/finance";
import { advisorAnswer } from "@/services/finance";
export default function Advisor({
  state,
  demo,
  open,
}: {
  state: FinanceState;
  demo: boolean;
  open: (type: string) => void;
}) {
  const [question, setQuestion] = useState(""),
    [messages, setMessages] = useState<
      { role: "user" | "assistant"; text: string; source?: string }[]
    >([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function ask(q: string) {
    if (!q.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      let answer,
        source = "calculation";
      if (demo) answer = advisorAnswer(state, q);
      else {
        const r = await fetch("/api/advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: q,
            history: messages.map(({ role, text }) => ({ role, text })),
          }),
        });
        const data = (await r.json()) as {
          error: string;
          answer: string;
          source: string;
        };
        if (!r.ok) throw new Error(data.error);
        answer = data.answer;
        source = data.source;
      }
      setMessages([
        ...messages,
        { role: "user", text: q },
        { role: "assistant", text: answer, source },
      ]);
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="advisor gift-page gift-advisor">
      <div className="advisor-intro">
        <span className="advisor-mark">
          <MessageCircle size={30} />
        </span>
        <h2>A little clarity, just for you.</h2>
        <p>Make your next money decision with a little more confidence.</p>
        <span className="small-note">
          Ask your own questions. Gift uses your saved budget and calculations
          to give a personalized answer.
        </span>
      </div>
      <button className="afford-card" onClick={() => open("purchase")}>
        <b>Can I afford it?</b>
        <span>Try a purchase before making it.</span>
        <strong>
          See the impact <ArrowUpRight size={17} />
        </strong>
      </button>
      <div className="suggestions">
        {[
          "Can I spend $200 this weekend?",
          "What bills are coming next week?",
          "Where am I overspending?",
          "How can I reach my savings goals?",
          "Why did my runway decrease?",
          "What if my rent increases by $200?",
        ].map((q) => (
          <button key={q} onClick={() => ask(q)} disabled={busy}>
            {q}
            <ArrowUpRight size={16} />
          </button>
        ))}
      </div>
      <div className="messages" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={"message " + m.role}>
            <span className="eyebrow">
              {m.role === "user"
                ? "YOU"
                : m.source === "gpt-5"
                  ? "Gift AI"
                  : "Gift calculation"}
            </span>
            <p>{m.text}</p>
          </div>
        ))}
        {busy && <p className="subtle">Checking your numbers…</p>}
      </div>
      {error && <p className="error-message">{error}</p>}
      <form
        className="advisor-input"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          aria-label="Ask about your money"
          placeholder="What’s on your mind?"
          maxLength={1000}
        />
        <button
          className="round-add"
          disabled={busy || !question.trim()}
          aria-label="Send question"
        >
          <ArrowUp size={20} />
        </button>
      </form>
    </div>
  );
}
