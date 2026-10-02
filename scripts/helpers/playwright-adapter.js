const { chromium } = require('playwright')

let browser = null
let context = null

/**
 * Custom Axios adapter that uses Playwright to bypass Cloudflare
 */
async function playwrightAdapter(config) {
  try {
    // Initialize browser if needed
    if (!browser) {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }

    // Create context if needed
    if (!context) {
      context = await browser.newContext({
        userAgent: config.headers?.['User-Agent'] || config.headers?.['user-agent'],
        extraHTTPHeaders: config.headers || {}
      })
    }

    const page = await context.newPage()

    try {
      // Navigate to the URL
      const response = await page.goto(config.url, {
        waitUntil: 'networkidle',
        timeout: config.timeout || 30000
      })

      if (!response) {
        throw new Error('No response received')
      }

      // Get the HTML content
      const data = await page.content()
      const status = response.status()
      const headers = await response.allHeaders()

      await page.close()

      // Return in axios response format
      return {
        data,
        status,
        statusText: response.statusText(),
        headers,
        config,
        request: {}
      }
    } catch (error) {
      await page.close()
      throw error
    }
  } catch (error) {
    console.error('Playwright adapter error:', error.message)
    
    // Return axios-compatible error
    const axiosError = new Error(error.message)
    axiosError.config = config
    axiosError.code = error.code || 'ECONNABORTED'
    axiosError.request = {}
    axiosError.isAxiosError = true
    throw axiosError
  }
}

/**
 * Cleanup function to close browser
 */
async function cleanup() {
  if (context) {
    await context.close()
    context = null
  }
  if (browser) {
    await browser.close()
    browser = null
  }
}

module.exports = {
  playwrightAdapter,
  cleanup
}
