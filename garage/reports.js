import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, inMemoryPersistence, setPersistence, signInAnonymously, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { addDoc, collection, doc, getFirestore, onSnapshot, query, serverTimestamp, updateDoc, where } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { deleteObject, getBlob, getStorage, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js';
import { firebaseConfig } from '../js/firebase-config.js';

const agentApp = initializeApp(firebaseConfig, 'garage-agent');
const serviceApp = initializeApp(firebaseConfig, 'garage-service');
const agentAuth = getAuth(agentApp);
const serviceAuth = getAuth(serviceApp);
const agentReady = setPersistence(agentAuth, inMemoryPersistence);
const serviceReady = setPersistence(serviceAuth, inMemoryPersistence);
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

export async function signIn(email, password) {
  await serviceReady;
  return signInWithEmailAndPassword(serviceAuth, email.trim(), password);
}

export function signOut() {
  return firebaseSignOut(serviceAuth);
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
