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
  output: '.gh-pages/guides/vidio.com.guide.xml',
  url({ channel }) {
    return `https://www.vidio.com/live/${channel.site_id}/schedules`
  },
  parser({ content, date }) {
    const programs = []
    const dom = new JSDOM(content)

    const currdate = dayjs(
        dom.window.document.querySelector('div.b-livestreaming-daily-schedule__date-label').textContent)
    const lists = dom.window.document.querySelectorAll('div.b-livestreaming-daily-schedule__content')
    lists.forEach(list => {
      const listdate = currdate.add(
        JSON.parse(list.querySelector('div.b-livestreaming-schedule__ahoy-impression').getAttribute('data-ahoy-props') || {}).schedule_day, 'day')

      const items = list.querySelectorAll('div.b-livestreaming-daily-schedule__item')
      items.forEach(item => {
        const title = (item.querySelector('div.b-livestreaming-daily-schedule__item-content-title') || { textContent: '' }).textContent
        const time = (item.querySelector('div.b-livestreaming-daily-schedule__item-content-caption') || { textContent: '' }).textContent
        if (title && time) {
          let start = dayjs(listdate.format('YYYY-MM-DD ').concat(time.substring(0,5)), 'YYYY-MM-DD HH:mm').subtract(7, 'hour')
          let stop = dayjs(listdate.format('YYYY-MM-DD ').concat(time.substring(8,13)), 'YYYY-MM-DD HH:mm').subtract(7, 'hour')
          if (start.diff(stop, 'h') > 0) {
            stop = stop.add(1, 'day')
          }

          if (listdate.diff(date.format('YYYY-MM-DD'), 'd') === 0) {
            programs.push({
              title,
              start,
              stop
            })
          }
        }
      })
    })

    return programs
  }
}
