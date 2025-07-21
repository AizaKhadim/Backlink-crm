// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // ✅ add this

const firebaseConfig = {
  apiKey: 'AIzaSyBULN0ZH69bK7X9K98JMU3fXvCpVmDt-Kk',
  authDomain: 'backlinkcrm-bee03.firebaseapp.com',
  projectId: 'backlinkcrm-bee03',
  storageBucket: 'backlinkcrm-bee03.appspot.com',
  messagingSenderId: '962305352319',
  appId: '1:962305352319:web:297a935851e810697c954a',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); // ✅ this line
export { app };
