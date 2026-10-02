import {
  ArrowRight,
  BellRing,
  CalendarDays,
  Check,
  CircleDollarSign,
  Heart,
  MessageCircle,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react';

const signupHref = '/auth/signup?next=%2F';

function Logo() {
  return (
    <a className="landing-logo" href="/" aria-label="Gift home">
      Gift<span>.</span>
    </a>
  );
}

export default function Landing() {
  return (
    <main className="gift-landing">
      <header className="landing-header">
        <Logo />
        <nav aria-label="Main navigation">
          <a href="#why-gift">Why Gift</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="landing-header-actions">
          <a className="landing-sign-in" href="/auth/login?next=%2F">
            Sign in
          </a>
          <a className="landing-button landing-button-dark" href={signupHref}>
            Start free <ArrowRight size={16} />
          </a>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-kicker"><Sparkles size={15} /> Money care for real life</p>
          <h1>Your money deserves more than a spreadsheet.</h1>
          <p className="landing-lede">
            Gift is the stylish budget companion that remembers what is due, notices
            what changed, and gently brings you back to the life you are building.
          </p>
          <div className="landing-hero-actions">
            <a className="landing-button landing-button-dark" href={signupHref}>
              Start your 14-day free trial <ArrowRight size={17} />
            </a>
            <a className="landing-text-link" href="#product-preview">
              See Gift in action
            </a>
          </div>
          <div className="landing-trust-line">
            <span><Check size={14} /> No charge today</span>
            <span><Check size={14} /> Cancel anytime</span>
            <span><ShieldCheck size={14} /> Private by design</span>
          </div>
        </div>

        <div className="landing-hero-visual" id="product-preview" aria-label="Gift dashboard preview">
          <div className="landing-spark landing-spark-one"><Sparkles size={24} /></div>
          <div className="landing-spark landing-spark-two"><Heart size={20} /></div>
          <div className="landing-app-frame">
            <div className="landing-app-topbar">
              <span className="landing-mini-logo">Gift</span>
              <span>Today</span>
              <span className="landing-avatar">A</span>
            </div>
            <div className="landing-app-body">
              <p className="landing-eyebrow">A clearer picture, every day</p>
              <h2>Good morning, Ava.</h2>
              <p>Your money is looking cared for.</p>
              <div className="landing-stat-grid">
                <article className="landing-stat sage">
                  <WalletCards size={18} />
                  <span>Available to spend</span>
                  <strong>$1,842</strong>
                  <small>after upcoming commitments</small>
                </article>
                <article className="landing-stat lilac">
                  <CalendarDays size={18} />
                  <span>Next payday</span>
                  <strong>In 4 days</strong>
                  <small>Friday · estimated $2,400</small>
                </article>
              </div>
              <article className="landing-moment-card">
                <div>
                  <p className="landing-eyebrow">Your next money moment</p>
                  <h3>Internet bill</h3>
                  <strong>$65</strong>
                  <span>Due tomorrow</span>
                </div>
                <div className="landing-calendar-icon"><CalendarDays size={27} /></div>
              </article>
              <div className="landing-insight-row">
                <Sparkles size={18} />
                <p><b>Gift insight</b><br />You are $74 under your weekly plan.</p>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
          <div className="landing-float-note landing-float-reminder">
            <BellRing size={18} />
            <span><b>Gentle nudge</b>Rent is due in 3 days</span>
          </div>
          <div className="landing-float-note landing-float-receipt">
            <ReceiptText size={18} />
            <span><b>Receipt saved</b>$42.18 · Groceries</span>
          </div>
        </div>
      </section>

      <section className="landing-marquee" aria-label="Gift capabilities">
        <span>Plan your payday</span><i />
        <span>Remember every bill</span><i />
        <span>Scan your receipts</span><i />
        <span>Grow your goals</span><i />
        <span>Ask Gift AI</span>
      </section>

      <section className="landing-story" id="why-gift">
        <div className="landing-section-heading">
          <p className="landing-kicker"><Heart size={15} /> Made for the way life actually happens</p>
          <h2>A budget you will want to come back to.</h2>
          <p>Gift turns money upkeep into small, supportive moments instead of another chore.</p>
        </div>
        <div className="landing-story-grid">
          <article className="landing-feature-card feature-peach">
            <div className="landing-feature-icon"><BellRing size={24} /></div>
            <p className="landing-card-number">01</p>
            <h3>It remembers, then follows up.</h3>
            <p>Get thoughtful reminders before payday and bills—and a gentle check-in when something still needs your attention.</p>
          </article>
          <article className="landing-feature-card feature-sage">
            <div className="landing-feature-icon"><ReceiptText size={24} /></div>
            <p className="landing-card-number">02</p>
            <h3>Receipts become useful.</h3>
            <p>Photograph a receipt and Gift helps capture the store, total, date, and items so your spending stays current.</p>
          </article>
          <article className="landing-feature-card feature-lilac">
            <div className="landing-feature-icon"><MessageCircle size={24} /></div>
            <p className="landing-card-number">03</p>
            <h3>Answers shaped around you.</h3>
            <p>Ask Gift AI what you can spend, what is coming next, or how one choice could change your goals.</p>
          </article>
        </div>
      </section>

      <section className="landing-how" id="how-it-works">
        <div className="landing-how-copy">
          <p className="landing-kicker"><CircleDollarSign size={15} /> Your money, beautifully organized</p>
          <h2>From “Where did it go?” to “I know what comes next.”</h2>
          <p>Gift brings your everyday spending, bills, goals, reminders, and money questions into one calm place.</p>
          <ol>
            <li><span>1</span><div><b>Tell Gift about your life</b><p>Add income, regular bills, spending plans, and the goals that matter to you.</p></div></li>
            <li><span>2</span><div><b>See today clearly</b><p>Know what is safe to spend after the commitments already on your calendar.</p></div></li>
            <li><span>3</span><div><b>Stay gently in the loop</b><p>Gift brings you back with useful reminders and clear next steps.</p></div></li>
          </ol>
          <a className="landing-button landing-button-light" href={signupHref}>Build my first budget <ArrowRight size={17} /></a>
        </div>
        <div className="landing-how-visual">
          <article className="landing-phone-card">
            <div className="landing-phone-head"><Logo /><span><BellRing size={17} /></span></div>
            <p className="landing-eyebrow">Today’s little win</p>
            <h3>You kept $118 more than last week.</h3>
            <div className="landing-progress"><span /></div>
            <p>That is another step toward your summer trip.</p>
          </article>
          <article className="landing-goal-card">
            <span><Heart size={18} /></span>
            <p>Summer in Lisbon</p>
            <strong>$1,460</strong>
            <small>of $2,800 saved</small>
            <div className="landing-progress"><span /></div>
          </article>
        </div>
      </section>

      <section className="landing-rituals">
        <div className="landing-section-heading">
          <p className="landing-kicker"><Sparkles size={15} /> More than tracking</p>
          <h2>Little rituals that make money feel lighter.</h2>
        </div>
        <div className="landing-ritual-grid">
          <article><CalendarDays size={22} /><h3>Payday planning</h3><p>Give the next check a purpose before it arrives.</p></article>
          <article><WalletCards size={22} /><h3>Spending pockets</h3><p>See groceries, gas, fun, and everyday life separately.</p></article>
          <article><Heart size={22} /><h3>Goals with meaning</h3><p>Save for safety, joy, travel, or whatever comes next.</p></article>
          <article><Sparkles size={22} /><h3>Gift AI</h3><p>Talk through your money with context from your real plan.</p></article>
        </div>
      </section>

      <section className="landing-pricing" id="pricing">
        <div>
          <p className="landing-kicker"><Heart size={15} /> One small plan for a clearer life</p>
          <h2>Try every part of Gift free for 14 days.</h2>
          <p>Build your full budget, turn on reminders, scan receipts, and meet Gift AI before paying.</p>
        </div>
        <article className="landing-price-card">
          <span>Gift Monthly</span>
          <strong>$5.99 <small>/ month</small></strong>
          <ul>
            <li><Check size={16} /> Complete budgeting workspace</li>
            <li><Check size={16} /> Email and in-app reminders</li>
            <li><Check size={16} /> Receipt capture and Gift AI</li>
            <li><Check size={16} /> Cancel anytime</li>
          </ul>
          <a className="landing-button landing-button-dark" href={signupHref}>Start free for 14 days <ArrowRight size={17} /></a>
          <small>No charge today. Payment details are required to begin your trial.</small>
        </article>
      </section>

      <section className="landing-final-cta">
        <Sparkles size={28} />
        <p className="landing-kicker">A little clarity goes a long way</p>
        <h2>Give your money a place that feels like you.</h2>
        <a className="landing-button landing-button-light" href={signupHref}>Start my free trial <ArrowRight size={17} /></a>
      </section>

      <footer className="landing-footer">
        <div><Logo /><p>Give every dollar a purpose.</p></div>
        <div><a href="#why-gift">Why Gift</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a></div>
        <div><a href="/legal/terms">Terms</a><a href="/legal/privacy">Privacy</a><a href="/legal/financial-disclaimer">Financial disclaimer</a></div>
        <div><a href="mailto:support@budgetwithgift.com">support@budgetwithgift.com</a><p>© 2026 Gift</p></div>
      </footer>
    </main>
  );
}
