import type React from 'react';
import path from 'node:path';
import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Brief } from '@/components/BriefDocument';
import type { CatalogPartner } from '@/lib/partners';
import { youtubeSearchUrlForTrack } from '@/lib/youtube-search';

const FONT_DIR = path.join(process.cwd(), 'lib/pdf/fonts');
const font = (file: string) => path.join(FONT_DIR, file);

// Inter, as on wearethoughtcollective.com. Latin subset; covers the briefs we write.
Font.register({
  family: 'Inter',
  fonts: [
    { src: font('Inter-400.ttf'), fontWeight: 400 },
    { src: font('Inter-500.ttf'), fontWeight: 500 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

export const TC_MARK_PATH = path.join(process.cwd(), 'public/brand/thought-collective-mark.png');

// Printed spec sheet: white paper, black ink, grey for labels.
const C = {
  paper: '#FFFFFF',
  ink: '#0A0A0A',
  body: '#262626',
  meta: '#7A7A7A',
  rule: '#E3E3E3',
};

const LABEL_W = 108;

const s = StyleSheet.create({
  page: {
    backgroundColor: C.paper,
    color: C.body,
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.5,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 48,
  },
  masthead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 34 },
  brand: { flexDirection: 'row', alignItems: 'center' },
  mark: { width: 15, height: 15, marginRight: 7 },
  brandName: { fontSize: 10.5, fontWeight: 500, color: C.ink, letterSpacing: -0.1 },
  kind: { fontSize: 9.5, color: C.meta },
  title: { fontSize: 38, fontWeight: 500, color: C.ink, lineHeight: 1.0, letterSpacing: -1.6, marginBottom: 12 },
  project: { fontSize: 12.5, color: C.body, lineHeight: 1.45, marginBottom: 10, maxWidth: 440 },
  meta: { fontSize: 8.5, color: C.meta },
  hero: { width: '100%', height: 170, objectFit: 'cover', marginTop: 22, marginBottom: 4 },
  row: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.rule, paddingTop: 12, paddingBottom: 12 },
  rowLabel: { width: LABEL_W, fontSize: 9, color: C.meta, paddingTop: 1 },
  rowBody: { flex: 1 },
  scene: { fontSize: 13, lineHeight: 1.45, color: C.ink, letterSpacing: -0.2 },
  text: { fontSize: 10, lineHeight: 1.6, color: C.body },
  listItem: { flexDirection: 'row', paddingVertical: 4, borderTopWidth: 1, borderTopColor: C.rule },
  listFirst: { borderTopWidth: 0, paddingTop: 0 },
  num: { width: 20, fontSize: 9, color: C.meta, paddingTop: 0.5 },
  listText: { flex: 1, fontSize: 10, lineHeight: 1.45, color: C.body },
  refGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  ref: { width: '50%', paddingRight: 14, marginBottom: 10 },
  refTitle: { fontSize: 10, fontWeight: 500, color: C.ink, textDecoration: 'none', marginBottom: 3 },
  refLine: { fontSize: 9, lineHeight: 1.45, color: C.body },
  refSkip: { fontSize: 9, lineHeight: 1.45, color: C.meta },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  spec: { width: '33.33%', paddingRight: 12, marginBottom: 8 },
  specLabel: { fontSize: 8, color: C.meta, marginBottom: 2 },
  specValue: { fontSize: 10, color: C.ink, lineHeight: 1.35 },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: C.meta,
    borderTopWidth: 1,
    borderTopColor: C.rule,
    paddingTop: 8,
  },
});

/** A labelled spec-sheet row. Its first lines never sit alone at the bottom of a page. */
function Row({ label, children, keepTogether = false }: { label: string; children: React.ReactNode; keepTogether?: boolean }) {
  return (
    <View style={s.row} wrap={!keepTogether} minPresenceAhead={40}>
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.rowBody}>{children}</View>
    </View>
  );
}

function Spec({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={s.spec} wrap={false}>
      <Text style={s.specLabel}>{label}</Text>
      <Text style={s.specValue}>{value}</Text>
    </View>
  );
}

