import { createReport, signIn, signOut, watchReports, updateStatus } from './reports.js?v=2';


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
let agentMode = true;
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
  cube.style.transform = 'scale(' + zoom + ') rotateX(' + x + 'deg) rotateY(' + y + 'deg)';
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
}
scene.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  gesture = {id:event.pointerId, sx:event.clientX, sy:event.clientY, x, y, dragged:false, face:event.target, u:event.offsetX / event.target.clientWidth * 100, v:event.offsetY / event.target.clientHeight * 100};
  scene.setPointerCapture(event.pointerId);
});
scene.addEventListener('pointermove', event => {
  if (gesture?.id !== event.pointerId) return;
  const dx = event.clientX - gesture.sx;
  const dy = event.clientY - gesture.sy;
  if (!gesture.dragged && Math.hypot(dx, dy) < 6) return;
  gesture.dragged = true;
  x = gesture.x - dy;
  y = gesture.y + dx;
  rotate();
});
scene.addEventListener('pointerup', event => {
  if (gesture?.id !== event.pointerId) return;
  if (agentMode && !gesture.dragged) {
    if (gesture.face.classList.contains('face')) {
      mark(gesture.face, gesture.u, gesture.v);
    }
  }
  gesture = undefined;
});
scene.addEventListener('lostpointercapture', () => { gesture = undefined; });
document.querySelectorAll('[data-turn]').forEach(button => button.onclick = () => {
  const delta = {left:[0,-45],right:[0,45],up:[-45,0],down:[45,0]}[button.dataset.turn];
  x += delta[0];
  y += delta[1];
  rotate();
});
byId('center').onclick = () => {
  const box = scene.getBoundingClientRect();
  const face = document.elementFromPoint(box.left + box.width/2, box.top + box.height/2);
  if (face?.classList.contains('face')) mark(face,50,50);
};
byId('clear').onclick = () => {
  marks.delete(selectedVehicle);
  renderMark();
};
function changeZoom(delta) {
  zoom = Math.max(0.75, Math.min(1.6, zoom + delta));
  rotate();
}
byId('zoom-in').onclick = () => changeZoom(0.15);
byId('zoom-out').onclick = () => changeZoom(-0.15);
document.querySelectorAll('[data-agent-vehicle]').forEach(button => {
  button.addEventListener('click', () => {
    selectedVehicle = Number(button.dataset.agentVehicle);
    document.querySelectorAll('[data-agent-vehicle]').forEach(choice => {
      choice.setAttribute('aria-pressed', String(choice === button));
    });
    byId('agent-detail').hidden = false;
    byId('vehicle-title').textContent = button.textContent;
    renderMark();
  });
});
function showAgent(show) {
  agentMode = show;
  byId(show ? 'agent-viewer' : 'service-viewer').append(byId('viewer'));
  byId('center').hidden = !show;
  byId('clear').hidden = !show;
  if (show) renderMark();
  else renderServicePins();
  byId('agent').hidden = !show;
  byId('service').hidden = show;
  byId('agent-tab').setAttribute('aria-pressed', show);
  byId('service-tab').setAttribute('aria-pressed', !show);
}
byId('agent-tab').onclick = () => showAgent(true);
byId('service-tab').onclick = () => showAgent(false);
rotate();

const report = byId('report');
report.addEventListener('submit', async event => {
  event.preventDefault();
  const mark = marks.get(selectedVehicle);
  const description = byId('description').value.trim();
  const result = byId('report-result');
  if (!mark || !description) {
    result.textContent = 'Pose un repère et décris l’anomalie.';
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
      description
    });
    byId('description').value = '';
    result.textContent = 'Signalement transmis au Garage.';
  } catch {
    result.textContent = 'Envoi impossible. Réessaie dans un instant.';
  } finally {
    button.disabled = false;
  }
});

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
