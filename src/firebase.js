/**
 * Firebase Realtime Database setup
 * 
 * Make sure you've enabled Realtime Database in Firebase Console:
 * Build > Realtime Database > Create Database
 * 
 * And set the rules to:
 * {
 *   "rules": {
 *     "cards": { ".read": true, ".write": true }
 *   }
 * }
 */

import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set, get } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBD5PNSHspVBEMcDDkaTwncdKMJf-0CGyg",
  authDomain: "loyalty-card-aa0ca.firebaseapp.com",
  databaseURL: "https://loyalty-card-aa0ca-default-rtdb.firebaseio.com",
  projectId: "loyalty-card-aa0ca",
  storageBucket: "loyalty-card-aa0ca.firebasestorage.app",
  messagingSenderId: "228659249891",
  appId: "1:228659249891:web:9837cf0a5afaf4e0fd7bd6"
}

let db = null

export function initFirebase() {
  const app = initializeApp(firebaseConfig)
  db = getDatabase(app)
  return db
}

export function getDb() {
  return db
}

export { ref, onValue, set, get }
