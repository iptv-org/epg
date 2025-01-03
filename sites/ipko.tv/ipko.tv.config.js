const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'ipko.tv',
  timezone: 'Europe/Belgrade',
  days: 5,
  url() {
    return 'https://stargate.ipko.tv/api/titan.tv.WebEpg/GetWebEpgData'
  },
  request: {
    method: 'POST',
    headers: {
      Host: 'stargate.ipko.tv',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
      'Content-Type': 'application/json',
      'X-AppLayout': '1',
      'x-language': 'sq',
      Origin: 'https://ipko.tv',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-GPC': '1',
      Connection: 'keep-alive'
    },
    data({ channel, date }) {
      const todayEpoch = date.startOf('day').unix()
      const nextDayEpoch = date.add(1, 'day').startOf('day').unix()
      return JSON.stringify({
        ch_ext_id: channel.site_id,
        from: todayEpoch,
        to: nextDayEpoch
      })
    }
  },
  parser: function ({ content }) {
    const programs = []
    const data = JSON.parse(content)
    data.shows.forEach(show => {
      const start = dayjs.unix(show.show_start).utc()
      const stop = dayjs.unix(show.show_end).utc()
      const programData = {
        title: show.title,
        description: show.summary || 'No description available',
        start: start.toISOString(),
        stop: stop.toISOString(),
        thumbnail: show.thumbnail
      }
      programs.push(programData)
    })
    return programs
  },
  async channels() {
    const response = await axios.post(
      'https://stargate.ipko.tv/api/titan.tv.WebEpg/ZapList',
      JSON.stringify({ includeRadioStations: true }),
      {
        headers: this.request.headers
      }
    )

    const data = response.data.data
    return data.map(item => ({
      lang: 'sq',
      name: String(item.channel.title),
      site_id: String(item.channel.id)
      //logo: String(item.channel.logo)
    }))
  }
}
