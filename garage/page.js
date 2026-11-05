import { createReport, signIn, signOut, watchReports, updateStatus, readPhoto } from './reports.js?v=3';


const byId = id => document.getElementById(id);
const cube = byId('cube');
const scene = byId('scene');
const names = ['Avant', 'Arrière', 'Droite', 'Gauche', 'Dessus', 'Dessous'];
const transforms = ['rotateY(0deg)', 'rotateY(180deg)', 'rotateY(90deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)'];
const marks = new Map();
let x = -20;
let y = -30;
let gesture;
let selectedVehicle = 0;
let zoom = 1;
let shiftX = 0;
let shiftY = 0;
let pinch;
const touches = new Map();
const agentMode = Boolean(byId('agent'));
const reportStatuses = {
  reported: 'Signalé',
  'in-progress': 'En cours',
  resolved: 'Résolu'
};
names.forEach((name, index) => {
  const face = document.createElement('div');
  face.className = 'face';
  face.dataset.face = name;
  face.textContent = name;
  face.style.transform = transforms[index] + ' translateZ(65px)';
  cube.append(face);
});
function rotate() {
  cube.style.transform = 'translate(' + shiftX + 'px,' + shiftY + 'px) scale(' + zoom + ') rotateX(' + x + 'deg) rotateY(' + y + 'deg)';
}
function addPin(face, u, v, status) {
  if (!face) return;
  const pin = document.createElement('span');
  pin.className = 'pin ' + status;
  pin.style.left = u + '%';
  pin.style.top = v + '%';
  face.append(pin);
}
function clearPins() {
  cube.querySelectorAll('.pin').forEach(pin => pin.remove());
}
function renderMark() {
  clearPins();
  const mark = marks.get(selectedVehicle);
  byId('status').textContent = mark ? 'Engin ' + selectedVehicle + ' · ' + mark.face.dataset.face : 'Aucun repère posé.';
  if (mark) addPin(mark.face, mark.u, mark.v, 'reported');
}
function mark(face, u, v) {
  marks.set(selectedVehicle, {face, u, v});
  renderMark();
  if (isFullscreen()) void exitCubeFullscreen().catch(() => fullscreenButton.focus());
}
function pinchState() {
  const [a, b] = touches.values();
  return {distance: Math.hypot(b.x - a.x, b.y - a.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
}

scene.addEventListener('pointerdown', event => {
  if (event.target.closest('button') || event.button !== 0) return;
  if (event.pointerType === 'touch' && isFullscreen()) {
    touches.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (touches.size >= 2) {
      gesture = undefined;
      pinch = pinchState();
    }
  }
  if (touches.size < 2 && event.isPrimary) {
    gesture = {id:event.pointerId, sx:event.clientX, sy:event.clientY, x, y, dragged:false, face:event.target, u:event.offsetX / event.target.clientWidth * 100, v:event.offsetY / event.target.clientHeight * 100};
  }
  scene.setPointerCapture(event.pointerId);
});
scene.addEventListener('pointermove', event => {
  if (touches.has(event.pointerId)) {
    touches.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (pinch && touches.size >= 2) {
      const next = pinchState();
      if (pinch.distance > 0 && next.distance > 0) {
        changeZoom(next.distance / pinch.distance, next.x, next.y);
      }
      pinch = next;
      return;
    }
  }
  if (gesture?.id !== event.pointerId) return;
  const dx = event.clientX - gesture.sx;
  const dy = event.clientY - gesture.sy;
  if (!gesture.dragged && Math.hypot(dx, dy) < 6) return;
  gesture.dragged = true;
  x = gesture.x - dy;
  y = gesture.y + dx;
  rotate();
});
function releasePointer(event) {
  if (touches.delete(event.pointerId)) pinch = touches.size >= 2 ? pinchState() : undefined;
  if (gesture?.id === event.pointerId) gesture = undefined;
}
scene.addEventListener('pointerup', event => {
  if (agentMode && gesture?.id === event.pointerId && !gesture.dragged && gesture.face.classList.contains('face')) {
    mark(gesture.face, gesture.u, gesture.v);
  }
  releasePointer(event);
});
scene.addEventListener('lostpointercapture', releasePointer);
scene.addEventListener('pointercancel', releasePointer);
document.querySelectorAll('[data-turn]').forEach(button => button.onclick = () => {
  const delta = {left:[0,-45],right:[0,45],up:[-45,0],down:[45,0]}[button.dataset.turn];
  x += delta[0];
  y += delta[1];
  rotate();
});
function markCenter() {
  const box = scene.getBoundingClientRect();
  const face = document.elementFromPoint(box.left + box.width/2, box.top + box.height/2);
  if (face?.classList.contains('face')) mark(face,50,50);
}
byId('center')?.addEventListener('click', markCenter);
scene.addEventListener('keydown', event => {
  if (event.target !== scene) return;
  if (event.key === 'Enter' && agentMode) {
    event.preventDefault();
    markCenter();
    return;
  }
  const delta = {ArrowLeft:[0,-45],ArrowRight:[0,45],ArrowUp:[-45,0],ArrowDown:[45,0]}[event.key];
  if (!delta) return;
  event.preventDefault();
  x += delta[0];
  y += delta[1];
  rotate();
});
byId('clear')?.addEventListener('click', () => {
  marks.delete(selectedVehicle);
  renderMark();
});
function changeZoom(factor, clientX, clientY) {
  const next = Math.max(1, Math.min(8, zoom * factor));
  const ratio = next / zoom;
  if (clientX !== undefined) {
    const box = scene.getBoundingClientRect();
    const anchorX = clientX - box.left - box.width / 2;
    const anchorY = clientY - box.top - box.height / 2;
    shiftX = anchorX + (shiftX - anchorX) * ratio;
    shiftY = anchorY + (shiftY - anchorY) * ratio;
  } else {
    shiftX *= ratio;
    shiftY *= ratio;
  }
  zoom = next;
  if (zoom === 1) shiftX = shiftY = 0;
  rotate();
}
byId('zoom-in').onclick = () => changeZoom(1 / 0.72);
byId('zoom-out').onclick = () => changeZoom(1 / 1.38);
byId('zoom-reset').onclick = () => {
  x = -20;
  y = -30;
  zoom = 1;
  shiftX = shiftY = 0;
  rotate();
};
function isFullscreen() {
  return document.fullscreenElement === scene || document.webkitFullscreenElement === scene ||
    scene.classList.contains('plan-fullscreen-fallback');
}
const fullscreenButton = byId('cube-fullscreen');
function syncFullscreen() {
  const active = isFullscreen();
  fullscreenButton.textContent = active ? '✕' : '⛶';
  const label = active ? 'Quitter le plein écran' : 'Plein écran';
  fullscreenButton.setAttribute('aria-label', label);
  fullscreenButton.title = label;
  if (!active) {
    zoom = 1;
    shiftX = shiftY = 0;
    touches.clear();
    pinch = undefined;
    gesture = undefined;
    rotate();
  }
}
function setFullscreenFallback(active) {
  scene.classList.toggle('plan-fullscreen-fallback', active);
  document.body.classList.toggle('plan-fullscreen-body', active);
  syncFullscreen();
}
async function exitCubeFullscreen() {
  if (scene.classList.contains('plan-fullscreen-fallback')) {
    setFullscreenFallback(false);
  } else if (document.exitFullscreen) {
    await document.exitFullscreen();
  } else {
    document.webkitExitFullscreen?.();
  }
}
fullscreenButton.onclick = async () => {
  if (isFullscreen()) {
    await exitCubeFullscreen();
    return;
  }
  try {
    if (scene.requestFullscreen) await scene.requestFullscreen();
    else if (scene.webkitRequestFullscreen) scene.webkitRequestFullscreen();
    else setFullscreenFallback(true);
  } catch {
    setFullscreenFallback(true);
  }
};
document.addEventListener('fullscreenchange', syncFullscreen);
document.addEventListener('webkitfullscreenchange', syncFullscreen);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && scene.classList.contains('plan-fullscreen-fallback')) setFullscreenFallback(false);
});
scene.addEventListener('wheel', event => {
  if (!isFullscreen()) return;
  event.preventDefault();
  changeZoom(event.deltaY < 0 ? 1 / 0.82 : 1 / 1.22, event.clientX, event.clientY);
}, {passive:false});
document.querySelectorAll('[data-agent-vehicle]').forEach(button => {
  button.addEventListener('click', () => {
    selectedVehicle = Number(button.dataset.agentVehicle);
    document.querySelectorAll('[data-agent-vehicle]').forEach(choice => {
      choice.setAttribute('aria-pressed', String(choice === button));
    });
    byId('agent-detail').hidden = false;
    renderMark();
  });
});
rotate();

