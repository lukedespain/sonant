import Link from 'next/link';
import type { Metadata } from 'next';
import AboutQuestions from '@/components/AboutQuestions';
import { Page, PageHeader, btn } from '@/components/ui';

export const metadata: Metadata = {
  title: 'FAQ · Thought Collective Composers',
  description: 'How briefs, submissions, feedback, and the Thought Collective catalogue work.',
};

export default function FaqPage() {
  return (
    <Page narrow>
      <PageHeader title="FAQ" description="How briefs, submissions, feedback, and the catalogue work." />
      <AboutQuestions />
      <div className="mt-14 flex flex-wrap items-center gap-3">
        <Link href="/briefs" className={btn('primary')}>See the briefs</Link>
        <a href="mailto:hello@thoughtcollective.com" className={btn('secondary')}>Ask us something else</a>
      </div>
    </Page>
  );
}
