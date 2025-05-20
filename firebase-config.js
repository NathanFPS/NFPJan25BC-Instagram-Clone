import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCqCuK1STXiWwCGReVFDTuyMqG-JHzbkps",
    authDomain: "instagram-clone-25e7a.firebaseapp.com",
    projectId: "instagram-clone-25e7a",
    storageBucket: "instagram-clone-25e7a.appspot.com",
    messagingSenderId: "1084918024477",
    appId: "1:1084918024477:web:657c1e66e5693109e5f9f4",
    measurementId: "G-1X10S7B7NS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };