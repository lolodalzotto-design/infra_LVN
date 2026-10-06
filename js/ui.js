import { PLAN_CONFIG } from './data.js';

export const STATUS_LABELS = {
  a_traiter: 'À traiter',
  en_cours: 'En cours',
  resolu: 'Résolu'
};

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

export function formatDate(value) {
  if (!value) return '—';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date);
}

export function roomHasActiveAnomaly(roomId, anomalies = []) {
  return anomalies.some((a) => a.roomId === roomId && a.status !== 'resolu');
}

export function renderPlan(container, buildingId, levelId, {
  mode = 'public',
  anomalies = [],
  selectedRoomId = null,
  onRoomClick = () => {}
} = {}) {
  const level = PLAN_CONFIG[buildingId]?.levels[levelId];
  if (!level) return;

  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${PLAN_CONFIG[buildingId].label} — ${level.label}`);
  svg.classList.add('plan-svg');

  const outer = document.createElementNS(svgNs, 'rect');
  outer.setAttribute('x', '1'); outer.setAttribute('y', '2'); outer.setAttribute('width', '98'); outer.setAttribute('height', '96');
  outer.setAttribute('rx', '2'); outer.classList.add('plan-shell');
  svg.appendChild(outer);

  level.rooms.forEach((room) => {
    const group = document.createElementNS(svgNs, 'g');
    group.classList.add('plan-room');
    const active = mode === 'infra' && roomHasActiveAnomaly(room.id, anomalies);
    group.classList.add(active ? 'room-red' : 'room-green');
    if (selectedRoomId === room.id) group.classList.add('room-selected');
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'button');
    group.setAttribute('aria-label', room.name);

    const rect = document.createElementNS(svgNs, 'rect');
    rect.setAttribute('x', room.x); rect.setAttribute('y', room.y); rect.setAttribute('width', room.w); rect.setAttribute('height', room.h);
    rect.setAttribute('rx', '1.6');

    const label = document.createElementNS(svgNs, 'text');
    label.setAttribute('x', room.x + room.w / 2);
    label.setAttribute('y', room.y + room.h / 2 - 1);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.classList.add('room-label');
    label.textContent = room.name;

    const code = document.createElementNS(svgNs, 'text');
    code.setAttribute('x', room.x + room.w / 2);
    code.setAttribute('y', room.y + room.h / 2 + 7);
    code.setAttribute('text-anchor', 'middle');
    code.classList.add('room-code');
    code.textContent = room.id.split('-').slice(-1)[0];

    const activate = () => onRoomClick(room);
    group.addEventListener('click', activate);
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
    });

    group.append(rect, label, code);
    svg.appendChild(group);
  });

  container.replaceChildren(svg);
}

export function statusBadge(status) {
  return `<span class="status status-${escapeHtml(status)}">${STATUS_LABELS[status] || escapeHtml(status)}</span>`;
}
