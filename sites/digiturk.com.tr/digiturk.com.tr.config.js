const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)
// category list is not complete
// const categories = {
//   '00': 'Diğer',
//   E0: 'Romantik Komedi',
//   E1: 'Aksiyon',
//   E4: 'Macera',
//   E5: 'Dram',
//   E6: 'Fantastik',
//   E7: 'Komedi',
//   E8: 'Korku',
//   EB: 'Polisiye',
//   EF: 'Western',
//   FA: 'Macera',
//   FB: 'Yarışma',
//   FC: 'Eğlence',
//   F0: 'Reality-Show',
//   F2: 'Haberler',
//   F4: 'Belgesel',
//   F6: 'Eğitim',
//   F7: 'Sanat ve Kültür',
//   F9: 'Life Style'
// }

module.exports = {
  site: 'digiturk.com.tr',
  days: 2,
  delay: 1000, // NOTE: under heavy load the server starts blocking requests
  url: function ({ date, channel }) {
    return `https://www.digiturk.com.tr/_Ajax/getBroadcast.aspx?channelNo=${
      channel.site_id
    }&date=${date.format('DD.MM.YYYY')}&tomorrow=false&primetime=false`
  },
  request: {
    method: 'GET',
    headers: {
      Referer: 'https://www.digiturk.com.tr/'
    }
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.PName,
        // description: item.LongDescription,
        // category: parseCategory(item),
        start: parseTime(item.PStartTime),
        stop: parseTime(item.PEndTime)
      })
    })

    programs.sort((a, b) => new Date(a.start) - new Date(b.start))

    return programs
  },
  async channels() {
    const axios = require('axios')
    const cheerio = require('cheerio')

    const data = await axios
      .get(`https://www.digiturk.com.tr/`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
      })
      .then(r => r.data)
      .catch(console.log)

    let channels = []
    const $ = cheerio.load(data)
    $('#chosen-select-channel > option').each((i, el) => {
      const site_id = $(el).attr('value')
      const name = $(el).text().trim()

      channels.push({
        lang: 'tr',
        site_id,
        name
      })
    })

    return channels
  }
}

function parseTime(time) {
  let timestamp = parseInt(time.replace('/Date(', '').replace('+0300)/', ''))
  return dayjs(timestamp)
}

// function parseCategory(item) {
//   return (item.PGenre) ? categories[item.PGenre] : null
// }

function parseItems(content) {
  if (!content) return []
  const data = JSON.parse(content)
  return data && data.BChannels && data.BChannels[0].CPrograms ? data.BChannels[0].CPrograms : []
}
