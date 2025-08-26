
// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase config object (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyDfwDtaFOM_8YzsNWE2iIvdBu379fKWP74",
  authDomain: "panxther-46b15.firebaseapp.com",
  projectId: "panxther-46b15",
  storageBucket: "panxther-46b15.firebasestorage.app",
  messagingSenderId: "684821370860",
  appId: "1:684821370860:web:bfd803b4aa3cf14a3d12c9",
  measurementId: "G-C5KGCQLVWQ"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);