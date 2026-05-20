export default function ReviewsPage() {
  return (
    <div className="pt-20 pb-12 flex-1">
      <div className="max-w-7xl mx-auto px-6 md:px-10">

        {/* HERO */}
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Live Reviews
        </div>

        <h1 className="text-5xl md:text-6xl tracking-tight leading-tight mb-6 max-w-3xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          Honest feedback on your <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>work</span>.
        </h1>

        <p className="text-base md:text-lg text-[#A8A39A] mb-4 max-w-2xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          A Live Review is a focused listening session where we walk through your track
          together, identify the gap between what the brief asked for and where your music
          lands, and name the patterns worth tracking in your work.
        </p>

        <p className="text-base text-[#8A8680] mb-20 max-w-2xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Reviews are run by someone who has reviewed hundreds of tracks written to sync briefs, and thousands more for composition, production, mixing, and mastering feedback.
        </p>

        <div className="border-t border-[#1F1D1A] mb-20" />

        {/* SESSION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-20 max-w-4xl">
          <SessionCard
            duration="15-Minute Session"
            oldPrice="$25"
            body="One track. Focused feedback. Best for sanity-checking a creative choice or a check-in before submission."
            cta="Book a 15-min Session"
            bookingUrl="https://cal.com/sonant/15min"
          />
          <SessionCard
            duration="30-Minute Session"
            oldPrice="$50"
            body="Up to two tracks. Pattern-level feedback. Best for composers building toward catalog submission or wanting deeper craft conversations."
            cta="Book a 30-min Session"
            bookingUrl="https://cal.com/sonant/30min"
          />
        </div>

        <div className="border-t border-[#1F1D1A] mb-20" />

        {/* WHO THIS IS FOR */}
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-8" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Who This Is For
        </div>

        <div className="max-w-2xl mb-20">
          <ul className="space-y-4 mb-8">
            <Bullet text={'Composers who want craft-level feedback, not just \u201Csounds great.\u201D'} />
            <Bullet text="Composers building portfolios for sync, library, or catalog work." />
            <Bullet text="Composers who've noticed patterns in their own work and want to test them." />
          </ul>

          <p className="text-base text-[#A8A39A] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Not the right fit for composers looking for validation, or composers who
            haven&apos;t generated a brief yet. Generate one first, write to it, then book.
          </p>
        </div>

        <div className="border-t border-[#1F1D1A] mb-20" />

        {/* WHAT TO BRING */}
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-8" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ What to Bring
        </div>

        <div className="max-w-2xl">
          <ul className="space-y-4">
            <Bullet text="A track you've written, ideally to a Sonant brief" />
            <Bullet text="The brief open and ready to reference" />
            <Bullet text="One question you want answered, if you have one" />
            <Bullet text="Honest expectations. Feedback is direct, not soft." />
          </ul>
        </div>

      </div>
    </div>
  );
}

function SessionCard({
  duration,
  oldPrice,
  body,
  cta,
  bookingUrl,
}: {
  duration: string;
  oldPrice: string;
  body: string;
  cta: string;
  bookingUrl: string;
}) {
  return (
    <div className="border border-[#2A2826] bg-[#141312] p-8 flex flex-col" style={{ borderRadius: '2px' }}>
      <div className="text-[10px] tracking-[0.3em] uppercase text-[#8A8680] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {duration}
      </div>

      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-lg text-[#5A5650] line-through" style={{ fontFamily: "'Fraunces', serif" }}>
          {oldPrice}
        </span>
        <span className="text-2xl text-[#E85D2F]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
          Free during Beta
        </span>
      </div>

      <p className="text-sm text-[#A8A39A] leading-relaxed mb-8 flex-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {body}
      </p>

      <a href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D] transition-colors text-center"
        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
      >
        {cta}
      </a>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="text-[#E85D2F] text-sm mt-0.5">◆</span>
      <span
        className="text-base text-[#C4BFB5] leading-relaxed"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {text}
      </span>
    </li>
  );
}