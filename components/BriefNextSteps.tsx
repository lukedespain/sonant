'use client';

import Link from 'next/link';
import SubmitTrackModal from '@/components/SubmitTrackModal';
import UploadTrackModal from '@/components/UploadTrackModal';
import ClientBriefSubmitModal from '@/components/ClientBriefSubmitModal';

type Props = {
  briefId: string;
  briefName: string;
  variant: 'client' | 'catalog';
  loggedIn: boolean;
  alreadySubmitted: boolean;
  submissionCredits: number;
  isAdmin: boolean;
  currentUserName?: string;
  discoUrl?: string | null;
};

const cardClass =
  'relative p-8 border bg-[var(--bg-card)] transition-colors flex flex-col';
const orangeBtn =
  'block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors text-center';
const creamBtn =
  'block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase bg-[#F5EFE0] text-[#1A1815] hover:bg-[#FFFFFF] transition-colors text-center';

function Bullet({ children }: { children: string }) {
  return (
    <li className="flex gap-3 items-baseline text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <span className="text-[#E85D2F]">·</span>
      <span>{children}</span>
    </li>
  );
}

export default function BriefNextSteps({
  briefId,
  briefName,
  variant,
  loggedIn,
  alreadySubmitted,
  submissionCredits,
  isAdmin,
  currentUserName = '',
  discoUrl = null,
}: Props) {
  const isClient = variant === 'client';
  const signInHref = `/login?redirect=/browse/${briefId}`;
  const signUpHref = `/signup?redirect=/browse/${briefId}`;

  if (isClient) {
    return (
      <section className="mt-10 no-print">
        <h2 className="text-3xl md:text-4xl mb-3 tracking-tight leading-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
          Ready to <span className="italic">deliver</span>.
        </h2>
        <p className="text-base text-[var(--text-tertiary)] mb-8 max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Paid client work goes to Disco as a WAV. There is no public playlist on these briefs, and no credit is used.
        </p>
        <div className="max-w-xl">
          <div
            className={`${cardClass} border-[#E85D2F]/30 hover:border-[#E85D2F]/60`}
            style={{ borderRadius: '2px' }}
          >
            <div className="flex items-start justify-between mb-6">
              <span className="text-2xl text-[#E85D2F]">↗</span>
              <span className="text-[10px] tracking-[0.25em] uppercase text-[#E85D2F]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Submit · Client
              </span>
            </div>
            <h3 className="text-3xl mb-3 leading-tight text-[var(--text-primary)]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
              Send it on <span className="italic">Disco</span>
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              This opens the Sonant Disco inbox. Deliver the WAV there. Send as many takes as you like — we want to hear the good ones.
            </p>
            <ul className="space-y-2 mb-8 flex-1">
              {[
                'No credit used',
                'WAV, as many takes as you want',
                'Private to the Sonant team',
                'Demo fee if we send it to the client',
              ].map((item) => (
                <Bullet key={item}>{item}</Bullet>
              ))}
            </ul>
            <div className="space-y-3">
              {loggedIn ? (
                <ClientBriefSubmitModal
                  briefId={briefId}
                  briefName={briefName}
                  composerName={currentUserName}
                  discoUrl={discoUrl}
                  triggerLabel="↗ Deliver on Disco"
                  triggerClassName={orangeBtn}
                />
              ) : (
                <Link href={signUpHref} className={orangeBtn} style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}>
                  ◆ Create Account to Deliver
                </Link>
              )}
              <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dim)] text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {loggedIn ? 'WAV · no credit' : 'Verified composers only'}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10 no-print">
      <h2 className="text-3xl md:text-4xl mb-3 tracking-tight leading-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
        Once your track is <span className="italic">ready</span>.
      </h2>
      <p className="text-base text-[var(--text-tertiary)] mb-8 max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        Upload a take to this brief for free, or spend a credit to submit it privately to the catalog.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`${cardClass} border-[var(--border-card)] hover:border-[var(--border-hover)]`}
          style={{ borderRadius: '2px' }}
        >
          <div className="flex items-start justify-between mb-6">
            <span className="text-2xl text-[#E85D2F]">↑</span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-dim)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Upload · Playlist
            </span>
          </div>
          <h3 className="text-3xl mb-3 leading-tight text-[var(--text-primary)]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
            Upload to <span className="italic">this brief</span>
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Attach an MP3 to the playlist. Keep it public so other composers can hear it, or private on your profile.
          </p>
          <ul className="space-y-2 mb-8 flex-1">
            {[
              'Free. No credit used',
              'Public or private, you choose',
              'Lives on this brief and your profile',
              'Does not go to the catalog',
            ].map((item) => (
              <Bullet key={item}>{item}</Bullet>
            ))}
          </ul>
          <div className="space-y-3">
            {loggedIn ? (
              <UploadTrackModal
                briefId={briefId}
                briefName={briefName}
                currentUserName={currentUserName}
                triggerLabel="↑ Upload MP3"
                triggerClassName={creamBtn}
              />
            ) : (
              <Link href={signUpHref} className={creamBtn} style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}>
                ◆ Create Account to Upload
              </Link>
            )}
            <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dim)] text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {loggedIn ? 'MP3 · max 50 MB' : (
                <>
                  <Link href={signInHref} className="hover:text-[#E85D2F] transition-colors">Sign in</Link>
                  {' · '}free
                </>
              )}
            </div>
          </div>
        </div>

        <div
          className={`${cardClass} border-[#E85D2F]/30 hover:border-[#E85D2F]/60`}
          style={{ borderRadius: '2px' }}
        >
          <div className="flex items-start justify-between mb-6">
            <span className="text-2xl text-[#E85D2F]">↗</span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#E85D2F]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Submit · Catalog
            </span>
          </div>
          <h3 className="text-3xl mb-3 leading-tight text-[var(--text-primary)]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
            Submit to the <span className="italic">catalog</span>
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Send the track in for written feedback and catalog consideration. One credit. This goes privately to the team, not onto the playlist.
          </p>
          <ul className="space-y-2 mb-8 flex-1">
            {[
              'Uses 1 submission credit',
              'Written feedback on every submission',
              'Accepted tracks are placed and pitched',
              'Non-exclusive: the music stays yours',
            ].map((item) => (
              <Bullet key={item}>{item}</Bullet>
            ))}
          </ul>
          <div className="space-y-3">
            {loggedIn ? (
              <SubmitTrackModal
                briefId={briefId}
                projectName={briefName}
                alreadySubmitted={alreadySubmitted}
                submissionCredits={submissionCredits}
                isAdmin={isAdmin}
                triggerLabel="↗ Submit to Catalog"
                triggerClassName={orangeBtn}
              />
            ) : (
              <Link href={signUpHref} className={orangeBtn} style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}>
                ◆ Create Account to Submit
              </Link>
            )}
            <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dim)] text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {loggedIn ? '1 credit · MP3 or WAV' : 'Free account · 1 credit / month'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
