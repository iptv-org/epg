const cheerio = require('cheerio')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const CHANNEL_LOGO_REGEX = /chanel-([\w-]+?)\.png/
const TIMEZONE = 'Europe/Belgrade'

module.exports = {
  site: 'tvarenasport.com',
  tz: TIMEZONE,
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
    const $ = cheerio.load(content)

    $('.tv-scheme-chanel').each((_, el) => {
      const $ch = $(el)
      const logo = $ch.find('.tv-scheme-chanel-header img').attr('src') || ''
      const m = logo.match(CHANNEL_LOGO_REGEX)
      if (!m || m[1] !== channel.site_id) return
      const dates = $ch.find('.tv-scheme-days a').map((i, d) => {
        const t = $(d).find('span:nth-child(3)').text().trim()
        return dayjs(`${t}${date.year()}`, 'DD.MM.YYYY')
      }).get()
      const startIdx = dates.findIndex(d => d.format('YYYY-MM-DD') === expectedDate)
      if (startIdx === -1) return
      const sliders = $ch.find('.tv-scheme-new-slider-item')
      const slider = sliders.eq(startIdx)
      if (!slider.length) return
      let entries = parseSchedules($, slider, dates[startIdx])
      entries.forEach((e, i) => {
        const nxt = entries[i + 1]
        e.stop = nxt
          ? nxt.start
          : dayjs.tz(`${expectedDate} 23:59`, 'YYYY-MM-DD HH:mm', TIMEZONE)
      })
      programs.push(...entries)
    })
    return programs
  },

  async channels() {
    const data = await axios.get(this.url).then(r => r.data).catch(console.error)
    if (!data) return []
    const $ = cheerio.load(data)
    return $('.tv-scheme-chanel-header img')
      .map((_, img) => {
        const src = $(img).attr('src') || ''
        const m = src.match(CHANNEL_LOGO_REGEX)
        if (!m) return null
        const id = m[1]
        const displayName = getDisplayName(id)
        const xmltvId = displayName.replaceAll(' ', '').replace(/Serbia$/, '.rs')
        const logourl = `https://www.${this.site}${src}`
        return { site_id: id, lang: this.lang, xmltv_id: xmltvId, name: displayName, logo: logourl }
      })
      .get()
  }
}

function getDisplayName(id) {
  const template = name => `Arena Sport ${name} Serbia`
  let m
  if ((m = /^0*(\d+)$/.exec(id))) return template(m[1])
  if ((m = /^a+(\d+)p$/.exec(id))) return template(`${m[1]} Premium`)
  const formattedId = id.replace(/^a-/, '').replace(/^./, c => c.toUpperCase())
  return template(formattedId)
}

function parseSchedules($, $slider, date) {
  return $slider
    .find('.slider-content')
    .map((_, el) => parseSchedule($(el), date))
    .get()
}

function parseSchedule($s, date) {
  const time = $s.find('.slider-content-top span').text().trim()
  const start = dayjs.tz(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm', TIMEZONE)
  const sport = $s.find('.slider-content-middle span').text().trim()
  const titleText = $s.find('.slider-content-bottom p').text().trim()
  const league = $s.find('.slider-content-bottom span')
    .not('.live-title, .blob-text, .blob-border, .blob').first().text().trim()
  const isLive = $s.find('.blob-text').text().trim().toLowerCase() === 'uživo'
  const title = (isLive ? '(Uživo) ' : '') + (league ? `${league}: ${titleText}` : titleText)
  return { title, category: sport, start }
}