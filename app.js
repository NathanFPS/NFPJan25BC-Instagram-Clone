// app.js - ES6 Module style

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// Your Firebase config - replace with your own config
const firebaseConfig = {
  apiKey: "AIzaSyApMlfQSeG4b8vutJUd5yglX7_9EqzRTuE",
  authDomain: "instagram-clone-90299.firebaseapp.com",
  projectId: "instagram-clone-90299",
  storageBucket: "instagram-clone-90299.firebasestorage.app",
  messagingSenderId: "291345870771",
  appId: "1:291345870771:web:509b942b5c763bf0e525c6",
  measurementId: "G-VCEY165GK6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const loginBtn = document.getElementById("btn-login");
const signupBtn = document.getElementById("btn-signup");
const logoutBtn = document.getElementById("btn-logout");
const userDisplay = document.getElementById("user-display");

const modalLogin = document.getElementById("modal-login");
const modalSignup = document.getElementById("modal-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

const postsContainer = document.getElementById("posts-container");
const uploadSection = document.getElementById("upload-section");
const uploadForm = document.getElementById("upload-form");
const imageUploadInput = document.getElementById("image-upload");
const captionInput = document.getElementById("caption");

const profileSection = document.getElementById("profile-section");
const profileInfo = document.getElementById("profile-info");

const modal = document.getElementById("post-modal");
const modalImg = modal.querySelector("img");
const modalCaption = modal.querySelector(".modal-caption p");
const closeBtn = modal.querySelector(".close-btn");


const sections = {
  feed: document.getElementById('feed-section'),
  upload: document.getElementById('upload-section'),
  profile: document.getElementById('profile-section')
};

const navButtons = {
  feed: document.getElementById('btn-feed'),
  upload: document.getElementById('btn-upload'),
  profile: document.getElementById('btn-profile')
};

document.querySelectorAll(".post img").forEach(img => {
  img.addEventListener("click", () => {
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    modalCaption.textContent = img.nextElementSibling?.textContent || "";
    modal.classList.add("show");
  });
});

// Close modal on click outside content
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("show");
  }
});

// Close modal on X button
closeBtn.addEventListener("click", () => {
  modal.classList.remove("show");
});

// Show only the selected section
function showSection(sectionKey) {
  Object.entries(sections).forEach(([key, section]) => {
    section.hidden = key !== sectionKey;
  });
}

// Add click listeners
Object.entries(navButtons).forEach(([key, button]) => {
  button.addEventListener('click', () => {
    showSection(key);
  });
});

// Show / Hide modals
const toggleModal = (modal, show) => {
  modal.classList.toggle("hidden", !show);
};

// Auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User logged in
    userDisplay.textContent = `Hello, ${user.email}`;
    loginBtn.hidden = true;
    signupBtn.hidden = true;
    logoutBtn.hidden = false;
    uploadSection.hidden = false;
    profileSection.hidden = false;
    modalLogin.classList.add("hidden");
    modalSignup.classList.add("hidden");
    loadPosts();
    loadUserProfile(user);

    renderLocalPostsInProfile(); // Add this line

    showSection('feed'); // Automatically show feed
    document.getElementById('sidebar').style.display = 'flex';
  } else {
    // User logged out
    userDisplay.textContent = "";
    loginBtn.hidden = false;
    signupBtn.hidden = false;
    logoutBtn.hidden = true;
    uploadSection.hidden = true;
    profileSection.hidden = true;
    postsContainer.innerHTML = "";
    profileInfo.innerHTML = "";
    showSection(null); // Or show a login screen/modal
    document.getElementById('sidebar').style.display = 'none';
  }
});


// Login, Signup, Logout button handlers
loginBtn.onclick = () => toggleModal(modalLogin, true);
signupBtn.onclick = () => toggleModal(modalSignup, true);
logoutBtn.onclick = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    alert(`Logout failed: ${err.message}`);
  }
};

// Close modals when clicking on "x"
document.querySelectorAll(".close").forEach((btn) => {
  btn.onclick = () => toggleModal(document.getElementById(btn.dataset.close), false);
});

// Login form submit
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = loginForm["login-email"].value;
  const password = loginForm["login-password"].value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    toggleModal(modalLogin, false);
    loginForm.reset();
  } catch (err) {
    alert(`Login failed: ${err.message}`);
  }
};

