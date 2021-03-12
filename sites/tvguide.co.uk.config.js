const jsdom = require('jsdom')
const { JSDOM } = jsdom
const { htmlToText } = require('html-to-text')
const dayjs = require('dayjs')
var customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

module.exports = {
  site: 'tvguide.co.uk',
  lang: 'en',
  output: '../../.gh-pages/guides/tvguide.co.uk.xml',
  url: function ({ date, channel }) {
    return `https://www.tvguide.co.uk/mobile/channellisting.asp?ch=${channel.site_id}`
  },
  parser: function ({ channel, content, date, lang }) {
    const programs = []
    const dom = new JSDOM(content)
    const channelListings = dom.window.document.querySelector('#channel-listings')
    const rows = channelListings.querySelectorAll('table:first-of-type > tbody > tr')

    rows.forEach(tr => {
      const time = (tr.getElementsByClassName('time')[0] || { innerHTML: '' }).innerHTML
        .toString()
        .trim()
      const title = (tr.getElementsByClassName('title')[0] || { innerHTML: '' }).innerHTML
        .toString()
        .trim()
      const detail = tr.getElementsByClassName('detail')[0] || { innerHTML: '' }
      const description = htmlToText(detail.innerHTML)

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
          start,
          stop: null,
          lang,
          channel: channel['xmltv_id']
        })
      }
    })

    return programs
  }
}
