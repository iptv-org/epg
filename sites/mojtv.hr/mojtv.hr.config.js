const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

// mojtv.hr — Croatian TV guide (server-rendered ASP.NET). Each channel has a per-day page at
//   /kanal/tv-program/<id>/<slug>/<YYYY-MM-DD>.aspx   (the slug is ignored by the routing)
// whose <li> rows carry an <a class="show" rel="START-STOP"> with full local datetimes, a
// <strong class="title">, and a description <span>. Times are Europe/Zagreb wall-clock.
const SITE = 'mojtv.hr'
const BASE = 'https://mojtv.hr'
const TZ = 'Europe/Zagreb'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

// rel="2026-06-22 06:25:00-2026-06-22 06:45:00" → [, start, stop]
const REL_RE = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})-(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/

// Category list pages (negative ids) — unioned to enumerate every channel mojtv covers.
const CATEGORIES = [-1, -2, -3, -5, -6, -7, -8, -9, -10, -11, -12, -13, -16]

module.exports = {
  site: SITE,
  days: 7,
  lang: 'hr',
  request: {
    headers: { 'User-Agent': UA },
    cache: {
      ttl: 60 * 60 * 1000 // 1h
    }
  },
  url({ channel, date }) {
    return `${BASE}/kanal/tv-program/${channel.site_id}/x/${date.format('YYYY-MM-DD')}.aspx`
  },
  parser({ content, date }) {
    const expected = date.format('YYYY-MM-DD')
    const $ = cheerio.load(content)
    const programs = []
    // The page renders the day across TWO overlapping `.tvprogram-lista` blocks (an early
    // "big" list + the main list), so dedup by exact start so each programme appears once.
    const seen = new Set()
    $('.tvprogram-lista li').each((_, li) => {
      const $li = $(li)
      const a = $li.find('a.show').first()
      const m = REL_RE.exec(a.attr('rel') || '')
      if (!m) return // spacer/ad rows have no rel
      // Keep only programmes that START on the requested day, so adjacent day-grabs don't
      // double-count a late-night programme that the site lists on both pages.
      if (m[1].slice(0, 10) !== expected) return
      if (seen.has(m[1])) return
      seen.add(m[1])
      // Two row formats exist: featured rows use <strong class="title"> + a <span> desc;
      // most rows use a plain <strong> title + <strong class="desc">. The title is the first
      // <strong> in .h that isn't the description.
      const $h = $li.find('span.h').first()
      const title = $h.find('strong').not('.desc').first().text().trim()
      if (!title) return
      const description =
        $h.find('strong.desc').first().text().trim() || $h.children('span').first().text().trim()
      programs.push({
        title,
        description: description || null,
        start: dayjs.tz(m[1], 'YYYY-MM-DD HH:mm:ss', TZ),
        stop: dayjs.tz(m[2], 'YYYY-MM-DD HH:mm:ss', TZ)
      })
    })
    return programs
  },
  async channels() {
    const seen = new Set()
    const channels = []
    const pages = await Promise.all(
      CATEGORIES.map((id) =>
        axios
          .get(`${BASE}/tv-program/${id}/x.aspx`, { headers: { 'User-Agent': UA } })
          .then((r) => r.data)
          .catch(() => null),
      ),
    )
    for (const data of pages) {
      if (!data) continue
      const $ = cheerio.load(data)
      $('a[href*="/kanal/tv-program/"]').each((_, a) => {
        const href = $(a).attr('href') || ''
        const m = href.match(/\/kanal\/tv-program\/(\d+)\//)
        if (!m || seen.has(m[1])) return
        const name = ($(a).text().trim() || $(a).find('img').attr('alt') || '').trim()
        if (!name) return
        seen.add(m[1])
        channels.push({ lang: 'hr', site_id: m[1], name })
      })
    }
    return channels
  }
}
