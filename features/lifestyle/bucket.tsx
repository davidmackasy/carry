"use client";

import { useEffect, useState } from "react";
import { Camera, ImagePlus, ReceiptText } from "lucide-react";
import type { FinanceState } from "@/types/finance";
import { categorySpent, money, today } from "@/services/finance";
import {
  normalizeItem,
  receiptDraft,
  type ReceiptDraft,
  type ReceiptItem,
} from "@/lib/lifestyle/receipt";
import { preparePhoto, uploadPhoto } from "@/lib/lifestyle/photos";

const groups = [
  "Produce",
  "Dairy & eggs",
  "Meat & seafood",
  "Pantry",
  "Frozen",
  "Household",
  "Personal care",
  "Other",
];

export default function Bucket({
  state,
  id,
  save,
  back,
  edit,
}: {
  state: FinanceState;
  id: string;
  save: (state: FinanceState) => Promise<boolean>;
  back: () => void;
  edit: () => void;
}) {
  const category = state.categories.find((entry) => entry.id === id)!;
  const currentDate = today(state.timezone);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(currentDate);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [entry, setEntry] = useState("");
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const transactions = state.transactions
    .filter(
      (transaction) => transaction.categoryId === id && !transaction.excluded,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const usual = Array.from(
    new Map(
      transactions
        .flatMap((transaction) => transaction.items ?? [])
        .map((item) => [normalizeItem(item.name), item] as const)
        .reverse(),
    ).values(),
  );

  function applyDraft(draft: ReceiptDraft) {
    setMerchant(draft.merchant);
    setAmount(draft.amount);
    if (draft.date && draft.date <= currentDate) setDate(draft.date);
    setItems(draft.items);
  }

  async function localReceiptDraft(image: Blob) {
    let worker: import("tesseract.js").Worker | undefined;
    try {
      setMessage("Finishing the receipt scan on your device…");
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("eng");
      const result = await worker.recognize(image);
      return receiptDraft(result.data.text);
    } finally {
      await worker?.terminate();
    }
  }

  async function scan(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage("Preparing your receipt…");
    try {
      const image = await preparePhoto(file);
      setPhoto(image);
      setMessage("Reading the store, total, date, and purchased items…");
      const response = await fetch("/api/receipts/parse", {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: image,
      });
      let draft: ReceiptDraft | null = null;
      if (response.ok) draft = (await response.json()) as ReceiptDraft;
      if (!draft) draft = await localReceiptDraft(image);
      applyDraft(draft);
      const missing = [
        !draft.merchant && "store",
        !draft.amount && "total",
        !draft.date && "date",
        !draft.items.length && "items",
      ].filter(Boolean);
      setMessage(
        missing.length
          ? `Receipt scanned. Please add or correct the ${missing.join(", ")} before saving.`
          : "Receipt scanned. Check the details below, then confirm the purchase.",
      );
    } catch {
      setMessage(
        "Gift could not read this receipt. You can still enter the details below and save the photo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    let receiptId: string | undefined;
    try {
      const cents = Math.round(Number(amount) * 100);
      if (
        !merchant.trim() ||
        !Number.isSafeInteger(cents) ||
        cents <= 0 ||
        date > currentDate
      )
        throw new Error(
          "Enter the store, a positive total, and a purchase date no later than today.",
        );
      if (!state.accounts.length) throw new Error("Add an account first.");
      if (
        transactions.some(
          (transaction) =>
            transaction.merchant.toLowerCase() ===
              merchant.trim().toLowerCase() &&
            transaction.date === date &&
            transaction.amount === cents,
        )
      )
        throw new Error(
          "A matching purchase already exists. Review your history before adding a duplicate.",
        );
      if (photo) receiptId = await uploadPhoto(photo);
      const transaction = {
        id: crypto.randomUUID(),
        merchant: merchant.trim(),
        amount: cents,
        date,
        categoryId: id,
        excluded: false,
        recurring: false,
        note: "",
        receiptId,
        items: items
          .filter((item) => item.name.trim())
          .map((item) => ({ ...item, name: item.name.trim() })),
      };
      const next = {
        ...state,
        accounts: state.accounts.map((account, index) =>
          index === 0
            ? { ...account, balance: account.balance - cents }
            : account,
        ),
        transactions: [transaction, ...state.transactions],
      };
      if (!(await save(next)))
        throw new Error("Could not save your purchase. Please retry.");
      setPhoto(null);
      setMerchant("");
      setAmount("");
      setDate(currentDate);
      setItems([]);
      setMessage(
        "Purchase saved. Your spending and available balance are updated.",
      );
    } catch (error) {
      if (receiptId)
        await fetch(`/api/media?id=${receiptId}`, { method: "DELETE" });
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function addItem(item: ReceiptItem) {
    const list = state.shoppingList ?? [];
    if (
      list.some(
        (entry) =>
          entry.categoryId === id &&
          normalizeItem(entry.name) === normalizeItem(item.name) &&
          !entry.checked,
      )
    )
      return;
    setBusy(true);
    await save({
      ...state,
      shoppingList: [
        ...list,
        {
          name: item.name,
          group: item.group,
          id: crypto.randomUUID(),
          categoryId: id,
          checked: false,
        },
      ],
    });
    setBusy(false);
    setEntry("");
  }

  return (
    <div className="gift-page bucket-detail">
      <button className="text-action bucket-back" onClick={back}>
        ← All spending buckets
      </button>
      <section className="card spending-total">
        <h2>{category.name}</h2>
        <strong>
          {money(categorySpent(state, id), 2)}{" "}
          <small>of {money(category.budget)}</small>
        </strong>
        <button className="text-action" onClick={edit}>
          Edit this budget
        </button>
      </section>

      <section className="card lifestyle-card receipt-card">
        <div className="receipt-heading">
          <span className="receipt-heading-icon" aria-hidden="true">
            <ReceiptText size={20} />
          </span>
          <div>
            <h2>What did you spend today?</h2>
            <p>
              Scan a paper receipt or choose a screenshot. You review everything
              before it is saved.
            </p>
          </div>
        </div>
        <div className="receipt-actions">
          <label className="receipt-upload">
            <Camera size={20} aria-hidden="true" />
            <span>
              <strong>Take a photo</strong>
              <small>Use your camera</small>
            </span>
            <input
              disabled={busy}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(event) => {
                void scan(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <label className="receipt-upload">
            <ImagePlus size={20} aria-hidden="true" />
            <span>
              <strong>Choose a receipt</strong>
              <small>Photo or screenshot</small>
            </span>
            <input
              disabled={busy}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                void scan(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
        <p className="subtle receipt-privacy">
          Gift securely analyzes the image to suggest the store, final total,
          purchase date, and items. Nothing is added to your budget until you
          confirm.
        </p>
        {preview && (
          <img
            className="receipt-preview"
            src={preview}
            alt="Receipt ready for review"
          />
        )}
        {message && (
          <p className="receipt-status" role="status" aria-live="polite">
            {busy && <span className="receipt-spinner" aria-hidden="true" />}
            {message}
          </p>
        )}
        <form onSubmit={submit} className="receipt-review">
          <h3>Review purchase</h3>
          <label className="field">
            Store
            <input
              className="carry-input"
              required
              maxLength={150}
              value={merchant}
              onChange={(event) => setMerchant(event.target.value)}
            />
          </label>
          <div className="form-grid receipt-core-fields">
            <label className="field">
              Total paid ($)
              <input
                className="carry-input"
                inputMode="decimal"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label className="field">
              Purchase date
              <input
                className="carry-input"
                type="date"
                required
                max={currentDate}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
          </div>
          <p className="subtle">
            The final total is deducted once from{" "}
            {state.accounts[0]?.name ?? "your account"}. Item prices are saved
            only as receipt details.
          </p>
          {items.length > 0 && <h3>Items found</h3>}
          {items.map((item, index) => (
            <div className="receipt-item" key={`${item.name}-${index}`}>
              <input
                aria-label={`Item ${index + 1}`}
                className="carry-input receipt-item-name"
                maxLength={150}
                value={item.name}
                onChange={(event) =>
                  setItems(
                    items.map((entry, itemIndex) =>
                      itemIndex === index
                        ? { ...entry, name: event.target.value }
                        : entry,
                    ),
                  )
                }
              />
              <input
                aria-label={`Item ${index + 1} price`}
                className="carry-input receipt-item-price"
                inputMode="decimal"
                placeholder="$0.00"
                value={item.amount ?? ""}
                onChange={(event) =>
                  setItems(
                    items.map((entry, itemIndex) =>
                      itemIndex === index
                        ? { ...entry, amount: event.target.value }
                        : entry,
                    ),
                  )
                }
              />
              <select
                aria-label={`Item ${index + 1} group`}
                className="carry-input"
                value={item.group}
                onChange={(event) =>
                  setItems(
                    items.map((entry, itemIndex) =>
                      itemIndex === index
                        ? { ...entry, group: event.target.value }
                        : entry,
                    ),
                  )
                }
              >
                {groups.map((group) => (
                  <option key={group}>{group}</option>
                ))}
              </select>
              <button
                type="button"
                className="receipt-remove"
                aria-label={`Remove item ${index + 1}`}
                onClick={() =>
                  setItems(items.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-action"
            onClick={() =>
              setItems([...items, { name: "", group: "Other", amount: "" }])
            }
          >
            + Add item
          </button>
          <button className="primary wide" disabled={busy}>
            {busy ? "Working…" : "Confirm & save purchase"}
          </button>
        </form>
      </section>

      <section className="card lifestyle-card shopping-card">
        <h2>Your shopping list</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (entry.trim())
              void addItem({ name: entry.trim(), group: "Other" });
          }}
          className="receipt-item shopping-entry"
        >
          <input
            aria-label="Shopping list item"
            className="carry-input"
            maxLength={150}
            required
            placeholder="Add milk, apples, or anything else"
            value={entry}
            onChange={(event) => setEntry(event.target.value)}
          />
          <button className="secondary" disabled={busy}>
            Add
          </button>
        </form>
        {(state.shoppingList ?? [])
          .filter((item) => item.categoryId === id)
          .map((item) => (
            <div className="list-row" key={item.id}>
              <label>
                <input
                  type="checkbox"
                  disabled={busy}
                  checked={item.checked}
                  onChange={() =>
                    void save({
                      ...state,
                      shoppingList: state.shoppingList!.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, checked: !entry.checked }
                          : entry,
                      ),
                    })
                  }
                />{" "}
                {item.name} <small>{item.group}</small>
              </label>
              <button
                className="text-action"
                onClick={() =>
                  void save({
                    ...state,
                    shoppingList: state.shoppingList!.filter(
                      (entry) => entry.id !== item.id,
                    ),
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
        <p className="subtle">
          Checking an item doesn’t record spending. Save the receipt or enter
          the purchase above.
        </p>
        {usual.length > 0 && (
          <>
            <h3>From your past purchases</h3>
            <div className="usual-items">
              {usual.slice(0, 30).map((item) => (
                <button
                  className="secondary"
                  key={normalizeItem(item.name)}
                  disabled={busy}
                  onClick={() => void addItem(item)}
                >
                  + {item.name}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="card lifestyle-card history-card">
        <h2>Purchase history</h2>
        {transactions.slice(0, 20).map((transaction) => (
          <details key={transaction.id}>
            <summary>
              {transaction.merchant} · {transaction.date} ·{" "}
              {money(transaction.amount, 2)}
            </summary>
            <p>
              {transaction.items
                ?.map(
                  (item) =>
                    `${item.name}${item.amount ? ` ($${item.amount})` : ""} (${item.group})`,
                )
                .join(", ") || "No item details saved."}
            </p>
            {transaction.receiptId && (
              <>
                <a
                  href={`/api/media?id=${transaction.receiptId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View receipt
                </a>
                <button
                  className="text-action"
                  onClick={async () => {
                    if (
                      !window.confirm(
                        "Remove this receipt photo? The purchase will stay in your budget.",
                      )
                    )
                      return;
                    if (
                      await save({
                        ...state,
                        transactions: state.transactions.map((entry) =>
                          entry.id === transaction.id
                            ? { ...entry, receiptId: undefined }
                            : entry,
                        ),
                      })
                    )
                      await fetch(`/api/media?id=${transaction.receiptId}`, {
                        method: "DELETE",
                      });
                  }}
                >
                  Remove photo
                </button>
              </>
            )}
          </details>
        ))}
      </section>
    </div>
  );
}
