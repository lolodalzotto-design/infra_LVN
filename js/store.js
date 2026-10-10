import { APP_MODE, firebaseConfig } from './firebase-config.js?v=20261007-1045';

const DEMO_KEY = 'infra_LVN_demo_anomalies_v1';
const DEMO_SESSION_KEY = 'infra_LVN_demo_infra_session';
const ADMIN_AUTH_EMAIL = 'lolo.dalzotto@gmail.com';
const ADMIN_BOOTSTRAP_PROFILE = {
  firstName: 'Laurent',
  lastName: 'Dal Zotto',
  email: ADMIN_AUTH_EMAIL,
  role: 'admin',
  active: true
};
const demoListeners = new Set();
let firebaseCtx = null;

function isoNow() {
  return new Date().toISOString();
}

function uid() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function fullName(profile = {}) {
  return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
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
        { type: 'status', label: 'Statut passé de À traiter à En cours', at: new Date(now - 3600000 * 5).toISOString(), actor: 'Laurent Dal Zotto' }
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
        { type: 'creation', label: 'Anomalie créée par le service Infra', at: new Date(now - 86400000 * 10).toISOString(), actor: 'Laurent Dal Zotto' },
        { type: 'status', label: 'Statut passé de En cours à Résolu', at: new Date(now - 86400000 * 4).toISOString(), actor: 'Laurent Dal Zotto' }
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
    appMod,
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

export async function getCurrentInfraUser({ bootstrapAdmin = true } = {}) {
  if (APP_MODE === 'demo') {
    return {
      uid: 'demo-admin',
      ...ADMIN_BOOTSTRAP_PROFILE,
      fullName: fullName(ADMIN_BOOTSTRAP_PROFILE),
      isAdmin: true,
      authorized: true
    };
  }

  const { auth, db, fsMod } = await getFirebase();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || user.isAnonymous) return null;

  const profileRef = fsMod.doc(db, 'users', user.uid);
  const isBootstrapAdmin = normalizeEmail(user.email) === ADMIN_AUTH_EMAIL;
  let snap;
  try {
    snap = await fsMod.getDoc(profileRef);
  } catch (error) {
    // Compatibilité pendant la migration : les anciennes règles ne connaissent
    // pas encore /users. Le compte admin historique reste donc utilisable.
    if (isBootstrapAdmin) {
      return {
        uid: user.uid,
        ...ADMIN_BOOTSTRAP_PROFILE,
        fullName: fullName(ADMIN_BOOTSTRAP_PROFILE),
        isAdmin: true,
        authorized: true,
        migrationPending: true
      };
    }
    throw error;
  }

  if (!snap.exists() && bootstrapAdmin && isBootstrapAdmin) {
    const now = fsMod.serverTimestamp();
    await fsMod.setDoc(profileRef, {
      ...ADMIN_BOOTSTRAP_PROFILE,
      createdAt: now,
      updatedAt: now,
      createdByUid: user.uid
    });
    snap = await fsMod.getDoc(profileRef);
  }

  if (!snap.exists()) {
    return {
      uid: user.uid,
      email: normalizeEmail(user.email),
      active: false,
      role: null,
      fullName: user.displayName || normalizeEmail(user.email),
      isAdmin: false,
      authorized: false
    };
  }

  const profile = snap.data();
  const authorized = profile.active === true && ['admin', 'infra'].includes(profile.role);
  return {
    uid: user.uid,
    ...profile,
    email: normalizeEmail(profile.email || user.email),
    fullName: fullName(profile) || user.displayName || normalizeEmail(user.email),
    isAdmin: authorized && profile.role === 'admin',
    authorized
  };
}

export async function loginInfra(email, password) {
  const { auth, authMod } = await getFirebase();
  const credential = await authMod.signInWithEmailAndPassword(auth, normalizeEmail(email), password);
  const profile = await getCurrentInfraUser();
  if (!profile?.authorized) {
    await authMod.signOut(auth);
    const error = new Error('Compte non autorisé ou accès révoqué.');
    error.code = 'infra/not-authorized';
    throw error;
  }
  if (APP_MODE === 'demo') localStorage.setItem(DEMO_SESSION_KEY, '1');
  return { user: credential.user, profile };
}

export async function logoutInfra() {
  if (APP_MODE === 'demo') localStorage.removeItem(DEMO_SESSION_KEY);
  const { auth, authMod } = await getFirebase();
  await authMod.signOut(auth);
}

