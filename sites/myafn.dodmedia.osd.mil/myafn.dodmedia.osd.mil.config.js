const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

module.exports = {
  site: 'myafn.dodmedia.osd.mil',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url: function ({ date }) {
    return `https://v3.myafn.dodmedia.osd.mil/api/json/32/${date.format(
      'YYYY-MM-DD'
    )}@0000/${date.format('YYYY-MM-DD')}@2359/schedule.json`
  },
  parser: function ({ content, date, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const start = parseStart(item, date)
      const stop = start.add(item.o, 'm')
      programs.push({
        title: item.h,
        sub_title: item.i,
        description: item.l,
        rating: parseRating(item),
        category: parseCategory(item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(`https://v3.myafn.dodmedia.osd.mil/api/json/32/channels.json`)
      .then(r => r.data)
      .catch(console.log)

    return data.map(item => ({
      site_id: item.Channel,
      name: item.Title
    }))
  }
}

function parseStart(item, date) {
  return dayjs.utc(item.e, 'YYYY,M,D,H,m,s,0').add(1, 'month')
}

function parseCategory(item) {
  return item.m ? item.m.split(',') : []
}

function parseRating(item) {
  return item.j
    ? {
        system: 'MPA',
        value: item.j
      }
    : null
}

function parseItems(content, channel) {
  const items = JSON.parse(content)
  if (!Array.isArray(items)) return []

  return items.filter(i => i.b == channel.site_id)
}
