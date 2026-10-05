const dayjs = require('dayjs')
const axios = require('axios')

const BASIC_TOKEN =
  'MjdlMTFmNWUtODhlMi00OGU0LWJkNDItOGUxNWFiYmM2NmY1OjEyejJzMXJ3bXdhZmsxMGNkdzl0cjloOWFjYjZwdjJoZDhscXZ0aGc='

let session

module.exports = {
  site: 'epg.telemach.ba',
  days: 3,
  url({ channel, date, country }) {
    const communityId = country === 'ba' ? 12 : country === 'me' ? 5 : 12
    const languageId = country === 'ba' ? 59 : country === 'me' ? 10001 : 59

    return `https://api-web.ug-be.cdn.united.cloud/v1/public/events/epg?fromTime=${date.format(
      'YYYY-MM-DDTHH:mm:ss-00:00'
    )}&toTime=${date
      .add(1, 'days')
      .subtract(1, 's')
      .format(
        'YYYY-MM-DDTHH:mm:ss-00:00'
      )}&communityId=${communityId}&languageId=${languageId}&cid=${channel.site_id}`
  },
  request: {
    async headers({ country } = {}) {
      if (!session) {
        session = await loadSessionDetails()
        if (!session || !session.access_token) return null
      }

      const referer = country === 'me' ? 'https://epg.telemach.me/' : 'https://epg.telemach.ba/'

      return {
        Authorization: `Bearer ${session.access_token}`,
        Referer: referer
      }
    }
  },
  parser({ content }) {
    try {
      const programs = []
      const data = JSON.parse(content)
      for (const channelId in data) {
        if (Array.isArray(data[channelId])) {
          data[channelId].forEach(item => {
            programs.push({
              title: item.title,
              description: item.shortDescription,
              image: parseImage(item),
              season: item.seasonNumber,
              episode: item.episodeNumber,
              start: dayjs(item.startTime),
              stop: dayjs(item.endTime)
            })
          })
        }
      }

      return programs
    } catch {
      return []
    }
  },
  async channels({ country }) {
    const communityID = country === 'ba' ? 12 : country === 'me' ? 5 : 12
    const languageID = country === 'ba' ? 59 : country === 'me' ? 10001 : 59
    const lang = country === 'ba' ? 'hr' : country === 'me' ? 'bs' : ''

    const tokenSession = await loadSessionDetails()
    if (!tokenSession || !tokenSession.access_token) return null

    const data = await axios
      .get(
        `https://api-web.ug-be.cdn.united.cloud/v1/public/channels?channelType=TV&communityId=${communityID}&languageId=${languageID}&imageSize=L`,
        {
          headers: {
            Authorization: `Bearer ${tokenSession.access_token}`
          }
        }
      )
      .then(r => r.data)
      .catch(err => {
        console.error(err)
        return null
      })

    if (!Array.isArray(data)) return []

    return data
      .map(item => ({
        lang,
        site_id: item.id,
        name: item.name
      }))
      .sort((a, b) => {
        const ai = Number(a.site_id)
        const bi = Number(b.site_id)
        if (!Number.isFinite(ai) || !Number.isFinite(bi))
          return String(a.site_id).localeCompare(String(b.site_id))
        return ai - bi
      })
  }
}

function parseImage(item) {
  const baseURL = 'https://images-web.ug-be.cdn.united.cloud'

  return Array.isArray(item?.images) && item.images[0] ? `${baseURL}${item.images[0].path}` : null
}

async function loadSessionDetails() {
  try {
    const r = await axios.post(
      'https://api-web.ug-be.cdn.united.cloud/oauth/token?grant_type=client_credentials',
      {},
      {
        headers: {
          Authorization: `Basic ${BASIC_TOKEN}`
        }
      }
    )
    return r.data
  } catch (message) {
    return console.log(message)
  }
}