export async function hasInfraSession() {
  if (APP_MODE === 'demo') return localStorage.getItem(DEMO_SESSION_KEY) === '1';
  const profile = await getCurrentInfraUser();
  return !!profile?.authorized;
}

export function subscribeCurrentInfraProfile(callback) {
  if (APP_MODE === 'demo') {
    callback({ ...ADMIN_BOOTSTRAP_PROFILE, fullName: fullName(ADMIN_BOOTSTRAP_PROFILE), authorized: true });
    return () => {};
  }

  let unsubscribe = () => {};
  getFirebase().then(async ({ auth, db, fsMod }) => {
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      callback(null);
      return;
    }
    unsubscribe = fsMod.onSnapshot(
      fsMod.doc(db, 'users', user.uid),
      (snap) => {
        if (!snap.exists()) { callback(null); return; }
        const profile = snap.data();
        const authorized = profile.active === true && ['admin', 'infra'].includes(profile.role);
        callback({
          uid: user.uid,
          ...profile,
          fullName: fullName(profile) || user.displayName || normalizeEmail(user.email),
          isAdmin: authorized && profile.role === 'admin',
          authorized
        });
      },
      () => {
        if (normalizeEmail(user.email) === ADMIN_AUTH_EMAIL) {
          callback({
            uid: user.uid,
            ...ADMIN_BOOTSTRAP_PROFILE,
            fullName: fullName(ADMIN_BOOTSTRAP_PROFILE),
            isAdmin: true,
            authorized: true,
            migrationPending: true
          });
        } else {
          callback(null);
        }
      }
    );
  });
  return () => unsubscribe();
}

export async function sendInfraPasswordReset(email) {
  if (APP_MODE === 'demo') return;
  const { auth, authMod } = await getFirebase();
  await authMod.sendPasswordResetEmail(auth, normalizeEmail(email));
}

export async function changeInfraPassword(currentPassword, newPassword) {
  if (APP_MODE === 'demo') return;
  const { auth, authMod } = await getFirebase();
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Session expirée.');
  const credential = authMod.EmailAuthProvider.credential(user.email, currentPassword);
  await authMod.reauthenticateWithCredential(user, credential);
  await authMod.updatePassword(user, newPassword);
}

export async function listInfraUsers() {
  if (APP_MODE === 'demo') {
    return [{
      uid: 'demo-admin',
      ...ADMIN_BOOTSTRAP_PROFILE,
      fullName: fullName(ADMIN_BOOTSTRAP_PROFILE),
      isAdmin: true
    }];
  }
  const current = await getCurrentInfraUser();
  if (!current?.isAdmin) throw new Error('Accès administrateur requis.');
  const { db, fsMod } = await getFirebase();
  const snap = await fsMod.getDocs(fsMod.collection(db, 'users'));
  return snap.docs
    .map((docSnap) => {
      const value = docSnap.data();
      return {
        uid: docSnap.id,
        ...value,
        fullName: fullName(value),
        isAdmin: value.role === 'admin'
      };
    })
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
      return a.fullName.localeCompare(b.fullName, 'fr');
    });
}

export async function createInfraUser({ firstName, lastName, email, initialPassword }) {
  if (APP_MODE === 'demo') throw new Error('Création indisponible en mode démo.');
  const current = await getCurrentInfraUser();
  if (!current?.isAdmin) throw new Error('Accès administrateur requis.');

  const normalized = normalizeEmail(email);
  const first = String(firstName || '').trim();
  const last = String(lastName || '').trim();
  const password = String(initialPassword || '');
  if (!first || !last || !normalized) throw new Error('Nom, prénom et e-mail sont obligatoires.');
  if (password.length < 8) throw new Error('Le mot de passe initial doit contenir au moins 8 caractères.');

  const { db, fsMod, appMod, authMod } = await getFirebase();
  const secondaryApp = appMod.initializeApp(firebaseConfig, `infra-create-${uid()}`);
  const secondaryAuth = authMod.getAuth(secondaryApp);
  let createdUser = null;
  let profileCreated = false;

  try {
    const credential = await authMod.createUserWithEmailAndPassword(
      secondaryAuth,
      normalized,
      password
    );
    createdUser = credential.user;
    await authMod.updateProfile(createdUser, { displayName: `${first} ${last}` });

    await fsMod.setDoc(fsMod.doc(db, 'users', createdUser.uid), {
      firstName: first,
      lastName: last,
      email: normalized,
      role: 'infra',
      active: true,
      createdAt: fsMod.serverTimestamp(),
      updatedAt: fsMod.serverTimestamp(),
      createdByUid: current.uid
    });
    profileCreated = true;

    return {
      uid: createdUser.uid,
      firstName: first,
      lastName: last,
      email: normalized,
      role: 'infra',
      active: true,
      fullName: `${first} ${last}`
    };
  } catch (error) {
    if (createdUser && !profileCreated) {
      try { await authMod.deleteUser(createdUser); } catch {}
    }
    throw error;
  } finally {
    try { await authMod.signOut(secondaryAuth); } catch {}
    try { await appMod.deleteApp(secondaryApp); } catch {}
  }
}

