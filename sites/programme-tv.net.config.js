const jsdom = require('jsdom')
const { JSDOM } = jsdom
const parseDuration = require('parse-duration')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const duration = require('dayjs/plugin/duration')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'fr',
  site: 'programme-tv.net',
  channels: 'programme-tv.net.channels.xml',
  output: '.gh-pages/guides/programme-tv.net.guide.xml',
  url: function ({ date, channel }) {
    return `https://www.programme-tv.net/programme/chaine/${date.format('YYYY-MM-DD')}/programme-${
      channel.site_id
    }.html`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector(
      '#corps > div > div.page.channel > div.gridChannel > div.gridChannel-leftColumn > div.gridChannel-epgGrid > div.gridChannel-header > div > div > div > img'
    )

    return img ? img.dataset.src : null
  },
  parser: function ({ content, date }) {
    const programs = []
    const dom = new JSDOM(content)
    const broadcastCards = dom.window.document.querySelectorAll('.singleBroadcastCard')
    broadcastCards.forEach(card => {
      const hour = (
        card.getElementsByClassName('singleBroadcastCard-hour')[0] || { textContent: '' }
      ).textContent
        .toString()
        .trim()
      const durationContent = (
        card.getElementsByClassName('singleBroadcastCard-durationContent')[0] || { textContent: '' }
      ).textContent
        .toString()
        .trim()
      const title = (
        card.getElementsByClassName('singleBroadcastCard-title')[0] || { textContent: '' }
      ).textContent
        .toString()
        .trim()
      const category = (
        card.getElementsByClassName('singleBroadcastCard-genre')[0] || { textContent: '' }
      ).textContent
        .toString()
        .trim()

      if (hour && title) {
        const start = dayjs
          .utc(hour.replace('h', '-'), 'HH-mm')
          .set('D', date.get('D'))
          .set('M', date.get('M'))
          .set('y', date.get('y'))

        let stop = null
        if (durationContent) {
          const durationInMilliseconds = parseDuration(durationContent)
          stop = start.add(dayjs.duration(durationInMilliseconds)).toString()
        }

        programs.push({
          title,
          category,
          start: start.toString(),
          stop
        })
      }
    })

    return programs
  }
}