export default function BriefPdf({
  brief,
  partner,
  kindLabel,
  image,
  mark,
}: {
  brief: Brief;
  partner: CatalogPartner | null;
  kindLabel: string;
  image: Buffer | null;
  mark: Buffer | null;
}) {
  const title = brief.projectTitle || brief.codename;
  const isClient = brief.kind === 'client';
  const meta = [
    isClient ? brief.client : null,
    brief.briefId,
    brief.issued ? `Issued ${brief.issued}` : null,
    brief.deadline ? `Due ${brief.deadline}` : null,
  ].filter(Boolean).join('  ·  ');
  const direction = brief.direction ?? [];
  const references = brief.references ?? [];

  return (
    <Document title={title} author="Thought Collective" creator="Thought Collective" producer="Thought Collective">
      <Page size="LETTER" style={s.page}>
        <View style={s.masthead}>
          <View style={s.brand}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img */}
            {mark && <Image src={mark} style={s.mark} />}
            <Text style={s.brandName}>Thought Collective</Text>
          </View>
          <Text style={s.kind}>{kindLabel}</Text>
        </View>

        <Text style={s.title}>{title}</Text>
        {!isClient && brief.project ? <Text style={s.project}>{brief.project}</Text> : null}
        <Text style={s.meta}>{meta}</Text>

        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img */}
        {image && <Image src={image} style={s.hero} />}

        <View style={{ marginTop: image ? 14 : 26 }}>
          <Row label="The scene">
            <Text style={s.scene}>{brief.story}</Text>
          </Row>

          <Row label="The music">
            <Text style={s.text}>{brief.ask}</Text>
          </Row>

          {direction.length > 0 && (
            <Row label="Direction">
              {direction.map((d, i) => (
                <View key={i} style={i === 0 ? [s.listItem, s.listFirst] : s.listItem} wrap={false}>
                  <Text style={s.num}>{String(i + 1).padStart(2, '0')}</Text>
                  <Text style={s.listText}>{d}</Text>
                </View>
              ))}
            </Row>
          )}

          {references.length > 0 && (
            <Row label="References">
              <View style={s.refGrid}>
                {references.map((r, i) => {
                  const href = partner ? youtubeSearchUrlForTrack(r.track) : r.url;
                  return (
                    <View key={i} style={s.ref} wrap={false}>
                      {href ? (
                        <Link src={href} style={s.refTitle}>{r.track}</Link>
                      ) : (
                        <Text style={s.refTitle}>{r.track}</Text>
                      )}
                      {(r.like || r.why) && (
                        <Text style={s.refLine}>
                          <Text style={{ color: C.ink, fontWeight: 500 }}>Use  </Text>
                          {r.like ?? r.why}
                        </Text>
                      )}
                      {r.avoid && (
                        <Text style={s.refSkip}>
                          <Text style={{ fontWeight: 500 }}>Skip  </Text>
                          {r.avoid}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </Row>
          )}

          {!partner && brief.links && brief.links.length > 0 && (
            <Row label="Files and links">
              {brief.links.map((link) => (
                <Link key={link.url} src={link.url} style={[s.text, { color: C.ink, textDecoration: 'none', marginBottom: 4 }]}>
                  {link.label}
                </Link>
              ))}
            </Row>
          )}

          <Row label="Sound">
            <View style={s.specGrid}>
              <Spec label="Genre" value={brief.genrePalette} />
              <Spec label="Mood" value={brief.emotionalArc} />
              <Spec label="Tempo" value={brief.tempo} />
              <Spec label="Key" value={brief.key} />
              <Spec label="Length" value={brief.length} />
              <Spec label="Type" value={brief.vocals} />
            </View>
          </Row>

          {partner && (
            <Row label="The deal">
              <View style={s.specGrid}>
                <Spec label="Catalogue" value={partner.name} />
                <Spec label="Rights" value={partner.exclusive ? 'Exclusive' : 'Non-exclusive'} />
                <Spec label="Sync fees" value={`${partner.split} split`} />
              </View>
              <Text style={s.text}>
                Accepted tracks go into the {partner.name} catalogue{partner.exclusive ? ' exclusively' : ''}, and we pitch them to agencies and brands. If one places, the sync fee splits {partner.split}.
                {partner.humanMadeOnly ? ' Human-made only: no AI-generated music, stems, or vocals.' : ''}
              </Text>
            </Row>
          )}

          {isClient && (
            <Row label="The opportunity" keepTogether>
              <View style={s.specGrid}>
                <Spec label="Due" value={brief.deadline} />
                <Spec label="Demo fee" value={brief.demoFee} />
                <Spec label="Win" value={brief.winFee} />
              </View>
              <Text style={s.text}>
                Verified composers only. These are paying clients. We review what you submit and secure a demo fee if it goes to the client. If the track wins the job, the split is 70/30 in your favour. These jobs move fast, so stay available for edits.
              </Text>
              <Text style={[s.text, { color: C.ink, marginTop: 6 }]}>Confidential. Please do not forward this brief.</Text>
            </Row>
          )}
        </View>

        {/* A render-prop page number blanks this whole footer in react-pdf 4.9, so there is none. */}
        <View style={s.footer} fixed>
          <Text>
            {brief.briefId}  ·  {kindLabel}
          </Text>
          <Text>wearethoughtcollective.com</Text>
        </View>
      </Page>
    </Document>
  );
}
