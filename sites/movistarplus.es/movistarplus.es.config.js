const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'movistarplus.es',
  days: 2,
  url({ channel, date }) {
    return `https://www.movistarplus.es/programacion-tv/${channel.site_id}/${date.format('YYYY-MM-DD')}`
  },
  request: {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      Referer: 'https://www.movistarplus.es/programacion-tv'
    },
    maxRedirects: 5
  },
  async parser({ content, date }) {
    let programs = []
    const $ = cheerio.load(content)

    const programDivs = $('div[id^="ele-"]').toArray()

    for (let i = 0; i < programDivs.length; i++) {
      const el = $(programDivs[i])

      const title = el.find('li.title').text().trim()
      if (!title) continue

      const timeText = el.find('li.time').text().trim()
      if (!timeText) continue

      const [hours, minutes] = timeText.split(':').map(h => parseInt(h, 10))

      // Parse time in Spain timezone (Europe/Madrid)
      let startDate = dayjs.tz(
        `${date.format('YYYY-MM-DD')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        'YYYY-MM-DD HH:mm',
        'Europe/Madrid'
      )

      // If the time is in early morning (before 5 AM), it's the next day
      if (hours < 5) {
        startDate = startDate.add(1, 'day')
      }

      // Calculate end time from next program's start time
      let endDate
      if (i < programDivs.length - 1) {
        const nextEl = $(programDivs[i + 1])
        const nextTimeText = nextEl.find('li.time').text().trim()
        if (nextTimeText) {
          const [nextHours, nextMinutes] = nextTimeText.split(':').map(h => parseInt(h, 10))
          endDate = dayjs.tz(
            `${date.format('YYYY-MM-DD')} ${nextHours.toString().padStart(2, '0')}:${nextMinutes.toString().padStart(2, '0')}`,
            'YYYY-MM-DD HH:mm',
            'Europe/Madrid'
          )

          // If the next time is in early morning (before 5 AM), it's the next day
          if (nextHours < 5) {
            endDate = endDate.add(1, 'day')
          }

          // If end time is still before or same as start time, add another day
          if (endDate.isBefore(startDate) || endDate.isSame(startDate)) {
            endDate = endDate.add(1, 'day')
          }
        }
      }

      // If no end time, use start of next day
      if (!endDate) {
        endDate = startDate.add(1, 'day').startOf('day')
      }

      const programLink = el.find('a').attr('href')
      let description = null

      if (programLink) {
        description = await getProgramDescription(programLink).catch(() => null)
      }

      programs.push({
        title,
        description,
        start: startDate,
        stop: endDate
      })
    }

    return programs
  },
  async channels() {
    const html = await axios
      .get('https://www.movistarplus.es/programacion-tv', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      })
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(html)
    let scheme = $('script:contains(ItemList)').html()
    scheme = JSON.parse(scheme)

    return scheme.itemListElement.map(el => {
      const urlParts = el.item.url.split('/')
      const site_id = urlParts.pop().toLowerCase()

      return {
        lang: 'es',
        name: el.item.name,
        site_id
      }
    })
  }
}

async function getProgramDescription(programUrl) {
  const response = await axios.get(programUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: 'https://www.movistarplus.es/programacion-tv/'
    }
  })

  const $ = cheerio.load(response.data)
  const description = $('.show-content .text p').first().text().trim() || null

  return description
}
