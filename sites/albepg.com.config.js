const epgParser = require('epg-parser')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'sq',
  site: 'albepg.com',
  channels: 'albepg.com.channels.xml',
  output: '.gh-pages/guides/albepg.com.guide.xml',
  request: {
    timeout: 15000,
    headers: {
      Referer: 'http://albepg.com/epg.html'
    }
  },
  url: function () {
    return `http://albepg.com/epg/guide.xml`
  },
  logo: function ({ channel }) {
    return `http://albepg.com/tvlogi/${encodeURI(channel.site_id)}.png`
  },
  parser: function ({ content, channel, date }) {
    const results = epgParser.parse(content)
    let programs = []
    results.programs
      .filter(item => item.channel === channel.site_id)
      .forEach(item => {
        if (item.title.length && item.start && item.stop) {
          const description = item.desc.length ? item.desc[0].value : null
          const category = item.category.length ? item.category[0].value : null
          const start = dayjs.utc(item.start, 'YYYYMMDDHHmmss Z')
          const stop = dayjs.utc(item.stop, 'YYYYMMDDHHmmss Z')
          if (start.diff(date.format('YYYY-MM-DD'), 'd') === 0) {
            programs.push({
              title: item.title[0].value,
              description,
              category,
              start: start.toString(),
              stop: stop.toString()
            })
          }
        }
      })

    return programs
  }
}
