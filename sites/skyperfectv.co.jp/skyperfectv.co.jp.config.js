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
  // Specific function that permits to gather NSFW channels (needs confirmation)
  async fetchSchedule({ date, channel }) {
    const url = exported.url({ date, channel })
    const response = await axios.get(url, {
      headers: {
        Cookie: 'adult_auth=true'
      }
    })
    return response.data
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
