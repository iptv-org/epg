const jsdom = require('jsdom')
const { JSDOM } = jsdom
const { htmlToText } = require('html-to-text')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'en',
  site: 'tvguide.co.uk',
  channels: 'tvguide.co.uk.channels.xml',
  output: '.gh-pages/guides/tvguide.co.uk.guide.xml',
  url: function ({ date, channel }) {
    return `https://www.tvguide.co.uk/mobile/channellisting.asp?ch=${channel.site_id}`
  },
  parser: function ({ content, date }) {
    const programs = []
    const dom = new JSDOM(content)
    const channelListings = dom.window.document.querySelector('#channel-listings')
    const rows = channelListings.querySelectorAll('table:first-of-type > tbody > tr')

    rows.forEach(tr => {
      const time = (tr.getElementsByClassName('time')[0] || { textContent: '' }).textContent
        .toString()
        .trim()
      const title = (tr.getElementsByClassName('title')[0] || { textContent: '' }).textContent
        .toString()
        .trim()
      const detail = tr.getElementsByClassName('detail')[0] || { textContent: '' }
      const description = htmlToText(detail.textContent)

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
          description,
          start
        })
      }
    })

    return programs
  }
}
