import { PLAN_CONFIG, CATEGORIES, allRooms, getRoom } from './data.js?v=20261007-planviz-1';
import { renderPlan, statusBadge, formatDate, escapeHtml } from './ui.js?v=20261007-planviz-1';
import {
  getAppMode, hasInfraSession, loginInfra, logoutInfra, getCurrentInfraUser, subscribeCurrentInfraProfile,
  sendInfraPasswordReset, changeInfraPassword, listInfraUsers, createInfraUser,
  setInfraUserActive,
  subscribeAnomalies, syncRoomStatuses, updateAnomaly, createAnomaly, deleteAnomaly, resetDemoData
} from './store.js?v=20261007-planviz-1';

// Alias d’affichage uniquement. Comparaison : trim, puis toLowerCase()
// (« Infra_LVN » et « infra_lvn » sont acceptés). Toute autre valeur est refusée
// sans appel Firebase. Le mot de passe saisi est transmis tel quel.
// L’adresse du compte n’est jamais affichée.
const INFRA_OPERATOR = 'infra_lvn';
const INFRA_AUTH_EMAIL = 'lolo.dalzotto@gmail.com';
const LOGIN_ERROR = 'Identifiant ou mot de passe incorrect.';

let anomalies = [];
let unsubscribe = null;
let profileUnsubscribe = null;
let currentUser = null;

const $ = (s) => document.querySelector(s);
const els = {
  loginWrap: $('#login-wrap'), shell: $('#infra-shell'), loginForm: $('#login-form'), logout: $('#logout-btn'),
  username: $('#username'), password: $('#password'), loginError: $('#login-error'),
  forgotPassword: $('#forgot-password-btn'), changePassword: $('#change-password-btn'),
  manageUsers: $('#manage-users-btn'), currentUser: $('#current-user'),
  list: $('#anomaly-list'), listCount: $('#list-count'),
  total: $('#kpi-total'), open: $('#kpi-open'), progress: $('#kpi-progress'), resolved: $('#kpi-resolved'), bar: $('#kpi-bar'), percent: $('#kpi-percent'),
  filterStatus: $('#filter-status'), filterCategory: $('#filter-category'), filterBuilding: $('#filter-building'), filterSearch: $('#filter-search'),
  planBuilding: $('#plan-building'), planLevel: $('#plan-level'), planZone: $('#plan-zone'), planZoneField: $('#plan-zone-field'),
  selectedPlan: $('#selected-plan'), planTitle: $('#plan-title'), planAnomalyCount: $('#plan-anomaly-count'),
  urgentPanel: $('#urgent-panel'), urgentList: $('#urgent-list'), urgentCount: $('#urgent-count'),
  modalRoot: $('#modal-root')
};

