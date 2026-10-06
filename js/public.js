import { PLAN_CONFIG, classifyCategory } from './data.js';
import { renderPlan } from './ui.js';
import { createAnomaly, getAppMode, preparePublicSession } from './store.js';

let selectedBuilding = 'A';
let selectedRoom = null;

const els = {
  buildingButtons: [...document.querySelectorAll('[data-building]')],
  plans: document.querySelector('#plans'),
  formCard: document.querySelector('#report-card'),
  form: document.querySelector('#report-form'),
  selectedRoom: document.querySelector('#selected-room-text'),
  description: document.querySelector('#description'),
  categoryPreview: document.querySelector('#category-preview'),
  submit: document.querySelector('#submit-btn'),
  mode: document.querySelector('#mode-pill')
};

function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 3400);
}

function renderBuildingPlans() {
  els.plans.innerHTML = '';
  const building = PLAN_CONFIG[selectedBuilding];
  Object.entries(building.levels).forEach(([levelId, level]) => {
    const card = document.createElement('article');
    card.className = 'plan-card';
    card.innerHTML = `
      <h3><span>${level.label}</span><span class="plan-note">Touchez une pièce</span></h3>
      <div class="plan-canvas"></div>
    `;
    const canvas = card.querySelector('.plan-canvas');
    renderPlan(canvas, selectedBuilding, levelId, {
      mode: 'public',
      selectedRoomId: selectedRoom?.id,
      onRoomClick: (room) => selectRoom(room, levelId)
    });
    els.plans.appendChild(card);
  });
}

function selectRoom(room, levelId) {
  const building = PLAN_CONFIG[selectedBuilding];
  selectedRoom = { ...room, buildingId: selectedBuilding, levelId, levelLabel: building.levels[levelId].label };
  els.selectedRoom.textContent = `${building.label} • ${selectedRoom.levelLabel} • ${room.name}`;
  els.formCard.classList.remove('hidden');
  renderBuildingPlans();
  setTimeout(() => els.formCard.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
}

els.buildingButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedBuilding = button.dataset.building;
    selectedRoom = null;
    els.formCard.classList.add('hidden');
    els.buildingButtons.forEach((b) => b.classList.toggle('active', b === button));
    renderBuildingPlans();
  });
});

els.description.addEventListener('input', () => {
  const category = classifyCategory(els.description.value);
  els.categoryPreview.textContent = els.description.value.trim() ? `Classement automatique : ${category}` : 'La catégorie sera déterminée automatiquement.';
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
      roomName: selectedRoom.name,
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
    const doneRoom = `${PLAN_CONFIG[selectedRoom.buildingId].label} • ${selectedRoom.levelLabel} • ${selectedRoom.name}`;
    selectedRoom = null;
    els.formCard.classList.add('hidden');
    renderBuildingPlans();
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

els.mode.textContent = getAppMode() === 'demo' ? 'Mode démo' : 'Firebase actif';
els.mode.classList.toggle('demo', getAppMode() === 'demo');
renderBuildingPlans();
