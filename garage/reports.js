import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, inMemoryPersistence, onAuthStateChanged, setPersistence, signInAnonymously, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { addDoc, collection, doc, getDoc, getFirestore, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { deleteObject, getBlob, getStorage, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js';
import { firebaseConfig } from '../js/firebase-config.js';

const agentApp = initializeApp(firebaseConfig, 'garage-agent');
const serviceApp = initializeApp(firebaseConfig);
const agentAuth = getAuth(agentApp);
const agentReady = setPersistence(agentAuth, inMemoryPersistence);
const agentReports = collection(getFirestore(agentApp), 'garage_reports');
const serviceReports = collection(getFirestore(serviceApp), 'garage_reports');

export async function createReport(report, photo) {
  await agentReady;
  if (!agentAuth.currentUser) await signInAnonymously(agentAuth);
  const data = { ...report, createdAt: serverTimestamp() };
  if (!photo) {
    await addDoc(agentReports, data);
    return;
  }
  const photoPath = 'garage-reports/' + agentAuth.currentUser.uid + '/' + doc(agentReports).id;
  const photoRef = ref(getStorage(agentApp), photoPath);
  await uploadBytes(photoRef, photo, { contentType: photo.type });
  try {
    await addDoc(agentReports, { ...data, photoPath });
  } catch (error) {
    await deleteObject(photoRef).catch(() => {});
    throw error;
  }
}

async function getGarageSession(user) {
  if (!user || user.isAnonymous) return null;
  if (user.email?.toLowerCase() === 'lolo.dalzotto@gmail.com') return { generalAdmin: true };
  const profile = (await getDoc(doc(getFirestore(serviceApp), 'users', user.uid))).data();
  if (profile?.active === true && profile.sector === 'garage' && ['admin', 'user'].includes(profile.role)) {
    return { generalAdmin: false };
  }
  return null;
}

export function watchServiceSession(onSession) {
  const auth = getAuth(serviceApp);
  let revision = 0;
  return onAuthStateChanged(auth, async user => {
    const currentRevision = ++revision;
    let session = null;
    try {
      session = await getGarageSession(user);
    } catch {
      // A profile that cannot be read does not grant Garage access.
    }
    if (currentRevision === revision && user === auth.currentUser) onSession(session);
  });
}

export async function signIn(email, password) {
  const auth = getAuth(serviceApp);
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  try {
    if (await getGarageSession(user)) return;
    throw new Error('Garage access denied');
  } catch (error) {
    if (auth.currentUser === user) await firebaseSignOut(auth);
    throw error;
  }
}

export function signOut() {
  return firebaseSignOut(getAuth(serviceApp));
}

export function watchReports(vehicle, onReports, onError) {
  return onSnapshot(query(serviceReports, where('vehicle', '==', vehicle)), snapshot => {
    const rows = snapshot.docs.map(entry => ({ ...entry.data(), id: entry.id }));
    rows.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
    onReports(rows);
  }, onError);
}

export function updateStatus(id, status) {
  return updateDoc(doc(serviceReports, id), { status });
}

export function readPhoto(path) {
  return getBlob(ref(getStorage(serviceApp), path), 8 * 1024 * 1024);
}

export function watchVehicleState(vehicle, onState, onError) {
  const statusRef = doc(getFirestore(agentApp), 'garage_vehicle_states', String(vehicle));
  return onSnapshot(statusRef, snapshot => {
    onState(snapshot.data()?.status ?? (vehicle === 4 ? 'maintenance' : 'operational'));
  }, onError);
}

export function setVehicleState(vehicle, status) {
  const statusRef = doc(getFirestore(serviceApp), 'garage_vehicle_states', String(vehicle));
  return setDoc(statusRef, { status });
}
