import { PLAN_CONFIG } from './data.js?v=20261007-0915';

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

function buildRoomLabelLayout(room) {
  const words = String(room.name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return { lines: [], fontSize: 0.4, lineGap: 0.48, showCode: false, codeSize: 0.28 };
  }

  const makeLines = (count) => {
    if (count <= 1 || words.length === 1) return [words.join(' ')];

    const totalChars = words.reduce((sum, word) => sum + word.length, 0) + Math.max(0, words.length - 1);
    const target = totalChars / count;
    const lines = [];
    let current = [];
    let currentChars = 0;

    for (const word of words) {
      const projected = currentChars + (current.length ? 1 : 0) + word.length;
      const canBreak = lines.length < count - 1 && current.length > 0;

      if (canBreak && projected > target) {
        lines.push(current.join(' '));
        current = [word];
        currentChars = word.length;
      } else {
        current.push(word);
        currentChars = projected;
      }
    }

    if (current.length) lines.push(current.join(' '));
    return lines;
  };

  const maxLines =
    room.h < 2.5 ? 1 :
    room.h < 4.2 ? 2 :
    room.h < 6.5 ? 3 :
    room.h < 10 ? 4 : 5;

  const availableW = Math.max(0.55, room.w * 0.80);
  const availableH = Math.max(0.55, room.h * 0.72);
  let best = null;

  for (let count = 1; count <= Math.min(maxLines, words.length); count += 1) {
    const lines = makeLines(count);
    const longest = Math.max(...lines.map(line => line.length), 1);
    const fontByWidth = availableW / (longest * 0.66);
    const fontByHeight = availableH / (lines.length * 1.24);
    const fontSize = Math.max(0.20, Math.min(0.72, fontByWidth, fontByHeight));

    if (!best || fontSize > best.fontSize) {
      best = { lines, fontSize };
    }
  }

  const lineGap = Math.max(0.28, best.fontSize * 1.16);
  const nameHeight = best.lines.length * lineGap;
  const showCode = !!room.code
    && room.w >= 8
    && room.h >= 8
    && nameHeight + 0.7 <= room.h * 0.66;

  return {
    ...best,
    lineGap,
    showCode,
    codeSize: Math.max(0.20, Math.min(0.46, best.fontSize * 0.58))
  };
}

