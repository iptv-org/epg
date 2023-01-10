const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'novasports.gr',
  days: 2,
  url: function ({ date, channel }) {
    return `https://www.novasports.gr/wp-admin/admin-ajax.php?action=nova_get_template&template=tv-program/broadcast&dt=${date.format(
      'YYYY-MM-DD'
    )}`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      const $item = cheerio.load(item)
      const prev = programs[programs.length - 1]
      let start = parseStart($item, date)
      let stop = start.add(30, 'm')
      if (prev) {
        if (start.isBefore(prev.start)) {
          start = start.add(1, 'd')
          stop = stop.add(1, 'd')
        }
        prev.stop = start
      }
      programs.push({
        title: parseTitle($item),
        description: parseDescription($item),
        start,
        stop
      })
    })

    return programs
  },
  async channels() {
    const html = await axios
      .get(
        `https://www.novasports.gr/wp-admin/admin-ajax.php?action=nova_get_template&template=tv-program/broadcast&dt=2022-10-29`
      )
      .then(r => r.data)
      .catch(console.log)
    const $ = cheerio.load(html)
    const items = $(
      `#mc-broadcast-content:nth-child(2) > div > #channelist-slider > div.channelist-wrapper.slider-wrapper.content > div > div`
    ).toArray()
    return items.map(item => {
      const name = $(item).find('.channel').text().trim()

      return {
        lang: 'el',
        site_id: name,
        name
      }
    })
  }
}

function parseTitle($item) {
  return $item('.title').text().trim()
}

function parseDescription($item) {
  return $item('.subtitle').text().trim()
}

function parseStart($item, date) {
  const timeString = $item('.time').text().trim()

  return dayjs.tz(`${date.format('YYYY-MM-DD')} ${timeString}`, 'YYYY-MM-DD HH:mm', 'Europe/Athens')
}

function parseItems(content, channel) {
  const $ = cheerio.load(content)
  const $channelElement = $(
    `#mc-broadcast-content:nth-child(2) > div > #channelist-slider > div.channelist-wrapper.slider-wrapper.content > div > div:contains("${channel.site_id}")`
  )

  return $channelElement.find('.channel-program > div').toArray()
}
