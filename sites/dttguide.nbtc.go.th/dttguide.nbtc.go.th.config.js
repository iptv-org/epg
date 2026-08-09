const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const BASE_URL =
  'https://dttguide.nbtc.go.th/BcsEpgDataServices/BcsEpgDataController/getProgramDataWeb'
const TIMEZONE = 'Asia/Bangkok'

module.exports = {
  site: 'dttguide.nbtc.go.th',
  days: 7,
  request: {
    method: 'POST',
    headers() {
      return {
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/json; charset=UTF-8',
        Origin: 'https://dttguide.nbtc.go.th',
        Referer: 'https://dttguide.nbtc.go.th/dttguide/',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    },
    data({ channel }) {
      const [channelType] = channel.site_id.split('|')
      return JSON.stringify({ channelType })
    },
    cache: {
      ttl: 6 * 60 * 60 * 1000 // 6 hours — API returns whole week at once
    }
  },

  // Encode channelType in the URL so each type gets its own cache entry.
  // The server ignores the query param on POST requests.
  url({ channel }) {
    const [channelType] = channel.site_id.split('|')
    return `${BASE_URL}?t=${channelType}`
  },

  parser({ content, channel, date }) {
    const programs = []
    try {
      const data = JSON.parse(content)
      if (!data.results) return programs

      const [, channelNo] = channel.site_id.split('|')
      const targetDate = date.format('DD-MM-YY')

      for (const item of data.results) {
        if (item.channelNo !== channelNo) continue
        if (item.pgDate !== targetDate) continue

        const start = dayjs.tz(
          `${item.pgDate} ${item.pgBeginTime}`,
          'DD-MM-YY HH:mm:ss',
          TIMEZONE
        )

        // Compute stop from start + duration rather than using pgEndTime,
        // since pgEndTime can be "00:00:00" for shows that run up to midnight.
        const [h, m, s] = item.pgDuration.split(':').map(Number)
        const stop = start.add(h * 3600 + m * 60 + s, 'second')

        programs.push({
          title: item.pgTitle,
          description: item.pgDesc || undefined,
          start,
          stop
        })
      }
    } catch {
      // ignore parse errors
    }
    return programs
  }
}