function enablePlanNavigation(container, svg) {
  const vb = svg.viewBox.baseVal;
  const CONTENT = { x: vb.x, y: vb.y, w: vb.width, h: vb.height };
  const padX = CONTENT.w * 0.065;
  const padY = CONTENT.h * 0.09;
  const BASE = {
    x: CONTENT.x - padX,
    y: CONTENT.y - padY,
    w: CONTENT.w + padX * 2,
    h: CONTENT.h + padY * 2
  };
  const MAX_ZOOM = 7;
  let view = { ...BASE };
  const pointers = new Map();
  let pinchLastDistance = null;
  let pinchLastCenter = null;
  let moved = false;

  const controls = document.createElement('div');
  controls.className = 'plan-nav-controls';
  controls.innerHTML = `
    <button type="button" data-plan-zoom-in aria-label="Zoomer">+</button>
    <button type="button" data-plan-zoom-out aria-label="Dézoomer">−</button>
    <button type="button" data-plan-reset aria-label="Recentrer">↺</button>
    <button type="button" data-plan-fullscreen aria-label="Plein écran" title="Plein écran">⛶</button>
  `;

  const applyView = () => {
    svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
  };

  const clampView = () => {
    view.w = Math.min(BASE.w, Math.max(BASE.w / MAX_ZOOM, view.w));
    view.h = Math.min(BASE.h, Math.max(BASE.h / MAX_ZOOM, view.h));
    view.x = Math.min(BASE.x + BASE.w - view.w, Math.max(BASE.x, view.x));
    view.y = Math.min(BASE.y + BASE.h - view.h, Math.max(BASE.y, view.y));
  };

  const clientToSvg = (clientX, clientY) => {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: view.x + view.w / 2, y: view.y + view.h / 2 };
    const p = point.matrixTransform(matrix.inverse());
    return { x: p.x, y: p.y };
  };

  const zoomAt = (factor, clientX, clientY) => {
    const anchor = clientToSvg(clientX, clientY);
    const ratioX = (anchor.x - view.x) / view.w;
    const ratioY = (anchor.y - view.y) / view.h;
    const nextW = Math.min(BASE.w, Math.max(BASE.w / MAX_ZOOM, view.w * factor));
    const nextH = Math.min(BASE.h, Math.max(BASE.h / MAX_ZOOM, view.h * factor));
    view.x = anchor.x - ratioX * nextW;
    view.y = anchor.y - ratioY * nextH;
    view.w = nextW;
    view.h = nextH;
    clampView();
    applyView();
  };

  const zoomFromCenter = (factor) => {
    const rect = svg.getBoundingClientRect();
    zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  controls.querySelector('[data-plan-zoom-in]').addEventListener('click', (event) => {
    event.stopPropagation();
    zoomFromCenter(0.72);
  });
  controls.querySelector('[data-plan-zoom-out]').addEventListener('click', (event) => {
    event.stopPropagation();
    zoomFromCenter(1.38);
  });
  controls.querySelector('[data-plan-reset]').addEventListener('click', (event) => {
    event.stopPropagation();
    view = { ...BASE };
    applyView();
  });

  const fullscreenBtn = controls.querySelector('[data-plan-fullscreen]');
  const syncFullscreenButton = () => {
    const active = document.fullscreenElement === container || document.webkitFullscreenElement === container || container.classList.contains('plan-fullscreen-fallback');
    fullscreenBtn.textContent = active ? '✕' : '⛶';
    fullscreenBtn.setAttribute('aria-label', active ? 'Quitter le plein écran' : 'Plein écran');
    fullscreenBtn.setAttribute('title', active ? 'Quitter le plein écran' : 'Plein écran');
  };

  fullscreenBtn.addEventListener('click', async (event) => {
    event.stopPropagation();
    const nativeActive = document.fullscreenElement || document.webkitFullscreenElement;
    try {
      if (nativeActive) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else {
        container.classList.toggle('plan-fullscreen-fallback');
        document.body.classList.toggle('plan-fullscreen-body', container.classList.contains('plan-fullscreen-fallback'));
        syncFullscreenButton();
      }
    } catch {
      container.classList.toggle('plan-fullscreen-fallback');
      document.body.classList.toggle('plan-fullscreen-body', container.classList.contains('plan-fullscreen-fallback'));
      syncFullscreenButton();
    }
  });

  document.addEventListener('fullscreenchange', syncFullscreenButton);
  document.addEventListener('webkitfullscreenchange', syncFullscreenButton);

  svg.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoomAt(event.deltaY < 0 ? 0.82 : 1.22, event.clientX, event.clientY);
  }, { passive: false });

  svg.addEventListener('pointerdown', (event) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    svg.setPointerCapture?.(event.pointerId);
    moved = false;

    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      pinchLastDistance = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchLastCenter = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    }
  });

  svg.addEventListener('pointermove', (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;

    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 1) {
      // À l'échelle initiale, un léger mouvement du doigt ne doit pas empêcher
      // le tap sur une pièce. Le déplacement devient actif dès qu'on a zoomé.
      if (view.w >= BASE.w - 0.01 && view.h >= BASE.h - 0.01) return;

      const before = clientToSvg(previous.x, previous.y);
      const after = clientToSvg(event.clientX, event.clientY);
      const dx = after.x - before.x;
      const dy = after.y - before.y;
      if (Math.abs(event.clientX - previous.x) + Math.abs(event.clientY - previous.y) > 3) moved = true;
      view.x -= dx;
      view.y -= dy;
      clampView();
      applyView();
      return;
    }

    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      const distance = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

      if (pinchLastCenter) {
        const before = clientToSvg(pinchLastCenter.x, pinchLastCenter.y);
        const after = clientToSvg(center.x, center.y);
        view.x -= after.x - before.x;
        view.y -= after.y - before.y;
        clampView();
      }

      if (pinchLastDistance && distance > 0) {
        zoomAt(pinchLastDistance / distance, center.x, center.y);
      } else {
        applyView();
      }

      pinchLastDistance = distance;
      pinchLastCenter = center;
      moved = true;
    }
  });

  const finishPointer = (event) => {
    pointers.delete(event.pointerId);
    try { svg.releasePointerCapture?.(event.pointerId); } catch {}
    if (moved) svg.__suppressRoomClickUntil = Date.now() + 250;

    if (pointers.size < 2) {
      pinchLastDistance = null;
      pinchLastCenter = null;
    }
  };

  svg.addEventListener('pointerup', finishPointer);
  svg.addEventListener('pointercancel', finishPointer);

  container.classList.add('plan-navigable');
  container.appendChild(controls);
  applyView();
}

