import { APP_MODE, firebaseConfig } from './firebase-config.js?v=20261007-0815';

const DEMO_KEY = 'infra_LVN_demo_anomalies_v1';
const DEMO_SESSION_KEY = 'infra_LVN_demo_infra_session';
const demoListeners = new Set();
let firebaseCtx = null;

function isoNow() {
  return new Date().toISOString();
}

function uid() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function seedDemoIfNeeded() {
  if (localStorage.getItem(DEMO_KEY)) return;
  const now = Date.now();
  const data = [
    {
      id: uid(), roomId: 'A-RDC-003', buildingId: 'A', levelId: 'RDC', roomName: 'Vestiaire',
      reporterFirstName: 'Jean', reporterLastName: 'Martin', description: 'Un robinet fuit au niveau du lavabo.',
      category: 'Plomberie / Sanitaire', urgent: false, status: 'a_traiter', source: 'public',
      createdAt: new Date(now - 86400000 * 2).toISOString(), updatedAt: new Date(now - 86400000 * 2).toISOString(),
      photoUrl: null, resolutionComment: '', resolutionPhotoUrl: null, resolvedAt: null,
      history: [{ type: 'creation', label: 'Anomalie signalée', at: new Date(now - 86400000 * 2).toISOString(), actor: 'Jean Martin' }]
    },
    {
      id: uid(), roomId: 'A-R1-101', buildingId: 'A', levelId: 'R1', roomName: 'Bureau 101',
      reporterFirstName: 'Sophie', reporterLastName: 'Durand', description: 'Prise électrique descellée à droite du bureau.',
      category: 'Électricité', urgent: true, status: 'en_cours', source: 'public',
      createdAt: new Date(now - 86400000).toISOString(), updatedAt: new Date(now - 3600000 * 5).toISOString(),
      photoUrl: null, resolutionComment: '', resolutionPhotoUrl: null, resolvedAt: null,
      history: [
        { type: 'creation', label: 'Anomalie signalée', at: new Date(now - 86400000).toISOString(), actor: 'Sophie Durand' },
        { type: 'status', label: 'Statut passé à En cours', at: new Date(now - 3600000 * 5).toISOString(), actor: 'Responsable Infra' }
      ]
    },
    {
      id: uid(), roomId: 'B-RDC-002', buildingId: 'B', levelId: 'RDC', roomName: 'Atelier',
      reporterFirstName: 'Marc', reporterLastName: 'Lopez', description: 'Poignée de porte cassée.',
      category: 'Menuiserie / Serrurerie', urgent: false, status: 'resolu', source: 'infra',
      createdAt: new Date(now - 86400000 * 10).toISOString(), updatedAt: new Date(now - 86400000 * 4).toISOString(),
      photoUrl: null, resolutionComment: 'Poignée remplacée.', resolutionPhotoUrl: null,
      resolvedAt: new Date(now - 86400000 * 4).toISOString(),
      history: [
        { type: 'creation', label: 'Anomalie créée', at: new Date(now - 86400000 * 10).toISOString(), actor: 'Responsable Infra' },
        { type: 'status', label: 'Statut passé à Résolu', at: new Date(now - 86400000 * 4).toISOString(), actor: 'Responsable Infra' }
      ]
    }
  ];
  localStorage.setItem(DEMO_KEY, JSON.stringify(data));
}

function getDemoData() {
  seedDemoIfNeeded();
  try { return JSON.parse(localStorage.getItem(DEMO_KEY) || '[]'); }
  catch { return []; }
}

function setDemoData(data) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(data));
  for (const cb of demoListeners) cb([...data]);
}

async function getFirebase() {
  if (firebaseCtx) return firebaseCtx;
  const [appMod, authMod, fsMod, storageMod] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js')
  ]);
  const app = appMod.initializeApp(firebaseConfig);
  firebaseCtx = {
    app,
    auth: authMod.getAuth(app),
    db: fsMod.getFirestore(app),
    storage: storageMod.getStorage(app),
    authMod,
    fsMod,
    storageMod
  };
  return firebaseCtx;
}