export async function setInfraUserActive(userId, active) {
  if (APP_MODE === 'demo') throw new Error('Modification indisponible en mode démo.');
  const current = await getCurrentInfraUser();
  if (!current?.isAdmin) throw new Error('Accès administrateur requis.');
  if (userId === current.uid && active === false) throw new Error('Le compte administrateur ne peut pas être révoqué.');

  const { db, fsMod } = await getFirebase();
  await fsMod.updateDoc(fsMod.doc(db, 'users', userId), {
    active: !!active,
    updatedAt: fsMod.serverTimestamp()
  });
}



function normalizeUsername(value) {
  return String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function usernameKey(value) {
  return normalizeUsername(value).replace(/[^a-z0-9._-]/g, '');
}
function technicalAuthEmail(username, sector) {
  const key = usernameKey(username);
  if (!key) throw new Error('Nom d’utilisateur invalide.');
  return `${key}.${sector}@lvn.local`;
}
function normalizeSector(value) {
  const sector = String(value || '').trim().toLowerCase();
  if (!['infra', 'hcc'].includes(sector)) throw new Error('Secteur invalide.');
  return sector;
}

export async function getCurrentSectorUser(sector, { bootstrapAdmin = true } = {}) {
  sector = normalizeSector(sector);
  if (APP_MODE === 'demo') return { uid:'demo-admin', username:sector + '_lvn', sector, role:'admin', active:true, fullName:'Administrateur', isAdmin:true, authorized:true };
  const { auth, db, fsMod } = await getFirebase();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || user.isAnonymous) return null;
  const bootstrap = normalizeEmail(user.email) === ADMIN_AUTH_EMAIL;
  const ref = fsMod.doc(db, 'users', user.uid);
  let snap = await fsMod.getDoc(ref);
  if (!snap.exists() && bootstrap && bootstrapAdmin) {
    const now = fsMod.serverTimestamp();
    await fsMod.setDoc(ref, { firstName:'Laurent', lastName:'Dal Zotto', email:ADMIN_AUTH_EMAIL, username:'infra_lvn', sector:'infra', role:'admin', active:true, createdAt:now, updatedAt:now, createdByUid:user.uid }, { merge:true });
    snap = await fsMod.getDoc(ref);
  }
  if (!snap.exists()) return { uid:user.uid, active:false, authorized:false, isAdmin:false };
  const p = snap.data();
  const profileSector = p.sector || (p.role === 'infra' || bootstrap ? 'infra' : null);
  const role = p.role === 'infra' ? 'user' : p.role;
  const moderator = p.active === true && p.role === 'moderator' && p.sector === 'both';
  const authorized = bootstrap || moderator || (p.active === true && profileSector === sector && ['admin','user'].includes(role));
  return { uid:user.uid, ...p, username:p.username || p.lastName || user.displayName || '', sector:profileSector, role, fullName:p.username || fullName(p) || user.displayName || '', isAdmin:authorized && (role === 'admin' || bootstrap), isModerator:moderator, authorized, bootstrapAdmin:bootstrap };
}

export async function loginSector(username, password, sector) {
  sector = normalizeSector(sector);
  const normalized = normalizeUsername(username);
  // Plus aucun alias ne pointe vers le compte historique : il se connecte avec son e-mail complet.
  const directEmail = normalized.includes('@');
  const moderatorLogin = ['admin-lvn', 'moderateur', 'modérateur'].includes(normalized);
  const email = directEmail ? normalizeEmail(username) : technicalAuthEmail(normalized, moderatorLogin ? 'both' : sector);
  const { auth, authMod } = await getFirebase();
  const credential = await authMod.signInWithEmailAndPassword(auth, email, password);
  const profile = await getCurrentSectorUser(sector);
  if (!profile?.authorized) {
    await authMod.signOut(auth);
    const error = new Error('Compte non autorisé pour ce secteur.');
    error.code = 'sector/not-authorized';
    throw error;
  }
  return { user:credential.user, profile };
}

