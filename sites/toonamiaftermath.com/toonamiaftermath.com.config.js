process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

const dayjs = require('dayjs')
const axios = require('axios')

const API_ENDPOINT = `https://api.toonamiaftermath.com`

module.exports = {
  site: 'toonamiaftermath.com',
  days: 3,
  async url({ channel, date }) {
    const playlists = await axios
      .get(
        `${API_ENDPOINT}/playlists?scheduleName=${channel.site_id}&startDate=${date
          .add(1, 'd')
          .toJSON()}&thisWeek=true&weekStartDay=monday`
      )
      .then(r => r.data)
      .catch(console.error)

    const playlist = playlists.find(p => date.isSame(p.startDate, 'day'))

    return `${API_ENDPOINT}/playlist?id=${playlist._id}&addInfo=true`
  },
  parser({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.name,
        sub_title: parseEpisode(item),
        icon: parseIcon(item),
        start: dayjs(item.startDate),
        stop: dayjs(item.endDate)
      })
    })

    return programs
  }
}

function parseItems(content) {
  if (!content) return []
  const data = JSON.parse(content)
  if (!data || !data.playlist) return []

  return data.playlist.blocks
    .reduce((acc, curr) => {
      acc = acc.concat(curr.mediaList)

      return acc
    }, [])
}

function parseEpisode(item) {
  return (item && item.info && item.info.episode) ? item.info.episode : null
}

function parseIcon(item) {
  return (item && item.info && item.info.image) ? item.info.image : null
}