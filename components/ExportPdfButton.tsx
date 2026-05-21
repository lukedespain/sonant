'use client';

export default function ExportPdfButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-[#3A3835] text-[#C4BFB5] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
      style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
    >
      ↓ Export PDF
    </button>
  );
}