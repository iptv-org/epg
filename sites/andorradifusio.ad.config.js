const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'ca',
  site: 'andorradifusio.ad',
  channels: 'andorradifusio.ad.channels.xml',
  output: '.gh-pages/guides/andorradifusio.ad.guide.xml',
  url({ channel }) {
    return `https://www.andorradifusio.ad/programacio/${channel.site_id}`
  },
  parser({ content, date }) {
    const day = date.day() - 1
    const programs = []
    const dom = new JSDOM(content)
    const cols = dom.window.document.querySelectorAll('.programacio-dia')
    const colNum = day < 0 ? 6 : day
    const times = cols[colNum].querySelectorAll(`h4`)
    const titles = cols[colNum].querySelectorAll(`p`)

    times.forEach((time, i) => {
      const title = titles[i] ? titles[i].textContent : null
      if (!time || !title) return false

      const start = dayjs
        .utc(time.textContent, 'HH:mm')
        .set('D', date.get('D'))
        .set('M', date.get('M'))
        .set('y', date.get('y'))

      if (!start.isValid()) return false

      if (programs.length && !programs[programs.length - 1].stop) {
        programs[programs.length - 1].stop = start
      }

      programs.push({
        title,
        start
      })
    })

    return programs
  }
}
