const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const currentYear = new Date().getFullYear()

module.exports = {
    site: 'moji.id',
    days: 4,
    output: 'moji.id.guide.xml',
    channels: 'moji.id.channels.xml',
    lang: 'en',
    delay: 5000,

    url: function () {
        return 'https://moji.id/schedule'
    },

    request: {
        method: 'GET',
        timeout: 5000,
        cache: { ttl: 60 * 60 * 1000 },
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36' }
    },

    logo: function (context) {
        return context.channel.logo
    },

    parser: function (context) {
        const programs = []
        const items = parseItems(context)

        items.forEach(function(item, i) {
            programs.push({
                title: item.progTitle,
                description: item.progDesc,
                start: item.progStart,
                stop: item.progStop
            })
        })

        return programs
    }
}

function parseItems(context) {
    const $ = cheerio.load(context.content)
    const schDayMonths =  $('.date-slider .month').toArray()
    const schPrograms = $('.desc-slider .list-slider').toArray()
    const monthDate = dayjs(context.date).format('MMM DD')
    const items = [];

    schDayMonths.forEach(function(schDayMonth, i) {
        if (monthDate == $(schDayMonth).text()) {
            let schDayPrograms = $(schPrograms[i]).find('.accordion').toArray()
            schDayPrograms.forEach(function(program, i) {
                let itemDay = {
                    progStart: parseStart(schDayMonth, program),
                    progStop: parseStop(schDayMonth, program, schDayPrograms[i+1]),
                    progTitle: parseTitle(program),
                    progDesc: parseDescription(program)
                };
                items.push(itemDay)
            })
        }
    })

    return items
}

function parseTitle(item) {
    return cheerio.load(item)('.name-prog').text()
}

function parseDescription(item) {
    return cheerio.load(item)('.content-acc span').text()
}

function parseStart(schDayMonth, item) {
    let monthDate = cheerio.load(schDayMonth).text().split(' ')
    let startTime = cheerio.load(item)('.pkl').text()
    let progStart = dayjs.tz(currentYear + ' ' + monthDate[0] + ' ' + monthDate[1] + ' ' + startTime, 'YYYY MMM DD HH:mm', 'Asia/Jakarta')
    return progStart
}

function parseStop(schDayMonth, itemCurrent, itemNext) {
    let monthDate = cheerio.load(schDayMonth).text().split(' ')
    
    if (itemNext) {
        let stopTime = cheerio.load(itemNext)('.pkl').text()
        return dayjs.tz(currentYear + ' ' + monthDate[0] + ' ' + monthDate[1] + ' ' + stopTime, 'YYYY MMM DD HH:mm', 'Asia/Jakarta')
    }
    else
    {
        return dayjs.tz(currentYear + ' ' + monthDate[0] + ' ' + (parseInt(monthDate[1]) + 1).toString().padStart(2, '0') + ' 00:00', 'YYYY MMM DD HH:mm', 'Asia/Jakarta')
    }
}