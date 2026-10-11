"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const homeNotes = [
  "Your money plan is ready for a quick check-in.",
  "I can help you understand what is safe to spend.",
  "Ask me about a bill, goal, or purchase anytime.",
];

const advisorNotes = [
  "Hi, I’m Kiki. Ask me what your plan means for today.",
  "I use your saved Gift plan to keep answers personal.",
  "Try asking what is due next or where you have room.",
];

export default function Kiki({
  variant = "home",
  onAction,
}: {
  variant?: "home" | "advisor";
  onAction?: () => void;
}) {
  const notes = variant === "advisor" ? advisorNotes : homeNotes;
  const [note, setNote] = useState(0);

  return (
    <aside className={`kiki-guide kiki-${variant}`} aria-label="Kiki, your Gift guide">
      <button
        type="button"
        className="kiki-character"
        onClick={() => {
          if (variant === "home" && onAction) onAction();
          else setNote((current) => (current + 1) % notes.length);
        }}
        aria-label={variant === "home" ? "Open Gift AI with Kiki" : "Hear another tip from Kiki"}
      >
        <Image
          src="/images/kiki-mascot.png"
          width={284}
          height={320}
          sizes={variant === "home" ? "72px" : "(max-width: 700px) 110px, 145px"}
          alt="Kiki, Gift’s friendly money guide"
          priority={variant === "home"}
        />
      </button>
      <div className="kiki-bubble" aria-live="polite">
        <span><Sparkles size={12} /> KIKI</span>
        <p>{notes[note]}</p>
        {onAction && (
          <button type="button" onClick={onAction}>
            Ask Kiki <ArrowRight size={13} />
          </button>
        )}
      </div>
    </aside>
  );
}
