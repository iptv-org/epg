const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'tvguide.myjcom.jp',
  days: 2,
  url: function ({ date, channel }) {
    const id = `${channel.site_id}_${date.format('YYYYMMDD')}`

    return `https://tvguide.myjcom.jp/api/getEpgInfo/?channels=${id}`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.commentary,
        category: parseCategory(item),
        icon: parseIcon(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const requests = [
      axios.get(
        `https://tvguide.myjcom.jp/api/mypage/getEpgChannelList/?channelType=2&area=108&channelGenre&course&chart&is_adult=true`
      ),
      axios.get(
        `https://tvguide.myjcom.jp/api/mypage/getEpgChannelList/?channelType=3&area=108&channelGenre&course&chart&is_adult=true`
      ),
      axios.get(
        `https://tvguide.myjcom.jp/api/mypage/getEpgChannelList/?channelType=5&area=108&channelGenre&course&chart&is_adult=true`
      ),
      axios.get(
        `https://tvguide.myjcom.jp/api/mypage/getEpgChannelList/?channelType=120&area=108&channelGenre&course&chart&is_adult=true`
      ),
      axios.get(
        `https://tvguide.myjcom.jp/api/mypage/getEpgChannelList/?channelType=200&area=108&channelGenre&course&chart&is_adult=true`
      )
    ]

    let items = []
    await Promise.all(requests)
      .then(responses => {
        for (const r of responses) {
          items = items.concat(r.data.header)
        }
      })
      .catch(console.log)

    return items.map(item => {
      return {
        lang: 'jp',
        site_id: `${item.channel_type}_${item.channel_id}_${item.network_id}`,
        name: item.channel_name
      }
    })
  }
}

function parseIcon(item) {
  return item.imgPath ? `https://tvguide.myjcom.jp${item.imgPath}` : null
}

function parseCategory(item) {
  if (!item.sortGenre) return null

  const id = item.sortGenre[0]
  const genres = {
    0: 'ニュース／報道',
    1: 'スポーツ',
    2: '情報／ワイドショー',
    3: 'ドラマ',
    4: '音楽',
    5: 'バラエティ',
    6: '映画',
    7: 'アニメ／特撮',
    8: 'ドキュメンタリー／教養',
    9: '劇場／公演',
    10: '趣味／教育',
    11: '福祉',
    12: 'その他'
  }

  return genres[id]
}

function parseStart(item) {
  return dayjs.tz(item.programStart.toString(), 'YYYYMMDDHHmmss', 'Asia/Tokyo')
}

function parseStop(item) {
  return dayjs.tz(item.programEnd.toString(), 'YYYYMMDDHHmmss', 'Asia/Tokyo')
}

function parseItems(content, channel, date) {
  const id = `${channel.site_id}_${date.format('YYYYMMDD')}`
  const parsed = JSON.parse(content)

  return parsed[id] || []
}
