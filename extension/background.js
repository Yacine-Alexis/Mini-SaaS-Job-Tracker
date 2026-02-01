// JobTracker Browser Extension - Background Service Worker

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopup') {
    // Open the extension popup
    chrome.action.openPopup();
  }
});

// Context menu for quick save
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-jobtracker',
    title: 'Save to JobTracker',
    contexts: ['page', 'selection', 'link']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-to-jobtracker') {
    // Open popup when context menu is clicked
    chrome.action.openPopup();
  }
});
