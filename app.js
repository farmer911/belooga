/**
 * BELOOGA LEGACY HOME SCENE CONTROLLER (home.scene.tsx Mockup Engine)
 */

document.addEventListener('DOMContentLoaded', () => {
  initSearchAutocomplete();
  initSmoothScroll();
});

// Candidate Search Autocomplete Behavior
function initSearchAutocomplete() {
  const searchInput = document.getElementById('candidate-search-input');
  const dropdown = document.getElementById('search-dropdown');
  const searchBtn = document.getElementById('btn-search-trigger');

  if (searchInput && dropdown) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (query.length > 0) {
        dropdown.style.display = 'block';
      } else {
        dropdown.style.display = 'none';
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    // Suggestion item selection
    const items = dropdown.querySelectorAll('.suggestion-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        searchInput.value = item.textContent.trim();
        dropdown.style.display = 'none';
        triggerSearch(searchInput.value);
      });
    });
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      triggerSearch(searchInput.value);
    });
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        triggerSearch(searchInput.value);
      }
    });
  }
}

function triggerSearch(keyword) {
  const q = keyword ? encodeURIComponent(keyword) : '';
  console.log(`[Belooga Navigation] Redirecting to /user/search/?key=${q}`);
  alert(`[Legacy Route Trigger]: Chuyển hướng đến Route 08 (/user/search/?key=${q})`);
}

// Interactive Video Modal Controls (matching modal states in home.scene.tsx)
function openVideoModal(title, videoSource, poster) {
  const modal = document.getElementById('video-modal');
  const titleEl = document.getElementById('modal-video-title');
  const fileEl = document.getElementById('modal-video-filename');

  if (modal) {
    if (titleEl) titleEl.textContent = title;
    if (fileEl) fileEl.textContent = `Source: /videos/home/${videoSource}`;
    modal.style.display = 'flex';
  }
}

function closeVideoModal() {
  const modal = document.getElementById('video-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeVideoModal();
  }
});

// Smooth Scroll for anchor links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }
    });
  });
}
