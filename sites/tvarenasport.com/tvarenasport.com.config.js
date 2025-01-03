const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'tvarenasport.com',
  tz: 'Europe/Belgrade',
  lang: 'sr',
  days: 2,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  url: 'https://www.tvarenasport.com/tv-scheme',
  parser({ content, channel, date }) {
    const programs = []
    const expectedDate = date.format('YYYY-MM-DD')
    if (content) {
      const dates = []
      const $ = cheerio.load(content)
      const parent = $(
        `.tv-scheme-chanel-header img[src*="chanel-${channel.site_id}.png"]`
      ).parents('div')
      parent
        .siblings('.tv-scheme-days')
        .find('a')
        .toArray()
        .forEach(el => {
          const a = $(el)
          const dt = a.find('span:nth-child(3)').text()
          dates.push(dayjs(dt + date.year(), 'DD.MM.YYYY'))
        })
      parent
        .siblings('.tv-scheme-new-slider-wrapper')
        .find('.tv-scheme-new-slider-item')
        .toArray()
        .forEach((el, i) => {
          programs.push(...parseSchedules($(el), dates[i], module.exports.tz))
        })
      programs.forEach((s, i) => {
        if (i < programs.length - 2) {
          s.stop = programs[i + 1].start
        } else {
          s.stop = s.start.startOf('d').add(1, 'd')
        }
      })
    }

    return programs.filter(
      p =>
        p.start.format('YYYY-MM-DD') === expectedDate ||
        p.stop.format('YYYY-MM-DD') === expectedDate
    )
  },
  async channels() {
    const channels = []
    const data = await axios
      .get(this.url)
      .then(r => r.data)
      .catch(console.error)

    if (data) {
      // channel naming rule
      const names = id => {
        let match = id.match(/^\d+$/)
        if (match) {
          return `Arena Sport ${parseInt(id)}`
        }
        match = id.match(/^\d/)
        if (match) {
          return `Arena Sport ${id}`
        }
        match = id.match(/^a(\d+)(p)?/)
        if (match) {
          return `Arena ${parseInt(match[1])}${match[2] === 'p' ? ' Premium' : ''}`
        }
        return `Arena ${id}`
      }
      const $ = cheerio.load(data)
      const items = $('.tv-scheme-chanel-header img').toArray()
      for (const item of items) {
        const [, id] = $(item)
          .attr('src')
          .match(/chanel-([a-z0-9]+)\.png/) || [null, null]
        if (id) {
          channels.push({
            lang: this.lang,
            site_id: id,
            name: names(id)
          })
        }
      }
    }

    return channels
  }
}

function parseSchedules($s, date, tz) {
  const schedules = []
  const $ = $s._make
  $s.find('.slider-content')
    .toArray()
    .forEach(el => {
      schedules.push(parseSchedule($(el), date, tz))
    })

  return schedules
}

function parseSchedule($s, date, tz) {
  const time = $s.find('.slider-content-top span').text()
  const start = dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', tz)
  const category = $s.find('.slider-content-middle span').text()
  const title = $s.find('.slider-content-bottom p').text()
  const description = $s.find('.slider-content-bottom span:first').text()

  return {
    title: description ? description : title,
    description: description ? title : description,
    category,
    start
  }
}
