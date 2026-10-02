const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const cheerio = require('cheerio')
const { playwrightAdapter } = require('../../scripts/helpers/playwright-adapter')

dayjs.extend(utc)

module.exports = {
  site: 'tvtv.us',
  days: 2,
  url({ date, channel }) {
    // New API: /partial/source/{timestamp_ms}/{channel_id}
    // Ensure date is at midnight UTC and convert to Unix timestamp in milliseconds
    const timestamp = dayjs.utc(date).startOf('day').valueOf()
    return `https://www.tvtv.us/partial/source/${timestamp}/${channel.site_id}`
  },
  request: {
    headers: {
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'HX-Request': 'true', // HTMX header - required for new API
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      'Referer': 'https://www.tvtv.us/',
      'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin'
    },
    // Use Playwright adapter to bypass Cloudflare
    adapter: playwrightAdapter
  },
  async parser({ content }) {
    const programs = []
    const $ = cheerio.load(content)

    // Parse each program from the HTML
    $('.gridAiring').each((i, elem) => {
      const $elem = $(elem)
      
      // Extract data from attributes
      const startTime = $elem.attr('data-time')
      const runtime = $elem.attr('data-runtime')
      
      if (!startTime || !runtime) return
      
      // Parse start and stop times (timestamp is in milliseconds UTC)
      const start = dayjs.utc(parseInt(startTime))
      const stop = start.add(parseInt(runtime), 'minute')
      
      // Extract title and subtitle from text content
      const titleElem = $elem.clone()
      titleElem.find('.gridSubtitle').remove()
      const title = titleElem.text().trim()
      
      const subtitle = $elem.find('.gridSubtitle').text().trim() || null
      
      if (title) {
        programs.push({
          title,
          subtitle,
          start,
          stop
        })
      }
    })

    return programs
  }
}

