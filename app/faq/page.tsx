import Link from 'next/link';
import type { Metadata } from 'next';
import AboutQuestions from '@/components/AboutQuestions';
import { Page, PageHeader, btn } from '@/components/ui';

export const metadata: Metadata = {
  title: 'FAQ | Sonant',
  description: 'How briefs, submissions, feedback, and catalog placements work on Sonant.',
};

export default function FaqPage() {
  return (
    <Page narrow>
      <PageHeader title="Questions." description="How briefs, submissions, feedback, and placements work." />
      <AboutQuestions />
      <div className="mt-14 flex flex-wrap items-center gap-3">
        <Link href="/briefs" className={btn('primary')}>◆ Open briefs</Link>
        <a href="mailto:hello@sonant.ac" className={btn('secondary')}>Ask us something else</a>
      </div>
    </Page>
  );
}
