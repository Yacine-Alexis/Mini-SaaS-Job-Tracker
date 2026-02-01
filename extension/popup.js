// JobTracker Browser Extension - Popup Script

const API_ENDPOINTS = {
  applications: '/api/applications',
  me: '/api/me'
};

// State
let state = {
  apiUrl: '',
  user: null,
  jobData: null,
  savedAppId: null
};

// DOM Elements
const elements = {
  authSection: document.getElementById('auth-section'),
  connectedSection: document.getElementById('connected-section'),
  apiUrlInput: document.getElementById('api-url'),
  connectBtn: document.getElementById('connect-btn'),
  disconnectBtn: document.getElementById('disconnect-btn'),
  jobPreview: document.getElementById('job-preview'),
  saveForm: document.getElementById('save-form'),
  successMessage: document.getElementById('success-message'),
  errorMessage: document.getElementById('error-message'),
  errorText: document.getElementById('error-text'),
  userEmail: document.getElementById('user-email'),
  viewBtn: document.getElementById('view-btn'),
  saveAnotherBtn: document.getElementById('save-another-btn'),
  // Form fields
  company: document.getElementById('company'),
  title: document.getElementById('title'),
  location: document.getElementById('location'),
  stage: document.getElementById('stage'),
  tags: document.getElementById('tags'),
  saveBtn: document.getElementById('save-btn')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadState();
  updateUI();
  
  if (state.apiUrl && state.user) {
    detectJobInfo();
  }
});

// Event Listeners
elements.connectBtn.addEventListener('click', handleConnect);
elements.disconnectBtn.addEventListener('click', handleDisconnect);
elements.saveForm.addEventListener('submit', handleSave);
elements.viewBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: `${state.apiUrl}/applications/${state.savedAppId}` });
});
elements.saveAnotherBtn.addEventListener('click', resetForm);

// Load state from storage
async function loadState() {
  const stored = await chrome.storage.local.get(['apiUrl', 'user']);
  state.apiUrl = stored.apiUrl || 'http://localhost:3000';
  state.user = stored.user || null;
  elements.apiUrlInput.value = state.apiUrl;
}

// Save state to storage
async function saveState() {
  await chrome.storage.local.set({
    apiUrl: state.apiUrl,
    user: state.user
  });
}

// Update UI based on state
function updateUI() {
  if (state.user) {
    elements.authSection.classList.add('hidden');
    elements.connectedSection.classList.remove('hidden');
    elements.userEmail.textContent = state.user.email;
    elements.disconnectBtn.classList.remove('hidden');
  } else {
    elements.authSection.classList.remove('hidden');
    elements.connectedSection.classList.add('hidden');
    elements.disconnectBtn.classList.add('hidden');
  }
}

// Handle connect
async function handleConnect() {
  const url = elements.apiUrlInput.value.trim().replace(/\/$/, '');
  if (!url) return;

  elements.connectBtn.disabled = true;
  elements.connectBtn.textContent = 'Connecting...';

  try {
    const res = await fetch(`${url}${API_ENDPOINTS.me}`, {
      credentials: 'include'
    });

    if (!res.ok) {
      throw new Error('Please log in to JobTracker first');
    }

    const data = await res.json();
    if (!data.user) {
      throw new Error('Please log in to JobTracker first');
    }

    state.apiUrl = url;
    state.user = data.user;
    await saveState();
    updateUI();
    detectJobInfo();
  } catch (err) {
    showError(err.message || 'Failed to connect');
  } finally {
    elements.connectBtn.disabled = false;
    elements.connectBtn.textContent = 'Connect';
  }
}

// Handle disconnect
async function handleDisconnect() {
  state.user = null;
  await chrome.storage.local.remove(['user']);
  updateUI();
}

// Detect job info from current page
async function detectJobInfo() {
  elements.jobPreview.innerHTML = `
    <div class="preview-loading">
      <div class="spinner"></div>
      <span>Detecting job info...</span>
    </div>
  `;

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Execute content script to extract job data
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJobData
    });

    const jobData = results[0]?.result;
    
    if (jobData && (jobData.company || jobData.title)) {
      state.jobData = jobData;
      showJobPreview(jobData);
      populateForm(jobData);
    } else {
      showManualEntry();
    }
  } catch (err) {
    console.error('Detection error:', err);
    showManualEntry();
  }
}

