const axios = require('axios')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')

dayjs.extend(timezone)
dayjs.extend(utc)

const tz = 'Asia/Jakarta'
const dateFormat = 'YYYY-MM-DD HH:mm:ss'
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
  'Origin': 'https://cubmu.com',
  'Referer': 'https://cubmu.com/',
}
let runtimeConfig, accessToken

module.exports = {
  site: 'cubmu.com',
  days: 2,
  url({ channel, date }) {
    return `https://servicebuss.transvision.co.id/global/v2/epg/programs?channel_id=${
      channel.site_id
    }&schedule_date=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  request: {
    async headers() {
      await fetchAccessToken()

      return {
        Authorization: `Bearer ${accessToken}`,
        ...headers,
      }
    }
  },
  parser({ content }) {
    const programs = []
    if (content && typeof content === 'string') {
      content = JSON.parse(content)
    }
    if (Array.isArray(content?.data)) {
      content.data.forEach(item => {
        programs.push({
          title: item.program_name,
          start: dayjs.tz(item.schedule_start_time, dateFormat, tz),
          stop: dayjs.tz(item.schedule_end_time, dateFormat, tz),
        })
      })
    }

    return programs
  },
  async channels({ lang = 'id' }) {
    const now = dayjs()
    await fetchAccessToken()
    const result = await axios
      .get(`https://servicebuss.transvision.co.id/global/v2/master-channels?platform_id=1&page=1&per_page=100&schedule_date=${now.format('YYYY-MM-DD')}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...headers,
        }
      })
      .then(r => r.data)
      .catch(err => console.error(err.message))

    const channels = []
    if (Array.isArray(result?.data?.items)) {
      result.data.items.forEach(channel => {
        channels.push({
          lang,
          site_id: channel.channel_id,
          name: channel.channel_name,
        })
      })
    }

    return channels
  }
}

async function fetchRuntimeConfig() {
  if (!runtimeConfig) {
    const cheerio = require('cheerio')
    const url = 'https://cubmu.com/'
    const result = await axios
      .get(url)
      .then(r => r.data)
      .catch(err => console.error(err.message))

      const $ = cheerio.load(result)

    runtimeConfig = JSON.parse($('#__NEXT_DATA__').text()).runtimeConfig || {}
  }
}

async function fetchAccessToken() {
  if (!runtimeConfig) {
    await fetchRuntimeConfig()
  }
  const url = 'https://servicebuss.transvision.co.id/global/v3/auth/redirect-login'
  if (!accessToken) {
    // extracted from https://cubmu.com/_next/static/chunks/pages/_app-ac49656f9b4eac2d.js
    const f = t => {
      let e = t,
        r = 'xx',
        n = Math.round(+new Date / 1e3),
        i = ''.concat(e, '{SPLITTER}').concat(n)
      return [0, 1].map(() => {
        i = ''.concat(r).concat(btoa(i))
      }), i
    }
    const payload = {
      app_id: 'cubmu',
      device: {
        device_brand: 'Web Browser',
        device_id: 'web_browser',
        device_type: 'Opera',
        firebase_id: 'NOT_ALLOWED',
        notes: 'Web Browser-V2.1',
      },
      email_or_phone: runtimeConfig?.emailMaster,
      password: f(runtimeConfig?.passwordMaster),
      tvs_platform_id: 'standalone',
    }
    const result = await axios
      .post(url, payload, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        }
      })
      .then(r => r.data)
      .catch(err => console.error(err.message))

    if (result?.data?.access_token) {
      accessToken = result.data.access_token
    }
  }
  if (!accessToken) {
    throw new Error(`Unable to fetch access token from ${url}!`)
  }
}
