export default function FeedbackPage() {
  return (
    <div className="pt-20 pb-24 flex-1">
      <div className="max-w-5xl mx-auto px-6 md:px-10">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ◆ 1:1 Feedback
            </div>

            <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-6" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
              Get notes on<br />
              <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>your track.</span>
            </h1>

            <p className="text-base text-[var(--text-tertiary)] mb-6 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              A focused one-on-one session where we listen to your track together, compare it against the brief you wrote to, and give you specific notes in real time.
            </p>

            <p className="text-sm text-[var(--text-muted)] mb-10 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Good for checking a track before submission, understanding why something isn&apos;t working, or getting a second ear on a mix you&apos;ve been staring at too long.
            </p>

            <div className="space-y-4 border-t border-[var(--border-base)] pt-8">
              {[
                { label: 'Session length', value: '1 hour' },
                { label: 'Standard rate', value: '$50 / session' },
                { label: 'Pro member rate', value: '$25 / session' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {label}
                  </span>
                  <span className="text-sm text-[var(--text-primary)]" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Pick a time
            </div>
            <div
              className="border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden"
              style={{ borderRadius: '2px' }}
            >
              <iframe
                src="https://cal.com/sonant/30-minutes?embed=true&theme=light"
                style={{ width: '100%', height: '660px', border: 'none' }}
                title="Book a 1:1 feedback session"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