// Signup form submit
signupForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = signupForm["signup-email"].value;
  const password = signupForm["signup-password"].value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    toggleModal(modalSignup, false);
    signupForm.reset();
  } catch (err) {
    alert(`Sign up failed: ${err.message}`);
  }
};

// Load posts from Firestore in realtime
const loadPosts = () => {
  const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(postsQuery, (snapshot) => {
    postsContainer.innerHTML = ""; // Clear current posts

    snapshot.forEach((doc) => {
      const post = doc.data();
      postsContainer.appendChild(createPostElement(post));
    });
  });
};

// Create post DOM element
const createPostElement = (post) => {
  const postEl = document.createElement("div");
  postEl.classList.add("post");

  const img = document.createElement("img");
  img.src = post.imageUrl;
  img.alt = post.caption || "User post";

  const caption = document.createElement("p");
  caption.classList.add("caption");
  caption.textContent = post.caption || "";

  postEl.append(img, caption);
  return postEl;
};

// Upload form submit handler
uploadForm.onsubmit = async (e) => {
  e.preventDefault();

  const file = imageUploadInput.files[0];
  const caption = captionInput.value.trim();
  const offlineMode = document.getElementById("offline-mode-toggle").checked;

  if (!file || !caption) {
    alert("Please provide both an image and a caption.");
    return;
  }

  if (offlineMode) {
    // Local upload path (no Firebase)
    const reader = new FileReader();
    reader.onload = function (event) {
      const imageUrl = event.target.result;
      const localPost = { imageUrl, caption }
      let localPosts = JSON.parse(localStorage.getItem("localPosts")) || [];
      localPosts.push(localPost);
      localStorage.setItem("localPosts", JSON.stringify(localPosts));

      const postEl = document.createElement("div");
      postEl.classList.add("post");

      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = caption;

      const captionEl = document.createElement("p");
      captionEl.classList.add("caption");
      captionEl.textContent = caption;

      img.addEventListener("click", () => {
        modalImg.src = img.src;
        modalImg.alt = img.alt;
        modalCaption.textContent = caption;
        modal.classList.add("show");
      });

      postEl.appendChild(img);
      postEl.appendChild(captionEl);
      postsContainer.prepend(postEl);

      uploadForm.reset();
      showSection("feed");
      renderLocalPostsInProfile();
    };

    reader.readAsDataURL(file);
  } else {
    // Firebase upload path
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to upload.");
      return;
    }

    try {
      const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        caption,
        imageUrl,
        createdAt: serverTimestamp(),
      });

      uploadForm.reset();
      showSection("feed");

    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    }
  }
};

const renderLocalPostsInProfile = () => {
  // Container for local posts inside profile
  let localPostsContainer = document.getElementById("local-posts-profile");

  if (!localPostsContainer) {
    localPostsContainer = document.createElement("div");
    localPostsContainer.id = "local-posts-profile";
    localPostsContainer.style.marginTop = "1rem";

    const title = document.createElement("h3");
    title.textContent = "Your Local Posts (Offline Mode)";
    localPostsContainer.appendChild(title);

    profileInfo.appendChild(localPostsContainer);
  }

  localPostsContainer.innerHTML = '<h3>Your Local Posts (Offline Mode)</h3>'; // Reset content except title

  const localPosts = JSON.parse(localStorage.getItem("localPosts")) || [];

  if (localPosts.length === 0) {
    const noPostsMsg = document.createElement("p");
    noPostsMsg.textContent = "No offline posts yet.";
    localPostsContainer.appendChild(noPostsMsg);
    return;
  }

  [...localPosts].reverse().forEach(post => {
    const postEl = document.createElement("div");
    postEl.classList.add("post");

    const img = document.createElement("img");
    img.src = post.imageUrl;
    img.alt = post.caption || "Offline post";

    const caption = document.createElement("p");
    caption.classList.add("caption");
    caption.textContent = post.caption || "";

    img.addEventListener("click", () => {
      modalImg.src = img.src;
      modalImg.alt = img.alt;
      modalCaption.textContent = caption.textContent;
      modal.classList.add("show");
    });

    postEl.appendChild(img);
    postEl.appendChild(caption);
    localPostsContainer.appendChild(postEl);
  });
};

// Load user profile info
const loadUserProfile = (user) => {
  profileInfo.innerHTML = `
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>UID:</strong> ${user.uid}</p>
  `;
};

// Clicking outside modal closes it
window.onclick = (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.add("hidden");
  }
};
