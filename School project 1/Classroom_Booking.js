
"use strict";

// ================================================
// 1. ADD OR REMOVE CLASSROOMS HERE
// Each ID must be unique.
// ================================================
const ROOMS = [
  { id: "lecture-room-1", name: "Lecture Room 1" },
  { id: "lecture-room-2", name: "Lecture Room 2" },
  { id: "lecture-room-3", name: "Lecture Room 3" },
  { id: "lecture-room-4", name: "Lecture Room 4" }
];

// ================================================
// 2. EDIT YOUR FOUR AUTHORS HERE
// Replace sample names, roles, emails, links and photos.
// ================================================
const AUTHORS = [
  {
    name: "Author One",
    role: "Frontend Developer",
    email: "author1@example.com",
    link: "https://github.com/",
    photo: "https://placehold.co/200x200?text=Author+1"
  },
  {
    name: "Author Two",
    role: "Backend Developer",
    email: "author2@example.com",
    link: "https://github.com/",
    photo: "https://placehold.co/200x200?text=Author+2"
  },
  {
    name: "Author Three",
    role: "UI/UX Designer",
    email: "author3@example.com",
    link: "https://www.linkedin.com/",
    photo: "https://placehold.co/200x200?text=Author+3"
  },
  {
    name: "Author Four",
    role: "Database Administrator",
    email: "author4@example.com",
    link: "https://github.com/",
    photo: "https://placehold.co/200x200?text=Author+4"
  }
];

// ================================================
// 3. PASTE YOUR FIREBASE CONFIGURATION HERE
// Firebase Console -> Project settings -> Your apps
// ================================================
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "PASTE_YOUR_DATABASE_URL_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE"
};

// ================================================
// APPLICATION
// ================================================
const $ = (id) => document.getElementById(id);

const availableElement = $("availableRooms");
const bookedElement = $("bookedRooms");
const authorsModal = $("authorsModal");
const bookingModal = $("bookingModal");

let database = null;
let roomsReference = null;
let roomsState = {};
let pendingRoom = null;
let isConnected = false;
let bookingInProgress = false;

$("currentYear").textContent = new Date().getFullYear();

function setStatus(message, state = "") {
  $("connectionText").textContent = message;
  $("statusDot").className = "status-dot";
  if (state) $("statusDot").classList.add(state);
}

function createElement(tag, className, text = "") {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function renderRooms() {
  availableElement.replaceChildren();
  bookedElement.replaceChildren();

  let availableCount = 0;
  let bookedCount = 0;

  ROOMS.forEach((room) => {
    const data = roomsState[room.id] || {};
    const booked = data.booked === true;

    const card = createElement(
      "div",
      "room-card" + (booked ? " unavailable" : "")
    );

    card.append(
      createElement("div", "room-name", room.name),
      createElement(
        "div",
        "room-status",
        booked ? "Booked / Unavailable" : "Available"
      )
    );

    if (booked) {
      bookedCount++;

      const disabledButton = createElement(
        "button", "book-button", "Unavailable"
      );
      disabledButton.disabled = true;
      card.append(disabledButton);

      const cancelButton = createElement(
        "button", "cancel-button", "Cancel booking"
      );
      cancelButton.addEventListener("click", () => cancelBooking(room));
      card.append(cancelButton);

      bookedElement.append(card);
    } else {
      availableCount++;

      const button = createElement("button", "book-button", "Book Room");
      button.disabled = !isConnected;
      button.addEventListener("click", () => openBooking(room));
      card.append(button);

      availableElement.append(card);
    }
  });

  $("availableCount").textContent = `${availableCount} rooms`;
  $("bookedCount").textContent = `${bookedCount} rooms`;

  if (availableCount === 0) {
    availableElement.append(
      createElement("p", "empty-message", "No rooms are available.")
    );
  }

  if (bookedCount === 0) {
    bookedElement.append(
      createElement("p", "empty-message", "No rooms have been booked yet.")
    );
  }
}

// ================================================
// AUTHORS POPUP
// ================================================
function renderAuthors() {
  const grid = $("authorsGrid");
  grid.replaceChildren();

  AUTHORS.forEach((author) => {
    const card = createElement("article", "author-card");
    const photo = document.createElement("img");

    photo.className = "author-photo";
    photo.src = author.photo;
    photo.alt = author.name;
    photo.loading = "lazy";
    photo.onerror = () => {
      photo.onerror = null;
      photo.src = "https://placehold.co/200x200?text=Photo";
    };

    const name = createElement("h3", "", author.name);
    const role = createElement("p", "author-role", author.role);
    const email = createElement("p", "author-email", author.email);

    const link = createElement("a", "author-link", "View Profile");
    link.href = author.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    card.append(photo, name, role, email, link);
    grid.append(card);
  });
}

function openModal(modal) {
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  modal.hidden = true;

  if (authorsModal.hidden && bookingModal.hidden) {
    document.body.style.overflow = "";
  }
}

$("openAuthors").addEventListener("click", () => {
  openModal(authorsModal);
});

$("closeAuthors").addEventListener("click", () => {
  closeModal(authorsModal);
});

authorsModal.addEventListener("click", (event) => {
  if (event.target === authorsModal) closeModal(authorsModal);
});

renderAuthors();

// ================================================
// BOOKING CONFIRMATION
// ================================================
function openBooking(room) {
  if (!isConnected || bookingInProgress) return;

  if (roomsState[room.id]?.booked === true) {
    alert("This room has already been booked.");
    return;
  }

  pendingRoom = room;
  $("bookingMessage").textContent = `Book ${room.name}?`;
  openModal(bookingModal);
}

function closeBooking() {
  if (bookingInProgress) return;

  closeModal(bookingModal);
  pendingRoom = null;
}

$("closeBooking").addEventListener("click", closeBooking);
$("rejectBooking").addEventListener("click", closeBooking);

bookingModal.addEventListener("click", (event) => {
  if (event.target === bookingModal) closeBooking();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!bookingModal.hidden) closeBooking();
    else if (!authorsModal.hidden) closeModal(authorsModal);
  }
});

