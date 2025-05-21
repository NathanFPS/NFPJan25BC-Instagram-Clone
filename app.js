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

    renderLocalPostsInProfile();

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
    showSection(null);
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
  const postsQuery = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(postsQuery, (snapshot) => {
    // Remove previously rendered real posts
    const realPosts = postsContainer.querySelectorAll(".real-post");
    realPosts.forEach((el) => el.remove());

    // Use fragment for better performance
    const fragment = document.createDocumentFragment();

    snapshot.forEach((doc) => {
      const post = doc.data();
      const el = createPostElement(post);
      fragment.appendChild(el);
    });

    // Insert UGC before preset posts
    const firstPreset = postsContainer.querySelector(".post:not(.real-post)");
    if (firstPreset) {
      postsContainer.insertBefore(fragment, firstPreset);
    } else {
      postsContainer.appendChild(fragment);
    }
  });
};


// Create post DOM element
const createPostElement = (post) => {
  const postEl = document.createElement("div");
  postEl.classList.add("post", "real-post");

  postEl.innerHTML = `
    <div class="post-header">
      <img class="profile-pic" src="${post.profilePic || 'https://randomuser.me/api/portraits/men/15.jpg'}" alt="Profile">
      <div class="username">${post.username || "You"}</div>
    </div>
    <div class="modal-image">
      <img src="${post.imageUrl}" alt="${post.caption || 'User post'}">
    </div>
    <div class="caption">${post.caption || ''}</div>
    <div class="divider"></div>
    <div class="actions">
      <div class="left">
        <i class="material-icons">favorite_border</i>
        <i class="material-icons">chat_bubble_outline</i>
        <i class="material-icons">send</i>
        <i class="material-icons">bookmark_border</i>
      </div>
    </div>
    <div class="views">0 likes</div>
    <div class="divider"></div>
    <div class="comments">
      <div><span class="username"></span>Be the first comment.</div>
    </div>
    <div class="divider"></div>
    <div class="comment-input">Add a comment...</div>
  `;

  // Attach modal opening behavior
  const img = postEl.querySelector(".modal-image img");
  img.addEventListener("click", () => {
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    modalCaption.textContent = post.caption || "";
    modal.classList.add("show");
  });

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
    const reader = new FileReader();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    reader.onload = async function (event) {
      const base64Image = event.target.result;
      try {
        await addDoc(collection(db, "posts"), {
          userId: currentUser.uid,
          caption,
          imageUrl: base64Image,   
          offline: true,           
          createdAt: serverTimestamp(),
        });
        uploadForm.reset();
        showSection("feed");
      } catch (err) {
        alert(`Firestore upload failed: ${err.message}`);
      }
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

import { getDocs, where } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

//Create a function to render local posts in the profile section from Firestore
const renderLocalPostsInProfile = async () => {
  let container = document.getElementById("local-posts-profile");
  if (!container) {
    container = document.createElement("div");
    container.id = "local-posts-profile";
    container.style.marginTop = "1rem";
    container.innerHTML = "<h3>Your Offline-Mode Posts</h3>";
    profileInfo.appendChild(container);
  } else {
    container.innerHTML = "<h3>Your Offline-Mode Posts</h3>";
  }

  const user = auth.currentUser;
  if (!user) {
    container.innerHTML += "<p>Please log in to see your offline posts.</p>";
    return;
  }

  const q = query(
    collection(db, "posts"),
    where("userId", "==", user.uid),
    where("offline", "==", true),
    orderBy("createdAt", "desc")
  );

  try {
    const snap = await getDocs(q);
    if (snap.empty) {
      container.innerHTML += "<p>No offline posts yet.</p>";
      return;
    }

    const fragment = document.createDocumentFragment();

    snap.forEach(doc => {
      const post = doc.data();
      const el = createPostElement(post);
      el.querySelector("img").addEventListener("click", () => {
        modalImg.src = post.imageUrl;
        modalCaption.textContent = post.caption;
        modal.classList.add("show");
      });
      fragment.appendChild(el);
    });

    container.appendChild(fragment);
  } catch (err) {
    
  }
};


let profileUnsubscribe = null;

const loadUserProfile = (user) => {
  profileInfo.innerHTML = `
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>UID:</strong> ${user.uid}</p>
  `;

  const postsContainer = document.querySelector("#profile-section #posts-container");
  postsContainer.innerHTML = "";

  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );
  
  if (profileUnsubscribe) {
    profileUnsubscribe();
  }

  profileUnsubscribe = onSnapshot(q, (snapshot) => {
    postsContainer.innerHTML = "";

    if (snapshot.empty) {
      postsContainer.innerHTML = `<p>No posts found.</p>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    snapshot.forEach((doc) => {
      const postData = doc.data();
      const postElement = createPostElement(postData);
      fragment.appendChild(postElement);
    });

    postsContainer.appendChild(fragment);
  }, (error) => {
    console.error("Real-time profile listener error:", error);
    postsContainer.innerHTML = `<p>Error loading posts.</p>`;
  });
};



// Clicking outside modal closes it
window.onclick = (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.add("hidden");
  }
};
