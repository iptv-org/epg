const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Jakarta')

module.exports = {
  lang: 'id',
  site: 'vidio.com',
  channels: 'vidio.com.channels.xml',
  output: '.gh-pages/guides/vidio.com.channels.xml',
  url({ channel }) {
    return `https://www.vidio.com/live/${channel.site_id}/schedules`
  },
  parser({ content, date }) {
    const programs = []
    const dom = new JSDOM(content)
    if (dom.window.document.querySelector('div.livestreaming-empty-state')) return programs

    const currdate = dayjs(
        dom.window.document.querySelector('div.b-livestreaming-daily-schedule__date-label').textContent,
        'DDDD, DD MMMM YYYY', 'id')
    const items = dom.window.document.querySelectorAll('div.b-livestreaming-daily-schedule__item')

    items.forEach(item => {
      const title = (item.querySelector('div.b-livestreaming-daily-schedule__item-content-title') || { textContent: '' }).textContent
      const time = (item.querySelector('b-livestreaming-daily-schedule__item-content-caption') || { textContent: '' }).textContent
      const it_date = currdate.add(JSON.parse(item.getAttribute('data-ahoy-props') || '{}').schedule_day, 'day')

      if (title && time) {
        let start = dayjs(it_date.format('YYYY-MM-DD ').concat(time.substring(0,5)), 'YYYY-MM-DD HH:mm')
        let stop = dayjs(it_date.format('YYYY-MM-DD ').concat(time.substring(8,13)), 'YYYY-MM-DD HH:mm')
        if start.diff(stop, 'h') < 0 {
          stop = stop.add(1, 'day')
        }

        if (it_date.diff(date.format('YYYY-MM-DD'), 'd') === 0) {
          programs.push({
            title,
            start,
            stop
          })
        }
      }
    })

    return programs
  }
}
