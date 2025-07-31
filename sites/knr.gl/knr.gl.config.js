const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'knr.gl',
  days: 2,
  url: 'https://knr.gl/kl/tv/aallakaatitassat?ajax_form=1',
  request: {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    data({ date }) {
      const params = new URLSearchParams()
      params.append('list_date', date.format('YYYY-MM-DD'))
      params.append('form_id', 'knr_radio_tv_program_overview_form')
      params.append('_triggering_element_name', 'list_date')

      return params
    }
  },
  parser({ content, date }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      const prev = programs[programs.length - 1]
      const start = parseStart(item, date)
      const stop = start.add(1, 'h')
      if (prev) prev.stop = start
      programs.push({
        title: item.title,
        description: item.description,
        start,
        stop
      })
    })

    return programs
  }
}

function parseStart(item, date) {
  const time = `${date.format('YYYY-MM-DD')} ${item.time}`

  return dayjs.tz(time, 'YYYY-MM-DD HH:mm', 'America/Nuuk')
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (data.length !== 1 || !data[0].data) return []
  const $ = cheerio.load(data[0].data)

  const items = []
  $('.overview-program__list__item').each((i, el) => {
    const title = $(el).find('.overview-program__text').text().trim()
    const description = $(el)
      .find('.overview-program__sublist__item')
      .first()
      .text()
      .trim()
      .replace(/(\r\n|\n|\r)/gm, ' ')
    const time = $(el).find('.overview-program__time').text().trim()

    items.push({
      title,
      description,
      time
    })
  })

  return items
}
