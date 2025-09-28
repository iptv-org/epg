const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const crypto = require('crypto')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const WEB_CLIENT_SECRET = Buffer.from('dPr0QImQ7bc5o9LMntNba2DOsSbZcjUh')
const WEB_CLIENT_IV = Buffer.from('C8RWsrtFsoeyCyPt')

module.exports = {
  site: 'vidio.com',
  days: 2,
  url({ date, channel }) {
    return `https://api.vidio.com/livestreamings/${channel.site_id}/schedules?filter[date]=${date.format('YYYY-MM-DD')}`
  },
  request: {
    async headers() {
      const session = await loadSessionDetails()
      if (!session || !session.api_key) return null

      var cipher = crypto.createCipheriv('aes-256-cbc', WEB_CLIENT_SECRET, WEB_CLIENT_IV)
      return {
        'X-API-Key': cipher.update(session.api_key, 'utf8', 'base64') + cipher.final('base64'),
        'X-Secure-Level': 2
      }
    }
  },
  parser({ content }) {
    const programs = []
    const json = JSON.parse(content)
    if (Array.isArray(json?.data)) {
      for (const program of json.data) {
        programs.push({
          title: program.attributes.title,
          description: program.attributes.description,
          start: dayjs(program.attributes.start_time),
          stop: dayjs(program.attributes.end_time),
          image: program.attributes.image_landscape_url
        })
      }
    }

    return programs
  },
  async channels() {
    const channels = []
    const json = await axios
      .get(
        'https://api.vidio.com/livestreamings?stream_type=tv_stream',
        {
          headers: await this.request.headers()
        }
      )
      .then(response => response.data)
      .catch(console.error)

    if (Array.isArray(json?.data)) {
      for (const channel of json.data) {
        channels.push({
          lang: 'id',
          site_id: channel.id,
          name: channel.attributes.title
        })
      }
    }

    return channels
  }
}

function loadSessionDetails() {
  return axios
    .post(
      'https://www.vidio.com/auth',
      {},
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    .then(r => r.data)
    .catch(console.log)
}