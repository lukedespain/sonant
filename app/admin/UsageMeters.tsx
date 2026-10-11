const LINKS = [
  { label: 'Claude billing', href: 'https://console.anthropic.com/settings/billing' },
  { label: 'fal.ai credits', href: 'https://fal.ai/dashboard/billing' },
  { label: 'Stripe balance', href: 'https://dashboard.stripe.com/balance' },
] as const;

export default function UsageMeters() {
  return (
    <div className="mt-20 pt-8 border-t border-[var(--border-base)] flex flex-wrap items-center gap-x-8 gap-y-3">
      <span className="label text-[var(--text-dimmer)]">Services</span>
      {LINKS.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          {link.label} ↗
        </a>
      ))}
    </div>
  );
}
