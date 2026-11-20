const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const parser = require('epg-parser')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'alexastream.kanal8.mk',
  days: 2,
  url: 'https://alexastream.kanal8.mk/epg.xml',
  parser({ content, channel, date }) {
    const programs = []
    const parsed = parser.parse(content)
    const items = parsed.programs.filter(p => p.channel === channel.site_id)

    for (const item of items) {
      const start = dayjs.utc(item.start, 'YYYYMMDDHHmmss ZZ')
      const stop = dayjs.utc(item.stop, 'YYYYMMDDHHmmss ZZ')

      if (date.isSame(start, 'day')) {
        programs.push({
          title: item.title?.[0]?.value,
          description: item.desc?.[0]?.value,
          start,
          stop
        })
      }
    }

    return programs
  }
}
