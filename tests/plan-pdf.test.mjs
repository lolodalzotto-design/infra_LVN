import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/plan-pdf.js', import.meta.url), 'utf8');
const { legendEntries, fitLegend, jpegPdf } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('legend contains only this plan’s active descriptions, grouped by room', () => {
  const rooms = [{ id: 'one', code: 'A025', name: 'Standard' }, { id: 'two', name: 'Entrée' }];
  const rows = [
    { roomId: 'one', status: 'a_traiter', description: 'Lampe\n cassée', reporterName: 'Private', createdAt: 'PRIVATE_DATE' },
    { roomId: 'one', status: 'en_cours', description: 'Porte bloquée' },
    { roomId: 'one', status: 'resolu', description: 'À exclure' },
    { roomId: 'other-plan', status: 'a_traiter', description: 'À exclure' },
    { roomId: 'two', status: 'a_traiter', description: 'Fuite' }
  ];
  assert.deepEqual(legendEntries(rooms, rows), ['A025 : Lampe cassée ; Porte bloquée', 'Entrée : Fuite']);
});

function measuringContext() {
  return { font: '', measureText(text) { return { width: [...text].length * parseFloat(this.font) * 0.6 }; } };
}

test('dense legends retain every room and stay inside the available height', () => {
  const entries = Array.from({ length: 100 }, (_, i) => `A${i} : ${'Fuite à réparer. '.repeat(12)}`);
  const ctx = measuringContext();
  const result = fitLegend(ctx, entries, 3348, 450);
  assert.equal(result.positions.length, entries.length);
  assert(result.size < 32);
  result.positions.forEach((block, index) => {
    assert.equal(block.lines.join(' ').replace(/\s/g, ''), entries[index].replace(/\s/g, ''));
    assert(block.y + block.lines.length * result.lineHeight <= 450);
  });
});

test('empty plans still have an exportable legend', () => {
  const result = fitLegend(measuringContext(), [], 3348, 450);
  assert.equal(result.positions[0].lines.join(''), 'Aucune anomalie active sur ce plan.');
});

test('long words wrap without losing characters', () => {
  const entry = 'A025 : ' + 'x'.repeat(1000);
  const result = fitLegend(measuringContext(), [entry], 400, 450);
  assert.equal(result.positions[0].lines.join('').replace(/\s/g, ''), entry.replace(/\s/g, ''));
});

test('PDF has one landscape A4 page and correct binary cross-reference offsets', async () => {
  const jpeg = new Uint8Array([255, 216, 0, 128, 255, 217]);
  const blob = jpegPdf(jpeg, 3508, 2480);
  assert.equal(blob.type, 'application/pdf');
  const bytes = Buffer.from(await blob.arrayBuffer());
  const text = bytes.toString('latin1');
  assert.match(text, /\/Count 1/);
  assert.match(text, /\/MediaBox \[0 0 841\.8898 595\.2756\]/);
  const xref = Number(text.match(/startxref\n(\d+)/)[1]);
  assert.equal(text.slice(xref, xref + 4), 'xref');
  const offsets = text.slice(xref).split('\n').slice(3, 8);
  offsets.forEach((line, i) => assert(text.slice(Number(line.slice(0, 10))).startsWith(`${i + 1} 0 obj`)));
  assert(bytes.includes(Buffer.from(jpeg)));
});
