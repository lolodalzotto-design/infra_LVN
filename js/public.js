window.__infraLvnBoot = true;
import { PLAN_CONFIG, classifyCategory } from './data.js?v=20261007-1225';
import { renderPlan } from './ui.js?v=20261007-1225';
import { createAnomaly, preparePublicSession, subscribeRoomStatus } from './store.js?v=20261007-1225';

let selectedBuilding = 'A';
let selectedLevel = 'RDC';
let selectedZone = 'caserne';
let selectedRoom = null;
let roomStatus = {};

const els = {
  buildingButtons: [...document.querySelectorAll('[data-building]')],
  levelButtons: document.querySelector('#level-buttons'),
  zoneWrap: document.querySelector('#zone-wrap'),
  zoneButtons: document.querySelector('#zone-buttons'),
  plans: document.querySelector('#plans'),
  formCard: document.querySelector('#report-card'),
  form: document.querySelector('#report-form'),
  selectedRoom: document.querySelector('#selected-room-text'),
  description: document.querySelector('#description'),
  categoryPreview: document.querySelector('#category-preview'),
  submit: document.querySelector('#submit-btn')
};

function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 3400);
}

function currentBuilding() {
  return PLAN_CONFIG[selectedBuilding];
}

function currentLevel() {
  return currentBuilding()?.levels?.[selectedLevel];
}

function availableZones() {
  return Object.entries(currentLevel()?.zones || {});
}

function resetRoomSelection() {
  selectedRoom = null;
  els.formCard.classList.add('hidden');
}

function renderLevelButtons() {
  const levels = Object.entries(currentBuilding()?.levels || {});
  if (!currentBuilding()?.levels?.[selectedLevel]) selectedLevel = levels[0]?.[0] || 'RDC';

  els.levelButtons.innerHTML = levels.map(([levelId, level]) =>
    `<button type="button" class="segment-btn ${levelId === selectedLevel ? 'active' : ''}" data-level="${levelId}">${level.label}</button>`
  ).join('');

  els.levelButtons.querySelectorAll('[data-level]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedLevel = button.dataset.level;
      selectedZone = Object.keys(currentLevel()?.zones || {})[0] || 'caserne';
      resetRoomSelection();
      renderSelectorsAndPlan();
    });
  });
}

function renderZoneButtons() {
  const zones = availableZones();
  if (!currentLevel()?.zones?.[selectedZone]) selectedZone = zones[0]?.[0] || 'caserne';

  const needsChoice = zones.length > 1;
  els.zoneWrap.classList.toggle('hidden', !needsChoice);

  if (!needsChoice) {
    els.zoneButtons.innerHTML = '';
    return;
  }

  els.zoneButtons.innerHTML = zones.map(([zoneId, zone]) =>
    `<button type="button" class="segment-btn ${zoneId === selectedZone ? 'active' : ''}" data-zone="${zoneId}">${zone.label}</button>`
  ).join('');

  els.zoneButtons.querySelectorAll('[data-zone]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedZone = button.dataset.zone;
      resetRoomSelection();
      renderSelectorsAndPlan();
    });
  });
}

function renderCurrentPlan() {
  els.plans.innerHTML = '';
  const building = currentBuilding();
  const level = currentLevel();
  const zone = level?.zones?.[selectedZone];
  if (!building || !level || !zone) return;

  const card = document.createElement('article');
  card.className = 'plan-card';
  const rotationTest = selectedBuilding === 'A' && selectedLevel === 'RDC' && selectedZone === 'caserne';
  card.innerHTML = `
    <h3>
      <span>${building.label} • ${level.label}${availableZones().length > 1 ? ` • ${zone.label}` : ''}</span>
    </h3>
    <div class="plan-legend" aria-label="Légende du plan">
      <span class="plan-legend-item"><i class="plan-legend-dot ok"></i>OK</span>
      <span class="plan-legend-item"><i class="plan-legend-dot alert"></i>Anomalie</span>
      <span class="plan-legend-hint">${rotationTest ? '2 doigts : zoom • déplacement • rotation' : 'Touchez une pièce • pincez pour zoomer'}</span>
    </div>
    <div class="plan-canvas"></div>
  `;

  const canvas = card.querySelector('.plan-canvas');
  const vb = zone.viewBox || { width: 100, height: 100 };
  const gestureTest = selectedBuilding === 'A' && selectedLevel === 'RDC' && selectedZone === 'caserne';
  canvas.style.aspectRatio = `${vb.width} / ${vb.height}`;
  canvas.style.minHeight = '0';
  canvas.classList.toggle('plan-vector-transparent', gestureTest);

  renderPlan(canvas, selectedBuilding, selectedLevel, {
    zoneId: selectedZone,
    mode: 'public',
    roomStatus,
    selectedRoomId: selectedRoom?.id,
    onRoomClick: selectRoom
  });

  els.plans.appendChild(card);
}

