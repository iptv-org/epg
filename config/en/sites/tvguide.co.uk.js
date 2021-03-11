const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
var customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

module.exports = {
  url: function ({ date, channel }) {
    return `https://www.tvguide.co.uk/mobile/channellisting.asp?ch=${channel.site_id}`
  },
  parser: function ({ channel, content, date }) {
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

      if (time && title) {
        const start = dayjs(time, 'h:mma')
          .set('D', date.get('D'))
          .set('M', date.get('M'))
          .set('y', date.get('y'))
          .toString()

        programs.push({
          title,
          description: null,
          start,
          stop: null,
          lang: 'en',
          channel: channel['xmltv_id']
        })
      }
    })

    return programs
  }
}
