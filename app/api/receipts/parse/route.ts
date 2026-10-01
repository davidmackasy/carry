import { getChatGPTUser } from "@/app/chatgpt-auth";
import { subscriptionRequired } from "@/lib/billing/access";
import { parseReceiptImage } from "@/services/receipts/openai";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  const denied = await subscriptionRequired(user.userId, user.email);
  if (denied) return denied;
  if (!request.headers.get("content-type")?.startsWith("image/jpeg"))
    return Response.json({ error: "Choose a receipt photo." }, { status: 400 });
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > 2_000_000)
    return Response.json(
      { error: "Choose an image smaller than 2 MB." },
      { status: 413 },
    );
  try {
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (
      bytes.byteLength < 4 ||
      bytes.byteLength > 2_000_000 ||
      bytes[0] !== 255 ||
      bytes[1] !== 216 ||
      bytes[2] !== 255
    )
      return Response.json(
        { error: "Choose a valid receipt photo." },
        { status: 400 },
      );
    const draft = await parseReceiptImage(bytes);
    if (!draft)
      return Response.json(
        { error: "Gift could not read enough detail from this receipt." },
        { status: 422 },
      );
    return Response.json(draft, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Receipt extraction failed", error);
    return Response.json(
      { error: "Gift could not read this receipt right now." },
      { status: 503 },
    );
  }
}
