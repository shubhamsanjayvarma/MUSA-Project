import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAtr3hA6MB61fkN34cphNzMC0Ay-m4m7Yw",
  authDomain: "interview-shield-67017.firebaseapp.com",
  projectId: "interview-shield-67017",
  storageBucket: "interview-shield-67017.firebasestorage.app",
  messagingSenderId: "275939752570",
  appId: "1:275939752570:web:beca40899da33f5a3bd9c3",
  measurementId: "G-TKWT59PY6J",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type FirebaseUser,
};
