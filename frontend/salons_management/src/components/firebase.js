import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDWzNL0lPqoE92x-nHWnAkd__v2FOZkY-c",
  authDomain: "salon-management-a51ad.firebaseapp.com",
  projectId: "salon-management-a51ad",
  storageBucket: "salon-management-a51ad.appspot.com",
  messagingSenderId: "133918952523",
  appId: "1:133918952523:web:b9efb7771640b550c891ce",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
