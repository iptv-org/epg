const jsdom = require('jsdom')
const { JSDOM } = jsdom
const { htmlToText } = require('html-to-text')
const dayjs = require('dayjs')
var customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

module.exports = {
  site: 'ontvtonight.com',
  lang: 'en',
  output: '../../.gh-pages/guides/ontvtonight.com.xml',
  url: function ({ date, channel }) {
    return `https://www.ontvtonight.com/uk/guide/listings/channel/${
      channel.site_id
    }.html?dt=${date.format('YYYY-MM-DD')}`
  },
  parser: function ({ channel, content, date, lang }) {
    const programs = []
    const dom = new JSDOM(content)
    const items = dom.window.document.querySelectorAll(
      '#content > div > div > div.span6 > table > tbody > tr'
    )

    items.forEach(item => {
      const time = (item.querySelector('td:nth-child(1) > h5') || { textContent: '' }).textContent
        .toString()
        .trim()
      const title = (
        item.querySelector('td:nth-child(2) > h5 > a') || { textContent: '' }
      ).textContent
        .toString()
        .trim()

      if (time && title) {
        const start = dayjs
          .utc(time, 'h:mma')
          .set('D', date.get('D'))
          .set('M', date.get('M'))
          .set('y', date.get('y'))
          .toString()

        if (programs.length && !programs[programs.length - 1].stop) {
          programs[programs.length - 1].stop = start
        }

        programs.push({
          title,
          start
        })
      }
    })

    return programs
  }
}
