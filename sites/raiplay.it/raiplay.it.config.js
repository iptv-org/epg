const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'raiplay.it',
  url: function ({ date, channel }) {
    return `https://www.raiplay.it/palinsesto/app/${channel.site_id}/${date.format('DD-MM-YYYY')}.json`
  },
  parser: function ({ content, date }) {
    const programs = []
    const data = JSON.parse(content)
    if (!data.events) return programs

    data.events.forEach(item => {
      if (item.name && item.hour && item.duration_in_minutes) {
        const startDate = dayjs
          .utc(item.hour, 'HH:mm')
          .set('D', date.get('D'))
          .set('M', date.get('M'))
          .set('y', date.get('y'))
        const start = startDate.toJSON()
        const duration = parseInt(item.duration_in_minutes)
        const stopDate = startDate.add(duration,'m')
        const stop = stopDate.toJSON()

        programs.push({
          title: item.name || item.program.name,
          description: item.description,
          season: item.season || null,
          episode: item.episode || null,
          start,
          stop,
          icon: parseIcon(item)
        })
      }
    })

    return programs
  }
}

function parseIcon(item) {
  return cover = item.image ? `https://www.raiplay.it${item.image}` : null

}
