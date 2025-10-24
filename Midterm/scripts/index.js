/* index.js — drives dynamic content across pages using data.json
   Uses: fetch + async/await, DOM, map/filter, arrow & callback functions, setTimeout, addEventListener
*/

const DATA_URL = 'https://raw.githubusercontent.com/tbonnell2003/divine-detailing/refs/heads/main/Midterm/data.json';
// ✅ Initialize EmailJS using Public Key
emailjs.init("kAmeXSNfzH1VLBaHZ");


// Utility: fetch JSON
const loadData = async () => {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Failed to load data.json');
  return res.json();
};

// Render helpers
const renderPackages = (packages, container) => {
  container.innerHTML = packages.map(pkg => `
    <div class="col-sm-6 col-md-4 col-lg-3">
      <div class="card package-card h-100">
        <img src="${pkg.image}" class="card-img-top" alt="${pkg.attributes.alt}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title text-primary text-center">${pkg.name}</h5>
          <p class="card-text">${pkg.description}</p>
          <ul class="small list-unstyled mb-3">
            <li><strong>Type:</strong> ${pkg.type}</li>
            <li><strong>Protection:</strong> ${pkg.attributes.protection}</li>
            <li><strong>Duration:</strong> ${pkg.attributes.duration_weeks} weeks</li>
          </ul>
          <p class="text-center fw-bold mt-auto">$${pkg.price}</p>
        </div>
      </div>
    </div>
  `).join('');
};

const renderAddons = (addons, listEl) => {
  listEl.innerHTML = addons.map(a =>
    `<li class="list-group-item d-flex justify-content-between align-items-start">
      <div>
        <div class="fw-semibold">${a.name}</div>
        <div class="small text-muted">${a.description}</div>
      </div>
      <span class="badge bg-primary rounded-pill">+$${a.price}</span>
    </li>`
  ).join('');
};

const renderServiceOptions = (packages, selectEl) => {
  // Keep services in sync with packages
  selectEl.innerHTML = `<option value="">Choose...</option>` +
    packages.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
};

const renderGallery = (items, container) => {
  container.innerHTML = items.map(g => `
    <div class="col-sm-6 col-lg-4">
      <div class="card h-100">
        <img src="${g.image}" class="card-img-top" alt="${g.alt}">
        <div class="card-body">
          <h5 class="card-title">${g.title}</h5>
          <p class="card-text">${g.blurb}</p>
          <p class="small text-muted mb-0">
            ${g.city}, ${g.state} • ${g.year} • ${g.category}
          </p>
        </div>
      </div>
    </div>
  `).join('');
};

