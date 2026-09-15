import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBbStFpNQ9sz_W6mAzrLypASrNfFi8pyv8",
  authDomain: "runningapp-a35d0.firebaseapp.com",
  projectId: "runningapp-a35d0",
  storageBucket: "runningapp-a35d0.firebasestorage.app",
  messagingSenderId: "455322157936",
  appId: "1:455322157936:web:64e7fa75098b4754e605b5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export const db = getFirestore(app);

export default app;