export async function hasSectorSession(sector) {
  const p = await getCurrentSectorUser(sector);
  return !!p?.authorized;
}

export function subscribeCurrentSectorProfile(sector, callback) {
  sector = normalizeSector(sector);
  let unsub = () => {};
  getFirebase().then(async ({ auth, db, fsMod }) => {
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user || user.isAnonymous) { callback(null); return; }
    unsub = fsMod.onSnapshot(fsMod.doc(db,'users',user.uid), async () => {
      try { callback(await getCurrentSectorUser(sector, { bootstrapAdmin:false })); } catch { callback(null); }
    }, () => callback(null));
  });
  return () => unsub();
}

export async function listSectorUsers(sector) {
  sector = normalizeSector(sector);
  const current = await getCurrentSectorUser(sector);
  if (!current?.isAdmin) throw new Error('Accès administrateur requis.');
  const { db, fsMod } = await getFirebase();
  const q = current.bootstrapAdmin ? fsMod.collection(db,'users') : fsMod.query(fsMod.collection(db,'users'), fsMod.where('sector','==',sector));
  const snap = await fsMod.getDocs(q);
  return snap.docs.map(d => ({ uid:d.id, ...d.data() }))
    .filter(p => {
      const ps = p.sector || (p.role === 'infra' ? 'infra' : null);
      return ps === sector || (current.bootstrapAdmin && (ps === 'both' || (p.email === ADMIN_AUTH_EMAIL && sector === 'infra')));
    })
    .map(p => ({ ...p, role:p.role === 'infra' ? 'user' : p.role, username:p.username || p.lastName || '', fullName:p.username || fullName(p) || 'Utilisateur', isAdmin:p.role === 'admin' }))
    .sort((a,b) => (a.username || '').localeCompare(b.username || '', 'fr'));
}

export async function createSectorUser({ username, initialPassword, sector, role = 'user' }) {
  sector = normalizeSector(sector);
  const current = await getCurrentSectorUser(sector);
  if (!current?.isAdmin) throw new Error('Accès administrateur requis.');
  if (role === 'moderator' && !current.bootstrapAdmin) throw new Error('Seul le compte administrateur principal peut créer un modérateur transversal.');
  if (!['user','moderator'].includes(role)) throw new Error('Rôle non autorisé.');
  const display = String(username || '').trim();
  const key = usernameKey(display);
  if (role === 'moderator' && key !== 'admin-lvn') throw new Error('Utiliser le nom d’utilisateur admin-lvn pour le compte transversal.');
  const password = String(initialPassword || '');
  if (!key) throw new Error('Le nom d’utilisateur est obligatoire.');
  if (password.length < 8) throw new Error('Le mot de passe initial doit contenir au moins 8 caractères.');
  const accountSector = role === 'moderator' ? 'both' : sector;
  const authEmail = technicalAuthEmail(key, accountSector);
  const { db, fsMod, appMod, authMod } = await getFirebase();
  const existing = await fsMod.getDocs(fsMod.query(fsMod.collection(db,'users'), fsMod.where('sector','==',accountSector)));
  if (existing.docs.some(d => usernameKey(d.data().username || d.data().lastName)===key)) throw new Error('Ce nom d’utilisateur existe déjà dans ce secteur.');
  const secondaryApp = appMod.initializeApp(firebaseConfig, `sector-create-${uid()}`);
  const secondaryAuth = authMod.getAuth(secondaryApp);
  let createdUser=null, profileCreated=false;
  try {
    const credential = await authMod.createUserWithEmailAndPassword(secondaryAuth, authEmail, password);
    createdUser=credential.user;
    await authMod.updateProfile(createdUser,{displayName:display});
    await fsMod.setDoc(fsMod.doc(db,'users',createdUser.uid),{
      username:display, usernameKey:key, sector:accountSector, role, active:true,
      authEmail, createdAt:fsMod.serverTimestamp(), updatedAt:fsMod.serverTimestamp(), createdByUid:current.uid
    });
    profileCreated=true;
    return { uid:createdUser.uid, username:display, sector:accountSector, role, active:true, fullName:display };
  } catch(error) {
    if (createdUser && !profileCreated) { try { await authMod.deleteUser(createdUser); } catch {} }
    throw error;
  } finally {
    try { await authMod.signOut(secondaryAuth); } catch {}
    try { await appMod.deleteApp(secondaryApp); } catch {}
  }
}

