import { createCcfViewer } from './ccf-viewer.js?v=20261105-report-dialog';
import { createReport, signIn, signOut, watchServiceSession, watchReports, updateStatus, addReportNote, readPhoto, watchVehicleState, setVehicleState } from './reports.js?v=20261105-garage-history';


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
const ccfIdentifiers = {5: '17', 6: '16'};
const vehicleName = vehicle => ccfIdentifiers[vehicle] ? 'CCF 4-1-' + ccfIdentifiers[vehicle] : 'Engin ' + vehicle;

const ccfCanvas = byId('ccf-view');
const ccfViewer = createCcfViewer(ccfCanvas);
let ccfActive = false;
function showVehicleModel(vehicle) {
  const next = Boolean(ccfIdentifiers[vehicle]);
  if (ccfActive !== next) byId('zoom-reset').click();
  ccfActive = next;
  ccfCanvas.hidden = !ccfActive;
  cube.hidden = ccfActive;
  ccfViewer.setPins([]);
  rotate();
}
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
  if (ccfActive) ccfViewer.setCamera({ x, y, zoom, shiftX, shiftY });
  cube.style.transform = 'translate(' + shiftX + 'px,' + shiftY + 'px) scale(' + zoom + ') rotateX(' + x + 'deg) rotateY(' + y + 'deg)';
}
function addPin(face, u, v, status, reportId) {
  if (!face) return;
  const pin = document.createElement('span');
  pin.className = 'pin ' + status;
  if (reportId) pin.dataset.reportId = reportId;
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
  byId('status').textContent = mark ? vehicleName(selectedVehicle) + ' · ' + mark.face : 'Aucun repère posé.';
  if (ccfActive) ccfViewer.setPins(mark ? [{...mark, status: 'reported'}] : []);
  else if (mark) addPin(cubeFace(mark.face), mark.u, mark.v, 'reported');
}
function cubeFace(name) {
  return [...cube.children].find(item => item.dataset.face === name);
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
  if (event.pointerType === 'touch' && (isFullscreen() || ccfActive)) {
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
let openReportFromPin;
scene.addEventListener('pointerup', event => {
  if (agentMode && gesture?.id === event.pointerId && !gesture.dragged) {
    if (ccfActive) {
      const hit = ccfViewer.pick(event.clientX, event.clientY);
      if (hit) mark(hit.face, hit.u, hit.v);
    } else if (gesture.face.classList.contains('face')) {
      mark(gesture.face.dataset.face, gesture.u, gesture.v);
    }
  }
  if (!agentMode && gesture?.id === event.pointerId && !gesture.dragged) {
    const id = ccfActive ? ccfViewer.pickPin(event.clientX, event.clientY) : gesture.face.dataset.reportId;
    if (id) openReportFromPin(id);
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
  const clientX = box.left + box.width / 2;
  const clientY = box.top + box.height / 2;
  if (ccfActive) {
    const hit = ccfViewer.pick(clientX, clientY);
    if (hit) mark(hit.face, hit.u, hit.v);
    return;
  }
  const face = document.elementFromPoint(clientX, clientY);
  if (face?.classList.contains('face')) mark(face.dataset.face, 50, 50);
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
  if (!isFullscreen() && !ccfActive) return;
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
    showVehicleModel(selectedVehicle);
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
  const reporterFirstName = byId('reporter-first-name').value.trim();
  const reporterLastName = byId('reporter-last-name').value.trim();
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
  if (!reporterFirstName || !reporterLastName) {
    result.textContent = 'Renseignez votre nom et votre prénom.';
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
      face: mark.face,
      u: Math.max(0, Math.min(100, mark.u)),
      v: Math.max(0, Math.min(100, mark.v)),
      description,
      reporterFirstName,
      reporterLastName,
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

const vehicleLabels = {
  operational: 'En caserne',
  maintenance: 'À la technique',
  unknown: 'État indisponible'
};
const vehicleStates = new Map();
const vehicleButtons = [...document.querySelectorAll('[data-agent-vehicle], [data-vehicle]')];
let serviceVehicle = 0;

function renderVehicleStateEditor() {
  const label = byId('vehicle-state-label');
  if (!label || !serviceVehicle) return;
  const state = vehicleStates.get(serviceVehicle) || 'unknown';
  label.textContent = vehicleName(serviceVehicle) + ' · ' + vehicleLabels[state];
  document.querySelectorAll('[data-set-vehicle-state]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.setVehicleState === state));
  });
}

vehicleButtons.forEach(button => {
  const vehicle = Number(button.dataset.agentVehicle || button.dataset.vehicle);
  const showState = state => {
    vehicleStates.set(vehicle, state);
    button.dataset.state = state;
    button.setAttribute('aria-label', button.textContent + ' · ' + vehicleLabels[state]);
    if (serviceVehicle === vehicle) renderVehicleStateEditor();
  };
  watchVehicleState(vehicle, showState, () => showState('unknown'));
});

if (!agentMode) {
  const serviceStatus = byId('service-status');
  const list = byId('reports');
  const reportDialog = byId('report-dialog');
  const dialogDetail = byId('report-dialog-detail');
  const dialogStatus = byId('report-dialog-status');
  let openReportId;
  let lastDetailVersion;
  let previousFocus;

  reportDialog.addEventListener('close', () => {
    if (reportDialog.open) return;
    const id = openReportId;
    openReportId = undefined;
    lastDetailVersion = undefined;
    dialogDetail.replaceChildren();
    if (previousFocus?.isConnected) previousFocus.focus();
    else if (id) list.querySelector('[data-report-id="' + CSS.escape(id) + '"]')?.focus();
  });

  function showReport(id, opener) {
    const row = visibleReports.find(report => report.id === id);
    if (!row) return;
    openReportId = id;
    previousFocus = opener || scene;
    lastDetailVersion = undefined;
    dialogStatus.textContent = '';
    refreshReportDialog();
    if (!reportDialog.open) reportDialog.showModal();
  }

  function refreshReportDialog() {
    if (!openReportId) return;
    const row = visibleReports.find(report => report.id === openReportId);
    if (!row) {
      if (reportDialog.open) reportDialog.close();
      return;
    }
    const version = JSON.stringify(row);
    if (version === lastDetailVersion) return;
    lastDetailVersion = version;
    const editing = dialogDetail.contains(document.activeElement) && document.activeElement.tagName === 'TEXTAREA';
    const selection = editing ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
    dialogDetail.replaceChildren(renderReportDetail(row));
    if (selection) {
      const field = dialogDetail.querySelector('textarea');
      field.focus({preventScroll: true});
      field.setSelectionRange(...selection);
    }
  }

  openReportFromPin = showReport;
  const login = byId('login');
  const topbar = byId('service-topbar');
  const menuButton = byId('service-menu-button');
  const menu = byId('service-menu');
  const sectorLinks = menu.querySelectorAll('[data-service-sector]');

  function setMenuOpen(open) {
    menu.classList.toggle('hidden', !open);
    menuButton.classList.toggle('active', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  }

  menuButton.addEventListener('click', () => setMenuOpen(menu.classList.contains('hidden')));
  document.addEventListener('click', event => {
    if (!menu.contains(event.target) && !menuButton.contains(event.target)) setMenuOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.classList.contains('hidden')) {
      setMenuOpen(false);
      menuButton.focus();
    }
  });
  let stopWatching;
  let visibleReports = [];
  const noteDrafts = new Map();
  const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' });

  function appendEntry(container, label, timestamp) {
    const item = document.createElement('div');
    item.className = 'history-item';
    const title = document.createElement('strong');
    title.textContent = label;
    item.append(title);
    const date = timestamp?.toDate?.();
    if (date) {
      const time = document.createElement('small');
      time.textContent = dateFormat.format(date);
      item.append(time);
    }
    container.append(item);
  }

  function renderReportJournal(item, row, reporter) {
    const journal = document.createElement('section');
    const journalTitle = document.createElement('h3');
    journalTitle.textContent = 'Main courante';
    const notes = document.createElement('div');
    notes.className = 'history';
    const history = document.createElement('div');
    history.className = 'history';
    appendEntry(history, reporter ? 'Signalement par ' + reporter : 'Signalement créé · auteur non renseigné', row.createdAt);
    for (const event of row.history || []) {
      if (event.type === 'note') {
        appendEntry(notes, event.text, event.at);
        appendEntry(history, 'Note ajoutée à la main courante', event.at);
      } else if (event.type === 'status') {
        appendEntry(history, 'Statut : ' + reportStatuses[event.from] + ' → ' + reportStatuses[event.to], event.at);
      }
    }
    if (!notes.childElementCount) notes.textContent = 'Aucune note.';
    const form = document.createElement('form');
    const field = document.createElement('textarea');
    field.required = true;
    field.maxLength = 1000;
    field.rows = 2;
    field.placeholder = 'Ex. appel à la technique, intervention prévue…';
    field.setAttribute('aria-label', 'Note de main courante');
    field.value = noteDrafts.get(row.id) || '';
    field.addEventListener('input', () => noteDrafts.set(row.id, field.value));
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Ajouter une note';
    form.append(field, submit);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const note = field.value.trim();
      if (!note) return;
      field.disabled = true;
      submit.disabled = true;
      noteDrafts.delete(row.id);
      try {
        if (reportDialog.open) dialogStatus.textContent = '';
        await addReportNote(row.id, note);
        field.value = '';
      } catch {
        noteDrafts.set(row.id, note);
        const current = openReportId === row.id ? dialogDetail.querySelector('textarea') : null;
        if (current && !current.value) current.value = note;
        if (openReportId === row.id && reportDialog.open) dialogStatus.textContent = 'Impossible d’ajouter la note. Réessayez.';
      } finally {
        field.disabled = false;
        submit.disabled = false;
      }
    });
    journal.append(journalTitle, notes, form);
    const historyTitle = document.createElement('h3');
    historyTitle.textContent = 'Historique de cette anomalie';
    item.append(journal, historyTitle, history);
  }

  function renderReportDetail(row) {
    const item = document.createElement('article');
    item.dataset.reportId = row.id;
    const reporter = [row.reporterFirstName, row.reporterLastName].filter(Boolean).join(' ');
    const status = row.status || 'reported';
    const dot = document.createElement('span');
    dot.className = 'status-dot ' + status;
    dot.setAttribute('aria-hidden', 'true');
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Statut de l’anomalie');
    Object.entries(reportStatuses).forEach(([value, label]) => {
      select.add(new Option(label, value, false, value === status));
    });
    select.addEventListener('change', async () => {
      select.disabled = true;
      try {
        dialogStatus.textContent = '';
        await updateStatus(row.id, select.value);
      } catch {
        select.value = status;
        if (openReportId === row.id && reportDialog.open) dialogStatus.textContent = 'Impossible de modifier le statut.';
      } finally {
        select.disabled = false;
      }
    });
    const author = document.createElement('p');
    author.textContent = 'Signalé par : ' + (reporter || 'non renseigné');
    item.append(dot, row.face + ' · ' + row.description, select, author);
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
    renderReportJournal(item, row, reporter);
    return item;
  }

  function renderServicePins() {
    clearPins();
    if (ccfActive) ccfViewer.setPins(visibleReports);
    else visibleReports.forEach(row => addPin(cubeFace(row.face), row.u, row.v, row.status || 'reported', row.id));
  }

  watchServiceSession(session => {
    const signedIn = Boolean(session);
    login.hidden = signedIn;
    byId('vehicles').hidden = !signedIn;
    topbar.classList.toggle('hidden', !signedIn);
    sectorLinks.forEach(link => link.classList.toggle('hidden', !session?.generalAdmin));
    setMenuOpen(false);
    if (reportDialog.open) reportDialog.close();
    stopWatching?.();
    stopWatching = undefined;
    list.replaceChildren();
    noteDrafts.clear();
    visibleReports = [];
    renderServicePins();
    byId('service-viewer').hidden = true;
    byId('report-list-panel').hidden = true;
    byId('vehicle-state-editor').hidden = true;
    serviceVehicle = 0;
    serviceStatus.textContent = signedIn ? 'Sélectionnez un engin.' : '';
  });

  login.addEventListener('submit', async event => {
    event.preventDefault();
    const button = login.querySelector('button');
    button.disabled = true;
    try {
      await signIn(byId('email').value, byId('password').value);
      byId('password').value = '';
    } catch {
      serviceStatus.textContent = 'Connexion Garage impossible.';
    } finally {
      button.disabled = false;
    }
  });

  byId('logout').addEventListener('click', async () => {
    try {
      await signOut();
    } catch {
      serviceStatus.textContent = 'Déconnexion impossible. Réessayez.';
    }
  });

  const stateButtons = [...document.querySelectorAll('[data-set-vehicle-state]')];
  stateButtons.forEach(button => {
    button.addEventListener('click', async () => {
      if (!serviceVehicle) return;
      const vehicle = serviceVehicle;
      stateButtons.forEach(choice => { choice.disabled = true; });
      try {
        await setVehicleState(vehicle, button.dataset.setVehicleState);
      } catch {
        if (serviceVehicle === vehicle) byId('vehicle-state-label').textContent = 'Impossible de modifier l’état de l’engin.';
      } finally {
        stateButtons.forEach(choice => { choice.disabled = false; });
      }
    });
  });

  document.querySelectorAll('[data-vehicle]').forEach(button => {
    button.addEventListener('click', () => {
      if (reportDialog.open) reportDialog.close();
      serviceVehicle = Number(button.dataset.vehicle);
      byId('vehicle-state-editor').hidden = false;
      renderVehicleStateEditor();
      stopWatching?.();
      list.replaceChildren();
      visibleReports = [];
      if (!agentMode) renderServicePins();
      byId('service-viewer').hidden = false;
      byId('report-list-panel').hidden = false;
      showVehicleModel(serviceVehicle);
      serviceStatus.textContent = 'Chargement…';
      stopWatching = watchReports(Number(button.dataset.vehicle), rows => {
        serviceStatus.textContent = button.textContent + ' · ' + rows.length + ' signalement(s)';
        visibleReports = rows;
        if (!agentMode) renderServicePins();
        list.replaceChildren(...rows.map(row => {
          const item = document.createElement('li');
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'garage-report-summary';
          button.dataset.reportId = row.id;
          button.setAttribute('aria-haspopup', 'dialog');
          const status = row.status || 'reported';
          const dot = document.createElement('span');
          dot.className = 'status-dot ' + status;
          dot.setAttribute('aria-hidden', 'true');
          button.append(dot, row.face + ' · ' + row.description + ' · ' + reportStatuses[status]);
          button.addEventListener('click', () => showReport(row.id, button));
          item.append(button);
          return item;
        }));
        if (!rows.length) {
          const empty = document.createElement('li');
          empty.textContent = 'Aucune anomalie pour cet engin.';
          list.append(empty);
        }
        refreshReportDialog();
      }, () => {
        visibleReports = [];
        if (reportDialog.open) reportDialog.close();
        if (!agentMode) renderServicePins();
        serviceStatus.textContent = 'Lecture impossible. Vérifie ton accès au Garage.';
        list.replaceChildren();
      });
    });
  });
}