export function getAppMode() { return APP_MODE; }

export async function preparePublicSession() {
  if (APP_MODE === 'demo') return { demo: true };
  const { auth, authMod } = await getFirebase();
  if (!auth.currentUser) await authMod.signInAnonymously(auth);
  return auth.currentUser;
}

export async function loginInfra(email, password) {
  const { auth, authMod } = await getFirebase();
  const credential = await authMod.signInWithEmailAndPassword(auth, email, password);
  if (APP_MODE === 'demo') localStorage.setItem(DEMO_SESSION_KEY, '1');
  return credential.user;
}

export async function logoutInfra() {
  if (APP_MODE === 'demo') localStorage.removeItem(DEMO_SESSION_KEY);
  const { auth, authMod } = await getFirebase();
  await authMod.signOut(auth);
}

export async function hasInfraSession() {
  if (APP_MODE === 'demo') return localStorage.getItem(DEMO_SESSION_KEY) === '1';
  const { auth } = await getFirebase();
  await auth.authStateReady();
  return !!auth.currentUser && !auth.currentUser.isAnonymous;
}

async function uploadPhoto(file, kind = 'reports') {
  if (!file) return null;
  if (APP_MODE === 'demo') return null;
  const { auth, storage, storageMod } = await getFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error('Session Firebase absente.');
  const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const path = `${kind}/${user.uid}/${uid()}.${ext}`;
  const objectRef = storageMod.ref(storage, path);
  await storageMod.uploadBytes(objectRef, file, { contentType: file.type || 'image/jpeg' });
  return storageMod.getDownloadURL(objectRef);
}

export async function createAnomaly(payload, photoFile = null) {
  const record = {
    ...payload,
    status: payload.status || 'a_traiter',
    createdAt: isoNow(),
    updatedAt: isoNow(),
    resolvedAt: null,
    resolutionComment: '',
    resolutionPhotoUrl: null,
    history: [{
      type: 'creation',
      label: payload.source === 'infra' ? 'Anomalie créée par le service Infra' : 'Anomalie signalée',
      at: isoNow(),
      actor: payload.reporterFirstName || payload.reporterLastName
        ? `${payload.reporterFirstName || ''} ${payload.reporterLastName || ''}`.trim()
        : (payload.actor || 'infra_lvn')
    }]
  };

  if (APP_MODE === 'demo') {
    const data = getDemoData();
    const item = { id: uid(), photoUrl: null, ...record };
    data.unshift(item);
    setDemoData(data);
    return item;
  }

  await preparePublicSession();
  const photoUrl = await uploadPhoto(photoFile, 'reports');
  const { db, fsMod } = await getFirebase();
  const docRef = await fsMod.addDoc(fsMod.collection(db, 'anomalies'), {
    ...record,
    photoUrl,
    createdAt: fsMod.serverTimestamp(),
    updatedAt: fsMod.serverTimestamp()
  });
  try { await setRoomStatus(payload.roomId, true); } catch {}
  return { id: docRef.id, ...record, photoUrl };
}

export function subscribeRoomStatus(callback) {
  if (APP_MODE === 'demo') {
    callback({});
    return () => {};
  }

  let unsub = () => {};
  getFirebase().then(({ db, fsMod }) => {
    unsub = fsMod.onSnapshot(
      fsMod.collection(db, 'room_status'),
      (snap) => {
        const status = {};
        snap.docs.forEach((d) => { status[d.id] = d.data()?.active === true; });
        callback(status);
      },
      () => callback({})
    );
  });
  return () => unsub();
}

async function setRoomStatus(roomId, active) {
  if (!roomId || APP_MODE === 'demo') return;
  const { db, fsMod } = await getFirebase();
  await fsMod.setDoc(
    fsMod.doc(db, 'room_status', roomId),
    { active: !!active, updatedAt: fsMod.serverTimestamp() },
    { merge: true }
  );
}

