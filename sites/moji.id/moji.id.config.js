const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const currentYear = new Date().getFullYear()
const tz = 'Asia/Jakarta'

module.exports = {
  site: 'moji.id',
  days: 2,
  url: 'https://moji.id/schedule',
  logo: function (context) {
    return context.channel.logo
  },
  parser: function (context) {
    const programs = []
    const items = parseItems(context)

    items.forEach(item => {
      programs.push({
        title: item.progTitle,
        description: item.progDesc,
        start: item.progStart,
        stop: item.progStop
      })
    })

    return programs
  }
}

function parseItems(context) {
  const $ = cheerio.load(context.content)
  const schDayMonths = $('.date-slider .month').toArray()
  const schPrograms = $('.desc-slider .list-slider').toArray()
  const monthDate = dayjs(context.date).format('MMM DD')
  const items = []

  schDayMonths.forEach((schDayMonth, i) => {
    if (monthDate == $(schDayMonth).text()) {
      const schDayPrograms = $(schPrograms[i]).find('.accordion').toArray()
      schDayPrograms.forEach((program, i) => {
        const itemDay = {
          progStart: parseStart($(schDayMonth), $(program)),
          progStop: parseStop(
            $(schDayMonth),
            schDayPrograms[i + 1] ? $(schDayPrograms[i + 1]) : null
          ),
          progTitle: parseTitle($(program)),
          progDesc: parseDescription($(program))
        }
        items.push(itemDay)
      })
    }
  })

  return items
}

function parseTitle(item) {
  return item.find('.name-prog').text()
}

function parseDescription(item) {
  return item.find('.content-acc span').text()
}

function parseStart(schDayMonth, item) {
  const monthDate = schDayMonth.text().split(' ')
  const startTime = item.find('.pkl').text()

  return dayjs.tz(
    `${currentYear}-${monthDate[0]}-${monthDate[1]} ${startTime}`,
    'YYYY-MMM-DD HH:mm',
    tz
  )
}

function parseStop(schDayMonth, itemNext) {
  const monthDate = schDayMonth.text().split(' ')
  if (itemNext) {
    const stopTime = itemNext.find('.pkl').text()
    return dayjs.tz(
      `${currentYear}-${monthDate[0]}-${monthDate[1]} ${stopTime}`,
      'YYYY-MMM-DD HH:mm',
      tz
    )
  } else {
    return dayjs.tz(
      `${currentYear}-${monthDate[0]}-${(parseInt(monthDate[1]) + 1)
        .toString()
        .padStart(2, '0')} 00:00`,
      'YYYY-MMM-DD HH:mm',
      tz
    )
  }
}
