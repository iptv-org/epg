const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'es',
  site: 'comteco.com.bo',
  channels: 'comteco.com.bo.channels.xml',
  output: '.gh-pages/guides/comteco.com.bo.guide.xml',
  url: function ({ channel }) {
    return `https://comteco.com.bo/pages/canales-y-programacion-tv/paquete-oro/${encodeURI(
      channel.site_id
    )}`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector(
      '#myform > div.row > div:nth-child(1) > div.col-xs-5.col-sm-7 > img'
    )

    return img ? `https://comteco.com.bo${img.src}` : null
  },
  parser: function ({ content, date }) {
    const programs = []
    const dom = new JSDOM(content)
    const items = dom.window.document.querySelectorAll('#datosasociados > div > .list-group-item')
    items.forEach(item => {
      const time = (
        item.querySelector('div > div.col-xs-11 > p > span') || { textContent: '' }
      ).textContent
        .toString()
        .trim()
      const title = (
        item.querySelector('div > div.col-xs-11 > p > strong') || { textContent: '' }
      ).textContent
        .toString()
        .trim()

      if (time && title) {
        const start = dayjs
          .utc(time, 'HH:mm:ss')
          .set('D', date.get('D'))
          .set('M', date.get('M'))
          .set('y', date.get('y'))

        if (programs.length && !programs[programs.length - 1].stop) {
          programs[programs.length - 1].stop = start
        }

        programs.push({
          title,
          start: start.toString()
        })
      }
    })

    return programs
  }
}
