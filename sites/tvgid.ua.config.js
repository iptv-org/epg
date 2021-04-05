const jsdom = require('jsdom')
const iconv = require('iconv-lite')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'uk',
  site: 'tvgid.ua',
  channels: 'tvgid.ua.channels.xml',
  output: '.gh-pages/guides/tvgid.ua.guide.xml',
  url: function ({ date, channel }) {
    return `https://tvgid.ua/channels/${channel.site_id}/${date.format('DDMMYYYY')}/tmall/`
  },
  parser: function ({ buffer, date }) {
    const programs = []
    const string = iconv.decode(buffer, 'win1251')
    const dom = new JSDOM(string)
    const items = dom.window.document.querySelectorAll(
      '#container > tbody > tr:nth-child(2) > td > table > tbody > tr > td > table:nth-child(2) > tbody > tr'
    )

    items.forEach(item => {
      const time = (item.querySelector('td > table > tbody > tr > td.time') || { textContent: '' })
        .textContent
      const title = (
        item.querySelector('td > table > tbody > tr > td.item > a') ||
        item.querySelector('td > table > tbody > tr > td.item') || { textContent: '' }
      ).textContent

      const start = dayjs
        .utc(time, 'HH:mm')
        .set('D', date.get('D'))
        .set('M', date.get('M'))
        .set('y', date.get('y'))

      if (programs.length && !programs[programs.length - 1].stop) {
        programs[programs.length - 1].stop = start
      }

      programs.push({
        title,
        start
      })
    })

    return programs
  }
}
