const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  lang: 'it',
  site: 'mediaset.it',
  channels: 'mediaset.it.channels.xml',
  output: '.gh-pages/guides/mediaset.it.guide.xml',
  url: function ({ date, channel }) {
    return `http://www.mediaset.it/guidatv/inc/canali/${date.format('YYYYMM')}/${date.format(
      'YYYYMMDD'
    )}_${channel.site_id}.sjson`
  },
  logo: function ({ channel }) {
    return `http://www.mediaset.it/include/img/loghi/${channel.site_id}.png`
  },
  parser: function ({ content, date }) {
    const programs = []
    if (!content.events) return programs

    content.events.forEach(item => {
      if (item.title && item.startTime && item.endTime) {
        const start = dayjs
          .utc(item.startTime, 'HH:mm')
          .set('D', date.get('D'))
          .set('M', date.get('M'))
          .set('y', date.get('y'))
          .toString()

        const stop = dayjs
          .utc(item.endTime, 'HH:mm')
          .set('D', date.get('D'))
          .set('M', date.get('M'))
          .set('y', date.get('y'))
          .toString()

        programs.push({
          title: item.displayTitle || item.title,
          description: item.description,
          category: item.genere,
          start,
          stop
        })
      }
    })

    return programs
  }
}
