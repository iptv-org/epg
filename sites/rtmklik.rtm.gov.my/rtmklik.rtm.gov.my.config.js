const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'rtmklik.rtm.gov.my',
  days: 2,
  url: function ({ date, channel }) {
    return `https://rtm.glueapi.io/v3/epg/${
      channel.site_id
    }/ChannelSchedule?dateStart=${date.format('YYYY-MM-DD')}&dateEnd=${date.format(
      'YYYY-MM-DD'
    )}&timezone=0`
    // return `https://rtm.glueapi.io/v3/epg/99/ChannelSchedule?dateStart=${date.format('YYYY-MM-DD')}&dateEnd=${date.format('YYYY-MM-DD')}&timezone=0`
  },
  parser: function ({ content }) {
    const programs = []
    const items = parseItems(content)
    if (!items.length) return programs
    items.forEach(item => {
      programs.push({
        title: item.programTitle,
        description: item.description,
        start: parseTime(item.dateTimeStart),
        stop: parseTime(item.dateTimeEnd)
      })
    })

    return programs
  }
}

function parseItems(content) {
  const data = JSON.parse(content)
  return data.schedule ? data.schedule : []
}

function parseTime(time) {
  return dayjs.utc(time, 'YYYY-MM-DDTHH:mm:ss')
}