function renderSelectorsAndPlan() {
  renderLevelButtons();
  renderZoneButtons();
  renderCurrentPlan();
}

function selectRoom(room) {
  const building = currentBuilding();
  const level = currentLevel();
  const zone = level?.zones?.[selectedZone];
  selectedRoom = {
    ...room,
    buildingId: selectedBuilding,
    buildingLabel: building.label,
    levelId: selectedLevel,
    levelLabel: level.label,
    zoneId: selectedZone,
    zoneLabel: zone?.label || ''
  };

  els.selectedRoom.textContent =
    `${building.label} • ${level.label}${availableZones().length > 1 ? ` • ${zone.label}` : ''} • ${room.code ? room.code + ' — ' : ''}${room.name}`;

  els.formCard.classList.remove('hidden');
  renderCurrentPlan();
  setTimeout(() => els.formCard.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
}

els.buildingButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedBuilding = button.dataset.building;
    selectedLevel = Object.keys(currentBuilding()?.levels || {})[0] || 'RDC';
    selectedZone = Object.keys(currentLevel()?.zones || {})[0] || 'caserne';
    resetRoomSelection();
    els.buildingButtons.forEach((b) => b.classList.toggle('active', b === button));
    renderSelectorsAndPlan();
  });
});

els.description.addEventListener('input', () => {
  const category = classifyCategory(els.description.value);
  els.categoryPreview.textContent = !els.description.value.trim()
    ? 'La catégorie sera déterminée automatiquement.'
    : category
      ? `Classement automatique : ${category}`
      : 'Catégorie à confirmer par le service Infra.';
});

els.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!selectedRoom) return toast('Sélectionnez d’abord une pièce.');

  const formData = new FormData(els.form);
  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const photoFile = document.querySelector('#photo').files?.[0] || null;

  if (!firstName || !lastName || !description) return toast('Nom, prénom et description sont nécessaires.');
  if (description.length > 240) return toast('La description doit rester courte (240 caractères maximum).');

  els.submit.disabled = true;
  els.submit.textContent = 'Envoi…';
  try {
    await preparePublicSession();
    await createAnomaly({
      roomId: selectedRoom.id,
      roomName: selectedRoom.code ? `${selectedRoom.code} — ${selectedRoom.name}` : selectedRoom.name,
      buildingId: selectedRoom.buildingId,
      levelId: selectedRoom.levelId,
      reporterFirstName: firstName,
      reporterLastName: lastName,
      description,
      category: classifyCategory(description),
      urgent: formData.get('urgent') === 'on',
      source: 'public'
    }, photoFile);

    els.form.reset();
    els.categoryPreview.textContent = 'La catégorie sera déterminée automatiquement.';
    const doneRoom = `${selectedRoom.buildingLabel} • ${selectedRoom.levelLabel}${availableZones().length > 1 ? ` • ${selectedRoom.zoneLabel}` : ''} • ${selectedRoom.roomName || selectedRoom.name}`;
    selectedRoom = null;
    els.formCard.classList.add('hidden');
    renderCurrentPlan();
    toast(`Signalement enregistré — ${doneRoom}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error(error);
    toast(`Impossible d’enregistrer : ${error.message || 'erreur inconnue'}`);
  } finally {
    els.submit.disabled = false;
    els.submit.textContent = 'Soumettre le signalement';
  }
});

subscribeRoomStatus((status) => {
  roomStatus = status || {};
  renderCurrentPlan();
});

renderSelectorsAndPlan();
