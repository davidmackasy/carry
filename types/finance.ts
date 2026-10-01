export type Frequency =
  | "once"
  | "weekly"
  | "biweekly"
  | "semimonthly"
  | "monthly"
  | "yearly";
export type Account = { id: string; name: string; balance: number };
export type Income = {
  id: string;
  name: string;
  amount: number;
  date: string;
  frequency: Frequency;
  employer?: string;
  payDays?: number[];
  receivedDates?: string[];
};
export type Bill = Income & {
  subscription: boolean;
  paused: boolean;
  paidDates: string[];
};
export type Category = {
  id: string;
  name: string;
  icon: string;
  budget: number;
};
export type Transaction = {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  categoryId: string;
  excluded: boolean;
  recurring: boolean;
  note: string;
  receiptId?: string;
  items?: { name: string; group: string; amount?: string }[];
  splits?: { categoryId: string; amount: number }[];
};
export type Goal = {
  id: string;
  name: string;
  icon: string;
  target: number;
  saved: number;
  contribution: number;
  date: string;
  targetDate: string;
};
export type Purchase = {
  id: string;
  name: string;
  amount: number;
  date: string;
};
export type Snapshot = {
  date: string;
  runway: number;
  balance: number;
  safe: number;
};
export type FinanceState = {
  shoppingList?: {
    id: string;
    categoryId: string;
    name: string;
    group: string;
    checked: boolean;
  }[];
  memories?: {
    id: string;
    goalId: string;
    city: string;
    country: string;
    date: string;
    note: string;
    photoId?: string;
    spent: number;
  }[];
  timezone?: string;
  setupVersion?: number;
  employment?: {
    status:
      | "employed"
      | "self-employed"
      | "student"
      | "retired"
      | "between-jobs"
      | "other";
  };
  reminders?: {
    paydayEnabled: boolean;
    paydayDays: number;
    billsEnabled: boolean;
    billDays: number;
    emailEnabled: boolean;
    sendHour: number;
    smartEnabled?: boolean;
    followUpEnabled?: boolean;
  };
  incomeReceipts?: {
    id: string;
    incomeId: string;
    scheduledDate: string;
    receivedDate: string;
    amount: number;
    accountId: string;
  }[];
  name: string;
  accounts: Account[];
  income: Income[];
  bills: Bill[];
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  purchases: Purchase[];
  protectedMinimum: number;
  periodStart: string;
  periodEnd: string;
  snapshots: Snapshot[];
  notificationSettings: { bills: boolean; budget: boolean; goals: boolean };
  onboarded: boolean;
};
