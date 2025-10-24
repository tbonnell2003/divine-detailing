let galleryData = [];
let currentBatch = 0;
const batchSize = 8;
const rotateDelay = 8000; // 8 seconds per batch

let elapsedTime = 0;
let lastTimestamp = null;
let animationFrame;
let hovered = false;

const galleryContainer = document.getElementById("galleryContainer");
const filterButtons = document.querySelectorAll(".filter-btn");
const progressBar = document.getElementById("progressBar");

// Load gallery data
async function loadGallery() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/tbonnell2003/personal/refs/heads/main/data.json");
    const data = await response.json();
    galleryData = data.gallery;
    displayBatch(galleryData);
    startRotation(galleryData);
  } catch (err) {
    console.error("Error loading gallery:", err);
  }
}

// Render a batch of images/videos
function displayBatch(items) {
  galleryContainer.style.opacity = 0;

  setTimeout(() => {
    galleryContainer.innerHTML = "";
    const start = currentBatch * batchSize;
    const end = start + batchSize;
    const batch = items.slice(start, end);

    batch.forEach(item => {
      const card = document.createElement("div");
      card.classList.add("gallery-card");

      let media;
      if (item.video) {
        media = document.createElement("video");
        media.src = item.video;
        media.autoplay = true;
        media.loop = true;
        media.muted = true;
        media.playsInline = true;
      } else {
        media = document.createElement("img");
        media.src = item.image;
        media.alt = item.alt || item.title;
      }

      const caption = document.createElement("div");
      caption.classList.add("caption");
      caption.innerHTML = `
        <h3>${item.title}</h3>
        <p>${item.blurb}</p>
        <span class="tag">${item.categories.join(", ")}</span>
      `;

      card.appendChild(media);
      card.appendChild(caption);

      // ✅ Add hover listeners directly to each new card’s media
      media.addEventListener("mouseenter", () => {
        hovered = true;
      });
      media.addEventListener("mouseleave", () => {
        hovered = false;
      });

      galleryContainer.appendChild(card);
    });

    galleryContainer.style.opacity = 1;
  }, 300);
}

// Smooth continuous animation loop
function startRotation(items) {
  cancelAnimationFrame(animationFrame);
  elapsedTime = 0;
  lastTimestamp = performance.now();
  animateProgress(items);
}

// Handles timing, progress bar, and batch rotation
function animateProgress(items) {
  const now = performance.now();
  const delta = now - lastTimestamp;
  lastTimestamp = now;

  if (!hovered) {
    elapsedTime += delta;
    const progress = Math.min((elapsedTime / rotateDelay) * 100, 100);
    progressBar.style.width = `${progress}%`;

    if (elapsedTime >= rotateDelay) {
      elapsedTime = 0;
      currentBatch++;
      if (currentBatch * batchSize >= items.length) currentBatch = 0;
      displayBatch(items);
    }
  }

  animationFrame = requestAnimationFrame(() => animateProgress(items));
}

// Filter buttons
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const category = btn.dataset.category;
    currentBatch = 0;

    if (category === "All") {
      displayBatch(galleryData);
      startRotation(galleryData);
    } else {
      const filtered = galleryData.filter(item =>
        item.categories.includes(category)
      );
      displayBatch(filtered);
      startRotation(filtered);
    }
  });
});

loadGallery();
