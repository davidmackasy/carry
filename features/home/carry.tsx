"use client";
import { useState, useEffect } from "react";
import { useFinance } from "@/features/use-finance";
import Overview from "@/features/home/overview";
import Spending from "@/features/spending/view";
import Bills from "@/features/bills/view";
import Goals from "@/features/goals/view";
import Advisor from "@/features/advisor/view";
import Onboarding from "@/features/onboarding/view";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { upcomingPaydays, remindersFor } from "@/services/notifications";
import { outstandingUpdates } from "@/services/notifications/follow-ups";
import Editors, { type Modal } from "@/components/carry/editors";
import { Skeleton } from "@/components/ui/skeleton";
import { emptyState } from "@/services/finance/sample";
import {
  Home,
  ArrowUpRight,
  Wallet,
  CalendarDays,
  Flag,
  MessageCircle,
  Bell,
  Plus,
  ArrowRight,
  ChevronDown,
  Leaf,
  Car,
  Coffee,
  ShieldCheck,
  Settings2,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { sampleState } from "@/services/finance/sample";
import { summarize, money } from "@/services/finance";
const navigation = [
  { name: "Home", icon: Home },
  { name: "Spending", icon: Wallet },
  { name: "Bills", icon: CalendarDays },
  { name: "Goals", icon: Flag },
  { name: "Advisor", label: "Gift AI", icon: MessageCircle },
];
export default function Carry() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [tab, setTab] = useState("Home");
  const f = useFinance();
  const { state, data } = f;
  const [modal, setModal] = useState<Modal>(null);
  const [onboarding, setOnboarding] = useState(false);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("reminder") === "review") setModal({ type: "notifications" });
    if (query.get("view") === "Bills") setTab("Bills");
  }, []);
  const open = (type: string, id?: string) => {
    if (type === "setup") {
      setModal(null);
      setOnboarding(true);
    } else setModal({ type, id });
  };
  const firstName = state.name.split(" ")[0] || "friend";
  const tabLabel = tab === "Advisor" ? "Gift AI" : tab;
  const outstanding = outstandingUpdates(state);
  const missedBillCount = outstanding.filter(
    (item) => item.kind === "bill",
  ).length;
  const notificationCount = Math.min(
    99,
    outstanding.length +
      remindersFor(state).filter(
        (reminder) =>
          reminder.kind !== "followup" &&
          reminder.notifyDate <= data.date &&
          reminder.due >= data.date,
      ).length,
  );
  async function erase() {
    if (f.demo) {
      f.setState(sampleState());
      setModal(null);
      return;
    }
    const r = await fetch("/api/finance", { method: "DELETE" });
    if (r.ok) {
      f.setState(emptyState());
      f.setDemo(false);
      f.setRevision(0);
      setModal(null);
    } else f.setError("Could not delete your data. Please retry.");
  }
  if (!mounted || (f.loading && !f.loaded))
    return (
      <main className="startup" aria-busy="true">
        <span className="brand">Gift</span>
        <p>Getting your picture ready…</p>
      </main>
    );
  if (!f.loaded)
    return (
      <main className="startup">
        <span className="brand">Gift</span>
        <p role="alert">{f.error || "Unable to load your budget."}</p>
        <button className="primary" onClick={f.reload}>
          Try again
        </button>
      </main>
    );
  if (!state.onboarded)
    return (
      <Onboarding
        initialState={state}
        profileRevision={f.revision}
        onComplete={() => window.location.assign("/billing")}
      />
    );
  return (
    <SidebarProvider>
      <Sidebar className="carry-sidebar" collapsible="none">
        <SidebarHeader>
          <a className="brand" href="/">
            Gift
          </a>
          <span className="tagline">Give every dollar a purpose.</span>
        </SidebarHeader>
        <SidebarContent>
          <span className="eyebrow nav-label">YOUR MONEY</span>
          <nav>
            {navigation.map(({ name, label, icon: Icon }) => (
              <button
                className={tab === name ? "nav-link active" : "nav-link"}
                key={name}
                onClick={() => setTab(name)}
              >
                <Icon size={20} />
                {label ?? name}
                {name === "Bills" && missedBillCount > 0 ? (
                  <span
                    className="nav-badge"
                    aria-label={`${missedBillCount} bill updates`}
                  >
                    {missedBillCount > 9 ? "9+" : missedBillCount}
                  </span>
                ) : (
                  tab === name && <span className="nav-indicator" />
                )}
              </button>
            ))}
          </nav>
        </SidebarContent>
        <SidebarFooter>
          <a className="nav-link" href="/billing">
            Subscription & billing
          </a>
          <div className="sidebar-legal">
            <a href="/legal/terms">Terms</a>
            <a href="/legal/privacy">Privacy</a>
            <a href="/legal/financial-disclaimer">Financial disclaimer</a>
          </div>
          <div className="private-note">
            <ShieldCheck size={17} />
            <span>Your money. Your business.</span>
          </div>
          <button className="profile" onClick={() => open("settings")}>
            <span className="avatar">{firstName[0].toUpperCase()}</span>
            <span>
              {state.name}
              <small>{f.demo ? "Sample account" : "Private account"}</small>
            </span>
            <Settings2 size={17} />
          </button>
        </SidebarFooter>
      </Sidebar>
      <div className="app-body">
        <header className="topbar">
          <span className="breadcrumb">
            My overview <span>/</span> {tabLabel}
          </span>
          <span className="mobile-brand">Gift</span>
          <div className="header-actions">
            <span className="date-label">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <button
              className="icon-button notification-button"
              aria-label={`Notifications${notificationCount ? `, ${notificationCount} need attention` : ""}`}
              onClick={() => open("notifications")}
            >
              <Bell size={19} />
              {notificationCount > 0 && (
                <span className="notification-badge">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>
            <button
              className="avatar small"
              onClick={() => open("settings")}
              aria-label="Your preferences"
            >
              {firstName[0].toUpperCase()}
            </button>
          </div>
        </header>
        <div
          className={
            tab === "Home"
              ? "workspace home-workspace"
              : "workspace gift-page-workspace"
          }
        >
          <main className="feed">
            <div className="page-heading">
              <div>
                <p className="eyebrow">A CLEARER PICTURE, EVERY DAY</p>
                <h1>{tab === "Home" ? `Hello, ${firstName} 👋` : tabLabel}</h1>
                <p className="subtle">
                  {
                    {
                      Home: "Here’s your money today.",
                      Spending: "A place for every part of your day.",
                      Bills: "Your commitments, comfortably covered.",
                      Goals: "Make a little room for what’s next.",
                      Advisor: "A clearer view of your next move.",
                    }[tab]
                  }
                </p>
              </div>
              <button
                className="round-add"
                aria-label={
                  tab === "Bills"
                    ? "Add bill"
                    : tab === "Goals"
                      ? "Add goal"
                      : "Add transaction"
                }
                onClick={() =>
                  open(
                    tab === "Bills"
                      ? "bill"
                      : tab === "Goals"
                        ? "goal"
                        : "transaction",
                  )
                }
              >
                <Plus size={22} />
              </button>
            </div>
            {f.offline && (
              <div className="notice-banner">
                You’re offline. Viewing the current screen; reconnect to save.
              </div>
            )}
            {f.error && !modal && !onboarding && (
              <div className="error-message" role="alert">
                {f.error} <button onClick={f.reload}>Retry</button>
              </div>
            )}
            {state.setupVersion !== 2 && (
              <div className="demo-banner">
                <span>Let’s complete your financial picture</span>
                <button onClick={() => setOnboarding(true)}>
                  Guided setup <ArrowRight size={14} />
                </button>
              </div>
            )}
            {f.loading && <Skeleton className="h-2 w-full mb-4" />}
            {tab === "Home" && (
              <Overview
                state={state}
                data={data}
                open={open}
                navigate={setTab}
              />
            )}
            {tab === "Spending" && (
              <Spending state={state} open={open} save={f.save} />
            )}
            {tab === "Bills" && <Bills state={state} open={open} />}
            {tab === "Goals" && (
              <Goals state={state} open={open} save={f.save} />
            )}
            {tab === "Advisor" && (
              <Advisor state={state} demo={f.demo} open={open} />
            )}
            {state.purchases.length > 0 && (
              <section className="card">
                <h3>Planned purchases</h3>
                {state.purchases.map((p) => (
                  <div className="breakdown-row" key={p.id}>
                    <span>
                      {p.name}
                      <small>{p.date}</small>
                    </span>
                    <b>{money(p.amount)}</b>
                    <button
                      className="text-action"
                      disabled={f.saving}
                      onClick={() =>
                        f.save({
                          ...state,
                          purchases: state.purchases.filter(
                            (x) => x.id !== p.id,
                          ),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </section>
            )}
            <p className="footnote">
              A little clarity goes a long way.{" "}
              <button onClick={() => open("search")}>Search your money</button>
            </p>
            <footer className="gift-footer">
              <span>© 2026 Gift</span>
              <a href="/legal/terms">Terms</a>
              <a href="/legal/privacy">Privacy</a>
              <a href="/legal/financial-disclaimer">Financial disclaimer</a>
              <a href="mailto:support@budgetwithgift.com">
                support@budgetwithgift.com
              </a>
            </footer>
          </main>
        </div>
      </div>
      <nav className="bottom-nav">
        {navigation.map(({ name, label, icon: Icon }) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={tab === name ? "active" : ""}
          >
            <Icon size={21} />
            <span>{label ?? name}</span>
            {name === "Bills" && missedBillCount > 0 && (
              <span className="mobile-nav-badge">
                {missedBillCount > 9 ? "9+" : missedBillCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <Editors
        modal={modal}
        state={state}
        demo={f.demo}
        saving={f.saving}
        error={f.error}
        close={() => setModal(null)}
        save={f.save}
        open={open}
        erase={erase}
      />
      <Sheet open={onboarding} onOpenChange={setOnboarding}>
        <SheetContent side="bottom" className="setup-overlay">
          <SheetTitle className="sr-only">Guided account setup</SheetTitle>
          <SheetDescription className="sr-only">
            Review your income, bills, spending, goals, and reminders.
          </SheetDescription>
          <Onboarding
            initialState={state}
            profileRevision={f.revision}
            onComplete={(result) => {
              f.accept(result);
              setOnboarding(false);
            }}
            onCancel={() => setOnboarding(false)}
            embedded
          />
        </SheetContent>
      </Sheet>
      {f.notice && (
        <div className="toast-message" role="status">
          {f.notice}
        </div>
      )}
    </SidebarProvider>
  );
}
