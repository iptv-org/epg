const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
    site: 'skylink.cz',
    request: {
        method: 'POST',
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: function ({ channel, date }) {
            const params = new URLSearchParams()
            params.append('channel_cid', channel.site_id)
            // 0 = today, 1 = tomorrow, etc
            const diff = date.diff(dayjs.utc().startOf('d'), 'd')
            params.append('day', diff)
            return params
        }
    },
    url() {
        return `https://services.mujtvprogram.cz/tvprogram2services/services/tvprogrammelist_mobile.php`
    },
    parser({ content}) {
        let programs = []
        const items = parseItems(content)
        items.forEach(item => {
            programs.push({
                title: item.name,
                start: parseTime(item.startDate),
                stop: parseTime(item.endDate),
                description: item.longDescription || item.shortDescription,
                category: parseCategory(item),
                date: item.year || null,
                director: parseList(item.directors),
                actor: parseList(item.actors)

            })
        })
        return programs
    }
}

function parseItems(content) {
    try {
        const data = JSON.parse(content)
        if (!data) return []
        const programmes = data['tv-program-programmes']
        return programmes && Array.isArray(programmes) ? programmes : []
    } catch (err) {
        return []
    }
}

function parseList(list) {
    return typeof list === 'string' ? list.split(',') : []
  }
function parseTime(time) {
    return dayjs.utc(time, 'DD.MM.YYYY HH.mm')
}

function parseCategory(item) {
    if (!item['programme-type']) return null
    return item['programme-type'].name
}
