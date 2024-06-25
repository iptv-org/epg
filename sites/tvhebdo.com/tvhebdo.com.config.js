const cheerio = require('cheerio')
const axios = require('axios')
const { DateTime } = require('luxon')

module.exports = {
  site: 'tvhebdo.com',
  days: 2,
  url: function ({ channel, date }) {
    return `https://www.tvhebdo.com/horaire-tele/${channel.site_id}/date/${date.format(
      'YYYY-MM-DD'
    )}`
  },
  parser: function ({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const $item = cheerio.load(item)
      let start = parseStart($item, date)
      if (prev) {
        if (start < prev.start) {
          start = start.plus({ days: 1 })
        }
        prev.stop = start
      }
      let stop = start.plus({ minutes: 30 })
      programs.push({
        title: parseTitle($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {

    let items = []
    const offsets = [
      0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360
    ]
    for (let offset of offsets) {
      const url = `https://www.tvhebdo.com/horaire/gr/offset/${offset}/gr_id/0/date/2022-05-11/time/12:00:00`
      console.log(url)
      const html = await axios
        .get(url, {
          headers: {
            Cookie:
              'distributeur=8004264; __utmz=222163677.1652094266.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); _gcl_au=1.1.656635701.1652094273; tvh=3c2kaml9u14m83v91bg4dqgaf3; __utmc=222163677; IR_gbd=tvhebdo.com; IR_MPI=cf76b363-cf87-11ec-93f5-13daf79f8f76%7C1652367602625; __utma=222163677.2064368965.1652094266.1652281202.1652281479.3; __utmt=1; IR_MPS=1652284935955%7C1652284314367; _uetsid=0d8e2e60d13b11ec850db551304ae9e7; _uetvid=80456fa0b26e11ec9bf94951ce79b5f8; __utmb=222163677.19.9.1652284953979; __atuvc=30%7C19; __atuvs=627bdb98682bc242006'
          }
        })
        .then(r => r.data)
        .catch(console.error)
      const $ = cheerio.load(html)
      const rows = $('table.gr_row').toArray()
      items = items.concat(rows)
    }

    let channels = []
    items.forEach(item => {
      const $item = cheerio.load(item)
      const name = $item('.gr_row_head > div > a.gr_row_head_logo.link_to_station > img').attr(
        'alt'
      )
      const url = $item('.gr_row_head > div > div.gr_row_head_poste > a').attr('href')
      const [, site_id] = url.match(/horaire-tele\/(.*)/) || [null, null]
      channels.push({
        lang: 'fr',
        site_id,
        name
      })
    })

    return [...new Map(channels.map(channel => [channel.site_id, channel])).values()]
  }
}

function parseTitle($item) {
  return $item('.titre').first().text().trim()
}

function parseStart($item, date) {
  const time = $item('.heure').text()

  return DateTime.fromFormat(`${date.format('YYYY-MM-DD')} ${time}`, 'yyyy-MM-dd HH:mm', {
    zone: 'America/Toronto'
  }).toUTC()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $(
    '#main_container > div.liste_container > table > tbody > tr[class^=liste_row_style_]'
  ).toArray()
}
