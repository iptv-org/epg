# tvtv.us EPG Scraper

## Quick Start

### Test the scraper
```bash
# Run unit tests
npm test -- sites/tvtv.us/tvtv.us.test.js

# Test Playwright adapter
node test-playwright-tvtv.js

# Grab EPG data (use conservative settings)
npm run grab --- --sites=tvtv.us --delay=5000 --maxConnections=2
```

## How It Works

### API Structure
- **Endpoint**: `GET /partial/source/{timestamp_ms}/{channel_id}`
- **Response**: HTML (HTMX)
- **Timestamp**: Unix milliseconds at midnight UTC

### Cloudflare Bypass
Uses Playwright headless browser to bypass Cloudflare protection:
- Real Chromium browser
- JavaScript execution
- Proper TLS fingerprint
- Browser reuse for performance

### HTML Parsing
Extracts program data from HTML attributes:
- `data-time`: Start time (Unix ms)
- `data-runtime`: Duration (minutes)
- `.gridAiring`: Program container
- `.gridSubtitle`: Episode name

## Configuration

### Recommended Settings
```bash
npm run grab --- \
  --sites=tvtv.us \
  --delay=5000 \           # 5 seconds between requests
  --maxConnections=2 \     # Max 2 concurrent browsers
  --days=2                 # 2 days of EPG data
```

### Performance
- **Speed**: ~10-30 seconds per request
- **Memory**: ~100-200MB per browser instance
- **Disk**: ~300MB for Chromium binaries

## Files

- `tvtv.us.config.js` - Main configuration
- `tvtv.us.test.js` - Unit tests
- `tvtv.us.channels.xml` - Channel list
- `../../scripts/helpers/playwright-adapter.js` - Shared Cloudflare bypass adapter (reusable by other sites)

## Troubleshooting

### Browser fails to launch
```bash
npx playwright install chromium
```

### Memory issues
Reduce concurrency:
```bash
npm run grab --- --sites=tvtv.us --maxConnections=1
```

### Rate limiting
Increase delay:
```bash
npm run grab --- --sites=tvtv.us --delay=10000
```


