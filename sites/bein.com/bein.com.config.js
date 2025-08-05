const axios = require('axios')
const dayjs = require('dayjs')
const cheerio = require('cheerio')
const { DateTime } = require('luxon')

module.exports = {
  site: 'bein.com',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url: function ({ date, channel }) {
    const [category] = channel.site_id.split('#')
    const postid = channel.lang === 'ar' ? '25344' : '25356'

    return `https://www.bein.com/${
      channel.lang
    }/epg-ajax-template/?action=epg_fetch&category=${category}&cdate=${date.format(
      'YYYY-MM-DD'
    )}&language=${channel.lang.toUpperCase()}&loadindex=0&mins=00&offset=0&postid=${postid}&serviceidentity=bein.net`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel)
    date = DateTime.fromMillis(date.valueOf()).minus({ days: 1 })
    items.forEach(item => {
      const $item = cheerio.load(item)
      const title = parseTitle($item)
      if (!title) return
      const category = parseCategory($item)
      const prev = programs[programs.length - 1]
      let start = parseTime($item, date)
      if (prev) {
        if (start < prev.start) {
          start = start.plus({ days: 1 })
          date = date.plus({ days: 1 })
        }
        prev.stop = start
      }
      let stop = parseTime($item, start)
      if (stop < start) {
        stop = stop.plus({ days: 1 })
      }
      programs.push({
        title,
        category,
        start,
        stop
      })
    })

    return programs
  },
  async channels({ lang }) {
    const categories = ['entertainment', 'sports']

    let channels = []
    for (let category of categories) {
      const url = `https://www.bein.com/en/epg-ajax-template/?action=epg_fetch&offset=0&category=${category}&serviceidentity=bein.net&mins=00&cdate=${dayjs().format(
        'YYYY-MM-DD'
      )}&language=${lang.toUpperCase()}&postid=25356&loadindex=0`
      const data = await axios
        .get(url)
        .then(r => r.data)
        .catch(console.log)

      const $ = cheerio.load(data)
      $('.container-tvguide > div').each((i, el) => {
        const id = $(el).attr('id')
        if (!id || !/^channels_\d+/.test(id)) return
        const [, channelId] = id.split('_')

        channels.push({
          lang,
          site_id: `${category}#${channelId}`,
          name: channelId
        })
      })
    }

    return channels
  }
}

function parseTitle($item) {
  return $item('.title').text()
}

function parseCategory($item) {
  return $item('.format').text()
}

function parseTime($item, date) {
  let [, time] = $item('.time')
    .text()
    .match(/^(\d{2}:\d{2})/) || [null, null]
  if (!time) return null
  time = `${date.toFormat('yyyy-MM-dd')} ${time}`

  return DateTime.fromFormat(time, 'yyyy-MM-dd HH:mm', { zone: 'Asia/Qatar' }).toUTC()
}

function parseItems(content, channel) {
  const [, channelId] = channel.site_id.split('#')
  const $ = cheerio.load(content)

  return $(`#channels_${channelId} .slider > ul:first-child > li`).toArray()
}
