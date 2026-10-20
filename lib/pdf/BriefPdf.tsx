import type React from 'react';
import path from 'node:path';
import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Brief } from '@/components/BriefDocument';
import type { CatalogPartner } from '@/lib/partners';
import { youtubeSearchUrlForTrack } from '@/lib/youtube-search';

const FONT_DIR = path.join(process.cwd(), 'lib/pdf/fonts');
const font = (file: string) => path.join(FONT_DIR, file);

Font.register({
  family: 'Fraunces',
  fonts: [
    { src: font('Fraunces-300.ttf'), fontWeight: 300 },
    { src: font('Fraunces-400.ttf'), fontWeight: 400 },
    { src: font('Fraunces-400-italic.ttf'), fontWeight: 400, fontStyle: 'italic' },
  ],
});
Font.register({
  family: 'DM Sans',
  fonts: [
    { src: font('DMSans-400.ttf'), fontWeight: 400 },
    { src: font('DMSans-500.ttf'), fontWeight: 500 },
    { src: font('DMSans-600.ttf'), fontWeight: 600 },
  ],
});
Font.register({ family: 'JetBrains Mono', src: font('JetBrainsMono-400.ttf') });
Font.registerHyphenationCallback((word) => [word]);

const C = {
  paper: '#F5EFE0',
  ink: '#1A1815',
  body: '#2E2A25',
  meta: '#8A8680',
  rule: '#D9D0BD',
  accent: '#E85D2F',
  use: '#4F7F45',
  skip: '#B33A1A',
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.paper,
    color: C.body,
    fontFamily: 'DM Sans',
    fontSize: 10.5,
    paddingTop: 44,
    paddingBottom: 60,
    paddingHorizontal: 54,
  },
  hero: { width: '100%', height: 190, objectFit: 'cover', borderRadius: 2, marginBottom: 26 },
  kickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  kicker: { fontFamily: 'JetBrains Mono', fontSize: 7.5, letterSpacing: 2, color: C.meta, textTransform: 'uppercase' },
  title: { fontFamily: 'Fraunces', fontWeight: 300, fontSize: 30, color: C.ink, lineHeight: 1.1, marginBottom: 8 },
  titleItalic: { fontFamily: 'Fraunces', fontWeight: 400, fontStyle: 'italic' },
  meta: { fontFamily: 'JetBrains Mono', fontSize: 7.5, color: C.meta, lineHeight: 1.6 },
  header: { borderBottomWidth: 1, borderBottomColor: C.rule, paddingBottom: 16, marginBottom: 22 },
  section: { marginBottom: 20 },
  label: { fontFamily: 'JetBrains Mono', fontSize: 7.5, letterSpacing: 2, color: C.accent, textTransform: 'uppercase', marginBottom: 8 },
  scene: { fontFamily: 'Fraunces', fontWeight: 300, fontSize: 14.5, lineHeight: 1.5, color: C.ink },
  bodyText: { fontSize: 10.5, lineHeight: 1.6 },
  row: { flexDirection: 'row', marginBottom: 6 },
  arrow: { fontFamily: 'JetBrains Mono', color: C.accent, width: 16, fontSize: 10 },
  rowText: { flex: 1, fontSize: 10.5, lineHeight: 1.5 },
  ref: { borderLeftWidth: 2, borderLeftColor: C.rule, paddingLeft: 10, marginBottom: 12 },
  refTitle: { fontWeight: 500, fontSize: 10.5, color: C.ink, textDecoration: 'none', marginBottom: 3 },
  refLine: { fontSize: 9.5, lineHeight: 1.5 },
  dnaGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dnaItem: { width: '33.33%', paddingRight: 12, marginBottom: 12 },
  dnaLabel: { fontFamily: 'JetBrains Mono', fontSize: 7, letterSpacing: 1.5, color: C.meta, textTransform: 'uppercase', marginBottom: 3 },
  dnaValue: { fontSize: 10, fontWeight: 500, color: C.ink, lineHeight: 1.35 },
  box: { borderWidth: 1, borderColor: C.rule, borderRadius: 2, padding: 16, marginBottom: 18 },
  boxName: { fontFamily: 'Fraunces', fontSize: 14, color: C.ink, marginBottom: 2 },
  boxText: { fontSize: 9.5, lineHeight: 1.6, marginTop: 8 },
  footer: {
    position: 'absolute',
    bottom: 26,
    left: 54,
    right: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontFamily: 'JetBrains Mono',
    fontSize: 7,
    color: C.meta,
    letterSpacing: 1,
  },
});

function Label({ children }: { children: string }) {
  return <Text style={s.label}>◆  {children}</Text>;
}

/** A list section whose heading never sits alone at the bottom of a page. */
function ListSection({ label, items }: { label: string; items: React.ReactNode[] }) {
  if (items.length === 0) return null;
  const [first, ...rest] = items;
  return (
    <View style={s.section}>
      <View wrap={false}>
        <Label>{label}</Label>
        {first}
      </View>
      {rest}
    </View>
  );
}

function DnaItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={s.dnaItem}>
      <Text style={s.dnaLabel}>{label}</Text>
      <Text style={s.dnaValue}>{value}</Text>
    </View>
  );
}

