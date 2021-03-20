const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
var customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'en',
  site: 'ontvtonight.com',
  channels: 'ontvtonight.com.channels.xml',
  output: '.gh-pages/guides/ontvtonight.com.guide.xml',
  url: function ({ date, channel }) {
    const [region, id] = channel.site_id.split('#')
    return region
      ? `https://www.ontvtonight.com/${region}/guide/listings/channel/${id}.html?dt=${date.format(
          'YYYY-MM-DD'
        )}`
      : `https://www.ontvtonight.com/guide/listings/channel/${id}.html?dt=${date.format(
          'YYYY-MM-DD'
        )}`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img =
      dom.window.document.querySelector('#content > div > div > div.span6 > img') ||
      dom.window.document.querySelector('#inner-headline > div > div > div > img')

    return img ? img.src : null
  },
  parser: function ({ content, date }) {
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
