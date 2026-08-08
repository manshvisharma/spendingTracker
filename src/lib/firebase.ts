import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCkwL3vx2BZJqTsOkpVyDWr_hwLAhWUlz4",
  authDomain: "moneyhisab-3b9b4.firebaseapp.com",
  projectId: "moneyhisab-3b9b4",
  storageBucket: "moneyhisab-3b9b4.firebasestorage.app",
  messagingSenderId: "96571760638",
  appId: "1:96571760638:web:881dfa114b0e25472d6aaf",
  measurementId: "G-MMH7L9CSHS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Enable offline persistence
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable persistence');
  }
});
