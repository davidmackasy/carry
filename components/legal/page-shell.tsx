import type { ReactNode } from "react";

export function LegalPage({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <a className="brand" href="/">
          Gift
        </a>
        <a href="/">Back to Gift</a>
      </header>
      <article>
        <span className="eyebrow">BUDGETWITHGIFT.COM</span>
        <h1>{title}</h1>
        <p className="legal-summary">{summary}</p>
        <p className="legal-date">Effective September 30, 2026</p>
        <nav className="legal-nav" aria-label="Legal policies">
          <a href="/legal/terms">Terms</a>
          <a href="/legal/privacy">Privacy</a>
          <a href="/legal/financial-disclaimer">Financial disclaimer</a>
        </nav>
        <div className="legal-content">{children}</div>
      </article>
      <footer>
        Questions? Email{" "}
        <a href="mailto:support@budgetwithgift.com">
          support@budgetwithgift.com
        </a>
        .
      </footer>
    </main>
  );
}