export async function syncRoomStatuses(rows = []) {
  if (APP_MODE === 'demo') return;
  const state = new Map();
  for (const item of rows) {
    if (!item?.roomId) continue;
    const active = item.status !== 'resolu';
    state.set(item.roomId, (state.get(item.roomId) || false) || active);
  }
  for (const [roomId, active] of state.entries()) {
    try { await setRoomStatus(roomId, active); } catch {}
  }
}

export function subscribeAnomalies(callback) {
  if (APP_MODE === 'demo') {
    const wrapped = (data) => callback(data);
    demoListeners.add(wrapped);
    callback(getDemoData());
    const onStorage = (e) => { if (e.key === DEMO_KEY) callback(getDemoData()); };
    window.addEventListener('storage', onStorage);
    return () => { demoListeners.delete(wrapped); window.removeEventListener('storage', onStorage); };
  }

  let unsub = () => {};
  getFirebase().then(({ db, fsMod }) => {
    const q = fsMod.query(fsMod.collection(db, 'anomalies'), fsMod.orderBy('createdAt', 'desc'));
    unsub = fsMod.onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => {
        const v = d.data();
        return {
          id: d.id,
          ...v,
          createdAt: v.createdAt?.toDate ? v.createdAt.toDate().toISOString() : v.createdAt,
          updatedAt: v.updatedAt?.toDate ? v.updatedAt.toDate().toISOString() : v.updatedAt,
          resolvedAt: v.resolvedAt?.toDate ? v.resolvedAt.toDate().toISOString() : v.resolvedAt
        };
      });
      callback(rows);
    });
  });
  return () => unsub();
}

export async function updateAnomaly(id, patch, { actor = 'infra_lvn', actionLabel = 'Anomalie modifiée', resolutionPhotoFile = null, roomId = null, roomActive = null } = {}) {
  const at = isoNow();
  const historyEvent = { type: patch.status ? 'status' : 'update', label: actionLabel, at, actor };

  if (APP_MODE === 'demo') {
    const data = getDemoData();
    const index = data.findIndex((x) => x.id === id);
    if (index < 0) throw new Error('Anomalie introuvable.');
    const current = data[index];
    data[index] = {
      ...current,
      ...patch,
      updatedAt: at,
      resolvedAt: patch.status === 'resolu' ? at : (patch.status && patch.status !== 'resolu' ? null : current.resolvedAt),
      history: [...(current.history || []), historyEvent]
    };
    setDemoData(data);
    return data[index];
  }

  const { db, fsMod } = await getFirebase();
  const finalPatch = { ...patch, updatedAt: fsMod.serverTimestamp(), history: fsMod.arrayUnion(historyEvent) };
  if (resolutionPhotoFile) finalPatch.resolutionPhotoUrl = await uploadPhoto(resolutionPhotoFile, 'resolutions');
  if (patch.status === 'resolu') finalPatch.resolvedAt = fsMod.serverTimestamp();
  if (patch.status && patch.status !== 'resolu') finalPatch.resolvedAt = null;
  await fsMod.updateDoc(fsMod.doc(db, 'anomalies', id), finalPatch);
  if (roomId && typeof roomActive === 'boolean') { try { await setRoomStatus(roomId, roomActive); } catch {} }
}

export async function deleteAnomaly(id, actor = 'infra_lvn', { roomId = null, roomActive = null } = {}) {
  if (APP_MODE === 'demo') {
    setDemoData(getDemoData().filter((x) => x.id !== id));
    return;
  }
  const { db, fsMod } = await getFirebase();
  // Suppression réservée aux erreurs manifestes. En production, préférer un archivage logique.
  await fsMod.deleteDoc(fsMod.doc(db, 'anomalies', id));
  if (roomId && typeof roomActive === 'boolean') { try { await setRoomStatus(roomId, roomActive); } catch {} }
}

export function resetDemoData() {
  localStorage.removeItem(DEMO_KEY);
  seedDemoIfNeeded();
  setDemoData(getDemoData());
}
