// One-page, A4 landscape export. No external PDF service or runtime dependency.
const PAGE = { width: 3508, height: 2480, margin: 80 };

export function legendEntries(rooms, anomalies) {
  return rooms.flatMap(room => {
    const descriptions = anomalies.filter(a => a.roomId === room.id && a.status !== 'resolu')
      .map(a => String(a.description || '').replace(/\s+/gu, ' ').trim() || 'Anomalie sans description');
    return descriptions.length ? [`${room.code || room.name} : ${descriptions.join(' ; ')}`] : [];
  });
}

function wrapText(ctx, text, width) {
  const lines = [];
  let line = '';
  for (const char of text) {
    if (line && ctx.measureText(line + char).width > width) {
      const space = line.lastIndexOf(' ');
      if (space > 0) {
        lines.push(line.slice(0, space));
        line = line.slice(space + 1) + char;
      } else { lines.push(line); line = char; }
    } else { line += char; }
  }
  if (line) lines.push(line.trim());
  return lines;
}

export function fitLegend(ctx, entries, width, height) {
  if (!entries.length) entries = ['Aucune anomalie active sur ce plan.'];
  // Only the legend shrinks. Never omit an anomaly or add another page.
  for (let size = 32; size >= 1; size -= 0.25) {
    let best = null;
    for (let columns = 1; columns <= Math.min(4, entries.length); columns++) {
      const gap = 48;
      const columnWidth = (width - gap * (columns - 1)) / columns;
      ctx.font = `${size}px Arial, sans-serif`;
      const lineHeight = size * 1.18;
      const positions = [];
      let column = 0, y = 0;
      for (const entry of entries) {
        const lines = wrapText(ctx, entry, columnWidth);
        const blockHeight = lines.length * lineHeight + size * 0.35;
        if (y && y + blockHeight > height) { column++; y = 0; }
        if (column >= columns || blockHeight > height) { column = columns; break; }
        positions.push({ lines, x: column * (columnWidth + gap), y });
        y += blockHeight;
      }
      if (column < columns) {
        best = { size, lineHeight, positions };
        break;
      }
    }
    if (best) return best;
  }
  throw new Error('Trop de texte pour tenir sur une seule page.');
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Impossible de préparer le plan pour le PDF.'));
    image.src = url;
  });
}

async function planImage(svg, viewBox) {
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', `0 0 ${viewBox.width} ${viewBox.height}`);
  clone.setAttribute('width', '3508');
  clone.setAttribute('height', String(3508 * viewBox.height / viewBox.width));
  clone.querySelector('.plan-scene')?.removeAttribute('transform');
  // Preserve the actual screen colours without hover/focus styling or zoom.
  const sourceNodes = [svg, ...svg.querySelectorAll('*')];
  const targetNodes = [clone, ...clone.querySelectorAll('*')];
  const properties = ['fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width',
    'font-family', 'font-size', 'font-weight', 'text-anchor', 'opacity', 'display', 'visibility',
    'vector-effect', 'paint-order', 'dominant-baseline'];
  sourceNodes.forEach((node, i) => {
    const style = getComputedStyle(node);
    for (const property of properties) targetNodes[i].style.setProperty(property, style.getPropertyValue(property));
    targetNodes[i].style.setProperty('filter', 'none');
  });
  for (const image of clone.querySelectorAll('image')) {
    const response = await fetch(new URL(image.getAttribute('href'), document.baseURI));
    if (!response.ok) throw new Error('Le fond du plan ne peut pas être chargé.');
    const blob = await response.blob();
    image.setAttribute('href', await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Lecture du plan impossible.'));
      reader.readAsDataURL(blob);
    }));
  }
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }));
  try { return await loadImage(url); } finally { URL.revokeObjectURL(url); }
}

export function jpegPdf(jpeg, width, height) {
  const encoder = new TextEncoder();
  const chunks = [], offsets = [0];
  let length = 0;
  const append = value => {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    chunks.push(bytes); length += bytes.length;
  };
  const object = (id, content) => { offsets[id] = length; append(`${id} 0 obj\n${content}\nendobj\n`); };
  append('%PDF-1.4\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.8898 595.2756] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
  offsets[4] = length;
  append(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  append(jpeg); append('\nendstream\nendobj\n');
  const commands = 'q\n841.8898 0 0 595.2756 0 0 cm\n/Im0 Do\nQ\n';
  object(5, `<< /Length ${encoder.encode(commands).length} >>\nstream\n${commands}endstream`);
  const xref = length;
  append('xref\n0 6\n0000000000 65535 f \n');
  for (let id = 1; id <= 5; id++) append(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}

export async function downloadPlanPdf({ svg, zone, title, anomalies }) {
  if (!svg) throw new Error('Choisissez un plan avant de télécharger le PDF.');
  // Snapshot before asynchronous image loading, even if live data changes.
  const entries = legendEntries(zone.rooms || [], anomalies);
  const viewBox = zone.viewBox || { width: 100, height: 100 };
  const image = await planImage(svg, viewBox);
  const canvas = document.createElement('canvas');
  canvas.width = PAGE.width; canvas.height = PAGE.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Votre navigateur ne permet pas de générer le PDF.');
  const width = PAGE.width - PAGE.margin * 2;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0d223a'; ctx.font = 'bold 38px Arial, sans-serif';
  ctx.fillText(title, PAGE.margin, 65, width);
  const top = 100;
  // At least 78% of usable height is reserved for the plan, regardless of text.
  const maxPlanHeight = (PAGE.height - top - PAGE.margin) * 0.78;
  const scale = Math.min(width / viewBox.width, maxPlanHeight / viewBox.height);
  const planWidth = viewBox.width * scale, planHeight = viewBox.height * scale;
  ctx.drawImage(image, PAGE.margin + (width - planWidth) / 2, top, planWidth, planHeight);
  const legendTop = top + planHeight + 38;
  const layout = fitLegend(ctx, entries, width, PAGE.height - PAGE.margin - legendTop);
  ctx.fillStyle = '#182b40'; ctx.font = `${layout.size}px Arial, sans-serif`;
  for (const block of layout.positions) block.lines.forEach((line, i) => {
    ctx.fillText(line, PAGE.margin + block.x, legendTop + block.y + layout.size + i * layout.lineHeight);
  });
  const jpeg = Uint8Array.from(atob(canvas.toDataURL('image/jpeg', 0.97).split(',')[1]), c => c.charCodeAt(0));
  const url = URL.createObjectURL(jpegPdf(jpeg, canvas.width, canvas.height));
  const link = document.createElement('a');
  link.href = url;
  link.download = `INFRA-LVN-${title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/-$/g, '')}.pdf`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