export async function setSectorUserActive(userId, active, sector) {
  sector = normalizeSector(sector);
  const current = await getCurrentSectorUser(sector);
  if (!current?.isAdmin) throw new Error('Accès administrateur requis.');
  if (userId === current.uid && !active) throw new Error('Le compte administrateur ne peut pas être révoqué.');
  const { db, fsMod } = await getFirebase();
  const ref=fsMod.doc(db,'users',userId), snap=await fsMod.getDoc(ref);
  if (!snap.exists()) throw new Error('Utilisateur introuvable.');
  const p=snap.data(), ps=p.sector || (p.role==='infra'?'infra':null);
  if (ps !== sector && !(current.bootstrapAdmin && ps === 'both')) throw new Error('Compte hors de votre secteur.');
  await fsMod.updateDoc(ref,{active:!!active,updatedAt:fsMod.serverTimestamp()});
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
    sector: 'INFRA',
    status: payload.status || 'a_traiter',
    createdAt: isoNow(),
    updatedAt: isoNow(),
    resolvedAt: null,
    resolutionComment: '',
    resolutionPhotoUrl: null,
    history: [{
      type: 'creation',
      label: `Ticket créé par ${payload.reporterFirstName || payload.reporterLastName ? `${payload.reporterFirstName || ''} ${payload.reporterLastName || ''}`.trim() : (payload.actor || 'Service Infra')}`,
      at: isoNow(),
      actor: payload.reporterFirstName || payload.reporterLastName
        ? `${payload.reporterFirstName || ''} ${payload.reporterLastName || ''}`.trim()
        : (payload.actor || 'Service Infra')
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

export async function createHccRequest(payload, photoFile = null) {
  const record = {
    ...payload,
    sector: 'HCC',
    status: 'a_traiter',
    createdAt: isoNow(),
    updatedAt: isoNow(),
    history: [{
      type: 'creation',
      label: `Ticket créé par ${`${payload.reporterFirstName || ''} ${payload.reporterLastName || ''}`.trim() || payload.actor || 'Service HCC'}`,
      at: isoNow(),
      actor: `${payload.reporterFirstName || ''} ${payload.reporterLastName || ''}`.trim() || payload.actor || 'Service HCC'
    }]
  };

  if (APP_MODE === 'demo') {
    const item = { id: uid(), photoUrl: null, ...record };
    const key = 'infra_LVN_demo_hcc_requests_v1';
    let data = [];
    try { data = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    data.unshift(item);
    localStorage.setItem(key, JSON.stringify(data));
    return item;
  }

  await preparePublicSession();
  const photoUrl = await uploadPhoto(photoFile, 'hcc-reports');
  const { db, fsMod } = await getFirebase();
  const docRef = await fsMod.addDoc(fsMod.collection(db, 'hcc_requests'), {
    ...record,
    photoUrl,
    createdAt: fsMod.serverTimestamp(),
    updatedAt: fsMod.serverTimestamp()
  });
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
      callback(rows.filter((row) => !row.sector || row.sector === 'INFRA'));
    });
  });
  return () => unsub();
}

export async function updateAnomaly(id, patch, { actor = 'Service Infra', actionLabel = 'Anomalie modifiée', resolutionPhotoFile = null, roomId = null, roomActive = null } = {}) {
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

export async function deleteAnomaly(id, actor = 'Service Infra', { roomId = null, roomActive = null } = {}) {
  if (APP_MODE === 'demo') {
    setDemoData(getDemoData().filter((x) => x.id !== id));
    return;
  }
  const { db, fsMod } = await getFirebase();
  await fsMod.deleteDoc(fsMod.doc(db, 'anomalies', id));
  if (roomId && typeof roomActive === 'boolean') { try { await setRoomStatus(roomId, roomActive); } catch {} }
}

export function resetDemoData() {
  localStorage.removeItem(DEMO_KEY);
  seedDemoIfNeeded();
  setDemoData(getDemoData());
}
