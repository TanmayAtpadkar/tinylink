// API Base URL
const API_URL = '/api';

// Get code from URL
const pathParts = window.location.pathname.split('/');
const code = pathParts[pathParts.length - 1];

// DOM Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const statsContent = document.getElementById('statsContent');
const shortLinkInput = document.getElementById('shortLink');
const targetUrlLink = document.getElementById('targetUrl');
const totalClicksEl = document.getElementById('totalClicks');
const createdAtEl = document.getElementById('createdAt');
const lastClickedEl = document.getElementById('lastClicked');
const shortCodeEl = document.getElementById('shortCode');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
});

// Load Stats
async function loadStats() {
  loadingState.classList.remove('hidden');
  errorState.classList.add('hidden');
  statsContent.classList.add('hidden');

  try {
    const response = await fetch(`${API_URL}/links/${code}`);

    if (!response.ok) {
      throw new Error('Link not found');
    }

    const link = await response.json();

    loadingState.classList.add('hidden');
    statsContent.classList.remove('hidden');

    // Populate data
    const shortUrl = `${window.location.origin}/${link.code}`;
    shortLinkInput.value = shortUrl;

    targetUrlLink.href = link.target_url;
    targetUrlLink.textContent = link.target_url;

    totalClicksEl.textContent = link.clicks;
    shortCodeEl.textContent = link.code;

    const createdDate = new Date(link.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    createdAtEl.textContent = createdDate;

    if (link.last_clicked) {
      const lastClickedDate = new Date(link.last_clicked).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      lastClickedEl.textContent = lastClickedDate;
    } else {
      lastClickedEl.textContent = 'Never';
    }

  } catch (error) {
    console.error('Error loading stats:', error);
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
  }
}

// Copy Link
function copyStatsLink() {
  shortLinkInput.select();
  shortLinkInput.setSelectionRange(0, 99999);
  
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

// Delete Link
async function deleteLink() {
  if (!confirm(`Are you sure you want to delete this link? This action cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/links/${code}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete link');
    }

    alert('Link deleted successfully');
    window.location.href = '/';

  } catch (error) {
    console.error('Error deleting link:', error);
    alert('Failed to delete link');
  }
}