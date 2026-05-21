import Link from 'next/link';

export default function SubmissionsPage() {
  return (
    <div className="pt-20 pb-12 flex-1">
      <div className="max-w-7xl mx-auto px-6 md:px-10">

        {/* HERO */}
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ Submissions
        </div>

        <h1 className="text-5xl md:text-6xl tracking-tight leading-tight mb-6 max-w-3xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          Where briefs meet <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>music</span>.
        </h1>

        <p className="text-base md:text-lg text-[#A8A39A] mb-3 max-w-2xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Sonant Catalog is a curated library of music written to Sonant briefs.
          Submissions are reviewed individually. Every track gets a written response.
        </p>
        <p className="text-base md:text-lg text-[#A8A39A] mb-10 max-w-2xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          High bar, honest feedback, no pay-to-play.
        </p>

        <div className="flex gap-3 flex-wrap mb-20">
          <Link
            href="/library"
            className="px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            Select a brief to submit a track to
          </Link>
        </div>

        <div className="border-t border-[#1F1D1A] mb-20" />

        {/* HOW IT WORKS */}
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-8" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ How It Works
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-20 max-w-4xl">
          <Step
            num="01"
            title="Generate a brief"
            body="Use Sonant's brief generator to create the brief you'll write to."
          />
          <Step
            num="02"
            title="Write to the brief"
            body="Compose your track. Stay close to what the brief asked for."
          />
          <Step
            num="03"
            title="Submit your track"
            body="Pick the brief from your library, upload your finished track."
          />
          <Step
            num="04"
            title="Get a response"
            body="Every submission receives a written review. Accepted tracks join the Sonant Catalog and become discoverable to music supervisors searching for industry-coded music."
          />
        </div>

        <div className="border-t border-[#1F1D1A] mb-20" />

        {/* WHAT GETS ACCEPTED */}
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-8" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ What Gets Accepted
        </div>

        <div className="max-w-2xl mb-20">
          <p className="text-base md:text-lg text-[#A8A39A] mb-8 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            The Catalog isn&apos;t trying to be exhaustive. It&apos;s trying to be reliable.
            Tracks accepted into the Sonant Catalog meet three criteria:
          </p>

          <ul className="space-y-4 mb-8">
            <Criterion text="The music answers the brief, not just the genre tag" />
            <Criterion text="Production quality is broadcast-ready" />
            <Criterion text="The arc of the music supports the arc of the brief" />
          </ul>

          <p className="text-base text-[#A8A39A] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Tracks that don&apos;t meet the bar still receive notes on what would have
            made the difference. The review is the value, not the catalog placement.
          </p>
        </div>

        <div className="border-t border-[#1F1D1A] mb-20" />

        {/* WHAT ACCEPTANCE MEANS */}
        <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-8" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          ◆ What Acceptance Means
        </div>

        <div className="max-w-2xl mb-12">
          <p className="text-base md:text-lg text-[#A8A39A] mb-10 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Getting into the Sonant Catalog should feel like an opportunity, not a trade.
            Here is exactly what it means, in plain terms.
          </p>

          <div className="mb-8">
            <h3 className="text-xl mb-2" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
              You keep your music
            </h3>
            <p className="text-base text-[#A8A39A] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              You retain full ownership of every track you submit. Use it in other libraries,
              release it yourself, put it on your own site. Submitting to Sonant restricts
              nothing. The catalog is non-exclusive.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl mb-2" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
              Sonant only earns when you do
            </h3>
            <p className="text-base text-[#A8A39A] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              There is no fee to submit and no fee to be in the catalog. If Sonant brokers
              a placement, getting your track used by a brand, the income splits 70/30 in
              your favor. If nothing gets placed, you owe nothing. We make money only when
              you make money.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl mb-2" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
              Why a catalog at all
            </h3>
            <p className="text-base text-[#A8A39A] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Sonant is built by composers, for composers. The goal is to be the first place
              a brand looks: a catalog of music written by people who already understand
              briefs, already practice writing to them, already think the way a sync
              placement needs them to think. Acceptance puts your work in front of people
              actively looking for exactly that.
            </p>
          </div>

          <p className="text-base text-[#C4BFB5] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            The bar is high on purpose. A small, reliable catalog is worth more to a music
            supervisor, and to you, than a large noisy one.
          </p>
        </div>

        <div className="border-t border-[#1F1D1A] mb-20" />
        {/* NOT SURE YET */}
        <div className="border border-[#2A2826] bg-[#141312] p-8 md:p-12 max-w-3xl" style={{ borderRadius: '2px' }}>
          <div className="text-[10px] tracking-[0.3em] uppercase text-[#E85D2F] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ◆ Not Sure Yet?
          </div>
          <p className="text-base md:text-lg text-[#C4BFB5] mb-3 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Live Reviews are a lower-friction way to get feedback on your work
            before committing to a submission. We listen together, talk through
            the gap between brief and music, identify patterns worth tracking.
          </p>
          <p className="text-base text-[#A8A39A] mb-8 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Most composers benefit from a Live Review before their first submission.
          </p>
          <Link
            href="/reviews"
            className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
          >
            ◆ Book a Live Review
          </Link>
        </div>

      </div>
    </div>
  );
}

function Step({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.3em] text-[#E85D2F] mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {num}
      </div>
      <h3 className="text-xl mb-2" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
        {title}
      </h3>
      <p className="text-sm text-[#A8A39A] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {body}
      </p>
    </div>
  );
}

function Criterion({ text }: { text: string }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="text-[#E85D2F] text-sm mt-0.5">◆</span>
      <span className="text-base text-[#C4BFB5] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {text}
      </span>
    </li>
  );
}