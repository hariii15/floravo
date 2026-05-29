import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Register a new user with email & password.
 * On success, creates a Firestore document in the `users` collection.
 */
export async function signUp(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Update Firebase Auth profile
  await updateProfile(user, { displayName });

  // Write user document to Firestore `users` collection
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    displayName,
    email: user.email,
    role: 'user',
    createdAt: serverTimestamp(),
    bouquetsCreated: 0,
  });

  return user;
}

/**
 * Sign in an existing user with email & password.
 */
export async function logIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Sign out the currently authenticated user.
 */
export async function logOut() {
  await signOut(auth);
}
