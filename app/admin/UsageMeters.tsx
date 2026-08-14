const LINKS = [
  {
    label: 'Claude',
    uses: 'Brief generation',
    href: 'https://console.anthropic.com/settings/billing',
    hrefLabel: 'Billing and usage',
  },
  {
    label: 'fal.ai',
    uses: 'Brief images',
    href: 'https://fal.ai/dashboard/billing',
    hrefLabel: 'Credits and billing',
  },
  {
    label: 'Stripe',
    uses: 'Payouts and charges',
    href: 'https://dashboard.stripe.com/balance',
    hrefLabel: 'Balance',
  },
] as const;

export default function UsageMeters() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
      {LINKS.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-[var(--border-card)] bg-[var(--bg-card)] p-5 hover:border-[#E85D2F] transition-colors block"
          style={{ borderRadius: '2px' }}
        >
          <div
            className="text-[10px] tracking-[0.25em] uppercase text-[#E85D2F] mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {link.label}
          </div>
          <p
            className="text-sm text-[var(--text-secondary)] mb-4"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {link.uses}
          </p>
          <div
            className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dimmer)]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {link.hrefLabel} ↗
          </div>
        </a>
      ))}
    </div>
  );
}
