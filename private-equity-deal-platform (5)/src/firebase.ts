import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAph7ck68CLFmCs_-Knin88JxPsYbDx5Jo",
  authDomain: "archaleon-198eb.firebaseapp.com",
  projectId: "archaleon-198eb",
  storageBucket: "archaleon-198eb.firebasestorage.app",
  messagingSenderId: "660898450519",
  appId: "1:660898450519:web:8af054d18ff0b8801f6712",
  measurementId: "G-13B920JMWN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set auth persistence to LOCAL - survives browser restart
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not available in this browser');
  }
});

export default app;