function toast(message) {
  const node = document.createElement('div'); node.className = 'toast'; node.textContent = message; document.body.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

async function openShell(profile = null) {
  currentUser = profile || await getCurrentInfraUser();
  if (!currentUser?.authorized) throw new Error('Compte non autorisé.');
  els.loginWrap.classList.add('hidden');
  els.shell.classList.add('active');
  els.logout.classList.remove('hidden');
  els.currentUser.textContent = currentUser.isAdmin ? 'Session administrateur' : `${currentUser.fullName} • Service Infrastructure`;
  els.manageUsers.classList.toggle('hidden', !currentUser.isAdmin || currentUser.migrationPending === true);
  document.querySelectorAll('.admin-overview').forEach(node => node.classList.toggle('hidden', !currentUser.isAdmin));
  if (!unsubscribe) unsubscribe = subscribeAnomalies((rows) => { anomalies = rows; renderAll(); syncRoomStatuses(rows).catch(() => {}); });
  if (!profileUnsubscribe) {
    profileUnsubscribe = subscribeCurrentInfraProfile(async (profile) => {
      if (profile?.authorized || !currentUser) return;
      toast('Votre accès Infrastructure a été révoqué.');
      try { await logoutInfra(); } catch {}
      closeShell();
    });
  }
}

function closeShell() {
  currentUser = null;
  els.loginWrap.classList.remove('hidden'); els.shell.classList.remove('active'); els.logout.classList.add('hidden');
  els.manageUsers.classList.add('hidden'); els.currentUser.textContent = '';
  unsubscribe?.(); unsubscribe = null;
  profileUnsubscribe?.(); profileUnsubscribe = null;
}

function fillCategories() {
  els.filterCategory.innerHTML = '<option value="all">Toutes les catégories</option>' + CATEGORIES.map(c => `<option>${escapeHtml(c)}</option>`).join('');
}

function renderKpis(rows = filteredAnomalies()) {
  const total = rows.length;
  const open = rows.filter(a => a.status === 'a_traiter').length;
  const progress = rows.filter(a => a.status === 'en_cours').length;
  const resolved = rows.filter(a => a.status === 'resolu').length;
  const pct = total ? Math.round((resolved / total) * 100) : 0;
  els.total.textContent = total; els.open.textContent = open; els.progress.textContent = progress; els.resolved.textContent = resolved;
  els.bar.style.width = `${pct}%`; els.percent.textContent = `${pct} % résolu`;
}

function filteredAnomalies() {
  const status = els.filterStatus.value, category = els.filterCategory.value, building = els.filterBuilding.value, q = els.filterSearch.value.trim().toLowerCase();
  return anomalies.filter(a => {
    if (status === 'active' && a.status === 'resolu') return false;
    if (!['all','active'].includes(status) && a.status !== status) return false;
    if (category !== 'all' && a.category !== category) return false;
    if (building !== 'all' && a.buildingId !== building) return false;
    if (q && !`${a.description} ${a.roomName} ${a.reporterFirstName} ${a.reporterLastName} ${a.category}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function anomalyAgeDays(value) {
  if (!value) return 0;
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function renderPriorityPanels(rows) {
  const urgentRows = rows
    .filter(a => a.status !== 'resolu' && a.urgent)
    .slice()
    .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

  els.urgentPanel.classList.toggle('hidden', urgentRows.length === 0);
  els.urgentCount.textContent = urgentRows.length;
  els.urgentList.innerHTML = urgentRows.length ? urgentRows.slice(0,5).map(a => {
    const room = getRoom(a.roomId);
    const age = anomalyAgeDays(a.createdAt);
    return `<button class="priority-item" type="button" data-priority-id="${escapeHtml(a.id)}">
      <span class="priority-main"><strong>🚨 ${escapeHtml(a.description)}</strong><small>${escapeHtml(room?.levelLabel || a.levelId || '')} · ${escapeHtml(a.roomName || room?.name || '')}</small></span>
      <span class="priority-age">${age} j</span>
    </button>`;
  }).join('') : '<div class="priority-empty">Aucune urgence active.</div>';

  els.urgentList.querySelectorAll('[data-priority-id]').forEach(button => {
    button.addEventListener('click', () => openAnomalyModal(button.dataset.priorityId));
  });
}

function planOptionLabelLevel(levelId, level) {
  if (levelId === 'RDC') return 'Rez-de-chaussée';
  return level?.label || levelId;
}

function fillPlanBuildingOptions() {
  const entries = Object.entries(PLAN_CONFIG);
  els.planBuilding.innerHTML = entries.map(([id, building]) =>
    `<option value="${escapeHtml(id)}">${escapeHtml(building.label)}</option>`
  ).join('');
  refreshPlanLevelOptions();
}

function refreshPlanLevelOptions() {
  const buildingId = els.planBuilding.value || Object.keys(PLAN_CONFIG)[0];
  const levels = PLAN_CONFIG[buildingId]?.levels || {};
  const previous = els.planLevel.value;
  els.planLevel.innerHTML = Object.entries(levels).map(([levelId, level]) =>
    `<option value="${escapeHtml(levelId)}">${escapeHtml(planOptionLabelLevel(levelId, level))}</option>`
  ).join('');
  if (previous && levels[previous]) els.planLevel.value = previous;
  refreshPlanZoneOptions();
}

function refreshPlanZoneOptions() {
  const buildingId = els.planBuilding.value;
  const levelId = els.planLevel.value;
  const zones = PLAN_CONFIG[buildingId]?.levels?.[levelId]?.zones || {};
  const previous = els.planZone.value;
  const zoneEntries = Object.entries(zones);

  els.planZone.innerHTML = zoneEntries.map(([zoneId, zone]) =>
    `<option value="${escapeHtml(zoneId)}">${escapeHtml(zone.label)}</option>`
  ).join('');

  if (previous && zones[previous]) els.planZone.value = previous;
  els.planZoneField.classList.toggle('hidden', zoneEntries.length <= 1);
  renderPlanVisualizer();
}

function renderPlanVisualizer() {
  const buildingId = els.planBuilding.value;
  const levelId = els.planLevel.value;
  const zoneId = els.planZone.value;
  const building = PLAN_CONFIG[buildingId];
  const level = building?.levels?.[levelId];
  const zone = level?.zones?.[zoneId] || Object.values(level?.zones || {})[0];
  if (!building || !level || !zone) {
    els.selectedPlan.replaceChildren();
    els.planTitle.textContent = '';
    els.planAnomalyCount.textContent = '';
    return;
  }

  const roomIds = new Set((zone.rooms || []).map(room => room.id));
  const planRows = anomalies.filter(a => roomIds.has(a.roomId));

  els.planTitle.textContent = [building.label, planOptionLabelLevel(levelId, level), zone.label].filter(Boolean).join(' • ');
  els.planAnomalyCount.textContent = `${planRows.length} anomalie${planRows.length > 1 ? 's' : ''} sur ce plan`;

  // Même fenêtre d'affichage que sur le formulaire Agent :
  // le ratio suit directement le viewBox du plan sélectionné.
  const vb = zone.viewBox || { width: 100, height: 100 };
  const vectorPlanActive = String(zone.planImage || '').includes('.svg');
  els.selectedPlan.style.aspectRatio = `${vb.width} / ${vb.height}`;
  els.selectedPlan.style.minHeight = '0';
  els.selectedPlan.classList.toggle('plan-vector-transparent', vectorPlanActive);

  renderPlan(els.selectedPlan, buildingId, levelId, {
    zoneId: Object.entries(level.zones).find(([, value]) => value === zone)?.[0] || zoneId,
    mode: 'infra',
    anomalies: planRows,
    statusColors: true,
    onRoomClick: (room) => openPlanRoom(room.id)
  });
}

function openPlanRoom(roomId) {
  const room = getRoom(roomId);
  const rows = anomalies.filter(a => a.roomId === roomId);
  if (!rows.length) {
    toast('Aucune anomalie pour cette pièce.');
    return;
  }
  if (rows.length === 1) {
    openAnomalyModal(rows[0].id);
    return;
  }

  modal(`<div class="modal-head"><div><h2>${escapeHtml(room?.name || 'Pièce')}</h2><div class="help">${rows.length} anomalies sur cette pièce</div></div><button class="icon-btn" data-close>×</button></div>
    <div class="room-popup-list">${rows.map(a => `<article class="anomaly-card ${a.urgent ? 'urgent' : ''}">
      <div class="anomaly-top"><strong>${a.urgent ? '🚨 ' : ''}${escapeHtml(a.description)}</strong>${statusBadge(a.status)}</div>
      <div class="anomaly-meta"><span>${escapeHtml(a.category || 'Autre')}</span><span>${formatDate(a.createdAt)}</span></div>
      <div class="submit-row" style="margin-top:8px"><button type="button" class="secondary plan-open-anomaly" data-id="${escapeHtml(a.id)}">Ouvrir</button></div>
    </article>`).join('')}</div>`);

  els.modalRoot.querySelectorAll('.plan-open-anomaly').forEach(button => {
    button.addEventListener('click', () => openAnomalyModal(button.dataset.id));
  });
}

function renderList(rows = filteredAnomalies()) {
  els.listCount.textContent = `(${rows.length})`;
  if (!rows.length) { els.list.innerHTML = '<div class="empty">Aucune anomalie pour ces filtres.</div>'; return; }
  els.list.innerHTML = rows.map(a => {
    const room = getRoom(a.roomId);
    const age = anomalyAgeDays(a.createdAt);
    const ageBadge = a.status !== 'resolu' && age >= 3
      ? `<span class="age-badge ${age >= 7 ? 'late' : 'watch'}">${age} j</span>`
      : '';
    return `<article class="anomaly-card ${a.urgent ? 'urgent' : ''}" data-anomaly-id="${escapeHtml(a.id)}">
      <div class="anomaly-top"><div><div class="anomaly-title">${a.urgent ? '🚨 ' : ''}${escapeHtml(a.description)}</div><div class="anomaly-meta"><span>${escapeHtml(room?.buildingLabel || a.buildingId || '')}</span><span>${escapeHtml(room?.levelLabel || a.levelId || '')}</span><span>${escapeHtml(a.roomName || room?.name || '')}</span><span>${escapeHtml(a.category || 'Autre')}</span>${ageBadge}</div></div>${statusBadge(a.status)}</div>
      <div class="anomaly-actions"><span class="help">${formatDate(a.createdAt)} • ${escapeHtml(`${a.reporterFirstName || ''} ${a.reporterLastName || ''}`.trim() || 'Infra')}</span><button class="secondary view-anomaly" type="button">Ouvrir</button></div>
    </article>`;
  }).join('');
  els.list.querySelectorAll('.view-anomaly').forEach(btn => btn.addEventListener('click', () => openAnomalyModal(btn.closest('[data-anomaly-id]').dataset.anomalyId)));
}

function renderAll() {
  const rows = filteredAnomalies();
  renderKpis(rows);
  if (currentUser?.isAdmin) {
    renderPriorityPanels(rows);
    renderPlanVisualizer();
  }
  renderList(rows);
}

function modal(content) {
  els.modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal">${content}</section></div>`;
  const backdrop = els.modalRoot.querySelector('.modal-backdrop');
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  els.modalRoot.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
}
function closeModal() { els.modalRoot.innerHTML = ''; }

function openOverviewRoom(roomId) {
  const room = getRoom(roomId);
  const rows = filteredAnomalies().filter(a => a.roomId === roomId);
  if (!rows.length) {
    toast('Aucune anomalie correspondant aux filtres pour cette pièce.');
    return;
  }
  if (rows.length === 1) {
    openAnomalyModal(rows[0].id);
    return;
  }

  modal(`<div class="modal-head"><div><h2>${escapeHtml(room?.name || 'Pièce')}</h2><div class="help">${rows.length} anomalies correspondant aux filtres</div></div><button class="icon-btn" data-close>×</button></div>
    <div class="room-popup-list">${rows.map(a => `<article class="anomaly-card ${a.urgent ? 'urgent' : ''}">
      <div class="anomaly-top"><strong>${a.urgent ? '🚨 ' : ''}${escapeHtml(a.description)}</strong>${statusBadge(a.status)}</div>
      <div class="anomaly-meta"><span>${escapeHtml(a.category || 'Autre')}</span><span>${formatDate(a.createdAt)}</span></div>
      <div class="submit-row" style="margin-top:8px"><button type="button" class="secondary overview-open" data-id="${escapeHtml(a.id)}">Ouvrir</button></div>
    </article>`).join('')}</div>`);

  els.modalRoot.querySelectorAll('.overview-open').forEach(button => {
    button.addEventListener('click', () => openAnomalyModal(button.dataset.id));
  });
}

function resolveLoginEmail(value) {
  const raw = String(value || '').trim().toLowerCase();
  if ([INFRA_OPERATOR, 'infra-lvn'].includes(raw)) return INFRA_AUTH_EMAIL;
  return raw.includes('@') ? raw : '';
}

function statusLabel(status) {
  return status === 'a_traiter' ? 'À traiter' : status === 'en_cours' ? 'En cours' : status === 'resolu' ? 'Résolu' : status;
}

function buildActionLabel(anomaly, formData, nextStatus) {
  const changes = [];
  if (nextStatus !== anomaly.status) changes.push(`Statut : ${statusLabel(anomaly.status)} → ${statusLabel(nextStatus)}`);
  if (String(formData.get('category') || '') !== String(anomaly.category || '')) changes.push('Catégorie modifiée');
  if (String(formData.get('description') || '').trim() !== String(anomaly.description || '').trim()) changes.push('Description modifiée');
  if ((formData.get('urgent') === 'on') !== !!anomaly.urgent) changes.push('Niveau d’urgence modifié');
  if (String(formData.get('resolutionComment') || '').trim() !== String(anomaly.resolutionComment || '').trim()) changes.push('Commentaire de suivi modifié');
  return changes.length ? changes.join(' • ') : 'Anomalie enregistrée sans changement';
}

function openForgotPasswordModal() {
  const initial = els.username.value.trim();
  modal(`<div class="modal-head"><div><h2>Mot de passe oublié</h2><div class="help">Un lien de réinitialisation sera envoyé à l’adresse e-mail du compte.</div></div><button class="icon-btn" data-close>×</button></div>
    <form id="forgot-form"><div class="form-grid"><div class="field full"><label>Adresse e-mail *</label><input name="login" type="text" autocomplete="username" required value="${escapeHtml(initial)}" placeholder="votre adresse e-mail"></div></div>
    <div class="submit-row"><button type="button" class="secondary" data-close>Annuler</button><button class="primary" type="submit">Envoyer le lien</button></div></form>`);
  $('#forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = resolveLoginEmail(fd.get('login'));
    if (!email) { toast('Saisissez votre adresse e-mail.'); return; }
    const button = e.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await sendInfraPasswordReset(email);
      closeModal();
      toast('Si ce compte existe, un e-mail de réinitialisation a été envoyé.');
    } catch {
      closeModal();
      toast('Si ce compte existe, un e-mail de réinitialisation a été envoyé.');
    }
  });
}

function openChangePasswordModal() {
  modal(`<div class="modal-head"><div><h2>Modifier mon mot de passe</h2><div class="help">${escapeHtml(currentUser?.isAdmin ? 'Session administrateur' : (currentUser?.fullName || ''))}</div></div><button class="icon-btn" data-close>×</button></div>
    <form id="password-form"><div class="form-grid">
      <div class="field full"><label>Mot de passe actuel *</label><input name="currentPassword" type="password" autocomplete="current-password" required></div>
      <div class="field full"><label>Nouveau mot de passe *</label><input name="newPassword" type="password" autocomplete="new-password" minlength="8" required></div>
      <div class="field full"><label>Confirmer le nouveau mot de passe *</label><input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required></div>
    </div><div class="submit-row"><button type="button" class="secondary" data-close>Annuler</button><button class="primary" type="submit">Modifier</button></div></form>`);
  $('#password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const currentPassword = String(fd.get('currentPassword') || '');
    const newPassword = String(fd.get('newPassword') || '');
    const confirmPassword = String(fd.get('confirmPassword') || '');
    if (newPassword.length < 8) { toast('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return; }
    if (newPassword !== confirmPassword) { toast('Les deux nouveaux mots de passe ne correspondent pas.'); return; }
    const button = e.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await changeInfraPassword(currentPassword, newPassword);
      closeModal();
      toast('Mot de passe modifié.');
    } catch {
      button.disabled = false;
      toast('Mot de passe actuel incorrect ou modification impossible.');
    }
  });
}

async function openUsersModal() {
  if (!currentUser?.isAdmin) return;
  try {
    const users = await listInfraUsers();
    modal(`<div class="modal-head"><div><h2>Gestion des accès</h2><div class="help">Comptes du service Infrastructure. Une révocation coupe immédiatement l’accès aux données Infra.</div></div><button class="icon-btn" data-close>×</button></div>
      <div class="account-list">${users.map((u) => `<article class="account-card">
        <div class="account-main">
          <div class="account-name">${u.role === 'admin' ? 'Session administrateur' : escapeHtml(u.fullName || 'Utilisateur')}</div>
          <div class="account-email">${u.role === 'admin' ? '' : escapeHtml(u.email || '')}</div>
          <div class="account-meta"><span class="account-role">${u.role === 'admin' ? 'Administrateur' : 'Infrastructure'}</span><span class="account-state ${u.active ? '' : 'revoked'}">${u.active ? 'Actif' : 'Accès révoqué'}</span></div>
        </div>
        <div class="account-actions">
          ${u.role === 'admin' ? '' : `<button class="${u.active ? 'danger' : 'secondary'} account-toggle" type="button" data-id="${escapeHtml(u.uid)}" data-active="${u.active ? '1' : '0'}">${u.active ? 'Révoquer l’accès' : 'Réactiver'}</button>`}
        </div>
      </article>`).join('')}</div>
      <form id="create-user-form" class="account-create">
        <h3>Ajouter un membre Infrastructure</h3>
        <div class="form-grid">
          <div class="field"><label>Prénom *</label><input name="firstName" required maxlength="60" autocomplete="off"></div>
          <div class="field"><label>Nom *</label><input name="lastName" required maxlength="60" autocomplete="off"></div>
          <div class="field full"><label>Adresse e-mail *</label><input name="email" type="email" required maxlength="160" autocomplete="off"></div>
          <div class="field full"><label>Mot de passe initial *</label><input name="initialPassword" type="password" required minlength="8" autocomplete="new-password"></div>
        </div>
        <div class="help">Le compte est créé avec ce mot de passe initial. Ensuite, l’utilisateur peut modifier son mot de passe ou utiliser « Mot de passe oublié ? » avec son adresse e-mail.</div>
        <div class="submit-row"><button class="primary" type="submit">Créer le compte</button></div>
      </form>`);

    els.modalRoot.querySelectorAll('.account-toggle').forEach((button) => button.addEventListener('click', async () => {
      const activate = button.dataset.active !== '1';
      button.disabled = true;
      try {
        await setInfraUserActive(button.dataset.id, activate);
        toast(activate ? 'Accès réactivé.' : 'Accès révoqué.');
        closeModal();
        await openUsersModal();
      } catch (err) {
        button.disabled = false;
        toast(err.message || 'Modification impossible.');
      }
    }));

    $('#create-user-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const button = e.currentTarget.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        const created = await createInfraUser({
          firstName: String(fd.get('firstName') || '').trim(),
          lastName: String(fd.get('lastName') || '').trim(),
          email: String(fd.get('email') || '').trim(),
          initialPassword: String(fd.get('initialPassword') || '')
        });
        toast(`Compte de ${created.fullName} créé avec son mot de passe initial.`);
        closeModal();
        await openUsersModal();
      } catch (err) {
        button.disabled = false;
        const message = err?.code === 'auth/email-already-in-use' ? 'Cette adresse e-mail possède déjà un compte.' : (err.message || 'Création impossible.');
        toast(message);
      }
    });
  } catch (err) {
    toast(err.message || 'Impossible de charger les comptes.');
  }
}

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
      <div class="field full"><label>Catégorie *</label><select name="category" required><option value="">Sélectionner une catégorie</option>${CATEGORIES.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select></div>
      <div class="field full"><label>Description *</label><textarea name="description" maxlength="240" required placeholder="Décrivez brièvement le problème"></textarea></div>
      <div class="field full"><label>Photo</label><input id="infra-create-photo" type="file" accept="image/*" capture="environment"></div>
      <div class="field full"><label class="urgent-toggle"><input name="urgent" type="checkbox"> <span>🚨 <strong>Urgent</strong></span></label></div>
    </div><div class="submit-row"><button type="button" class="secondary" data-close>Annuler</button><button class="primary" type="submit">Créer</button></div></form>`);
  $('#create-form').addEventListener('submit', async e => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const room = getRoom(fd.get('roomId')); const description = String(fd.get('description')).trim(); const category = String(fd.get('category') || '');
    if (!room || !description || !CATEGORIES.includes(category)) return;
    try {
      await createAnomaly({ roomId:room.id, roomName:room.name, buildingId:room.buildingId, levelId:room.levelId, reporterFirstName:'', reporterLastName:'', actor:currentUser?.fullName || 'Service Infra', description, category, urgent:fd.get('urgent')==='on', source:'infra' }, $('#infra-create-photo').files?.[0] || null);
      closeModal(); toast('Anomalie créée.');
    } catch(err) { toast(err.message || 'Erreur'); }
  });
}

function openAnomalyModal(id) {
  const a = anomalies.find(x => x.id === id); if (!a) return;
  const room = getRoom(a.roomId);
  const level = room ? PLAN_CONFIG[room.buildingId]?.levels?.[room.levelId] : null;
  modal(`<div class="modal-head"><div><h2>${a.urgent?'🚨 ':''}${escapeHtml(a.description)}</h2><div class="help">${escapeHtml(room?.buildingLabel || '')} • ${escapeHtml(room?.levelLabel || '')}${room?.zoneLabel ? ' • ' + escapeHtml(room.zoneLabel) : ''} • ${escapeHtml(a.roomName || '')}</div></div><button class="icon-btn" data-close>×</button></div>
    ${room && level ? '<div class="incident-room-zoom-wrap"><div class="incident-room-zoom-title">Pièce concernée</div><div id="incident-room-zoom" class="incident-room-zoom"></div></div>' : ''}
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

  if (room && level) {
    const zoom = $('#incident-room-zoom');
    renderPlan(zoom, room.buildingId, room.levelId, {
      zoneId: room.zoneId,
      mode: 'infra',
      anomalies: [a],
      selectedRoomId: room.id,
      onRoomClick: () => {}
    });
    const svg = zoom?.querySelector('svg');
    if (svg) {
      const zone = level?.zones?.[room.zoneId];
      const vb = zone?.viewBox || { width: 100, height: 100 };
      const scaleY = zone?.coordinateScaleY || 1;
      const roomY = room.y * scaleY;
      const roomH = room.h * scaleY;
      const padX = Math.max(2.5, room.w * 0.28);
      const padY = Math.max(2.5, roomH * 0.28);
      const x = Math.max(0, room.x - padX);
      const y = Math.max(0, roomY - padY);
      const w = Math.min(vb.width - x, room.w + padX * 2);
      const h = Math.min(vb.height - y, roomH + padY * 2);
      svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }
  }

  $('#update-form').addEventListener('submit', async e => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const status = fd.get('status');
    const label = buildActionLabel(a, fd, status);
    const roomActive = status !== 'resolu' || anomalies.some(x => x.id !== id && x.roomId === a.roomId && x.status !== 'resolu');
    try {
      await updateAnomaly(id, { status, category:fd.get('category'), description:String(fd.get('description')).trim(), urgent:fd.get('urgent')==='on', resolutionComment:String(fd.get('resolutionComment')||'').trim() }, { actor:currentUser?.fullName || 'Service Infra', actionLabel:label, resolutionPhotoFile:$('#resolution-photo').files?.[0] || null, roomId:a.roomId, roomActive });
      closeModal(); toast('Anomalie mise à jour.');
    } catch(err) { toast(err.message || 'Erreur'); }
  });
  $('#delete-anomaly').addEventListener('click', async () => {
    if (!confirm('Supprimer ce signalement créé par erreur ?')) return;
    const roomActive = anomalies.some(x => x.id !== id && x.roomId === a.roomId && x.status !== 'resolu');
    try { await deleteAnomaly(id, currentUser?.fullName || 'Service Infra', { roomId:a.roomId, roomActive }); closeModal(); toast('Signalement supprimé.'); } catch(err) { toast(err.message || 'Erreur'); }
  });
}

