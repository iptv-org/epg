const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0 WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 7.0; LGMS210 Build/NRD90U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.83 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.110 Safari/537.36',
  'Mozilla/5.0 (en-US) AppleWebKit/537.36 (KHTML, like Gecko; Hound) Chrome/27.0.1453 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36',
  'Mozilla/5.0 (Windows NT 5.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.8 (KHTML, like Gecko) Beamrise/17.2.0.9 Chrome/17.0.939.0 Safari/535.8',
  'Mozilla/5.0 (Windows NT 6.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 4.4.2; rk31sdk Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/30.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.95 Safari/537.11',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.162 Safari/535.19',
]

module.exports = {
  site: 'tvguide.myjcom.jp',
  days: 2,
  lang: 'ja',
  request: {
    headers: {
      Cookie: 'AD_NAV=1; area_id=108;',
      'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
    }
  },
  url: function ({ date, channel }) {
    const id = `${channel.site_id}_${date.format('YYYYMMDD')}`
    return `https://tvguide.myjcom.jp/api/getEpgInfo/?channels=${id}&rectime=&rec4k=`
  },
  parser: function ({ content, channel, date }) {
    let programs = []
    const items = parseItems(content, channel, date)
    items.forEach(item => {
      programs.push({
        title: item.title,
        description: item.commentary,
        category: parseCategory(item),
        image: parseImage(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const requests = [
      axios.get(
        'https://tvguide.myjcom.jp/api/mypage/getEpgChannelList/?channelType=2&area=108&channelGenre&course&chart&is_adult=true'
      ),
      axios.get(
        'https://tvguide.myjcom.jp/api/mypage/getEpgChannelList/?channelType=3&area=108&channelGenre&course&chart&is_adult=true'
      ),
      axios.get(
        'https://tvguide.myjcom.jp/api/mypage/getEpgChannelList/?channelType=5&area=108&channelGenre&course&chart&is_adult=true'
      ),
      axios.get(
        'https://tvguide.myjcom.jp/api/mypage/getEpgChannelList/?channelType=120&area=108&channelGenre&course&chart&is_adult=true'
      ),
      axios.get(
        'https://tvguide.myjcom.jp/api/mypage/getEpgChannelList/?channelType=200&area=108&channelGenre&course&chart&is_adult=true'
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
        lang: 'ja',
        site_id: `${item.channel_type}_${item.channel_id}_${item.network_id}`,
        name: item.channel_name
      }
    })
  }
}

function parseImage(item) {
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
