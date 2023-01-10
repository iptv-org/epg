const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'dishtv.in',
  days: 2,
  url: `https://www.dishtv.in/WhatsonIndiaWebService.asmx/LoadPagginResultDataForProgram`,
  request: {
    method: 'POST',
    data({ channel, date }) {
      return {
        Channelarr: channel.site_id,
        fromdate: date.format('YYYYMMDDHHmm'),
        todate: date.add(1, 'd').format('YYYYMMDDHHmm')
      }
    }
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const data = parseContent(content)
    const items = parseItems(data)
    items.forEach(item => {
      const title = parseTitle(item)
      const start = parseStart(item, date)
      const stop = parseStop(item, start)
      if (title === 'No Information Available') return

      programs.push({
        title,
        start: start.toString(),
        stop: stop.toString()
      })
    })

    return programs
  }
}

function parseTitle(item) {
  const $ = cheerio.load(item)

  return $('a').text()
}

function parseStart(item, date) {
  const $ = cheerio.load(item)
  const onclick = $('i.fa-circle').attr('onclick')
  const [_, time] = onclick.match(/RecordingEnteryOpen\('.*','.*','(.*)','.*',.*\)/)

  return dayjs.tz(time, 'YYYYMMDDHHmm', 'Asia/Kolkata')
}

function parseStop(item, start) {
  const $ = cheerio.load(item)
  const duration = $('*').data('time')

  return start.add(duration, 'm')
}

function parseContent(content) {
  const data = JSON.parse(content)

  return data.d
}

function parseItems(data) {
  const $ = cheerio.load(data)

  return $('.datatime').toArray()
}
