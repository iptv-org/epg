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

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',
  'Mozilla/5.0 (Windows NT 5.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.63 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.65 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
  'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36',
  'Mozilla/5.0 (Windows NT 5.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.104 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 OPR/45.0.2552.881'
]

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
      'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
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
    const pageParser = (content, type) => {
      // type: "basic" | "premium"
      // Returns an array of channel objects

      const $ = cheerio.load(content)
      const channels = []

      $('.p-channel').each((index, element) => {
        const site_id = `${type}_${$(element).find('.p-channel__id').text()}`
        const name = $(element).find('.p-channel__name').text()
        channels.push({ site_id, name, lang: 'ja' })
      })

      return channels
    }

    const getChannels = async type => {
      const response = await axios.get(`https://www.skyperfectv.co.jp/program/schedule/${type}/`, {
        headers: {
          Cookie: 'adult_auth=true;'
        }
      })
      return pageParser(response.data, type)
    }

    const fetchAllChannels = async () => {
      const basicChannels = await getChannels('basic')
      const premiumChannels = await getChannels('premium')
      const results = [...basicChannels, ...premiumChannels]
      return results
    }

    return await fetchAllChannels()
  }
}

module.exports = exported