const report = byId('report');
function syncActionsField() {
  const needsActions = report.elements.malfunction.value === 'yes';
  const actions = byId('actions-taken');
  byId('actions-field').hidden = !needsActions;
  actions.disabled = !needsActions;
  actions.required = needsActions;
}
report?.addEventListener('change', event => {
  if (event.target.name === 'malfunction') syncActionsField();
});
if (report) {
  syncActionsField();
}
report?.addEventListener('submit', async event => {
  event.preventDefault();
  const mark = marks.get(selectedVehicle);
  const description = byId('description').value.trim();
  const result = byId('report-result');
  const photo = byId('photo-file').files[0];
  if (photo && (!photo.type.startsWith('image/') || photo.size >= 8 * 1024 * 1024)) {
    result.textContent = 'Choisissez une image de moins de 8 Mo.';
    return;
  }
  const answer = report.elements.malfunction.value;
  const malfunction = answer === 'yes';
  const actionsTaken = malfunction ? byId('actions-taken').value.trim() : '';
  if (!answer || (malfunction && !actionsTaken)) {
    result.textContent = 'Répondez à la question et indiquez les actions menées si nécessaire.';
    return;
  }
  if (!mark || !description) {
    result.textContent = 'Posez un repère et décrivez l’anomalie.';
    return;
  }
  const button = report.querySelector('button');
  button.disabled = true;
  result.textContent = 'Envoi en cours…';
  try {
    await createReport({
      vehicle: selectedVehicle,
      face: mark.face.dataset.face,
      u: Math.max(0, Math.min(100, mark.u)),
      v: Math.max(0, Math.min(100, mark.v)),
      description,
      malfunction,
      actionsTaken
    }, photo);
    report.reset();
    syncActionsField();
    result.textContent = 'Signalement transmis au Garage.';
  } catch {
    result.textContent = 'Envoi impossible. Réessayez dans un instant.';
  } finally {
    button.disabled = false;
  }
});