$("confirmBooking").addEventListener("click", async () => {
  if (!pendingRoom || !roomsReference || bookingInProgress) return;

  const room = pendingRoom;
  bookingInProgress = true;
  $("confirmBooking").disabled = true;
  $("rejectBooking").disabled = true;
  $("closeBooking").disabled = true;
  $("confirmBooking").textContent = "Booking...";

  try {
    const result = await roomsReference.child(room.id).transaction((current) => {
      // Abort if another user has already booked this room.
      if (current && current.booked === true) return;

      return {
        booked: true,
        bookedAt: firebase.database.ServerValue.TIMESTAMP
      };
    });

    if (result.committed) {
      alert(`${room.name} has been booked successfully.`);
    } else {
      alert(`Sorry, ${room.name} has already been booked by someone else.`);
    }

    closeModal(bookingModal);
    pendingRoom = null;
  } catch (error) {
    console.error("Booking failed:", error);
    alert("Booking failed. Check your internet connection and try again.");
  } finally {
    bookingInProgress = false;
    $("confirmBooking").disabled = false;
    $("rejectBooking").disabled = false;
    $("closeBooking").disabled = false;
    $("confirmBooking").textContent = "Confirm Booking";
  }
});

// ================================================
// CANCEL BOOKING
// IMPORTANT: Add authentication and authorization
// before using this on a public university website.
// ================================================
async function cancelBooking(room) {
  if (!isConnected || !roomsReference) {
    alert("Database connection is unavailable.");
    return;
  }

  if (!confirm(`Release ${room.name} and make it available again?`)) {
    return;
  }

  try {
    const result = await roomsReference.child(room.id).transaction((current) => {
      if (!current || current.booked !== true) return;

      return {
        booked: false,
        bookedAt: null
      };
    });

    alert(
      result.committed
        ? `${room.name} is now available.`
        : "This room is no longer booked."
    );
  } catch (error) {
    console.error("Cancellation failed:", error);
    alert("Could not release the room. Please try again.");
  }
}

// ================================================
// FIREBASE CONNECTION
// ================================================
function startFirebase() {
  const configMissing =
    !firebaseConfig.apiKey ||
    firebaseConfig.apiKey.includes("PASTE_") ||
    !firebaseConfig.projectId ||
    firebaseConfig.projectId.includes("PASTE_") ||
    !firebaseConfig.databaseURL ||
    firebaseConfig.databaseURL.includes("PASTE_");

  if (configMissing) {
    setStatus("Firebase configuration required", "error");

    availableElement.replaceChildren(
      createElement(
        "p", "empty-message",
        "Paste your Firebase configuration into script.js to enable bookings."
      )
    );

    bookedElement.replaceChildren(
      createElement(
        "p", "empty-message",
        "Booked rooms will appear here after Firebase is connected."
      )
    );
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    database = firebase.database();
    roomsReference = database.ref("classroomBookings");

    database.ref(".info/connected").on("value", (snapshot) => {
      isConnected = snapshot.val() === true;

      setStatus(
        isConnected ? "Connected · Live updates enabled" : "Reconnecting...",
        isConnected ? "online" : ""
      );

      renderRooms();
    });

    roomsReference.on("value", (snapshot) => {
      roomsState = snapshot.val() || {};
      renderRooms();
    }, (error) => {
      console.error("Database read failed:", error);
      isConnected = false;
      setStatus("Database access denied or unavailable", "error");
      renderRooms();
    });

    // Create missing rooms without overwriting existing bookings.
    ROOMS.forEach((room) => {
      roomsReference.child(room.id).transaction((current) => {
        if (current === null) {
          return { booked: false, bookedAt: null };
        }
        return;
      }).catch((error) => {
        console.error("Could not initialize room:", error);
      });
    });
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    isConnected = false;
    setStatus("Firebase initialization failed", "error");
    renderRooms();
  }
}

startFirebase();
