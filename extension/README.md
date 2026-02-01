# JobTracker Browser Extension

A Chrome extension to save job postings directly to your JobTracker account with one click.

## Features

- **One-Click Save**: Save any job posting to JobTracker instantly
- **Smart Detection**: Auto-detects job info from LinkedIn, Indeed, Glassdoor, Greenhouse, Lever, and more
- **Floating Button**: Appears on job listing pages for quick access
- **Context Menu**: Right-click to save jobs from any page

## Supported Job Boards

- ✅ LinkedIn Jobs
- ✅ Indeed
- ✅ Glassdoor
- ✅ Greenhouse
- ✅ Lever
- ✅ Workday
- ✅ SmartRecruiters
- ✅ Most company career pages

## Installation

### From Chrome Web Store (Recommended)
*Coming soon*

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `extension` folder from this project
6. The JobTracker icon should appear in your browser toolbar

## Usage

1. Click the JobTracker icon in your browser toolbar
2. Enter your JobTracker URL (e.g., `https://your-jobtracker.com`)
3. Click **Connect** (make sure you're logged into JobTracker)
4. Navigate to any job posting
5. Click the floating "Save to JobTracker" button or the extension icon
6. Review the auto-detected info and click **Save**

## Development

### Project Structure

```
extension/
├── manifest.json     # Extension configuration
├── popup.html        # Extension popup UI
├── popup.css         # Popup styles
├── popup.js          # Popup logic
├── content.js        # Content script (runs on job pages)
├── content.css       # Content script styles
├── background.js     # Background service worker
└── icons/            # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Building Icons

Replace the placeholder icons with actual PNG files:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

### Testing

1. Load the unpacked extension in Chrome
2. Open any job posting on a supported site
3. Click the extension icon to test the popup
4. Check the console for any errors

## Permissions

- `activeTab` - Access current tab to extract job info
- `storage` - Save connection settings locally
- Host permissions for job board domains

## Privacy

This extension:
- Only activates on job-related pages
- Stores your JobTracker URL locally
- Does not track browsing history
- Does not collect any personal data
- Only sends job data to your own JobTracker instance

## License

MIT License - See the main project LICENSE file
