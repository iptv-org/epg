const jsdom = require('jsdom')
const { JSDOM } = jsdom
const parse = require('parse-duration')
const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const duration = require('dayjs/plugin/duration')
dayjs.extend(duration)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'programme-tv.net',
  lang: 'fr',
  output: '../../.gh-pages/guides/programme-tv.net.xml',
  url: function ({ date, channel }) {
    return `https://www.programme-tv.net/programme/chaine/${date.format('YYYY-MM-DD')}/programme-${
      channel.site_id
    }.html`
  },
  parser: function ({ channel, content, date, lang }) {
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

        const durationInMilliseconds = parse(durationContent)
        const stop = start.add(dayjs.duration(durationInMilliseconds))

        programs.push({
          title,
          category,
          start: start.toString(),
          stop: stop.toString()
        })
      }
    })

    return programs
  }
}
