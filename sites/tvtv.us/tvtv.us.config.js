const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  site: 'tvtv.us',
  days: 2,
  url: function ({ date, channel }) {
    if (!dayjs.isDayjs(date)) {
      throw new Error('Invalid date object passed to url function')
    }

    return `https://www.tvtv.us/api/v1/lineup/USA-NY71652-X/grid/${date.toJSON()}/${date
      .add(1, 'day')
      .toJSON()}/${channel.site_id}`
  },
  request: {
    method: 'GET',
    headers: {
      Accept: '*/*',
      Connection: 'keep-alive',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    }
  },
  parser: function ({ content }) {
    let programs = []

    const items = parseItems(content)
    items.forEach(item => {
      const start = dayjs.utc(item.startTime)
      const stop = start.add(item.runTime, 'minute')
      programs.push({
        title: item.title,
        description: item.subtitle,
        start,
        stop
      })
    })

    return programs
  }
}

function parseItems(content) {
  const json = JSON.parse(content)
  if (!json.length) return []
  return json[0]
}
