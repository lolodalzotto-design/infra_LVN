window.__infraLvnBoot = true;
import { PLAN_CONFIG, classifyCategory } from './data.js?v=20261007-refplan-1';
import { renderPlan } from './ui.js?v=20261007-refplan-1';
import { createAnomaly, createHccRequest, preparePublicSession } from './store.js?v=20261008-sector-1';

let selectedReportType = null;
let selectedBuilding = null;
let selectedLevel = null;
let selectedZone = null;
let selectedRoom = null;

const els = {
  reportTypeButtons: [...document.querySelectorAll('[data-report-type]')],
  locationFlow: document.querySelector('#location-flow'),
  buildingStepNumber: document.querySelector('#building-step-number'),
  levelStepNumber: document.querySelector('#level-step-number'),
  zoneStepNumber: document.querySelector('#zone-step-number'),
  roomStepNumber: document.querySelector('#room-step-number'),
  formStepNumber: document.querySelector('#form-step-number'),
  formStepTitle: document.querySelector('#form-step-title'),
  descriptionLabel: document.querySelector('#description-label'),
  urgentField: document.querySelector('#urgent-field'),
  buildingButtons: [...document.querySelectorAll('[data-building]')],
  step2: document.querySelector('#step-2'),
  step3: document.querySelector('#step-3'),
  step4: document.querySelector('#step-4'),
  levelButtons: document.querySelector('#level-buttons'),
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
  return selectedBuilding ? PLAN_CONFIG[selectedBuilding] : null;
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
  els.levelButtons.innerHTML = levels.map(([levelId, level]) =>
    `<button type="button" class="segment-btn ${levelId === selectedLevel ? 'active' : ''}" data-level="${levelId}">${level.label}</button>`
  ).join('');

  els.levelButtons.querySelectorAll('[data-level]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedLevel = button.dataset.level;
      selectedZone = null;
      resetRoomSelection();

      els.levelButtons.querySelectorAll('[data-level]').forEach((b) => {
        b.classList.toggle('active', b === button);
      });

      els.step3.classList.remove('hidden');
      els.step4.classList.add('hidden');
      els.plans.innerHTML = '';
      renderZoneButtons();
    });
  });
}

function renderZoneButtons() {
  const zones = availableZones();

  els.zoneButtons.innerHTML = zones.map(([zoneId, zone]) =>
    `<button type="button" class="segment-btn ${zoneId === selectedZone ? 'active' : ''}" data-zone="${zoneId}">${zone.label}</button>`
  ).join('');

  els.zoneButtons.querySelectorAll('[data-zone]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedZone = button.dataset.zone;
      resetRoomSelection();

      els.zoneButtons.querySelectorAll('[data-zone]').forEach((b) => {
        b.classList.toggle('active', b === button);
      });

      els.step4.classList.remove('hidden');
      renderCurrentPlan();
    });
  });
}

