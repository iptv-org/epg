const urlParser = require('url')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'pl',
  site: 'programtv.onet.pl',
  channels: 'programtv.onet.pl.channels.xml',
  output: '.gh-pages/guides/programtv.onet.pl.guide.xml',
  url: function ({ date, channel }) {
    const day = dayjs().diff(date, 'd')
    return `https://programtv.onet.pl/program-tv/${channel.site_id}?dzien=${day}`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('#channelTV > section > header > span > img')

    return img ? 'https:' + img.src : null
  },
  parser: function ({ content, date }) {
    const programs = []
    const dom = new JSDOM(content)
    const items = dom.window.document.querySelectorAll(
      '#channelTV > section > div.emissions > ul > li'
    )

    items.forEach(item => {
      const title = (item.querySelector('.titles > a') || { textContent: '' }).textContent
      const description = (item.querySelector('.titles > p') || { textContent: '' }).textContent
      const category = (item.querySelector('.titles > .type') || { textContent: '' }).textContent
      const hour = (item.querySelector('.hours > .hour') || { textContent: '' }).textContent

      const start = dayjs
        .utc(hour, 'H:mm')
        .set('D', date.get('D'))
        .set('M', date.get('M'))
        .set('y', date.get('y'))

      if (programs.length && !programs[programs.length - 1].stop) {
        programs[programs.length - 1].stop = start
      }

      programs.push({
        title,
        description,
        category,
        start
      })
    })

    return programs
  }
}