export function renderPlan(container, buildingId, levelId, {
  zoneId = null,
  mode = 'public',
  anomalies = [],
  roomStatus = {},
  selectedRoomId = null,
  onRoomClick = () => {}
} = {}) {
  const level = PLAN_CONFIG[buildingId]?.levels[levelId];
  if (!level) return;
  const resolvedZoneId = zoneId && level.zones?.[zoneId] ? zoneId : Object.keys(level.zones || {})[0];
  const zone = level.zones?.[resolvedZoneId];
  if (!zone) return;

  const svgNs = 'http://www.w3.org/2000/svg';
  const vb = zone.viewBox || { width: 100, height: 100 };
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('viewBox', `0 0 ${vb.width} ${vb.height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${PLAN_CONFIG[buildingId].label} — ${level.label} — ${zone.label}`);
  svg.classList.add('plan-svg');

  const outer = document.createElementNS(svgNs, 'rect');
  outer.setAttribute('x', '0.5'); outer.setAttribute('y', '0.5'); outer.setAttribute('width', String(vb.width - 1)); outer.setAttribute('height', String(vb.height - 1));
  outer.setAttribute('rx', '2'); outer.classList.add('plan-shell');
  svg.appendChild(outer);

  zone.rooms.forEach((room) => {
    const group = document.createElementNS(svgNs, 'g');
    group.classList.add('plan-room');
    const activeFromStatus = roomStatus && Object.prototype.hasOwnProperty.call(roomStatus, room.id)
      ? roomStatus[room.id] === true
      : null;
    const active = activeFromStatus === null
      ? roomHasActiveAnomaly(room.id, anomalies)
      : activeFromStatus;
    group.classList.add(active ? 'room-red' : 'room-green');
    if (selectedRoomId === room.id) group.classList.add('room-selected');
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'button');
    group.setAttribute('aria-label', room.name);

    let shape;
    if (Array.isArray(room.points) && room.points.length >= 3) {
      shape = document.createElementNS(svgNs, 'polygon');
      shape.setAttribute('points', room.points.map(p => `${p[0]},${p[1]}`).join(' '));
    } else {
      shape = document.createElementNS(svgNs, 'rect');
      shape.setAttribute('x', room.x);
      shape.setAttribute('y', room.y);
      shape.setAttribute('width', room.w);
      shape.setAttribute('height', room.h);
      shape.setAttribute('rx', '0.6');
    }
    shape.classList.add('plan-shape');

    const layout = buildRoomLabelLayout(room);
    const label = document.createElementNS(svgNs, 'text');
    const centerX = room.x + room.w / 2;
    const centerY = room.y + room.h / 2;
    label.setAttribute('x', centerX);
    label.setAttribute('text-anchor', 'middle');
    label.classList.add('room-label');
    label.setAttribute('font-size', String(layout.fontSize));

    const labelBlockHeight = Math.max(0, (layout.lines.length - 1) * layout.lineGap);
    const codeOffset = layout.showCode ? layout.lineGap * 0.42 : 0;
    const firstY = centerY - labelBlockHeight / 2 - codeOffset;

    layout.lines.forEach((line, index) => {
      const tspan = document.createElementNS(svgNs, 'tspan');
      tspan.setAttribute('x', centerX);
      tspan.setAttribute('y', String(firstY + index * layout.lineGap));
      tspan.textContent = line;
      label.appendChild(tspan);
    });

    const code = document.createElementNS(svgNs, 'text');
    code.setAttribute('x', centerX);
    code.setAttribute('y', String(centerY + labelBlockHeight / 2 + layout.lineGap * 0.82));
    code.setAttribute('text-anchor', 'middle');
    code.classList.add('room-code');
    code.setAttribute('font-size', String(layout.codeSize));
    code.textContent = layout.showCode ? (room.code || '') : '';

    const activate = () => {
      if (svg.__suppressRoomClickUntil && Date.now() < svg.__suppressRoomClickUntil) return;
      onRoomClick(room);
    };
    group.addEventListener('click', activate);
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
    });

    group.append(shape, label, code);
    svg.appendChild(group);
  });

  container.replaceChildren(svg);
  enablePlanNavigation(container, svg);
}

export function statusBadge(status) {
  return `<span class="status status-${escapeHtml(status)}">${STATUS_LABELS[status] || escapeHtml(status)}</span>`;
}
