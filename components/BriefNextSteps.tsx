'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import SubmitTrackModal from '@/components/SubmitTrackModal';
import ClientBriefSubmitModal from '@/components/ClientBriefSubmitModal';
import { DownloadBriefButton } from '@/components/BriefActions';
import { btn } from '@/components/ui';

type Props = {
  briefId: string | null;
  briefName: string;
  variant: 'client' | 'catalog' | 'practice';
  catalogExclusive?: boolean;
  catalogName?: string;
  catalogSplit?: string;
  humanMadeOnly?: boolean;
  loggedIn: boolean;
  alreadySubmitted?: boolean;
  submissionCredits?: number;
  isAdmin?: boolean;
  currentUserName?: string;
  discoUrl?: string | null;
  closed?: boolean;
};

function Card({
  title,
  body,
  bullets,
  accent = false,
  action,
  footnote,
}: {
  title: ReactNode;
  body: string;
  bullets: string[];
  accent?: boolean;
  action: ReactNode;
  footnote?: string;
}) {
  return (
    <div
      className={`flex flex-col p-7 md:p-8 border rounded-[2px] bg-[var(--bg-card)] ${
        accent ? 'border-[var(--accent-line)]' : 'border-[var(--border-card)]'
      }`}
    >
      <h3 className="font-serif text-2xl md:text-[1.7rem] tracking-tight leading-tight">{title}</h3>
      <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed">{body}</p>
      <ul className="mt-5 mb-8 space-y-2 flex-1">
        {bullets.map((item) => (
          <li key={item} className="flex gap-3 items-baseline text-sm text-[var(--text-secondary)]">
            <span className="text-[var(--accent)]">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {action}
      {footnote && <p className="mt-3 text-center text-xs text-[var(--text-dimmer)]">{footnote}</p>}
    </div>
  );
}

function Heading({ title, body }: { title: ReactNode; body: string }) {
  return (
    <div className="mb-8 max-w-xl">
      <h2 className="font-serif font-light text-3xl md:text-4xl tracking-tight leading-tight">{title}</h2>
      <p className="mt-3 text-[15px] text-[var(--text-tertiary)] leading-relaxed">{body}</p>
    </div>
  );
}

export default function BriefNextSteps({
  briefId,
  briefName,
  variant,
  catalogExclusive = false,
  catalogName = 'Sonant',
  catalogSplit = '50/50',
  humanMadeOnly = false,
  loggedIn,
  alreadySubmitted = false,
  submissionCredits = 0,
  isAdmin = false,
  currentUserName = '',
  discoUrl = null,
  closed = false,
}: Props) {
  const signUpHref = briefId ? `/signup?redirect=/briefs/${briefId}` : '/signup';

  if (variant === 'client') {
    if (closed) {
      return (
        <section className="mt-16 no-print">
          <div className="border border-dashed border-[var(--border-card)] rounded-[2px] px-6 py-12 text-center">
            <p className="font-serif text-2xl tracking-tight">This brief is closed.</p>
            <p className="mt-3 text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              New paid client briefs are on the way. Verified composers get an email the moment one hits Sonant.
            </p>
          </div>
        </section>
      );
    }
    return (
      <section className="mt-16 no-print">
        <Heading
          title={<>Ready to <span className="italic">deliver</span>.</>}
          body="Paid client work goes to Disco as a WAV. No credit is used, and it stays private to the Sonant team."
        />
        <div className="max-w-xl">
          <Card
            accent
            title={<>Deliver on <span className="italic">Disco</span></>}
            body="This opens the Sonant Disco inbox. Send as many takes as you like. We want to hear the good ones."
            bullets={['No credit used', 'WAV, as many takes as you want', 'Demo fee if we send it to the client']}
            action={
              loggedIn && briefId ? (
                <ClientBriefSubmitModal
                  briefId={briefId}
                  briefName={briefName}
                  composerName={currentUserName}
                  discoUrl={discoUrl}
                  triggerLabel="↗ Deliver on Disco"
                  triggerClassName={btn('primary', 'md', 'w-full')}
                />
              ) : (
                <Link href={signUpHref} className={btn('primary', 'md', 'w-full')}>
                  Create account to deliver
                </Link>
              )
            }
          />
        </div>
      </section>
    );
  }

  if (variant === 'practice') {
    return (
      <section className="mt-16 no-print">
        <Heading
          title={<>Write to <span className="italic">it</span>.</>}
          body="Practice briefs are for reps. Download it and write the track on your own time."
        />
        <div className="max-w-xl">
          <Card
            title={<>Download <span className="italic">the brief</span></>}
            body="Keep it open next to your session while you write."
            bullets={['Every section, laid out for print', 'Just the brief, nothing else on the page']}
            action={<DownloadBriefButton briefId={briefId} variant="secondary" size="md" className="w-full" />}
            footnote={briefId ? 'Saves a PDF to your computer' : 'Opens print. Choose Save as PDF.'}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-16 no-print">
      <Heading
        title={<>Once your track is <span className="italic">ready</span>.</>}
        body={`${catalogName} is looking for this one. Every submission gets written feedback on the track.`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          title={<>Download <span className="italic">the brief</span></>}
          body="Keep it open next to your session while you write."
          bullets={['Every section, laid out for print', 'Free, no credit used']}
          action={<DownloadBriefButton briefId={briefId} variant="secondary" size="md" className="w-full" />}
          footnote={briefId ? 'Saves a PDF to your computer' : 'Opens print. Choose Save as PDF.'}
        />
        <Card
          accent
          title={<>Submit to <span className="italic">{catalogName}</span></>}
          body={`The strongest tracks go to ${catalogName}.${catalogExclusive ? ' Accepted tracks are exclusive to their catalog.' : ''}`}
          bullets={[
            'Uses 1 submission credit',
            'Written feedback on every submission',
            `${catalogExclusive ? 'Exclusive' : 'Non-exclusive'} · ${catalogSplit} if it places`,
            ...(humanMadeOnly ? ['Human-made only, no AI'] : []),
          ]}
          action={
            loggedIn && briefId ? (
              <SubmitTrackModal
                briefId={briefId}
                projectName={briefName}
                alreadySubmitted={alreadySubmitted}
                submissionCredits={submissionCredits}
                isAdmin={isAdmin}
                triggerLabel="↗ Submit track"
                triggerClassName={btn('primary', 'md', 'w-full')}
              />
            ) : (
              <Link href={signUpHref} className={btn('primary', 'md', 'w-full')}>
                Create account to submit
              </Link>
            )
          }
          footnote={loggedIn ? 'MP3 or WAV' : 'Free account · 1 credit a month'}
        />
      </div>
    </section>
  );
}
