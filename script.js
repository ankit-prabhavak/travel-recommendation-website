// ===========================
// NAVIGATION
// ===========================

function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

  // Show target section
  const target = document.getElementById(sectionId);
  if (target) target.classList.add('active');

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === sectionId);
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleNav() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
}

function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ===========================
// SEARCH
// ===========================

function handleSearch(isMobile = false) {
  const inputId = isMobile ? 'mobileSearchInput' : 'searchInput';
  const query = document.getElementById(inputId).value.trim();

  if (!query) {
    shakeInput(inputId);
    return;
  }

  // Sync both inputs
  document.getElementById('searchInput').value = query;
  document.getElementById('mobileSearchInput').value = query;

  // Make sure home section is active
  showSection('home');
  closeMobileMenu();

  // Fetch data
  fetchRecommendations(query.toLowerCase());
}

function shakeInput(id) {
  const el = document.getElementById(id);
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake 0.4s ease';
  el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
  el.focus();
}

// Add shake animation dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }
`;
document.head.appendChild(shakeStyle);

function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('mobileSearchInput').value = '';
  const resultsSection = document.getElementById('resultsSection');
  resultsSection.style.display = 'none';
  document.getElementById('resultsGrid').innerHTML = '';
}

function quickSearch(term) {
  document.getElementById('searchInput').value = term;
  document.getElementById('mobileSearchInput').value = term;
  fetchRecommendations(term);
}

// ===========================
// DATA FETCHING
// ===========================

async function fetchRecommendations(query) {
  showLoadingState();

  try {
    const response = await fetch('travel_recommendation_api.json');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    processResults(query, data);
  } catch (error) {
    console.error('Fetch error:', error);
    showErrorState();
  }
}

function processResults(query, data) {
  const results = [];
  const q = query.toLowerCase();

  // Match beaches
  if (q.includes('beach') || q.includes('beaches') || q.includes('beac')) {
    data.beaches.forEach(item => {
      results.push({
        type: 'Beach',
        name: item.name,
        imageUrl: item.imageUrl,
        description: item.description,
        rating: item.rating,
        timezone: null
      });
    });
  }

  // Match temples
  if (q.includes('temple') || q.includes('temples') || q.includes('templ')) {
    data.temples.forEach(item => {
      results.push({
        type: 'Temple',
        name: item.name,
        imageUrl: item.imageUrl,
        description: item.description,
        rating: item.rating,
        timezone: null
      });
    });
  }

  // Match countries / cities
  if (q.includes('country') || q.includes('countries') || q.includes('countr')) {
    data.countries.forEach(country => {
      country.cities.forEach(city => {
        results.push({
          type: country.name,
          name: city.name + ', ' + country.name,
          imageUrl: city.imageUrl,
          description: city.description,
          rating: city.rating,
          timezone: city.timezone
        });
      });
    });
  }

  // Match specific country by name
  if (results.length === 0) {
    data.countries.forEach(country => {
      if (country.name.toLowerCase().includes(q) || q.includes(country.name.toLowerCase())) {
        country.cities.forEach(city => {
          results.push({
            type: country.name,
            name: city.name + ', ' + country.name,
            imageUrl: city.imageUrl,
            description: city.description,
            rating: city.rating,
            timezone: city.timezone
          });
        });
      }
    });
  }

  // Match specific city by name
  if (results.length === 0) {
    data.countries.forEach(country => {
      country.cities.forEach(city => {
        if (city.name.toLowerCase().includes(q) || q.includes(city.name.toLowerCase())) {
          results.push({
            type: country.name,
            name: city.name + ', ' + country.name,
            imageUrl: city.imageUrl,
            description: city.description,
            rating: city.rating,
            timezone: city.timezone
          });
        }
      });
    });
  }

  displayResults(results, query);
}

// ===========================
// DISPLAY RESULTS
// ===========================

function showLoadingState() {
  const resultsSection = document.getElementById('resultsSection');
  const grid = document.getElementById('resultsGrid');

  resultsSection.style.display = 'block';
  document.getElementById('resultsEyebrow').textContent = 'Searching…';
  document.getElementById('resultsTitle').textContent = 'Finding your perfect destination';

  grid.innerHTML = `
    <div class="no-results">
      <div class="no-icon">🔍</div>
      <h3>Searching destinations…</h3>
      <p>Curating the best options for you</p>
    </div>
  `;

  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showErrorState() {
  const grid = document.getElementById('resultsGrid');
  document.getElementById('resultsEyebrow').textContent = 'Error';
  document.getElementById('resultsTitle').textContent = 'Something went wrong';
  grid.innerHTML = `
    <div class="no-results">
      <div class="no-icon">⚠️</div>
      <h3>Could not load recommendations</h3>
      <p>Please ensure the JSON file is present and try again.</p>
    </div>
  `;
}

function displayResults(results, query) {
  const resultsSection = document.getElementById('resultsSection');
  const grid = document.getElementById('resultsGrid');
  const eyebrow = document.getElementById('resultsEyebrow');
  const title = document.getElementById('resultsTitle');

  resultsSection.style.display = 'block';

  if (results.length === 0) {
    eyebrow.textContent = 'No Results Found';
    title.textContent = 'Try a different search';
    grid.innerHTML = `
      <div class="no-results">
        <div class="no-icon">🗺️</div>
        <h3>No destinations found for "${query}"</h3>
        <p>Try searching for "beach", "temple", "country", "Japan", "Sydney", or "Toronto".</p>
      </div>
    `;
    return;
  }

  eyebrow.textContent = `${results.length} Destination${results.length !== 1 ? 's' : ''} Found`;
  title.textContent = formatQueryTitle(query);

  grid.innerHTML = results.map((item, i) => buildCard(item, i)).join('');

  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatQueryTitle(query) {
  const q = query.toLowerCase();
  if (q.includes('beach') || q.includes('beac')) return 'Top Beach Destinations';
  if (q.includes('temple') || q.includes('templ')) return 'Sacred Temple Destinations';
  if (q.includes('country') || q.includes('countr')) return 'Countries to Explore';
  return `Destinations: "${query}"`;
}

function buildCard(item, index) {
  const stars = generateStars(item.rating);
  const timeHtml = item.timezone
    ? `<span class="result-card-time" id="time-${index}">Loading time…</span>`
    : '';

  const cardHtml = `
    <div class="result-card" style="animation-delay: ${index * 0.06}s">
      <div class="result-card-image">
        <img src="${item.imageUrl}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80'" />
      </div>
      <div class="result-card-body">
        <p class="result-card-tag">${item.type}</p>
        <h3 class="result-card-title">${item.name}</h3>
        <p class="result-card-desc">${item.description}</p>
        <div class="result-card-meta">
          <span class="result-card-rating">${stars} ${item.rating} / 5.0</span>
          ${timeHtml}
        </div>
      </div>
    </div>
  `;

  // Update time asynchronously
  if (item.timezone) {
    setTimeout(() => updateLocalTime(index, item.timezone), 50);
  }

  return cardHtml;
}

function generateStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  let stars = '★'.repeat(full);
  if (half) stars += '½';
  return stars;
}

function updateLocalTime(index, timezone) {
  const el = document.getElementById(`time-${index}`);
  if (!el) return;

  try {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    el.textContent = `Local: ${time}`;
  } catch (e) {
    el.textContent = '';
  }
}

// ===========================
// CONTACT FORM
// ===========================

function submitForm() {
  const name = document.getElementById('fname');
  const email = document.getElementById('femail');
  const message = document.getElementById('fmessage');

  // Clear previous errors
  clearFormErrors();
  let valid = true;

  if (!name.value.trim()) {
    showFieldError('fnameError', name, 'Please enter your full name.');
    valid = false;
  }

  if (!email.value.trim()) {
    showFieldError('femailError', email, 'Please enter your email address.');
    valid = false;
  } else if (!isValidEmail(email.value)) {
    showFieldError('femailError', email, 'Please enter a valid email address.');
    valid = false;
  }

  if (!message.value.trim()) {
    showFieldError('fmessageError', message, 'Please write a message.');
    valid = false;
  }

  if (!valid) return;

  // Show success
  document.getElementById('contactForm').style.opacity = '0';
  document.getElementById('contactForm').style.pointerEvents = 'none';

  setTimeout(() => {
    document.getElementById('contactForm').style.display = 'none';
    const successEl = document.getElementById('formSuccess');
    successEl.style.display = 'flex';
    successEl.style.animation = 'fadeIn 0.4s ease';
  }, 200);
}

function showFieldError(errorId, inputEl, message) {
  document.getElementById(errorId).textContent = message;
  inputEl.classList.add('error');
  inputEl.addEventListener('input', () => {
    inputEl.classList.remove('error');
    document.getElementById(errorId).textContent = '';
  }, { once: true });
}

function clearFormErrors() {
  ['fnameError', 'femailError', 'fmessageError'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
  ['fname', 'femail', 'fmessage'].forEach(id => {
    document.getElementById(id).classList.remove('error');
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===========================
// KEYBOARD SUPPORT
// ===========================

document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    const active = document.activeElement;
    if (active && active.id === 'searchInput') handleSearch(false);
    if (active && active.id === 'mobileSearchInput') handleSearch(true);
  }
  if (e.key === 'Escape') {
    closeMobileMenu();
  }
});

// ===========================
// INIT
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  // Show home by default
  showSection('home');
});