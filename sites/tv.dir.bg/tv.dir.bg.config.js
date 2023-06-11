const axios = require('axios')
const cheerio = require('cheerio')
const { DateTime } = require('luxon')

module.exports = {
  site: 'tv.dir.bg',
  days: 2,
  url({ channel, date }) {
    return `https://tv.dir.bg/tv_channel.php?id=${channel.site_id}&dd=${date.format('DD.MM')}`
  },
  parser({ content, date }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      if (!start) return
      if (prev) {
        if (start < prev.start) {
          start = start.plus({ days: 1 })
          date = date.add(1, 'd')
        }
        prev.stop = start
      }
      const stop = start.plus({ minutes: 30 })
      programs.push({
        title: parseTitle($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const requests = [
      axios.get(`https://tv.dir.bg/programata.php?t=0`),
      axios.get(`https://tv.dir.bg/programata.php?t=1`)
    ]

    const items = await Promise.all(requests)
      .then(r => {
        return r
          .map(i => {
            const html = i.data
            const $ = cheerio.load(html)
            return $('#programa-left > div > div > div > a').toArray()
          })
          .reduce((acc, curr) => {
            acc = acc.concat(curr)
            return acc
          }, [])
      })
      .catch(console.log)

    const $ = cheerio.load('')
    return items.map(item => {
      const $item = $(item)
      return {
        lang: 'bg',
        site_id: $item.attr('href').replace('tv_channel.php?id=', ''),
        name: $item.find('div.thumbnail > img').attr('alt')
      }
    })
  }
}

function parseStart($item, date) {
  const time = $item('i').text()
  if (!time) return null
  const dateString = `${date.format('MM/DD/YYYY')} ${time}`

  return DateTime.fromFormat(dateString, 'MM/dd/yyyy HH.mm', { zone: 'Europe/Sofia' }).toUTC()
}

function parseTitle($item) {
  return $item
    .text()
    .replace(/^\d{2}.\d{2}/, '')
    .trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)

  return $('#events > li').toArray()
}
