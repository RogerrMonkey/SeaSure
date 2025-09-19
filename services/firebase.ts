import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { CONFIG } from '../config';

// Firebase configuration
const firebaseConfig = {
  apiKey: CONFIG.FIREBASE.apiKey,
  authDomain: CONFIG.FIREBASE.authDomain,
  projectId: CONFIG.FIREBASE.projectId,
  storageBucket: CONFIG.FIREBASE.storageBucket,
  messagingSenderId: CONFIG.FIREBASE.messagingSenderId,
  appId: CONFIG.FIREBASE.appId,
  measurementId: CONFIG.FIREBASE.measurementId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth (AsyncStorage persistence is handled automatically in React Native)
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

console.log('✅ Firebase initialized with automatic AsyncStorage persistence');

export { app, auth, db };
export default app;
