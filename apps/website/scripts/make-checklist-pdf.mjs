/**
 * Generates public/downloads/interactive-content-checklist.pdf
 * A minimal, valid one-page PDF (no dependencies).
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTDIR = join(__dirname, '..', 'public', 'downloads');
mkdirSync(OUTDIR, { recursive: true });

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const title = 'The Interactive Content Checklist';
const subtitle = 'Ten questions to ask before you hit publish';
const items = [
  '1.  Does the reader get to DO something in the first 30 seconds?',
  '2.  Is there at least one choice that changes what they see next?',
  '3.  Does every interactive element answer "what is in it for me"?',
  '4.  Can a skimmer still get the gist (SSR fallbacks, details, tables)?',
  '5.  Does every quiz and poll give feedback worth the click?',
  '6.  Is there a branch point a reader would actually care about?',
  '7.  Do your charts earn their place, or would a sentence do?',
  '8.  Does the page work with JavaScript disabled (crawlable content)?',
  '9.  Is every claim backed by a reference a reader can check?',
  '10. Would you finish your own article? Honestly?',
];
const footer = 'Pulse — The Interactive Content Playbook, 2026';

const lines = [];
lines.push('BT /F1 20 Tf 56 780 Td (' + esc(title) + ') Tj ET');
lines.push('BT /F2 11 Tf 56 758 Td (' + esc(subtitle) + ') Tj ET');
lines.push('0.85 0.15 0.10 RG 2 w 56 748 m 380 748 l S');
let y = 716;
for (const item of items) {
  lines.push('BT /F2 11 Tf 66 ' + y + ' Td (' + esc(item) + ') Tj ET');
  y -= 26;
}
lines.push('0.5 0.5 0.5 RG 0.5 w 56 420 m 539 420 l S');
lines.push('BT /F2 9 Tf 56 404 Td (' + esc(footer) + ') Tj ET');
const stream = lines.join('\n');

const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
];

let pdf = '%PDF-1.4\n';
const offsets = [0];
objects.forEach((body, i) => {
  offsets.push(Buffer.byteLength(pdf, 'latin1'));
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xrefStart = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += '0000000000 65535 f \n';
for (let i = 1; i <= objects.length; i++) {
  pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

const out = join(OUTDIR, 'interactive-content-checklist.pdf');
writeFileSync(out, Buffer.from(pdf, 'latin1'));
console.log('PDF written:', out, Buffer.byteLength(pdf, 'latin1'), 'bytes');