//dynamically loads every image/video into gallery.html
async function loadGallery() {
  try {
    const res = await fetch('./data.json');
    const data = await res.json();
    const gallery = data.gallery;
    const galleryContainer = document.getElementById('galleryGrid');

    galleryContainer.innerHTML = gallery.map(item => `
      <div class="col-sm-6 col-lg-4 mb-4">
        <div class="card shadow-sm h-100">
          ${item.video
            ? `<video class="card-img-top" autoplay loop muted playsinline>
                 <source src="${item.video}" type="video/mp4">
                 Your browser does not support the video tag.
               </video>`
            : `<img src="${item.image}" alt="${item.alt}" class="card-img-top gallery-thumb" loading="lazy">`}
          <div class="card-body">
            <h5 class="card-title">${item.title}</h5>
            <p class="card-text text-muted small">${item.city}, ${item.state} (${item.year})</p>
            <p class="card-text">${item.blurb}</p>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading gallery:', err);
  }
}

if (document.getElementById('galleryGrid')) {
  loadGallery();
}

// Fade-in the hero only after the background image is actually loaded
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const bgUrl = './images/gallery/optima_sunset.jpg'; // same path as in CSS
  const probe = new Image();
  probe.src = bgUrl;

  const activate = () => hero.classList.add('is-ready');

  // If cached, complete is already true
  if (probe.complete) {
    requestAnimationFrame(activate);
  } else {
    probe.onload = activate;
    probe.onerror = activate; // fail-safe: still reveal hero if load fails
  }
});



// Render addon checkboxes dynamically from JSON
const renderAddonCheckboxes = (addons, container) => {
  if (!container) return;
  container.innerHTML = addons.map(a => `
    <div class="form-check">
      <input class="form-check-input addon-check" type="checkbox" id="addon-${a.name.replace(/\s+/g, '')}" 
             data-price="${a.price}" value="${a.name}">
      <label class="form-check-label" for="addon-${a.name.replace(/\s+/g, '')}">
        ${a.name} (+$${a.price}) — <small>${a.description}</small>
      </label>
    </div>
  `).join('');
};


const initFilters = (packages, gridEl) => {
  // Example of using callback + filter + map
  const filterBtns = document.querySelectorAll('[data-filter]');
  const applyFilter = (type) => {
    const next = type === 'all' ? packages : packages.filter(p => p.type === type);
    renderPackages(next, gridEl);
  };
  filterBtns.forEach(btn => btn.addEventListener('click', () => applyFilter(btn.dataset.filter)));
};

const initGalleryFilters = (gallery, gridEl) => {
  const btns = document.querySelectorAll('[data-gallery]');
  const apply = cat => {
    const next = cat === 'all' ? gallery : gallery.filter(g => g.category === cat);
    renderGallery(next, gridEl);
  };
  btns.forEach(b => b.addEventListener('click', () => apply(b.dataset.gallery)));
};

// Main form logic with summary line
const initScheduleForm = (packages, addons) => {
  const form = document.getElementById('scheduleForm');
  const serviceSelect = document.getElementById('service');
  const addonsContainer = document.getElementById('addonsContainer');
  const totalSummary = document.getElementById('totalSummary');

  if (serviceSelect) renderServiceOptions(packages, serviceSelect);
  if (addonsContainer) renderAddonCheckboxes(addons, addonsContainer);

  // Update price summary
  const updateSummary = () => {
    const service = serviceSelect.value;
    const pkg = packages.find(p => p.name === service);
    let total = pkg ? pkg.price : 0;

    const addonChecks = document.querySelectorAll('.addon-check:checked');
    addonChecks.forEach(cb => total += Number(cb.dataset.price));

    totalSummary.textContent = `Total: $${total}`;
  };

  if (serviceSelect) serviceSelect.addEventListener('change', updateSummary);
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('addon-check')) updateSummary();
  });

  // Handle form submission
  if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const date = document.getElementById('date').value;
    const service = serviceSelect.value;
    const vehicle = document.getElementById('vehicle').value.trim();
    const condition = document.getElementById('condition').value;

    const selectedAddons = Array.from(document.querySelectorAll('.addon-check:checked'))
                               .map(cb => cb.value);

    const pkg = packages.find(p => p.name === service);
    let total = pkg ? pkg.price : 0;
    selectedAddons.forEach(addon => {
      const found = addons.find(a => a.name === addon);
      if (found) total += found.price;
    });

    const req = {
      name,
      email,
      service,
      vehicle,
      condition,
      date,
      addons: selectedAddons,
      total,
      createdAt: new Date().toISOString()
      
    };


     // ✅ Then call EmailJS using req
     emailjs.send("service_divinedetailing", "template_divinedetailing", req)
    .then(() => console.log("Email sent!"))
    .catch(err => console.error("Email error:", err));

    const prev = JSON.parse(localStorage.getItem('requests') || '[]');
    localStorage.setItem('requests', JSON.stringify([...prev, req]));

    form.reset();
    totalSummary.textContent = 'Total: $0';

    // Personalized toast message
const toastEl = document.getElementById('thanksToast');
const toastMsg = document.getElementById('toastMessage');
if (toastMsg) {
  toastMsg.textContent = `Thanks, ${name}! Your ${vehicle} (${condition}) has been scheduled for ${date}.`;
}

// Reset + show toast
form.reset();
totalSummary.textContent = 'Total: $0';

setTimeout(() => {
  if (toastEl) {
    const toast = new bootstrap.Toast(toastEl, { delay: 5000 }); // 5 seconds
    toast.show();
  }
}, 400);

  });
}
}

// Boot
(async () => {
  try {
    const data = await loadData();

    // INDEX: packages + addons
    const packagesGrid = document.getElementById('packagesGrid');
    const addonsList = document.getElementById('addonsList');
    if (packagesGrid && addonsList) {
      // render all by default
      renderPackages(data.packages, packagesGrid);
      renderAddons(data.addons, addonsList);
      initFilters(data.packages, packagesGrid);
    }

    // GALLERY page
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid) {
      // show at least 3 items (we have more)
      renderGallery(data.gallery, galleryGrid);
      initGalleryFilters(data.gallery, galleryGrid);
    }

    // Schedule form (on index)
initScheduleForm(data.packages, data.addons);

  } catch (err) {
    console.error(err);
  }
})();