export default function BriefPdf({
  brief,
  partner,
  houseLabel,
  image,
}: {
  brief: Brief;
  partner: CatalogPartner | null;
  houseLabel: string;
  image: Buffer | null;
}) {
  const title = brief.projectTitle || brief.codename;
  const isClient = brief.kind === 'client';
  const meta = [
    brief.briefId,
    brief.client,
    !isClient && brief.brandName && brief.brandName !== brief.client ? brief.brandName : null,
    !isClient ? brief.project : null,
    brief.issued ? `Issued ${brief.issued}` : null,
    brief.deadline ? `Due ${brief.deadline}` : null,
  ].filter(Boolean).join('  ·  ');

  return (
    <Document title={`Project ${title}`} author="Sonant" creator="Sonant" producer="Sonant">
      <Page size="LETTER" style={s.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img */}
        {image && <Image src={image} style={s.hero} />}

        <View style={s.header}>
          <View style={s.kickerRow}>
            <Text style={s.kicker}>Music brief</Text>
            {partner && <Text style={s.kicker}>{partner.name}</Text>}
          </View>
          <Text style={s.title}>
            Project <Text style={s.titleItalic}>{title}</Text>
          </Text>
          <Text style={s.meta}>{meta}</Text>
        </View>

        <View style={s.section}>
          <Label>The scene</Label>
          <Text style={s.scene}>{brief.story}</Text>
        </View>

        <View style={s.section}>
          <Label>The music</Label>
          <Text style={s.bodyText}>{brief.ask}</Text>
        </View>

        <ListSection
          label="Direction"
          items={(brief.direction ?? []).map((d, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={s.arrow}>→</Text>
              <Text style={s.rowText}>{d}</Text>
            </View>
          ))}
        />

        <ListSection
          label="References"
          items={(brief.references ?? []).map((r, i) => {
            const href = partner ? youtubeSearchUrlForTrack(r.track) : r.url;
            return (
              <View key={i} style={s.ref} wrap={false}>
                {href ? (
                  <Link src={href} style={s.refTitle}>
                    {r.track}  ↗
                  </Link>
                ) : (
                  <Text style={s.refTitle}>{r.track}</Text>
                )}
                {(r.like || r.why) && (
                  <Text style={s.refLine}>
                    <Text style={{ color: C.use, fontWeight: 600 }}>Use: </Text>
                    {r.like ?? r.why}
                  </Text>
                )}
                {r.avoid && (
                  <Text style={s.refLine}>
                    <Text style={{ color: C.skip, fontWeight: 600 }}>Skip: </Text>
                    {r.avoid}
                  </Text>
                )}
              </View>
            );
          })}
        />

        {!partner && (
          <ListSection
            label="Files and links"
            items={(brief.links ?? []).map((link) => (
              <View key={link.url} style={s.row} wrap={false}>
                <Text style={s.arrow}>→</Text>
                <Link src={link.url} style={[s.rowText, { color: C.ink, textDecoration: 'none' }]}>
                  {link.label}  ↗
                </Link>
              </View>
            ))}
          />
        )}

        <View style={s.section} wrap={false}>
          <Label>Sonic DNA</Label>
          <View style={s.dnaGrid}>
            <DnaItem label="Genre" value={brief.genrePalette} />
            <DnaItem label="Mood" value={brief.emotionalArc} />
            <DnaItem label="Tempo" value={brief.tempo} />
            <DnaItem label="Key" value={brief.key} />
            <DnaItem label="Length" value={brief.length} />
            <DnaItem label="Type" value={brief.vocals} />
          </View>
        </View>

        {partner && (
          <View style={s.box} wrap={false}>
            <Label>This catalog</Label>
            <Text style={s.boxName}>{partner.name}</Text>
            <Text style={s.kicker}>
              {partner.exclusive ? 'Exclusive' : 'Non-exclusive'}  ·  {partner.split} split
              {partner.humanMadeOnly ? '  ·  Human-made only' : ''}
            </Text>
            <Text style={s.boxText}>
              Writing to this brief means you are writing for the {partner.name} catalog.
              {partner.exclusive
                ? ' If the track is accepted, it is exclusive to that catalog.'
                : ' If the track is accepted, it stays non-exclusive.'}{' '}
              If {partner.name} pitches the track and it places, the sync fee splits {partner.split}.
            </Text>
          </View>
        )}

        {isClient && (
          <View style={s.box} wrap={false}>
            <Label>The opportunity</Label>
            <View style={s.dnaGrid}>
              <DnaItem label="Due" value={brief.deadline} />
              <DnaItem label="Demo fee" value={brief.demoFee} />
              <DnaItem label="Win" value={brief.winFee} />
            </View>
            <Text style={s.boxText}>
              Verified composers only. These are paying clients. Sonant reviews what you submit, secures a demo fee if it goes to the client, and if the track wins the job, the split is 70/30 in your favor. These jobs move fast, so stay available for edits.
            </Text>
            <Text style={[s.boxText, { color: C.accent }]}>Confidential. Please do not forward this brief.</Text>
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>
            SONANT  ·  {brief.briefId}  ·  {houseLabel.toUpperCase()}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
