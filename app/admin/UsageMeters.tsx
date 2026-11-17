const LINKS = [
  { label: 'Claude billing', href: 'https://console.anthropic.com/settings/billing' },
  { label: 'fal.ai credits', href: 'https://fal.ai/dashboard/billing' },
  { label: 'Stripe balance', href: 'https://dashboard.stripe.com/balance' },
] as const;

export default function UsageMeters() {
  return (
    <div className="mt-20 pt-6 border-t border-[var(--border-base)] flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
      <span className="text-[var(--text-dimmer)]">Services</span>
      {LINKS.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {link.label} ↗
        </a>
      ))}
    </div>
  );
}
