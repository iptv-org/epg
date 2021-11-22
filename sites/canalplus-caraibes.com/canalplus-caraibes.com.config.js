const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'canalplus-caraibes.com',
  url: function ({ channel, date }) {
    const diff = date.diff(dayjs.utc().startOf('d'), 'd')

    return `https://service.canal-overseas.com/ott-frontend/vector/53001/channel/${channel.site_id}/events?filter.day=${diff}`
  },
  logo({ channel }) {
    return channel.logo
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      if (item.title === 'Fin des programmes') return
      programs.push({
        title: item.title,
        icon: item.URLImageDefault,
        start: parseStart(item).toJSON(),
        stop: parseStop(item).toJSON()
      })
    })

    return programs
  },
  async channels({ country }) {
    const html = await axios
      .get(`https://www.canalplus-caraibes.com/${country}/guide-tv-ce-soir`)
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(html)
    const script = $('body > script:nth-child(2)').html()
    const [_, json] = script.match(/window.APP_STATE=(.*);/) || [null, null]
    const data = JSON.parse(json)
    const items = data.tvGuide.channels.byZapNumber

    return Object.values(items).map(item => {
      return {
        lang: 'fr',
        site_id: item.epgID,
        name: item.name,
        logo: item.LogoUrl
      }
    })
  }
}

function parseStart(item) {
  return dayjs.unix(item.startTime)
}

function parseStop(item) {
  return dayjs.unix(item.endTime)
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !data.timeSlices) return []
  const items = data.timeSlices.reduce((acc, curr) => {
    acc = acc.concat(curr.contents)
    return acc
  }, [])

  return items
}
