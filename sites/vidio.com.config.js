const jsdom = require('jsdom')
const { JSDOM } = jsdom
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

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

    const scheduleDate = dom.window.document.querySelector(
      'div.b-livestreaming-daily-schedule__date-label'
    ).textContent
    const currdate = dayjs(scheduleDate)
    const list = dom.window.document.querySelector(
      `#schedule-content-${currdate.format(
        'YYYYMMDD'
      )} > .b-livestreaming-daily-schedule__scroll-container`
    )
    const items = list.querySelectorAll('div.b-livestreaming-daily-schedule__item')
    items.forEach(item => {
      const title = (
        item.querySelector('div.b-livestreaming-daily-schedule__item-content-title') || {
          textContent: ''
        }
      ).textContent
      const time = (
        item.querySelector('div.b-livestreaming-daily-schedule__item-content-caption') || {
          textContent: ''
        }
      ).textContent
      if (title && time) {
        let start = dayjs.tz(
          currdate.format('YYYY-MM-DD ').concat(time.substring(0, 5)),
          'YYYY-MM-DD HH:mm',
          'Asia/Jakarta'
        )
        let stop = dayjs.tz(
          currdate.format('YYYY-MM-DD ').concat(time.substring(8, 13)),
          'YYYY-MM-DD HH:mm',
          'Asia/Jakarta'
        )
        if (start.diff(stop, 'h') > 0) {
          stop = stop.add(1, 'day')
        }

        programs.push({
          title,
          start,
          stop
        })
      }
    })

    return programs
  }
}
