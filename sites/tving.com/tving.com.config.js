const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'tving.com',
  days: 2,
  url: function ({ channel, date }) {
    return `https://api.tving.com/v2/media/schedules/${channel.site_id}/${date.format(
      'YYYYMMDD'
    )}?callback=cb&pageNo=1&pageSize=500&screenCode=CSSD0200&networkCode=CSND0900&osCode=CSOD0900&teleCode=CSCD0900&apiKey=4263d7d76161f4a19a9efe9ca7903ec4`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.program.name.ko,
        description: item.program.synopsis.ko,
        categories: parseCategories(item),
        date: item.program.product_year,
        directors: item.program.director,
        actors: item.program.actor,
        start: parseStart(item),
        stop: parseStop(item),
        icon: parseIcon(item)
      })
    })

    return programs
  },
  async channels() {
    let items = await axios
      .get(`https://m.tving.com/guide/schedule.tving`)
      .then(r => r.data)
      .then(html => {
        let $ = cheerio.load(html)

        return $('ul.cb > li').toArray()
      })
      .catch(console.log)

    return items.map(item => {
      let $item = cheerio.load(item)
      let [, site_id] = $item('a')
        .attr('href')
        .match(/\?id\=(.*)/) || [null, null]
      let name = $item('img').attr('alt')

      return {
        lang: 'ko',
        site_id,
        name
      }
    })
  }
}

function parseIcon(item) {
  return item.program.image.length ? `https://image.tving.com${item.program.image[0].url}` : null
}

function parseStart(item) {
  return dayjs.tz(item.broadcast_start_time.toString(), `YYYYMMDDHHmmss`, 'Asia/Seoul')
}

function parseStop(item) {
  return dayjs.tz(item.broadcast_end_time.toString(), `YYYYMMDDHHmmss`, 'Asia/Seoul')
}

function parseCategories(item) {
  const categories = []

  if (item.category1_name) categories.push(item.category1_name.ko)
  if (item.category2_name) categories.push(item.category2_name.ko)

  return categories.filter(Boolean)
}

function parseItems(content) {
  let data = (content.match(/cb\((.*)\)/) || [null, null])[1]
  if (!data) return []
  let json = JSON.parse(data)
  if (!json || !json.body || !Array.isArray(json.body.result)) return []

  return json.body.result
}
