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
  async channels({ country }) {
    const area = {
      ke: 6,
      ng: 2,
      tz: 3,
      ug: 4,
      rw: 5,
      gh: 32,
      mw: 14,
      ci: 22,
      gn: 12,
      bi: 9,
      cg: 16,
      cd: 11,
      mg: 13,
      mz: 15,
      cm: 20,
      ga: 19
    }
    const data = await axios
      .get(`https://www.startimestv.com/tv_guide.html`, {
        headers: {
          Cookie: `default_areaID=${area[country]}`
        }
      })
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(data)
    const script = $('body > script:nth-child(10)').html()
    let [_, json] = script.match(/var obj = eval\( '(.*)' \);/) || [null, null]
    json = json.replace(/\\'/g, '')
    const items = JSON.parse(json)

    return items.map(i => ({
      name: i.name,
      site_id: i.id
    }))
  }
}

function parseStart($item, date) {
  const time = $item('.in > .t').text()
  const [_, HH, mm] = time.match(/^(\d{2}):(\d{2})/) || [null, null, null]

  return HH && mm ? dayjs.utc(`${date.format('YYYY-MM-DD')} ${HH}:${mm}`, 'YYYY-MM-DD HH:mm') : null
}

function parseStop($item, date) {
  const time = $item('.in > .t').text()
  const [_, HH, mm] = time.match(/(\d{2}):(\d{2})$/) || [null, null, null]

  return HH && mm ? dayjs.utc(`${date.format('YYYY-MM-DD')} ${HH}:${mm}`, 'YYYY-MM-DD HH:mm') : null
}

function parseSeason($item) {
  const title = parseTitle($item)
  const [_, season] = title.match(/ S(\d+)/) || [null, null]

  return season ? parseInt(season) : null
}

function parseEpisode($item) {
  const title = parseTitle($item)
  const [_, episode] = title.match(/ E(\d+)/) || [null, null]

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
