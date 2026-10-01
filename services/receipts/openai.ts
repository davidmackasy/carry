import { env } from "cloudflare:workers";
import type { ReceiptDraft, ReceiptItem } from "@/lib/lifestyle/receipt";

const groups = [
  "Produce",
  "Dairy & eggs",
  "Meat & seafood",
  "Pantry",
  "Frozen",
  "Household",
  "Personal care",
  "Other",
] as const;

function base64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
}

function outputText(response: {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}) {
  return (
    response.output_text?.trim() ??
    response.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" && item.text)
      .map((item) => item.text)
      .join("\n")
      .trim() ??
    ""
  );
}

function cleanDraft(value: unknown): ReceiptDraft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Record<string, unknown>;
  const merchant =
    typeof draft.merchant === "string"
      ? draft.merchant.trim().slice(0, 150)
      : "";
  const amount =
    typeof draft.amount === "string" && /^\d{1,9}\.\d{2}$/.test(draft.amount)
      ? draft.amount
      : "";
  const date =
    typeof draft.date === "string" && /^20\d{2}-\d{2}-\d{2}$/.test(draft.date)
      ? draft.date
      : "";
  const items: ReceiptItem[] = Array.isArray(draft.items)
    ? draft.items.slice(0, 80).flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const item = entry as Record<string, unknown>;
        const name =
          typeof item.name === "string" ? item.name.trim().slice(0, 150) : "";
        if (!name) return [];
        const group = groups.includes(item.group as (typeof groups)[number])
          ? String(item.group)
          : "Other";
        const itemAmount =
          typeof item.amount === "string" &&
          /^\d{1,9}\.\d{2}$/.test(item.amount)
            ? item.amount
            : "";
        return [{ name, group, amount: itemAmount }];
      })
    : [];
  return { merchant, amount, date, items };
}

export async function parseReceiptImage(bytes: Uint8Array) {
  const config = env as unknown as Record<string, string | undefined>;
  if (!config.OPENAI_API_KEY) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model:
          config.OPENAI_RECEIPT_MODEL ?? config.OPENAI_ADVISOR_MODEL ?? "gpt-5",
        store: false,
        reasoning: { effort: "minimal" },
        max_output_tokens: 3_000,
        instructions:
          "Read this retail receipt carefully. Extract only details visible in the image. merchant is the store or business name. amount is the final amount paid, excluding subtotal, tax, savings, balance, cash tendered, and change. date is the purchase date. items contains purchased products or services, excluding totals, taxes, discounts, payment lines, loyalty messages, and receipt metadata. Preserve recognizable item names and place each in the closest allowed group. Use an empty string when a field is unreadable. Never guess.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Extract the merchant, final total, purchase date, and purchased line items from this receipt.",
              },
              {
                type: "input_image",
                image_url: `data:image/jpeg;base64,${base64(bytes)}`,
                detail: "high",
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "gift_receipt",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                merchant: { type: "string" },
                amount: {
                  type: "string",
                  description:
                    "Final amount paid as digits with two decimals, or an empty string.",
                },
                date: {
                  type: "string",
                  description:
                    "Purchase date as YYYY-MM-DD, or an empty string.",
                },
                items: {
                  type: "array",
                  maxItems: 80,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      name: { type: "string" },
                      group: { type: "string", enum: groups },
                      amount: {
                        type: "string",
                        description:
                          "Line price as digits with two decimals, or an empty string.",
                      },
                    },
                    required: ["name", "group", "amount"],
                  },
                },
              },
              required: ["merchant", "amount", "date", "items"],
            },
          },
        },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI returned ${response.status}.`);
    const text = outputText(await response.json());
    if (!text) return null;
    return cleanDraft(JSON.parse(text));
  } finally {
    clearTimeout(timeout);
  }
}
