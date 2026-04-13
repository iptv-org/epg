const { File } = require('node:buffer')


if (typeof global.File === 'undefined') {

  global.File = File

}


const cheerio = require('cheerio')


module.exports = {

  site: 'app.tvufop.com.br',

  days: 7,

  url() {

    return 'https://app.tvufop.com.br/epg/epg_tvufop_web.xml'

  },

  parser({ content, channel, date }) {

    const $ = cheerio.load(content || '', { xmlMode: true, decodeEntities: false })

    const programs = []


    const dayStart = date.startOf('d').toDate()

    const dayEnd = date.add(1, 'd').startOf('d').toDate()


    $(`programme[channel="${channel.site_id}"]`).each((_, el) => {

      const $el = $(el)


      const start = parseXmltvDate($el.attr('start'))

      const stop = parseXmltvDate($el.attr('stop'))


      if (!start || !stop) return

      if (start >= dayEnd || stop <= dayStart) return


      const title = textOf($el, 'title')

      if (!title) return


      const item = {

        title,

        start,

        stop

      }


      const description = textOf($el, 'desc')

      if (description) item.description = description


      const icon = $el.find('icon').attr('src')

      if (icon) item.icon = icon


      const rating = $el.find('rating > value').first().text().trim()

      if (rating) item.rating = rating


      programs.push(item)

    })


    return programs

  }

}


function textOf($el, tagName) {

  return $el.find(tagName).first().text().trim()

}


function parseXmltvDate(value) {

  if (!value) return null


  const m = value.trim().match(

    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s+([+-])(\d{2})(\d{2})$/

  )


  if (!m) return null


  const [

    ,

    year,

    month,

    day,

    hour,

    minute,

    second,

    sign,

    tzHour,

    tzMinute

  ] = m


  const utcMs = Date.UTC(

    Number(year),

    Number(month) - 1,

    Number(day),

    Number(hour),

    Number(minute),

    Number(second)

  )


  const offsetMinutes =

    (Number(tzHour) * 60 + Number(tzMinute)) * (sign === '+' ? 1 : -1)


  return new Date(utcMs - offsetMinutes * 60 * 1000)

}
