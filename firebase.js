// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjGP5erki71UkJEC_3xdyuD6BEanbza_o",
  authDomain: "flower-c41bd.firebaseapp.com",
  projectId: "flower-c41bd",
  storageBucket: "flower-c41bd.firebasestorage.app",
  messagingSenderId: "813082466211",
  appId: "1:813082466211:web:591a38531301b42e286c16",
  measurementId: "G-G6E2N1DSLV"
};

// Initialize Firebase (safeguard for hot reload in Next.js)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Safely initialize analytics only on the browser client
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app, analytics };
export default app;