async function init() {
  fillCategories();
  fillPlanBuildingOptions();
  const demo = getAppMode() === 'demo';

  els.loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    els.loginError.textContent = '';
    els.loginError.classList.add('hidden');
    const email = resolveLoginEmail(els.username.value);
    if (!email) {
      els.loginError.textContent = LOGIN_ERROR;
      els.loginError.classList.remove('hidden');
      return;
    }
    const submitBtn = els.loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      const { profile } = await loginInfra(email, els.password.value);
      await openShell(profile);
    } catch {
      els.loginError.textContent = LOGIN_ERROR;
      els.loginError.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
    }
  });

  try {
    if (await hasInfraSession()) await openShell(await getCurrentInfraUser());
  } catch {
    // Le formulaire reste disponible si le contrôle de session échoue.
  }

  els.forgotPassword.addEventListener('click', openForgotPasswordModal);
  els.changePassword.addEventListener('click', openChangePasswordModal);
  els.manageUsers.addEventListener('click', openUsersModal);
  els.logout.addEventListener('click', async () => { await logoutInfra(); closeShell(); });
  [els.filterStatus,els.filterCategory,els.filterBuilding].forEach(x => x.addEventListener('change', renderAll));
  els.filterSearch.addEventListener('input', renderAll);
  els.planBuilding.addEventListener('change', refreshPlanLevelOptions);
  els.planLevel.addEventListener('change', refreshPlanZoneOptions);
  els.planZone.addEventListener('change', renderPlanVisualizer);

  if (demo) {
    window.addEventListener('keydown', e => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') { resetDemoData(); toast('Données démo réinitialisées.'); }
    });
  }
}

init();
