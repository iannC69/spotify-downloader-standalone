import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBvkAqXW3llzARIw50qpfH9pd5h_VwfrvI",
  authDomain: "iannc-site.firebaseapp.com",
  projectId: "iannc-site",
  storageBucket: "iannc-site.firebasestorage.app",
  messagingSenderId: "617190889344",
  appId: "1:617190889344:web:8cf1f49ff73260db72d365"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
