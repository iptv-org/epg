const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
var customParseFormat = require('dayjs/plugin/customParseFormat')
var duration = require('dayjs/plugin/duration')
dayjs.extend(duration)
dayjs.extend(customParseFormat)
const { htmlToText } = require('html-to-text')
var parse = require('parse-duration')

module.exports = {
  url: function ({ date, channel }) {
    return `https://www.programme-tv.net/programme/chaine/${date.format('YYYY-MM-DD')}/programme-${
      channel.site_id
    }.html`
  },
  parser: function ({ channel, content, date, lang }) {
    // console.log(content)
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
          lang,
          category,
          start: start.toString(),
          stop: stop.toString(),
          channel: channel['xmltv_id']
        })
      }
    })

    // console.log(programs)

    return programs
  }
}
