export type ReceiptItem = { name: string; group: string; amount?: string };
export type ReceiptDraft = {
  merchant: string;
  amount: string;
  date: string;
  items: ReceiptItem[];
};

const excludedItem =
  /\b(sub\s*total|total|tax|change|cash|visa|mastercard|amex|balance|saving|tender|payment|approved|authorization|card|amount (?:paid|due)|discount)\b/i;

function amountAtEnd(line: string) {
  const match = line.match(
    /(?:\$|usd\s*)?(\d{1,3}(?:[,\s]\d{3})*|\d+)[.,](\d{2})\s*(?:[a-z]{0,3})?$/i,
  );
  return match ? `${match[1].replace(/[,\s]/g, "")}.${match[2]}` : "";
}

function isoDate(text: string) {
  const numeric = text.match(
    /\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.]([0-2]?\d|3[01])\b|\b(0?[1-9]|1[0-2])[-/.]([0-2]?\d|3[01])[-/.](20\d{2}|\d{2})\b/,
  );
  let year: number;
  let month: number;
  let day: number;
  if (numeric?.[1]) {
    year = Number(numeric[1]);
    month = Number(numeric[2]);
    day = Number(numeric[3]);
  } else if (numeric?.[4]) {
    month = Number(numeric[4]);
    day = Number(numeric[5]);
    year = Number(numeric[6]);
    if (year < 100) year += 2000;
  } else {
    const named = text.match(
      /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+([0-2]?\d|3[01])(?:st|nd|rd|th)?[,]?\s+(20\d{2}|\d{2})\b/i,
    );
    if (!named) return "";
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    month = months.indexOf(named[1].slice(0, 3).toLowerCase()) + 1;
    day = Number(named[2]);
    year = Number(named[3]);
    if (year < 100) year += 2000;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function groupFor(name: string) {
  if (/\b(milk|cheese|yogurt|egg|cream|butter)\b/i.test(name))
    return "Dairy & eggs";
  if (/\b(beef|chicken|pork|fish|salmon|shrimp|turkey|meat)\b/i.test(name))
    return "Meat & seafood";
  if (
    /\b(apples?|bananas?|oranges?|berries|lettuce|tomatoes?|onions?|fruits?|vegetables?)\b/i.test(
      name,
    )
  )
    return "Produce";
  if (/\b(frozen|ice cream)\b/i.test(name)) return "Frozen";
  if (/\b(detergent|paper towel|tissue|cleaner|trash bag)\b/i.test(name))
    return "Household";
  if (/\b(shampoo|soap|toothpaste|deodorant|lotion)\b/i.test(name))
    return "Personal care";
  if (
    /\b(rice|pasta|bread|cereal|flour|oil|sauce|coffee|tea|can(?:ned)?)\b/i.test(
      name,
    )
  )
    return "Pantry";
  return "Other";
}

export function receiptDraft(text: string): ReceiptDraft {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const totalLines = lines.filter(
    (line) =>
      /\b(grand\s+total|total|amount\s+(?:paid|due)|balance\s+due)\b/i.test(
        line,
      ) && !/sub\s*total|tax|saving/i.test(line),
  );
  const amount =
    totalLines.map(amountAtEnd).filter(Boolean).at(-1) ??
    lines
      .filter((line) => /\b(?:visa|mastercard|amex|debit|credit)\b/i.test(line))
      .map(amountAtEnd)
      .filter(Boolean)
      .at(-1) ??
    "";
  const items = lines
    .filter((line) => amountAtEnd(line) && !excludedItem.test(line))
    .slice(0, 80)
    .map((line) => {
      const itemAmount = amountAtEnd(line);
      const name = line
        .replace(/(?:\$|usd\s*)?\d[\d,\s]*[.,]\d{2}\s*(?:[a-z]{0,3})?$/i, "")
        .replace(/^\d+\s*[xX@]?\s+/, "")
        .trim()
        .slice(0, 100);
      return { name, group: groupFor(name), amount: itemAmount };
    })
    .filter((item) => /[a-z]/i.test(item.name));
  const merchant =
    lines
      .slice(0, 10)
      .find(
        (line) =>
          /[a-z]{2}/i.test(line) &&
          !isoDate(line) &&
          !/^\d+[\s-]/.test(line) &&
          !/\b(receipt|invoice|tel|phone|www\.|cashier|store\s*#)\b/i.test(
            line,
          ),
      )
      ?.slice(0, 100) ?? "";
  return {
    merchant,
    amount,
    date: lines.map(isoDate).find(Boolean) ?? "",
    items,
  };
}

export const normalizeItem = (name: string) =>
  name.trim().toLocaleLowerCase().replace(/\s+/g, " ");
