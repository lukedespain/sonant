'use client';

export default function ExportPdfButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs tracking-[0.2em] uppercase px-4 py-2 bg-[#E85D2F] text-[#0A0908] hover:bg-[#FF6E3D] transition-colors"
      style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
    >
      ↓ Export PDF
    </button>
  );
}