'use client';

import Link from 'next/link';
import SubmitTrackModal from '@/components/SubmitTrackModal';
import ClientBriefSubmitModal from '@/components/ClientBriefSubmitModal';

type Props = {
  briefId: string | null;
  briefName: string;
  variant: 'client' | 'catalog' | 'practice';
  catalogExclusive?: boolean;
  catalogName?: string;
  catalogSplit?: string;
  loggedIn: boolean;
  alreadySubmitted?: boolean;
  submissionCredits?: number;
  isAdmin?: boolean;
  currentUserName?: string;
  discoUrl?: string | null;
};

const serif = { fontFamily: "'Fraunces', serif" } as const;
const sans = { fontFamily: "'DM Sans', sans-serif" } as const;
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

const cardClass = 'relative p-8 border bg-[var(--bg-card)] transition-colors flex flex-col';
const orangeBtn =
  'block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors text-center';
const creamBtn =
  'block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase bg-[#F5EFE0] text-[#1A1815] hover:bg-[#FFFFFF] transition-colors text-center';

function Bullet({ children }: { children: string }) {
  return (
    <li className="flex gap-3 items-baseline text-sm text-[var(--text-secondary)]" style={sans}>
      <span className="text-[#E85D2F]">·</span>
      <span>{children}</span>
    </li>
  );
}

function Card({
  icon,
  tag,
  title,
  body,
  bullets,
  accent = false,
  children,
  footnote,
}: {
  icon: string;
  tag: string;
  title: React.ReactNode;
  body: string;
  bullets: string[];
  accent?: boolean;
  children: React.ReactNode;
  footnote: React.ReactNode;
}) {
  return (
    <div
      className={`${cardClass} ${
        accent
          ? 'border-[#E85D2F]/30 hover:border-[#E85D2F]/60'
          : 'border-[var(--border-card)] hover:border-[var(--border-hover)]'
      }`}
      style={{ borderRadius: '2px' }}
    >
      <div className="flex items-start justify-between mb-6">
        <span className="text-2xl text-[#E85D2F]">{icon}</span>
        <span
          className={`text-[10px] tracking-[0.25em] uppercase ${accent ? 'text-[#E85D2F]' : 'text-[var(--text-dim)]'}`}
          style={mono}
        >
          {tag}
        </span>
      </div>
      <h3 className="text-3xl mb-3 leading-tight text-[var(--text-primary)]" style={{ ...serif, fontWeight: 400 }}>
        {title}
      </h3>
      <p className="text-sm text-[var(--text-tertiary)] leading-relaxed mb-6" style={sans}>
        {body}
      </p>
      <ul className="space-y-2 mb-8 flex-1">
        {bullets.map((item) => (
          <Bullet key={item}>{item}</Bullet>
        ))}
      </ul>
      <div className="space-y-3">
        {children}
        <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dim)] text-center" style={mono}>
          {footnote}
        </div>
      </div>
    </div>
  );
}

function printBrief() {
  document.body.dataset.printBrief = '';
  const clear = () => {
    delete document.body.dataset.printBrief;
    window.removeEventListener('afterprint', clear);
  };
  window.addEventListener('afterprint', clear);
  window.print();
}

function DownloadCard() {
  return (
    <Card
      icon="↓"
      tag="Download · PDF"
      title={<>Download <span className="italic">the brief</span></>}
      body="Take the full brief offline. Keep it open next to your session while you write."
      bullets={['Every section, laid out for print', 'Just the brief, nothing else on the page', 'Free, no credit used']}
      footnote="Opens print · choose Save as PDF"
    >
      <button
        type="button"
        onClick={printBrief}
        className={creamBtn}
        style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}
      >
        ↓ Download PDF
      </button>
    </Card>
  );
}

function Heading({ title, body }: { title: React.ReactNode; body: string }) {
  return (
    <>
      <h2 className="text-3xl md:text-4xl mb-3 tracking-tight leading-tight" style={{ ...serif, fontWeight: 300 }}>
        {title}
      </h2>
      <p className="text-base text-[var(--text-tertiary)] mb-8 max-w-xl" style={sans}>
        {body}
      </p>
    </>
  );
}

export default function BriefNextSteps({
  briefId,
  briefName,
  variant,
  catalogExclusive = false,
  catalogName = 'Sonant',
  catalogSplit = '50/50',
  loggedIn,
  alreadySubmitted = false,
  submissionCredits = 0,
  isAdmin = false,
  currentUserName = '',
  discoUrl = null,
}: Props) {
  const signUpHref = briefId ? `/signup?redirect=/briefs/${briefId}` : '/signup';

  if (variant === 'client') {
    return (
      <section className="mt-10 no-print">
        <Heading
          title={<>Ready to <span className="italic">deliver</span>.</>}
          body="Paid client work goes to Disco as a WAV. There is no public playlist on these briefs, and no credit is used."
        />
        <div className="max-w-xl">
          <Card
            accent
            icon="↗"
            tag="Submit · Client"
            title={<>Send it on <span className="italic">Disco</span></>}
            body="This opens the Sonant Disco inbox. Deliver the WAV there. Send as many takes as you like. We want to hear the good ones."
            bullets={['No credit used', 'WAV, as many takes as you want', 'Private to the Sonant team', 'Demo fee if we send it to the client']}
            footnote={loggedIn ? 'WAV · no credit' : 'Verified composers only'}
          >
            {loggedIn && briefId ? (
              <ClientBriefSubmitModal
                briefId={briefId}
                briefName={briefName}
                composerName={currentUserName}
                discoUrl={discoUrl}
                triggerLabel="↗ Deliver on Disco"
                triggerClassName={orangeBtn}
              />
            ) : (
              <Link href={signUpHref} className={orangeBtn} style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}>
                ◆ Create Account to Deliver
              </Link>
            )}
          </Card>
        </div>
      </section>
    );
  }

  if (variant === 'practice') {
    return (
      <section className="mt-10 no-print">
        <Heading
          title={<>Write to <span className="italic">it</span>.</>}
          body="Practice briefs are for reps. Download it and write the track on your own time."
        />
        <div className="max-w-xl">
          <DownloadCard />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10 no-print">
      <Heading
        title={<>Once your track is <span className="italic">ready</span>.</>}
        body={`${catalogName} is looking for this one. Download the brief to write offline, then submit your track with a credit.`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DownloadCard />
        <Card
          accent
          icon="↗"
          tag={`Submit · ${catalogName}`}
          title={<>Submit to <span className="italic">{catalogName}</span></>}
          body={`Send the track in for written feedback. The strongest go to ${catalogName}.${
            catalogExclusive ? ` Accepted tracks are exclusive to the ${catalogName} catalog.` : ''
          }`}
          bullets={[
            'Uses 1 submission credit',
            'Written feedback on every submission',
            catalogExclusive ? `Exclusive · ${catalogSplit} if it places` : 'Non-exclusive: the music stays yours',
          ]}
          footnote={loggedIn ? '1 credit · MP3 or WAV' : 'Free account · 1 credit / month'}
        >
          {loggedIn && briefId ? (
            <SubmitTrackModal
              briefId={briefId}
              projectName={briefName}
              alreadySubmitted={alreadySubmitted}
              submissionCredits={submissionCredits}
              isAdmin={isAdmin}
              triggerLabel={`↗ Submit to ${catalogName}`}
              triggerClassName={orangeBtn}
            />
          ) : (
            <Link href={signUpHref} className={orangeBtn} style={{ ...mono, borderRadius: '2px', fontWeight: 500 }}>
              ◆ Create Account to Submit
            </Link>
          )}
        </Card>
      </div>
    </section>
  );
}
