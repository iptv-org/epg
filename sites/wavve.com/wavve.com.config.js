const axios = require('axios')
const { DateTime } = require('luxon')

module.exports = {
  site: 'wavve.com',
  days: 2,
  maxConnections: 200,
  url: function ({ channel, date }) {
    return `https://apis.pooq.co.kr/live/epgs/channels/${
      channel.site_id
    }?startdatetime=${date.format('YYYY-MM-DD')}%2000%3A00&enddatetime=${date
      .add(1, 'd')
      .format('YYYY-MM-DD')}%2000%3A00&apikey=E5F3E0D30947AA5440556471321BB6D9&limit=500`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.title,
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels({ country }) {
    const channels = []

    const data = await axios
      .get(
        `https://apis.pooq.co.kr/live/epgs?enddatetime=2022-04-17%2019%3A00&genre=all&limit=500&startdatetime=2022-04-17%2016%3A00&apikey=E5F3E0D30947AA5440556471321BB6D9`
      )
      .then(r => r.data)
      .catch(console.log)

    data.list.forEach(i => {
      channels.push({
        name: i.channelname,
        site_id: i.channelid,
        lang: 'ko'
      })
    })

    return channels
  }
}

function parseStart(item) {
  return DateTime.fromFormat(item.starttime, 'yyyy-MM-dd HH:mm', { zone: 'Asia/Seoul' }).toUTC()
}

function parseStop(item) {
  return DateTime.fromFormat(item.endtime, 'yyyy-MM-dd HH:mm', { zone: 'Asia/Seoul' }).toUTC()
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.list)) return []

  return data.list
}