// Extract job data from page (runs in content script context)
function extractJobData() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  
  let data = {
    company: '',
    title: '',
    location: '',
    url: url,
    source: ''
  };

  // LinkedIn
  if (hostname.includes('linkedin.com')) {
    data.source = 'LinkedIn';
    data.company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() ||
                   document.querySelector('.topcard__org-name-link')?.textContent?.trim() ||
                   document.querySelector('[data-tracking-control-name="public_jobs_topcard-org-name"]')?.textContent?.trim() || '';
    data.title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() ||
                 document.querySelector('.topcard__title')?.textContent?.trim() ||
                 document.querySelector('h1')?.textContent?.trim() || '';
    data.location = document.querySelector('.job-details-jobs-unified-top-card__bullet')?.textContent?.trim() ||
                    document.querySelector('.topcard__flavor--bullet')?.textContent?.trim() || '';
  }
  
  // Indeed
  else if (hostname.includes('indeed.com')) {
    data.source = 'Indeed';
    data.company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim() ||
                   document.querySelector('.jobsearch-InlineCompanyRating-companyHeader')?.textContent?.trim() || '';
    data.title = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim() ||
                 document.querySelector('.jobsearch-JobInfoHeader-title')?.textContent?.trim() ||
                 document.querySelector('h1')?.textContent?.trim() || '';
    data.location = document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.textContent?.trim() ||
                    document.querySelector('.jobsearch-JobInfoHeader-subtitle > div:last-child')?.textContent?.trim() || '';
  }
  
  // Glassdoor
  else if (hostname.includes('glassdoor.com')) {
    data.source = 'Glassdoor';
    data.company = document.querySelector('[data-test="employer-name"]')?.textContent?.trim() ||
                   document.querySelector('.employerName')?.textContent?.trim() || '';
    data.title = document.querySelector('[data-test="job-title"]')?.textContent?.trim() ||
                 document.querySelector('h1')?.textContent?.trim() || '';
    data.location = document.querySelector('[data-test="location"]')?.textContent?.trim() || '';
  }
  
  // Greenhouse
  else if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse.io')) {
    data.source = 'Greenhouse';
    data.company = document.querySelector('.company-name')?.textContent?.trim() ||
                   document.querySelector('[class*="company"]')?.textContent?.trim() || '';
    data.title = document.querySelector('h1.app-title')?.textContent?.trim() ||
                 document.querySelector('h1')?.textContent?.trim() || '';
    data.location = document.querySelector('.location')?.textContent?.trim() || '';
  }
  
  // Lever
  else if (hostname.includes('lever.co') || hostname.includes('jobs.lever.co')) {
    data.source = 'Lever';
    data.company = document.querySelector('.main-header-logo img')?.alt?.trim() ||
                   document.querySelector('[data-qa="company-name"]')?.textContent?.trim() || '';
    data.title = document.querySelector('h2.posting-headline')?.textContent?.trim() ||
                 document.querySelector('h2')?.textContent?.trim() || '';
    data.location = document.querySelector('.location')?.textContent?.trim() ||
                    document.querySelector('.posting-categories .sort-by-time')?.textContent?.trim() || '';
  }
  
  // Generic fallback - try common patterns
  else {
    data.source = hostname.replace('www.', '').split('.')[0];
    data.title = document.querySelector('h1')?.textContent?.trim() || 
                 document.querySelector('[class*="job-title"]')?.textContent?.trim() ||
                 document.querySelector('[class*="jobTitle"]')?.textContent?.trim() || '';
    data.company = document.querySelector('[class*="company"]')?.textContent?.trim() ||
                   document.querySelector('[class*="employer"]')?.textContent?.trim() || '';
    data.location = document.querySelector('[class*="location"]')?.textContent?.trim() || '';
  }

  return data;
}

// Show job preview
function showJobPreview(data) {
  const sourceBadge = data.source ? `<span class="source-badge">📍 ${data.source}</span>` : '';
  
  elements.jobPreview.innerHTML = `
    <div class="job-info">
      <div class="job-company">${escapeHtml(data.company) || 'Unknown Company'}</div>
      <div class="job-title">${escapeHtml(data.title) || 'Unknown Position'}</div>
      <div class="job-meta">
        ${data.location ? `<span>📍 ${escapeHtml(data.location)}</span>` : ''}
        ${sourceBadge}
      </div>
    </div>
  `;
  
  elements.saveForm.classList.remove('hidden');
}

// Show manual entry form
function showManualEntry() {
  elements.jobPreview.innerHTML = `
    <div class="job-info">
      <div class="job-title" style="color: var(--text-secondary);">
        Couldn't auto-detect job info. Enter details below:
      </div>
    </div>
  `;
  
  // Try to get URL anyway
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url) {
      state.jobData = { url: tabs[0].url };
    }
  });
  
  elements.saveForm.classList.remove('hidden');
}

// Populate form with detected data
function populateForm(data) {
  elements.company.value = data.company || '';
  elements.title.value = data.title || '';
  elements.location.value = data.location || '';
  elements.tags.value = data.source ? data.source.toLowerCase() : '';
}

// Handle save
async function handleSave(e) {
  e.preventDefault();
  
  elements.saveBtn.disabled = true;
  elements.saveBtn.innerHTML = `
    <div class="spinner" style="width:16px;height:16px;border-width:2px;"></div>
    Saving...
  `;
  hideError();

  const payload = {
    company: elements.company.value.trim(),
    title: elements.title.value.trim(),
    location: elements.location.value.trim() || null,
    url: state.jobData?.url || null,
    source: state.jobData?.source || null,
    stage: elements.stage.value,
    tags: elements.tags.value.split(',').map(t => t.trim()).filter(Boolean)
  };

  try {
    const res = await fetch(`${state.apiUrl}${API_ENDPOINTS.applications}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error?.message || 'Failed to save job');
    }

    state.savedAppId = data.item?.id;
    showSuccess();
  } catch (err) {
    showError(err.message);
  } finally {
    elements.saveBtn.disabled = false;
    elements.saveBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
        <polyline points="17,21 17,13 7,13 7,21"/>
        <polyline points="7,3 7,8 15,8"/>
      </svg>
      Save to JobTracker
    `;
  }
}

// Show success
function showSuccess() {
  elements.jobPreview.classList.add('hidden');
  elements.saveForm.classList.add('hidden');
  elements.successMessage.classList.remove('hidden');
}

// Reset form
function resetForm() {
  elements.successMessage.classList.add('hidden');
  elements.jobPreview.classList.remove('hidden');
  elements.saveForm.classList.remove('hidden');
  elements.saveForm.reset();
  state.savedAppId = null;
  detectJobInfo();
}

// Show error
function showError(message) {
  elements.errorText.textContent = message;
  elements.errorMessage.classList.remove('hidden');
}

// Hide error
function hideError() {
  elements.errorMessage.classList.add('hidden');
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
