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
    delay: 5000,

    url: function () {
        return 'https://www.taiwanplus.com/api/video/live/schedule/0'
    },

    request: {
        method: 'GET',
        timeout: 5000,
        cache: { ttl: 60 * 60 * 1000 }, // 60 * 60 seconds = 1 hour
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36' }
    },

    logo: function (context) {
        return context.channel.logo
    },

    parser: function (context) {
        const programs = []
        const scheduleDates = parseItems(context.content)
        const today = dayjs.utc(context.date).startOf('day')
        const lastDay = today.add(1, 'day')

        for(let scheduleDate of scheduleDates) {
            const currentScheduleDate = new dayjs.utc(scheduleDate.date, 'YYYY/MM/DD')

            if (currentScheduleDate.isSame(today)) {
                scheduleDate.schedule.forEach(function(program, i) {
                    programs.push({
                        title: program.title,
                        start: dayjs.utc(program.dateTime, 'YYYY/MM/DD HH:mm'),
                        stop: (i != (scheduleDate.schedule.length - 1)) ? dayjs.utc(scheduleDate.schedule[i+1].dateTime, 'YYYY/MM/DD HH:mm') : dayjs.utc(program.dateTime, 'YYYY/MM/DD HH:mm').add(1, 'day').startOf('day'),
                        description: program.description,
                        icon: program.image,
                        category: program.categoryName,
                        rating: program.ageRating
                    })
                });
            }
        }

        return programs
    }
}

function parseItems(content) {
    if (content != '') {
        const data = JSON.parse(content)
        return (!data || !data.data || !Array.isArray(data.data)) ? [] : data.data
    } else {
        return []
    }
}