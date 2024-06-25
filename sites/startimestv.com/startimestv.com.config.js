const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'startimestv.com',
  days: 2,
  url: function ({ channel, date }) {
    return `https://www.startimestv.com/channeldetail/${channel.site_id}/${date.format(
      'YYYY-MM-DD'
    )}.html`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      programs.push({
        title: parseTitle($item),
        season: parseSeason($item),
        episode: parseEpisode($item),
        description: parseDescription($item),
        start: parseStart($item, date),
        stop: parseStop($item, date)
      })
    })

    return programs
  },
  async channels() {
    const areas = [6, 2, 3, 4, 5, 32, 14, 22, 12, 9, 16, 11, 13, 15, 20, 19]

    const channels = []
    for (let area of areas) {
      const data = await axios
        .get('https://www.startimestv.com/tv_guide.html', {
          headers: {
            Cookie: `default_areaID=${area}`
          }
        })
        .then(r => r.data)
        .catch(console.log)

      const $ = cheerio.load(data)
      const script = $('body > script:nth-child(10)').html()
      let [, json] = script.match(/var obj = eval\( '(.*)' \);/) || [null, null]
      json = json.replace(/\\'/g, '')
      const items = JSON.parse(json)

      items.forEach(item => {
        channels.push({
          lang: 'en',
          name: item.name,
          site_id: item.id
        })
      })
    }

    return [...new Map(channels.map(channel => [channel.site_id, channel])).values()]
  }
}

function parseStart($item, date) {
  const time = $item('.in > .t').text()
  const [, HH, mm] = time.match(/^(\d{2}):(\d{2})/) || [null, null, null]

  return HH && mm ? dayjs.utc(`${date.format('YYYY-MM-DD')} ${HH}:${mm}`, 'YYYY-MM-DD HH:mm') : null
}

function parseStop($item, date) {
  const time = $item('.in > .t').text()
  const [, HH, mm] = time.match(/(\d{2}):(\d{2})$/) || [null, null, null]

  return HH && mm ? dayjs.utc(`${date.format('YYYY-MM-DD')} ${HH}:${mm}`, 'YYYY-MM-DD HH:mm') : null
}

function parseSeason($item) {
  const title = parseTitle($item)
  const [, season] = title.match(/ S(\d+)/) || [null, null]

  return season ? parseInt(season) : null
}

function parseEpisode($item) {
  const title = parseTitle($item)
  const [, episode] = title.match(/ E(\d+)/) || [null, null]

  return episode ? parseInt(episode) : null
}

function parseTitle($item) {
  return $item('.in > h3').text()
}

function parseDescription($item) {
  return $item('.in > p').text()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('div.tv_gui > div.list > div > div').toArray()
}
