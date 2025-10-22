const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter')
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore')

dayjs.extend(utc)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

module.exports = {
  site: 'taiwanplus.com',
  days: 7,
  output: 'taiwanplus.com.guide.xml',
  channels: 'taiwanplus.com.channels.xml',
  lang: 'en',

  url: function () {
    return 'https://www.taiwanplus.com/api/video/live/schedule/0'
  },

  request: {
    method: 'GET',
    timeout: 5000,
    cache: { ttl: 60 * 60 * 1000 } // 60 * 60 seconds = 1 hour
  },

  logo: function (context) {
    return context.channel.logo
  },

  parser: function (context) {
    const programs = []
    const scheduleDates = parseItems(context.content)
    const today = dayjs.utc(context.date).startOf('day')

    for (let scheduleDate of scheduleDates) {
      const currentScheduleDate = new dayjs.utc(scheduleDate.date, 'YYYY/MM/DD')

      if (currentScheduleDate.isSame(today)) {
        scheduleDate.schedule.forEach(function (program, i) {
          programs.push({
            title: program.title,
            start: dayjs.utc(program.dateTime, 'YYYY/MM/DD HH:mm'),
            stop:
              i != scheduleDate.schedule.length - 1
                ? dayjs.utc(scheduleDate.schedule[i + 1].dateTime, 'YYYY/MM/DD HH:mm')
                : dayjs.utc(program.dateTime, 'YYYY/MM/DD HH:mm').add(1, 'day').startOf('day'),
            description: program.description,
            image: program.image,
            category: program.categoryName,
            rating: program.ageRating
          })
        })
      }
    }

    return programs
  }
}

function parseItems(content) {
  if (content != '') {
    const data = JSON.parse(content)
    return !data || !data.data || !Array.isArray(data.data) ? [] : data.data
  } else {
    return []
  }
}
