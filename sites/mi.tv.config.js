const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'pt',
  site: 'mi.tv',
  channels: 'mi.tv.channels.xml',
  output: '.gh-pages/guides/mi.tv.guide.xml',
  url({ date, channel }) {
    const [country, id] = channel.site_id.split('#')
    return `https://mi.tv/${country}/async/channel/${id}/${date.format('YYYY-MM-DD')}/180`
  },
  logo({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('#listings > div.channel-info > img')
    return img ? img.src : null
  },
  parser({ content, date }) {
    const programs = []
    const dom = new JSDOM(content)
    const items = dom.window.document.querySelectorAll('#listings > ul > li')

    items.forEach(item => {
      const title = (item.querySelector('a > div.content > h2') || { textContent: '' }).textContent
      const time = (item.querySelector('a > div.content > span.time') || { textContent: '' })
        .textContent

      if (title && time) {
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
      }
    })

    return programs
  }
}