function renderCurrentPlan() {
  els.plans.innerHTML = '';
  if (!selectedBuilding || !selectedLevel || !selectedZone) return;
  const building = currentBuilding();
  const level = currentLevel();
  const zone = level?.zones?.[selectedZone];
  if (!building || !level || !zone) return;

  const card = document.createElement('article');
  card.className = 'plan-card';
  card.innerHTML = `
    <h3>
      <span>${building.label} • ${level.label}${availableZones().length > 1 ? ` • ${zone.label}` : ''}</span>
    </h3>

    <div class="plan-canvas"></div>
  `;

  const canvas = card.querySelector('.plan-canvas');
  const vb = zone.viewBox || { width: 100, height: 100 };
  const vectorPlanActive = String(zone.planImage || '').includes('.svg');
  canvas.style.aspectRatio = `${vb.width} / ${vb.height}`;
  canvas.style.minHeight = '0';
  canvas.classList.toggle('plan-vector-transparent', vectorPlanActive);

  renderPlan(canvas, selectedBuilding, selectedLevel, {
    zoneId: selectedZone,
    mode: 'public',
    roomStatus: {},
    selectedRoomId: selectedRoom?.id,
    onRoomClick: selectRoom
  });

  els.plans.appendChild(card);
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

  configureReportForm();
  els.formCard.classList.remove('hidden');
  renderCurrentPlan();
  setTimeout(() => els.formCard.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
}

function resetLocationFlow() {
  selectedBuilding = null;
  selectedLevel = null;
  selectedZone = null;
  resetRoomSelection();
  els.buildingButtons.forEach((b) => b.classList.remove('active'));
  els.step2.classList.add('hidden');
  els.step3.classList.add('hidden');
  els.step4.classList.add('hidden');
  els.levelButtons.innerHTML = '';
  els.zoneButtons.innerHTML = '';
  els.plans.innerHTML = '';
}

function configureReportForm() {
  const isHcc = selectedReportType === 'hcc';
  els.formStepTitle.textContent = isHcc ? 'Précisez votre demande HCC' : 'Décrivez le problème';
  els.descriptionLabel.textContent = isHcc ? 'Précisez le besoin ou le matériel concerné *' : 'Quel est le problème ? *';
  els.description.placeholder = isHcc
    ? 'Décrivez librement votre demande HCC'
    : 'Ex. : la chasse d’eau fuit en continu';
  els.categoryPreview.classList.toggle('hidden', isHcc);
  els.urgentField.classList.remove('hidden');
  els.submit.textContent = isHcc ? 'Envoyer la remontée HCC' : 'Soumettre le signalement';
}

function updateStepNumbers() {
  const offset = 0;
  els.buildingStepNumber.textContent = 2 + offset;
  els.levelStepNumber.textContent = 3 + offset;
  els.zoneStepNumber.textContent = 4 + offset;
  els.roomStepNumber.textContent = 5 + offset;
  els.formStepNumber.textContent = 6 + offset;
}

function openLocationFlow() {
  resetLocationFlow();
  updateStepNumbers();
  configureReportForm();
  els.locationFlow.classList.remove('hidden');
}

els.reportTypeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedReportType = button.dataset.reportType;
    els.reportTypeButtons.forEach((b) => b.classList.toggle('active', b === button));
    resetLocationFlow();
    openLocationFlow();
  });
});

els.buildingButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedBuilding = button.dataset.building;
    selectedLevel = null;
    selectedZone = null;
    resetRoomSelection();

    els.buildingButtons.forEach((b) => b.classList.toggle('active', b === button));

    els.step2.classList.remove('hidden');
    els.step3.classList.add('hidden');
    els.step4.classList.add('hidden');
    els.levelButtons.innerHTML = '';
    els.zoneButtons.innerHTML = '';
    els.plans.innerHTML = '';

    renderLevelButtons();
  });
});

els.description.addEventListener('input', () => {
  if (selectedReportType === 'hcc') return;
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
    const commonPayload = {
      roomId: selectedRoom.id,
      roomName: selectedRoom.code ? `${selectedRoom.code} — ${selectedRoom.name}` : selectedRoom.name,
      buildingId: selectedRoom.buildingId,
      levelId: selectedRoom.levelId,
      reporterFirstName: firstName,
      reporterLastName: lastName,
      description,
      source: 'public'
    };

    if (selectedReportType === 'hcc') {
      await createHccRequest({
        ...commonPayload,
        zoneId: selectedRoom.zoneId,
        urgent: formData.get('urgent') === 'on'
      }, photoFile);
    } else {
      await createAnomaly({
        ...commonPayload,
        category: classifyCategory(description),
        urgent: formData.get('urgent') === 'on'
      }, photoFile);
    }

    els.form.reset();
    els.categoryPreview.textContent = 'La catégorie sera déterminée automatiquement.';
    const doneRoom = `${selectedRoom.buildingLabel} • ${selectedRoom.levelLabel}${availableZones().length > 1 ? ` • ${selectedRoom.zoneLabel}` : ''} • ${selectedRoom.roomName || selectedRoom.name}`;
    selectedRoom = null;
    els.formCard.classList.add('hidden');
    renderCurrentPlan();
    toast(`${selectedReportType === 'hcc' ? 'Remontée HCC enregistrée' : 'Signalement enregistré'} — ${doneRoom}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error(error);
    toast(`Impossible d’enregistrer : ${error.message || 'erreur inconnue'}`);
  } finally {
    els.submit.disabled = false;
    configureReportForm();
  }
});

