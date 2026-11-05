import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, inMemoryPersistence, setPersistence, signInAnonymously, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { addDoc, collection, getFirestore, onSnapshot, query, serverTimestamp, where } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { firebaseConfig } from '../js/firebase-config.js';

const agentApp = initializeApp(firebaseConfig, 'garage-agent');
const serviceApp = initializeApp(firebaseConfig, 'garage-service');
const agentAuth = getAuth(agentApp);
const serviceAuth = getAuth(serviceApp);
const agentReady = setPersistence(agentAuth, inMemoryPersistence);
const serviceReady = setPersistence(serviceAuth, inMemoryPersistence);
const agentReports = collection(getFirestore(agentApp), 'garage_reports');
const serviceReports = collection(getFirestore(serviceApp), 'garage_reports');

export async function createReport(report) {
  await agentReady;
  if (!agentAuth.currentUser) await signInAnonymously(agentAuth);
  await addDoc(agentReports, { ...report, createdAt: serverTimestamp() });
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
    const rows = snapshot.docs.map(doc => doc.data());
    rows.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
    onReports(rows);
  }, onError);
}
