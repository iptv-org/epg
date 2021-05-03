const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

module.exports = {
  lang: 'pt',
  site: 'meo.pt',
  channels: 'meo.pt.channels.xml',
  output: '.gh-pages/guides/meo.pt.guide.xml',
  request: {
    method: 'POST',
    data: function ({ channel, date }) {
      return {
        service: 'channelsguide',
        channels: [channel.site_id],
        dateStart: date.format('YYYY-MM-DDT00:00:00-00:00'),
        dateEnd: date.add(1, 'd').format('YYYY-MM-DDT00:00:00-00:00'),
        accountID: ''
      }
    }
  },
  logo({ content }) {
    const data = parseContent(content)
    return data.d.channels[0] ? data.d.channels[0].logo : null
  },
  url() {
    return `https://www.meo.pt/_layouts/15/Ptsi.Isites.GridTv/GridTvMng.asmx/getProgramsFromChannels`
  },
  parser({ content }) {
    let programs = []
    const data = parseContent(content)
    const items = data.d.channels[0] ? data.d.channels[0].programs : []
    if (!items.length) return programs

    items.forEach(item => {
      const title = item.name
      const localStart = dayjs.utc(`${item.date}/${item.timeIni}`, 'D-M-YYYY/HH:mm')
      const start = dayjs.tz(localStart.toString(), 'Europe/Lisbon').toString()
      const localStop = dayjs.utc(`${item.date}/${item.timeEnd}`, 'D-M-YYYY/HH:mm')
      const stop = dayjs.tz(localStop.toString(), 'Europe/Lisbon').toString()

      if (title && start && stop) {
        programs.push({
          title,
          start,
          stop
        })
      }
    })

    return programs
  }
}

function parseContent(content) {
  return JSON.parse(content)
}
