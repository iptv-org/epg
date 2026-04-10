const dayjs = require('dayjs')
const axios = require('axios')

const API_BASE = 'https://unity.tbxapis.com/v0'
const CLIENT_ID = '6a561d048728db7c786b53b0941d0dd9'

let cachedToken = null

module.exports = {
  site: 'winplay.co',
  days: 2,
  async url({ date }) {
    const epgLink = await fetchEpgItemsURL()
    const from = dayjs(date).startOf('day').toISOString()
    const to = dayjs(date).add(1, 'day').endOf('day').toISOString()
    return epgLink + `?pageSize=25&page=1&fromEpg=${from}&toEpg=${to}`
  },
  request: {
    async headers() {
      await getToken()
      return {
        Authorization: `JWT ${cachedToken}`,
        'Content-Type': 'application/json'
      }
    }
  },
  parser({ content, channel, date }) {
    const programs = []
    const items = parseItems(content, channel, date)
    for (const item of items) {
      programs.push({
        title: item.programName || item.title,
        description: item.description || null,
        start: dayjs(item.startTime),
        stop: dayjs(item.endTime),
        episode: item.episode || null,
        season: item.season || null,
        icon: item.images?.[0]?.url || null
      })
    }

    return programs
  },
  async channels() {
    await getToken()
    const epgLink = await fetchEpgItemsURL()
    const response = await axios.get(epgLink + '?pageSize=50&page=1', {
      headers: { Authorization: `JWT ${cachedToken}` }
    })
    const data = response.data
    if (!data?.result) return []
    return data.result.map(item => ({
      site_id: item.content.signalId,
      name: item.content.title,
      lang: 'es'
    }))
  }
}

async function getToken() {
  if (cachedToken) return cachedToken
  const response = await axios.post(`${API_BASE}/auth/public`, {
    auth: {
      sub: CLIENT_ID,
      country: null,
      currentProfile: null,
      device: null,
      language: null
    }
  }, { headers: { 'Content-Type': 'application/json' } })
  cachedToken = response.data?.token?.access_token || null
  return cachedToken
}

let cachedEpgItemsURL = null

async function fetchEpgItemsURL() {
  if (cachedEpgItemsURL) return cachedEpgItemsURL

  const sectionsResp = await axios.get(`${API_BASE}/sections?page=1&pageSize=400`, {
    headers: { Authorization: `JWT ${cachedToken}` }
  })
  const programacionID = sectionsResp.data?.result?.find(s => s.name === 'Programación')?.id
  if (!programacionID) throw new Error('Programación section not found')

  const componentsResp = await axios.get(`${API_BASE}/sections/${programacionID}/components`, {
    headers: { Authorization: `JWT ${cachedToken}` }
  })
  const epgLink = componentsResp.data?.result?.find(
    c => c.active && c.componentType === 'epg_grid'
  )?.itemsURL
  if (!epgLink) throw new Error('EPG grid component not found')

  cachedEpgItemsURL = epgLink
  return cachedEpgItemsURL
}

function parseItems(content, channel, date) {
  const data = JSON.parse(content)
  if (!data?.result) return []
  const channelData = data.result.find(i => i.content?.signalId === channel.site_id)
  if (!channelData?.content?.epg) return []

  return channelData.content.epg.filter(i => dayjs(date).isSame(dayjs(i.startTime), 'd'))
}
