const axios = require('axios')
const dayjs = require('dayjs')
const cheerio = require('cheerio')
const duration = require('dayjs/plugin/duration')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.extend(duration)

const exported = {
  site: 'skyperfectv.co.jp',
  days: 1,
  lang: 'ja',
  url: function ({ date, channel }) {
    let [type, ...code] = channel.site_id.split('_')
    code = code.join('_')
    return `https://www.skyperfectv.co.jp/program/schedule/${type}/channel:${code}/date:${date.format(
      'YYMMDD'
    )}`
  },
  logo: function ({ channel }) {
    return `https://www.skyperfectv.co.jp/library/common/img/channel/icon/basic/m_${channel.site_id.toLowerCase()}.gif`
  },
  request: {
    headers: {
      Cookie: 'adult_auth=true',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'
    }
  },
  parser({ content, date }) {
    const $ = cheerio.load(content)
    const programs = []

    const sections = [
      { id: 'js-am', addition: 0 },
      { id: 'js-pm', addition: 0 },
      { id: 'js-md', addition: 1 }
    ]

    sections.forEach(({ id, addition }) => {
      $(`#${id} > td`).each((index, element) => {
        // `td` is a column for a day
        // the next `td` will be the next day
        const today = date.add(index + addition, 'd').tz('Asia/Tokyo')

        const parseTime = timeString => {
          // timeString is in the format "HH:mm"
          // replace `today` with the time from timeString
          const [hour, minute] = timeString.split(':').map(Number)
          return today.hour(hour).minute(minute)
        }

        const $element = $(element) // Wrap element with Cheerio
        $element.find('.p-program__item').each((itemIndex, itemElement) => {
          const $itemElement = $(itemElement) // Wrap itemElement with Cheerio
          const [start, stop] = $itemElement
            .find('.p-program__range')
            .first()
            .text()
            .split('〜')
            .map(parseTime)
          const title = $itemElement.find('.p-program__name').first().text()
          const image = $itemElement.find('.js-program_thumbnail').first().attr('data-lazysrc')
          programs.push({
            title,
            start,
            stop,
            image
          })
        })
      })
    })

    return programs
  },
  async channels() {
    const normalizeText = str => (str || '').replace(/\s+/g, ' ').trim()

    const getChannelIdFromHref = href => {
      const m = (href || '').match(/channel:([^/]+)\//i)
      return m ? normalizeText(m[1]) : ''
    }

    const pageParser = (content, type) => {
      // type: "basic" | "premium"
      const $ = cheerio.load(content)
      const map = new Map()

      $('.p-channel').each((_, element) => {
        const $el = $(element)

        const href = $el.find('a.p-channel__link').attr('href') || $el.find('a').first().attr('href')
        const idFromDom = normalizeText($el.find('.p-channel__id').first().text())
        const id = idFromDom || getChannelIdFromHref(href)

        const name = normalizeText($el.find('.p-channel__name').first().text())

        if (!id || !name) return

        const site_id = `${type}_${id}`
        if (!map.has(site_id)) {
          map.set(site_id, { site_id, name, lang: 'ja' })
        }
      })

      return Array.from(map.values())
    }

    const getChannels = async type => {
      const response = await axios.get(`https://www.skyperfectv.co.jp/program/schedule/${type}/`, {
        headers: {
          Cookie: 'adult_auth=true;',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'
        }
      })
      return pageParser(response.data, type)
    }

    const fetchAllChannels = async () => {
      const basicChannels = await getChannels('basic')
      const premiumChannels = await getChannels('premium')
      return [...basicChannels, ...premiumChannels]
    }

    return await fetchAllChannels()
  }
}

module.exports = exported
