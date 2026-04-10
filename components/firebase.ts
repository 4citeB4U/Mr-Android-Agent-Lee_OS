/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.SERVICE.FIREBASE
TAG: UI.COMPONENT.SERVICE.FIREBASE.BRIDGE

COLOR_ONION_HEX:
NEON=#4285F4
FLUO=#5A9AF5
PASTEL=#BFDBFE

ICON_ASCII:
family=lucide
glyph=database

5WH:
WHAT = Firebase bridge exports for legacy AgentLeeVM component
WHY = Keeps legacy VM component build-safe while reusing the project's Firebase environment config
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/firebase.ts
WHEN = 2026
HOW = Initializes Firebase app/auth/firestore once and re-exports common helpers

AGENTS:
ASSESS
AUDIT
SECURITY

LICENSE:
MIT
*/

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  addDoc,
  getDocFromServer
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD6g6WI5Ql1W1On5yBsJiGpesC5D71RL5I",
  authDomain: "agent-lee-assistant.firebaseapp.com",
  projectId: "agent-lee-assistant",
  storageBucket: "agent-lee-assistant.firebasestorage.app",
  messagingSenderId: "386516092800",
  appId: "1:386516092800:web:410a9abdba67c85e332365",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const leewayProvider = new GoogleAuthProvider();
export type FirebaseUser = User;
export type { User };

export {
  signInWithPopup,
  onAuthStateChanged,
  GoogleAuthProvider as leewayAuthProvider,
  getAuth,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  addDoc,
  getDocFromServer
};

export function handleFirestoreError(error: unknown, operation: string, path: string) {
  console.error(`[Firestore ${operation}] ${path}`, error);
}

export async function testConnection() {
  try {
    await getDocs(query(collection(db, '_connection_probe'), limit(1)));
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
