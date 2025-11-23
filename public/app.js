// API Base URL
const API_URL = '/api';

// State
let allLinks = [];

// DOM Elements
const addLinkForm = document.getElementById('addLinkForm');
const targetUrlInput = document.getElementById('targetUrl');
const customCodeInput = document.getElementById('customCode');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const urlError = document.getElementById('urlError');
const codeError = document.getElementById('codeError');
const successMessage = document.getElementById('successMessage');
const shortLinkInput = document.getElementById('shortLinkInput');
const searchInput = document.getElementById('searchInput');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const linksTableContainer = document.getElementById('linksTableContainer');
const linksTableBody = document.getElementById('linksTableBody');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadLinks();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  addLinkForm.addEventListener('submit', handleCreateLink);
  searchInput.addEventListener('input', handleSearch);
}

// Create Link
async function handleCreateLink(e) {
  e.preventDefault();

  // Reset errors
  urlError.textContent = '';
  codeError.textContent = '';
  targetUrlInput.classList.remove('error');
  customCodeInput.classList.remove('error');
  successMessage.classList.add('hidden');

  const targetUrl = targetUrlInput.value.trim();
  const customCode = customCodeInput.value.trim();

  // Basic validation
  if (!targetUrl) {
    urlError.textContent = 'Please enter a URL';
    targetUrlInput.classList.add('error');
    return;
  }

  // Show loading state
  submitBtn.disabled = true;
  btnText.classList.add('hidden');
  btnLoader.classList.remove('hidden');

  try {
    const response = await fetch(`${API_URL}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_url: targetUrl,
        code: customCode || undefined
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create link');
    }

    // Show success message
    const shortUrl = `${window.location.origin}/${data.code}`;
    shortLinkInput.value = shortUrl;
    successMessage.classList.remove('hidden');

    // Reset form
    addLinkForm.reset();

    // Reload links
    await loadLinks();

    // Scroll to success message
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (error) {
    if (error.message.includes('Invalid URL')) {
      urlError.textContent = 'Please enter a valid URL starting with http:// or https://';
      targetUrlInput.classList.add('error');
    } else if (error.message.includes('Code already exists')) {
      codeError.textContent = 'This code is already taken. Try another one.';
      customCodeInput.classList.add('error');
    } else if (error.message.includes('6-8 alphanumeric')) {
      codeError.textContent = 'Code must be 6-8 alphanumeric characters';
      customCodeInput.classList.add('error');
    } else {
      urlError.textContent = error.message || 'Failed to create link';
    }
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  }
}

// Load Links
async function loadLinks() {
  loadingState.classList.remove('hidden');
  emptyState.classList.add('hidden');
  errorState.classList.add('hidden');
  linksTableContainer.classList.add('hidden');

  try {
    const response = await fetch(`${API_URL}/links`);

    if (!response.ok) {
      throw new Error('Failed to fetch links');
    }

    allLinks = await response.json();

    loadingState.classList.add('hidden');

    if (allLinks.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      linksTableContainer.classList.remove('hidden');
      renderLinks(allLinks);
    }

  } catch (error) {
    console.error('Error loading links:', error);
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
  }
}

// Render Links
function renderLinks(links) {
  linksTableBody.innerHTML = '';

  links.forEach(link => {
    const row = document.createElement('tr');

    const shortUrl = `${window.location.origin}/${link.code}`;
    const createdDate = new Date(link.created_at).toLocaleDateString();
    const lastClicked = link.last_clicked
      ? new Date(link.last_clicked).toLocaleDateString()
      : 'Never';

    row.innerHTML = `
      <td class="code-cell">${link.code}</td>
      <td class="url-cell" title="${link.target_url}">${link.target_url}</td>
      <td>${link.clicks}</td>
      <td>${lastClicked}</td>
      <td>${createdDate}</td>
      <td class="actions-cell">
        <button class="action-btn btn-view" onclick="viewStats('${link.code}')">
          View
        </button>
        <button class="action-btn btn-delete" onclick="confirmDelete('${link.code}')">
          Delete
        </button>
      </td>
    `;

    linksTableBody.appendChild(row);
  });
}

// Search Links
function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();

  if (!query) {
    renderLinks(allLinks);
    return;
  }

  const filtered = allLinks.filter(link =>
    link.code.toLowerCase().includes(query) ||
    link.target_url.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    linksTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
          No links found matching "${query}"
        </td>
      </tr>
    `;
  } else {
    renderLinks(filtered);
  }
}

// Copy Link
function copyLink(event) {
  shortLinkInput.select();
  shortLinkInput.setSelectionRange(0, 99999); // For mobile

  navigator.clipboard.writeText(shortLinkInput.value)
    .then(() => {
      const copyBtn = event.target;
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    })
    .catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy link');
    });
}

// View Stats
function viewStats(code) {
  window.location.href = `/code/${code}`;
}

// Confirm Delete
function confirmDelete(code) {
  if (confirm(`Are you sure you want to delete the link with code "${code}"?`)) {
    deleteLink(code);
  }
}

// Delete Link
async function deleteLink(code) {
  try {
    const response = await fetch(`${API_URL}/links/${code}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete link');
    }

    // Reload links
    await loadLinks();

    // Show success (optional)
    alert('Link deleted successfully');

  } catch (error) {
    console.error('Error deleting link:', error);
    alert('Failed to delete link');
  }
}