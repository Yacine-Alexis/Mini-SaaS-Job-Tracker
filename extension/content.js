// JobTracker Browser Extension - Content Script

// Inject floating save button on job listing pages
(function() {
  // Only run on job pages
  if (!isJobPage()) return;

  // Create floating button
  const button = document.createElement('div');
  button.id = 'jobtracker-save-btn';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
      <polyline points="17,21 17,13 7,13 7,21"/>
      <polyline points="7,3 7,8 15,8"/>
    </svg>
    <span>Save to JobTracker</span>
  `;
  
  document.body.appendChild(button);

  // Handle click - open extension popup
  button.addEventListener('click', () => {
    // Send message to background script to open popup
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });

  function isJobPage() {
    const url = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    // Check for common job page patterns
    return (
      url.includes('/jobs/') ||
      url.includes('/job/') ||
      url.includes('/careers/') ||
      url.includes('/vacancy') ||
      url.includes('jobid=') ||
      url.includes('/position/') ||
      pathname.includes('/jobs') ||
      pathname.includes('/careers') ||
      document.querySelector('[class*="job-title"]') ||
      document.querySelector('[class*="job-details"]') ||
      document.querySelector('[data-testid*="job"]')
    );
  }
})();