if (!agentMode) {
  const serviceStatus = byId('service-status');
  const list = byId('reports');
  const login = byId('login');
  let stopWatching;
  let visibleReports = [];

  function renderServicePins() {
    clearPins();
    visibleReports.forEach(row => {
      const face = [...cube.children].find(item => item.dataset.face === row.face);
      addPin(face, row.u, row.v, row.status || 'reported');
    });
  }

  function setSignedIn(value) {
    login.hidden = value;
    byId('vehicles').hidden = !value;
    byId('logout').hidden = !value;
  }

  login.addEventListener('submit', async event => {
    event.preventDefault();
    const button = login.querySelector('button');
    button.disabled = true;
    try {
      await signIn(byId('email').value, byId('password').value);
      byId('password').value = '';
      serviceStatus.textContent = 'Sélectionne un engin.';
      setSignedIn(true);
    } catch {
      serviceStatus.textContent = 'Connexion Garage impossible.';
    } finally {
      button.disabled = false;
    }
  });

  byId('logout').addEventListener('click', async () => {
    stopWatching?.();
    list.replaceChildren();
    visibleReports = [];
    if (!agentMode) renderServicePins();
    byId('service-viewer').hidden = true;
    try {
      await signOut();
      setSignedIn(false);
      serviceStatus.textContent = '';
    } catch {
      serviceStatus.textContent = 'Déconnexion impossible. Réessaie.';
    }
  });

  document.querySelectorAll('[data-vehicle]').forEach(button => {
    button.addEventListener('click', () => {
      stopWatching?.();
      list.replaceChildren();
      visibleReports = [];
      if (!agentMode) renderServicePins();
      byId('service-viewer').hidden = false;
      serviceStatus.textContent = 'Chargement…';
      stopWatching = watchReports(Number(button.dataset.vehicle), rows => {
        serviceStatus.textContent = button.textContent + ' · ' + rows.length + ' signalement(s)';
        visibleReports = rows;
        if (!agentMode) renderServicePins();
        list.replaceChildren(...rows.map(row => {
          const item = document.createElement('li');
          const status = row.status || 'reported';
          const dot = document.createElement('span');
          dot.className = 'status-dot ' + status;
          dot.setAttribute('aria-hidden', 'true');
          const select = document.createElement('select');
          select.setAttribute('aria-label', 'Statut du signalement ' + row.description);
          Object.entries(reportStatuses).forEach(([value, label]) => {
            select.add(new Option(label, value, false, value === status));
          });
          select.addEventListener('change', async () => {
            select.disabled = true;
            try {
              await updateStatus(row.id, select.value);
            } catch {
              select.value = status;
              serviceStatus.textContent = 'Impossible de modifier le statut.';
            } finally {
              select.disabled = false;
            }
          });
          item.append(dot, row.face + ' · ' + row.description, select);
        if (row.photoPath) {
          const photoButton = document.createElement('button');
          photoButton.type = 'button';
          photoButton.textContent = 'Voir la photo';
          photoButton.addEventListener('click', async () => {
            photoButton.disabled = true;
            try {
              const blob = await readPhoto(row.photoPath);
              if (!item.isConnected) return;
              const url = URL.createObjectURL(blob);
              const image = document.createElement('img');
              image.alt = 'Photo jointe au signalement';
              image.style.maxWidth = '100%';
              const release = () => URL.revokeObjectURL(url);
              image.addEventListener('load', release, {once:true});
              image.addEventListener('error', release, {once:true});
              image.src = url;
              photoButton.replaceWith(image);
            } catch {
              photoButton.textContent = 'Réessayer d’ouvrir la photo';
              photoButton.disabled = false;
            }
          });
          item.append(' ', photoButton);
        }
        if (typeof row.malfunction === 'boolean') {
          const detail = document.createElement('p');
          detail.textContent = row.malfunction ? 'Dysfonctionnement : oui. Actions menées : ' + row.actionsTaken : 'Dysfonctionnement : non.';
          item.append(detail);
        }
          return item;
        }));
      }, () => {
        visibleReports = [];
        if (!agentMode) renderServicePins();
        serviceStatus.textContent = 'Lecture impossible. Vérifie ton accès au Garage.';
        list.replaceChildren();
      });
    });
  });
}
