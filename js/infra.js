import { PLAN_CONFIG, CATEGORIES, allRooms, classifyCategory, getRoom } from './data.js';
import { renderPlan, statusBadge, formatDate, escapeHtml } from './ui.js';
import {
  getAppMode, hasInfraSession, loginInfra, logoutInfra,
  subscribeAnomalies, updateAnomaly, createAnomaly, deleteAnomaly, resetDemoData
} from './store.js';

let anomalies = [];
let selectedBuilding = 'A';
let actorName = sessionStorage.getItem('infra_LVN_actor') || '';
let unsubscribe = null;

const $ = (s) => document.querySelector(s);
const els = {
  loginWrap: $('#login-wrap'), shell: $('#infra-shell'), loginForm: $('#login-form'), logout: $('#logout-btn'),
  actor: $('#actorName'), email: $('#email'), password: $('#password'), firebaseFields: $('#firebase-login-fields'), demoNote: $('#demo-note'),
  mode: $('#mode-pill'), plans: $('#infra-plans'), list: $('#anomaly-list'), listCount: $('#list-count'), journal: $('#journal-list'),
  total: $('#kpi-total'), open: $('#kpi-open'), progress: $('#kpi-progress'), resolved: $('#kpi-resolved'), bar: $('#kpi-bar'), percent: $('#kpi-percent'),
  filterStatus: $('#filter-status'), filterCategory: $('#filter-category'), filterBuilding: $('#filter-building'), filterSearch: $('#filter-search'),
  add: $('#add-anomaly-btn'), modalRoot: $('#modal-root')
};

