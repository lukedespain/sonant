import Link from 'next/link';
import type { ReactNode } from 'react';
import SubmitTrackModal from '@/components/SubmitTrackModal';
import ClientBriefSubmitModal from '@/components/ClientBriefSubmitModal';
import { DownloadBriefButton } from '@/components/BriefActions';
import { StatusPill, btn, card, type Tone } from '@/components/ui';

export type BriefPanelProps = {
  briefId: string;
  title: string;
  variant: 'client' | 'catalog' | 'practice';
  signedIn: boolean;
  isAdmin: boolean;
  submission: { label: string; tone: Tone; pulse?: boolean } | null;
  credits: number;
  daysUntilNextCredit: number | null;
  deadline?: string;
  catalog?: { name: string; exclusive: boolean; split: string; humanMadeOnly: boolean } | null;
  client?: { demoFee?: string; winFee?: string } | null;
  closed: boolean;
  currentUserName: string;
  discoUrl: string | null;
};

function Fact({ label, value }: { label: string; value?: ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-[13px] text-[var(--text-muted)]">{label}</dt>
      <dd className="text-[14px] text-right">{value}</dd>
    </div>
  );
}

/** The primary action for a brief, used in the side panel and the phone action bar. */
export function BriefPrimaryAction(props: BriefPanelProps & { size?: 'md' | 'lg'; full?: boolean; compact?: boolean }) {
  const { briefId, title, variant, signedIn, isAdmin, submission, credits, closed, currentUserName, discoUrl } = props;
  const cls = btn('accent', props.size ?? 'lg', props.full === false ? '' : 'w-full');
  const signUp = `/signup?redirect=/briefs/${briefId}`;

  if (variant === 'client') {
    if (closed) return <p className="text-[13px] text-[var(--text-dim)] text-center">This brief is closed.</p>;
    if (!signedIn) {
      return (
        <Link href={signUp} className={cls}>
          {props.compact ? 'Sign up' : 'Create an account'}
        </Link>
      );
    }
    return (
      <ClientBriefSubmitModal
        briefId={briefId}
        briefName={title}
        composerName={currentUserName}
        discoUrl={discoUrl}
        triggerLabel="Deliver on Disco"
        triggerClassName={cls}
      />
    );
  }

  if (variant === 'practice') return <DownloadBriefButton briefId={briefId} variant="primary" size={props.size ?? 'md'} className="w-full" />;

  if (!signedIn) {
    return (
      <Link href={signUp} className={cls}>
        {props.compact ? 'Sign up to submit' : 'Create an account to submit'}
      </Link>
    );
  }
  return (
    <SubmitTrackModal
      briefId={briefId}
      projectName={title}
      alreadySubmitted={!!submission}
      submissionCredits={credits}
      isAdmin={isAdmin}
      triggerLabel={submission ? (props.compact ? 'Submit again' : 'Submit another track') : props.compact ? 'Submit' : 'Submit your track'}
      triggerClassName={submission ? btn('secondary', props.size ?? 'lg', props.full === false ? '' : 'w-full') : cls}
    />
  );
}

export default function BriefPanel(props: BriefPanelProps) {
  const { variant, signedIn, isAdmin, submission, credits, daysUntilNextCredit, catalog, client, deadline, closed } = props;

  return (
    <div className="flex flex-col gap-3">
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-[var(--text-muted)]">
            {variant === 'client' ? 'Paid client brief' : variant === 'catalog' ? 'Catalogue brief' : 'Practice brief'}
          </p>
          {submission ? (
            <StatusPill tone={submission.tone} pulse={submission.pulse}>
              {submission.label}
            </StatusPill>
          ) : closed ? (
            <StatusPill tone="muted">Closed</StatusPill>
          ) : (
            <StatusPill tone="signal">Open</StatusPill>
          )}
        </div>

        <dl className="mt-3 divide-y divide-[var(--border-base)] border-y border-[var(--border-base)]">
          {catalog && (
            <>
              <Fact label="Catalogue" value={catalog.name} />
              <Fact label="Rights" value={catalog.exclusive ? 'Exclusive' : 'Non-exclusive'} />
              <Fact label="Sync fees" value={`${catalog.split} split`} />
            </>
          )}
          {client && (
            <>
              <Fact label="Demo fee" value={client.demoFee} />
              <Fact label="If it wins" value={client.winFee ?? '70/30 your way'} />
            </>
          )}
          <Fact label="Due" value={deadline} />
          <Fact label="Joins the roster" value={variant === 'catalog' ? 'When accepted' : undefined} />
        </dl>

        <div className="mt-5 flex flex-col gap-2">
          <BriefPrimaryAction {...props} />
          <DownloadBriefButton briefId={props.briefId} variant="secondary" size="lg" className="w-full" />
        </div>

        {submission && (
          <Link
            href="/dashboard"
            className="mt-3 block text-center text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Track it in Submissions →
          </Link>
        )}
      </div>

      {variant === 'catalog' && signedIn && !isAdmin && (
        <div className={`${card} px-5 py-4 flex items-center justify-between gap-4`}>
          <div>
            <p className="text-[13px] text-[var(--text-muted)]">Free submissions</p>
            <p className="text-[12px] text-[var(--text-dim)]">
              {daysUntilNextCredit != null ? `+1 in ${daysUntilNextCredit} ${daysUntilNextCredit === 1 ? 'day' : 'days'}` : 'One a week'}
              {' · they stack'}
            </p>
          </div>
          <p className="text-[24px] font-semibold tracking-[-0.03em] tabular-nums">{credits}</p>
        </div>
      )}

      {catalog?.humanMadeOnly && (
        <p className="px-2 text-[12px] text-[var(--text-dim)] leading-relaxed">
          Human-made only. No AI-generated music, stems, or vocals.
        </p>
      )}
    </div>
  );
}
