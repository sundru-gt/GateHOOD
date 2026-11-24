import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gatehood.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'gatehood-demo',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'gatehood.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

export const DEFAULT_PROJECT_ID = process.env.EXPO_PUBLIC_PROJECT_ID || 'gatehood-residences';
export const BUILDER_PIN = process.env.EXPO_PUBLIC_BUILDER_PIN || '4826';

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache(),
  });
} catch (e) {
  try {
    db = getFirestore(app);
  } catch (err) {
    db = null;
  }
}

export const auth = getAuth(app);
export { db };

export async function ensureAnonymousUser() {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (error) {
    return {
      uid: 'offline-user-' + Math.random().toString(36).substring(2, 9),
      isAnonymous: true,
    };
  }
}
