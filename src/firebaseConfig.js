// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"
import { getStorage, ref, uploadBytes, getDownloadURL, getBytes } from "firebase/storage"
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, where, setDoc, deleteDoc } from  "firebase/firestore"// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCeuZZzCdIEv_yS_BPxJvfmSp9aAeaEYoY",
  authDomain: "calculadorabonos-e6a55.firebaseapp.com",
  projectId: "calculadorabonos-e6a55",
  storageBucket: "calculadorabonos-e6a55.appspot.com",
  messagingSenderId: "868433563839",
  appId: "1:868433563839:web:6c88b46acd90c2c567360a"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
