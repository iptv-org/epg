const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'es',
  site: 'comteco.com.bo',
  channels: 'comteco.com.bo.channels.xml',
  output: '.gh-pages/guides/comteco.com.bo.guide.xml',
  url: function ({ channel }) {
    return `https://comteco.com.bo/pages/canales-y-programacion-tv/paquete-oro/${channel.site_id}`
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
    const items = parseItems(content)
    items.forEach(item => {
      const title = parseTitle(item)
      let start = parseStart(item, date)
      const stop = parseStop(item, date)
      if (programs.length) {
        programs[programs.length - 1].stop = start
      }

      programs.push({ title, start, stop })
    })

    return programs
  }
}

function parseStop(item, date) {
  return date.tz('America/La_Paz').endOf('d')
}

function parseStart(item, date) {
  let time = (
    item.querySelector('div > div.col-xs-11 > p > span') || { textContent: '' }
  ).textContent.trim()
  time = `${date.format('MM/DD/YYYY')} ${time}`

  return dayjs.tz(time, 'MM/DD/YYYY HH:mm:ss', 'America/La_Paz')
}

function parseTitle(item) {
  return (
    item.querySelector('div > div.col-xs-11 > p > strong') || { textContent: '' }
  ).textContent.trim()
}

function parseItems(content) {
  const dom = new JSDOM(content)

  return dom.window.document.querySelectorAll('#datosasociados > div > .list-group-item')
}
