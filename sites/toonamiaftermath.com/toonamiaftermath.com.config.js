process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

const dayjs = require('dayjs')
const axios = require('axios')

const API_ENDPOINT = `https://api.toonamiaftermath.com`

module.exports = {
  site: 'toonamiaftermath.com',
  days: 2,
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

    return `https://api.toonamiaftermath.com/playlist?id=${playlist._id}&addInfo=true`
  },
  parser({ content, date }) {
    let programs = []
    const items = parseItems(content, date)
    items.forEach(item => {
      programs.push({
        title: item.name,
        sub_title: item?.info?.episode,
        icon: item?.info?.image,
        start: dayjs(item.startDate),
        stop: dayjs(item.endDate)
      })
    })

    return programs
  }
}

function parseItems(content, date) {
  if (!content) return []
  const data = JSON.parse(content)
  const blocks = data?.playlist?.blocks || []

  return blocks
    .reduce((acc, curr) => {
      acc = acc.concat(curr.mediaList)

      return acc
    }, [])
    .filter(i => date.isSame(i.startDate, 'day'))
}
