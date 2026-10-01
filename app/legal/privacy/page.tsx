import { LegalPage } from "@/components/legal/page-shell";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="This policy describes what Gift collects, why we use it, which services process it, and the choices you have."
    >
      <section>
        <h2>1. Information you provide</h2>
        <p>
          Gift collects account information such as your email address and
          authentication details. We also process the budgeting information you
          choose to save, including balances, expected income, bills,
          subscriptions, spending categories, transactions, savings goals,
          reminder preferences, receipts, shopping-list items, notes, and travel
          memories or photos. Do not upload payment-card numbers, bank
          passwords, government identifiers, or information you do not want
          stored.
        </p>
      </section>
      <section>
        <h2>2. Information generated through use</h2>
        <p>
          We may collect basic technical and service information such as browser
          type, device data, approximate network information, request times,
          error logs, security events, subscription status, and email-delivery
          status. Gift generates budget calculations and reminder records from
          the data you enter.
        </p>
      </section>
      <section>
        <h2>3. How Gift uses information</h2>
        <p>
          We use information to authenticate you, save and display your budget,
          calculate estimates, process subscriptions, deliver emails, provide
          Gift AI answers, prevent abuse, troubleshoot, secure and improve the
          platform, communicate with you, and comply with legal obligations. We
          do not sell your personal information or use your private budget to
          serve targeted advertising.
        </p>
      </section>
      <section>
        <h2>4. Gift AI processing</h2>
        <p>
          When you ask Gift AI a question, Gift may send your question, recent
          Gift AI messages, and a limited budget summary to OpenAI to generate a
          personalized response. The summary can include balances, budget
          categories, upcoming bills, goals, and estimates. It excludes your
          Gift name, email address, authentication credentials, receipt images,
          and raw transaction history. Gift requests that the response not be
          stored by the model API, but OpenAI may process limited data for
          security and legal purposes under its applicable API terms. If the AI
          service is unavailable, Gift can return a calculation-based answer.
        </p>
      </section>
      <section>
        <h2>5. Service providers</h2>
        <p>
          Gift relies on service providers that process data for defined
          operational purposes: Supabase for authentication and application
          data, Cloudflare for hosting and network security, Stripe for
          subscription billing, Mailgun for email delivery, and OpenAI for
          optional Gift AI responses. Their processing is governed by their
          contracts and privacy terms. Payment-card details are handled by
          Stripe and are not stored in Gift’s budget profile.
        </p>
      </section>
      <section>
        <h2>6. When information may be disclosed</h2>
        <p>
          We may disclose information to service providers, when you direct us,
          to investigate fraud or security threats, to protect rights and
          safety, during a business reorganization subject to appropriate
          safeguards, or when required by valid legal process. We do not permit
          providers to use Gift data for their own advertising.
        </p>
      </section>
      <section>
        <h2>7. Retention and deletion</h2>
        <p>
          We keep account and budget information while your account is active
          and as reasonably needed to provide Gift. Security, billing, and
          transaction records may be retained longer when required for fraud
          prevention, tax, accounting, dispute, or legal purposes. Deleted data
          may remain temporarily in restricted backups before routine removal.
          You can request account deletion from Gift’s settings.
        </p>
      </section>
      <section>
        <h2>8. Security</h2>
        <p>
          We use administrative, technical, and organizational safeguards
          designed to protect information. No internet service can guarantee
          absolute security. Use a unique password, secure your email account,
          and notify us if you suspect unauthorized access.
        </p>
      </section>
      <section>
        <h2>9. Your choices and rights</h2>
        <p>
          You can review and update budget information, disable optional email
          reminders, export your data, and request deletion. Depending on where
          you live, you may also have rights to access, correct, delete,
          restrict, or receive a portable copy of personal information, or to
          object to certain processing. We may verify your identity before
          completing a request. You may appeal a denied request by replying to
          our decision.
        </p>
      </section>
      <section>
        <h2>10. Children and international processing</h2>
        <p>
          Gift is intended for adults and is not directed to children under 13.
          We do not knowingly collect children’s personal information. Gift and
          its providers may process information in countries other than your
          own, subject to protections required by applicable law.
        </p>
      </section>
      <section>
        <h2>11. Changes and contact</h2>
        <p>
          We may update this policy as Gift changes. We will post the effective
          date and provide additional notice when appropriate. For privacy
          questions or requests, email{" "}
          <a href="mailto:support@budgetwithgift.com">
            support@budgetwithgift.com
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