function toast(message) {
  const node = document.createElement('div'); node.className = 'toast'; node.textContent = message; document.body.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

function openShell() {
  els.loginWrap.classList.add('hidden');
  els.shell.classList.add('active');
  els.logout.classList.remove('hidden');
  if (!unsubscribe) unsubscribe = subscribeAnomalies((rows) => { anomalies = rows; renderAll(); });
}

function closeShell() {
  els.loginWrap.classList.remove('hidden'); els.shell.classList.remove('active'); els.logout.classList.add('hidden');
  unsubscribe?.(); unsubscribe = null;
}

function fillCategories() {
  els.filterCategory.innerHTML = '<option value="all">Toutes les catégories</option>' + CATEGORIES.map(c => `<option>${escapeHtml(c)}</option>`).join('');
}

function renderKpis() {
  const total = anomalies.length;
  const open = anomalies.filter(a => a.status === 'a_traiter').length;
  const progress = anomalies.filter(a => a.status === 'en_cours').length;
  const resolved = anomalies.filter(a => a.status === 'resolu').length;
  const pct = total ? Math.round((resolved / total) * 100) : 100;
  els.total.textContent = total; els.open.textContent = open; els.progress.textContent = progress; els.resolved.textContent = resolved;
  els.bar.style.width = `${pct}%`; els.percent.textContent = `${pct} % réalisé`;
}

function renderPlans() {
  els.plans.innerHTML = '';
  Object.entries(PLAN_CONFIG[selectedBuilding].levels).forEach(([levelId, level]) => {
    const card = document.createElement('article'); card.className = 'plan-card';
    card.innerHTML = `<h3><span>${escapeHtml(level.label)}</span><span class="plan-note">Rouge = anomalie active</span></h3><div class="plan-canvas"></div>`;
    renderPlan(card.querySelector('.plan-canvas'), selectedBuilding, levelId, {
      mode: 'infra', anomalies, onRoomClick: (room) => openRoomModal(room.id)
    });
    els.plans.appendChild(card);
  });
}

function filteredAnomalies() {
  const s = els.filterStatus.value, c = els.filterCategory.value, b = els.filterBuilding.value, q = els.filterSearch.value.trim().toLowerCase();
  return anomalies.filter(a => {
    if (s === 'active' && a.status === 'resolu') return false;
    if (!['all','active'].includes(s) && a.status !== s) return false;
    if (c !== 'all' && a.category !== c) return false;
    if (b !== 'all' && a.buildingId !== b) return false;
    if (q && !`${a.description} ${a.roomName} ${a.reporterFirstName} ${a.reporterLastName} ${a.category}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderList() {
  const rows = filteredAnomalies();
  els.listCount.textContent = `(${rows.length})`;
  if (!rows.length) { els.list.innerHTML = '<div class="empty">Aucune anomalie pour ces filtres.</div>'; return; }
  els.list.innerHTML = rows.map(a => {
    const room = getRoom(a.roomId);
    return `<article class="anomaly-card ${a.urgent ? 'urgent' : ''}" data-anomaly-id="${escapeHtml(a.id)}">
      <div class="anomaly-top"><div><div class="anomaly-title">${a.urgent ? '🚨 ' : ''}${escapeHtml(a.description)}</div><div class="anomaly-meta"><span>${escapeHtml(room?.buildingLabel || a.buildingId || '')}</span><span>${escapeHtml(room?.levelLabel || a.levelId || '')}</span><span>${escapeHtml(a.roomName || room?.name || '')}</span><span>${escapeHtml(a.category || 'Autre')}</span></div></div>${statusBadge(a.status)}</div>
      <div class="anomaly-actions"><span class="help">${formatDate(a.createdAt)} • ${escapeHtml(`${a.reporterFirstName || ''} ${a.reporterLastName || ''}`.trim() || 'Infra')}</span><button class="secondary view-anomaly" type="button">Ouvrir</button></div>
    </article>`;
  }).join('');
  els.list.querySelectorAll('.view-anomaly').forEach(btn => btn.addEventListener('click', () => openAnomalyModal(btn.closest('[data-anomaly-id]').dataset.anomalyId)));
}

function renderJournal() {
  const events = anomalies.flatMap(a => (a.history || []).map(h => ({...h, anomaly:a}))).sort((a,b) => new Date(b.at) - new Date(a.at)).slice(0,40);
  if (!events.length) { els.journal.innerHTML = '<div class="empty">Aucun événement.</div>'; return; }
  els.journal.innerHTML = events.map(e => `<div class="history-item"><strong>${escapeHtml(e.label)}</strong> — ${escapeHtml(e.anomaly.roomName || '')}<small>${formatDate(e.at)} • ${escapeHtml(e.actor || 'Infra')}</small></div>`).join('');
}

function renderAll() { renderKpis(); renderPlans(); renderList(); renderJournal(); }

function modal(content) {
  els.modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal">${content}</section></div>`;
  const backdrop = els.modalRoot.querySelector('.modal-backdrop');
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  els.modalRoot.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
}
function closeModal() { els.modalRoot.innerHTML = ''; }

function openRoomModal(roomId) {
  const room = getRoom(roomId); const rows = anomalies.filter(a => a.roomId === roomId && a.status !== 'resolu');
  modal(`<div class="modal-head"><div><h2>${escapeHtml(room.name)}</h2><div class="help">${escapeHtml(room.buildingLabel)} • ${escapeHtml(room.levelLabel)}</div></div><button class="icon-btn" data-close>×</button></div>
    ${rows.length ? `<div class="room-popup-list">${rows.map(a=>`<article class="anomaly-card ${a.urgent?'urgent':''}"><div class="anomaly-top"><strong>${a.urgent?'🚨 ':''}${escapeHtml(a.description)}</strong>${statusBadge(a.status)}</div><div class="anomaly-meta"><span>${escapeHtml(a.category)}</span><span>${formatDate(a.createdAt)}</span></div><div class="submit-row" style="margin-top:8px"><button type="button" class="secondary room-open" data-id="${a.id}">Détail</button></div></article>`).join('')}</div>` : '<div class="empty">Aucune anomalie active dans cette pièce.</div>'}
    <div class="submit-row"><button type="button" class="primary" id="room-add">+ Ajouter une anomalie ici</button></div>`);
  $('#room-add').addEventListener('click', () => openCreateModal(roomId));
  els.modalRoot.querySelectorAll('.room-open').forEach(b => b.addEventListener('click', () => openAnomalyModal(b.dataset.id)));
}

function openCreateModal(preselectedRoomId = '') {
  const rooms = allRooms();
  modal(`<div class="modal-head"><div><h2>Créer une anomalie</h2><div class="help">Création directe par le service Infra</div></div><button class="icon-btn" data-close>×</button></div>
    <form id="create-form"><div class="form-grid">
      <div class="field full"><label>Pièce *</label><select name="roomId" required>${rooms.map(r=>`<option value="${r.id}" ${r.id===preselectedRoomId?'selected':''}>${escapeHtml(r.buildingLabel)} — ${escapeHtml(r.levelLabel)} — ${escapeHtml(r.name)}</option>`).join('')}</select></div>
      <div class="field full"><label>Description *</label><textarea name="description" maxlength="240" required placeholder="Décrivez brièvement le problème"></textarea></div>
      <div class="field full"><label>Photo</label><input id="infra-create-photo" type="file" accept="image/*" capture="environment"></div>
      <div class="field full"><label class="urgent-toggle"><input name="urgent" type="checkbox"> <span>🚨 <strong>Urgent</strong></span></label></div>
    </div><div class="submit-row"><button type="button" class="secondary" data-close>Annuler</button><button class="primary" type="submit">Créer</button></div></form>`);
  $('#create-form').addEventListener('submit', async e => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const room = getRoom(fd.get('roomId')); const description = String(fd.get('description')).trim();
    if (!room || !description) return;
    try {
      await createAnomaly({ roomId:room.id, roomName:room.name, buildingId:room.buildingId, levelId:room.levelId, reporterFirstName:'', reporterLastName:'', actor:actorName, description, category:classifyCategory(description), urgent:fd.get('urgent')==='on', source:'infra' }, $('#infra-create-photo').files?.[0] || null);
      closeModal(); toast('Anomalie créée.');
    } catch(err) { toast(err.message || 'Erreur'); }
  });
}

function openAnomalyModal(id) {
  const a = anomalies.find(x => x.id === id); if (!a) return;
  const room = getRoom(a.roomId);
  modal(`<div class="modal-head"><div><h2>${a.urgent?'🚨 ':''}${escapeHtml(a.description)}</h2><div class="help">${escapeHtml(room?.buildingLabel || '')} • ${escapeHtml(room?.levelLabel || '')} • ${escapeHtml(a.roomName || '')}</div></div><button class="icon-btn" data-close>×</button></div>
    <div class="detail-grid"><div class="detail-item"><strong>Signalé par</strong>${escapeHtml(`${a.reporterFirstName||''} ${a.reporterLastName||''}`.trim() || 'Service Infra')}</div><div class="detail-item"><strong>Date</strong>${formatDate(a.createdAt)}</div><div class="detail-item"><strong>Catégorie</strong>${escapeHtml(a.category || 'Autre')}</div><div class="detail-item"><strong>Statut</strong>${statusBadge(a.status)}</div></div>
    <form id="update-form"><div class="form-grid">
      <div class="field"><label>Statut</label><select name="status"><option value="a_traiter" ${a.status==='a_traiter'?'selected':''}>À traiter</option><option value="en_cours" ${a.status==='en_cours'?'selected':''}>En cours</option><option value="resolu" ${a.status==='resolu'?'selected':''}>Résolu</option></select></div>
      <div class="field"><label>Catégorie</label><select name="category">${CATEGORIES.map(c=>`<option ${a.category===c?'selected':''}>${escapeHtml(c)}</option>`).join('')}</select></div>
      <div class="field full"><label>Description</label><textarea name="description" maxlength="240">${escapeHtml(a.description)}</textarea></div>
      <div class="field full"><label class="urgent-toggle"><input name="urgent" type="checkbox" ${a.urgent?'checked':''}> <span>🚨 <strong>Urgent</strong></span></label></div>
      <div class="field full"><label>Commentaire de résolution / suivi</label><textarea name="resolutionComment" placeholder="Ex. : intervention réalisée, pièce remplacée…">${escapeHtml(a.resolutionComment || '')}</textarea></div>
      <div class="field full"><label>Photo après intervention <span class="help">(facultative)</span></label><input id="resolution-photo" type="file" accept="image/*" capture="environment"></div>
    </div>
    <div class="submit-row"><button type="button" class="danger" id="delete-anomaly">Supprimer erreur</button><button class="primary" type="submit">Enregistrer</button></div></form>
    <h3 style="margin-top:20px">Historique de cette anomalie</h3><div class="history">${(a.history||[]).slice().reverse().map(h=>`<div class="history-item"><strong>${escapeHtml(h.label)}</strong><small>${formatDate(h.at)} • ${escapeHtml(h.actor||'Infra')}</small></div>`).join('') || '<div class="help">Aucun historique.</div>'}</div>`);

  $('#update-form').addEventListener('submit', async e => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const status = fd.get('status');
    const label = status !== a.status ? `Statut passé à ${status === 'a_traiter' ? 'À traiter' : status === 'en_cours' ? 'En cours' : 'Résolu'}` : 'Anomalie mise à jour';
    try {
      await updateAnomaly(id, { status, category:fd.get('category'), description:String(fd.get('description')).trim(), urgent:fd.get('urgent')==='on', resolutionComment:String(fd.get('resolutionComment')||'').trim() }, { actor:actorName, actionLabel:label, resolutionPhotoFile:$('#resolution-photo').files?.[0] || null });
      closeModal(); toast('Anomalie mise à jour.');
    } catch(err) { toast(err.message || 'Erreur'); }
  });
  $('#delete-anomaly').addEventListener('click', async () => {
    if (!confirm('Supprimer ce signalement créé par erreur ?')) return;
    try { await deleteAnomaly(id, actorName); closeModal(); toast('Signalement supprimé.'); } catch(err) { toast(err.message || 'Erreur'); }
  });
}

async function init() {
  fillCategories();
  const demo = getAppMode() === 'demo';
  els.mode.textContent = demo ? 'Mode démo' : 'Firebase actif'; els.mode.classList.toggle('demo', demo);
  els.demoNote.classList.toggle('hidden', !demo); els.firebaseFields.classList.toggle('hidden', demo);
  els.actor.value = actorName;

  if (await hasInfraSession()) openShell();

  els.loginForm.addEventListener('submit', async e => {
    e.preventDefault(); actorName = els.actor.value.trim(); if (!actorName) return toast('Indiquez votre nom / prénom.');
    sessionStorage.setItem('infra_LVN_actor', actorName);
    try { const identifier = els.email.value.trim();
    const firebaseEmail = identifier.toLowerCase() === 'infra_lvn' ? 'lolo.dalzotto@gmail.com' : identifier;
    await loginInfra(firebaseEmail, els.password.value); openShell(); } catch(err) { toast('Connexion impossible : ' + (err.message || 'identifiants invalides')); }
  });

  els.logout.addEventListener('click', async () => { await logoutInfra(); closeShell(); });
  document.querySelectorAll('[data-infra-building]').forEach(btn => btn.addEventListener('click', () => {
    selectedBuilding = btn.dataset.infraBuilding;
    document.querySelectorAll('[data-infra-building]').forEach(b => b.classList.toggle('active', b === btn));
    renderPlans();
  }));
  [els.filterStatus,els.filterCategory,els.filterBuilding].forEach(x => x.addEventListener('change', renderList));
  els.filterSearch.addEventListener('input', renderList);
  els.add.addEventListener('click', () => openCreateModal());

  if (demo) {
    window.addEventListener('keydown', e => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') { resetDemoData(); toast('Données démo réinitialisées.'); }
    });
  }
}

init();
