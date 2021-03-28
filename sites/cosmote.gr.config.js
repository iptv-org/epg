const urlParser = require('url')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'el',
  site: 'cosmote.gr',
  channels: 'cosmote.gr.channels.xml',
  output: '.gh-pages/guides/cosmote.gr.guide.xml',
  url: function ({ date, channel }) {
    return `https://www.cosmote.gr/cosmotetv/residential/program/epg/programchannel?p_p_id=channelprogram_WAR_OTETVportlet&p_p_lifecycle=0&_channelprogram_WAR_OTETVportlet_platform=IPTV&_channelprogram_WAR_OTETVportlet_date=${date.format(
      'DD-MM-YYYY'
    )}&_channelprogram_WAR_OTETVportlet_articleTitleUrl=${channel.site_id}`
  },
  logo: function ({ content }) {
    const dom = new JSDOM(content)
    const img = dom.window.document.querySelector('img.channel_program-banner')

    return img ? 'https://www.cosmote.gr' + img.src : null
  },
  parser: function ({ date, content }) {
    const dom = new JSDOM(content)
    const items = dom.window.document.querySelectorAll(
      '#_channelprogram_WAR_OTETVportlet_programs > tr.visible-xs'
    )
    let programs = []
    items.forEach(item => {
      const title = (item.querySelector('a') || { textContent: '' }).textContent
      const meta = (item.querySelector('td') || { innerHTML: '' }).innerHTML
      const startTime = (item.querySelector('.start-time') || { textContent: '' }).textContent
      const endTime = (item.querySelector('.end-time') || { textContent: '' }).textContent
      const category = meta.match(/\| (.+)<br>/)[1]
      const start = dayjs
        .utc(startTime, 'HH:mm')
        .set('D', date.get('D'))
        .set('M', date.get('M'))
        .set('y', date.get('y'))
      const stop = dayjs
        .utc(endTime, 'HH:mm')
        .set('D', date.get('D'))
        .set('M', date.get('M'))
        .set('y', date.get('y'))

      programs.push({
        title,
        category,
        start,
        stop
      })
    })

    return programs
  }
}
