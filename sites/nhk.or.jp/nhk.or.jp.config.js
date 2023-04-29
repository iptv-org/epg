const dayjs = require('dayjs')

module.exports = {
    site: 'nhk.or.jp',
    days: 5,
    output: 'nhk.or.jp.guide.xml',
    channels: 'nhk.or.jp.channels.xml',
    lang: 'en',
    delay: 5000,

    url: function ({ date }) {
        return `https://nwapi.nhk.jp/nhkworld/epg/v7b/world/s${date.unix() * 1000}-e${date.add(1, 'd').unix() * 1000}.json`
    },

    request: {
        method: 'GET',
        timeout: 5000,
        cache: { ttl: 60 * 1000 },
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36' }
    },

    logo: function (context) {
        return context.channel.logo
    },

    parser: function (context) {
        const programs = []

        const items = parseItems(context.content)

        items.forEach(item => {
            programs.push({
                title: item.title,
                start: parseStart(item),
                stop: parseStop(item),
                description: item.description,
                icon: parseIcon(item),
                sub_title: item.subtitle
            })
        })

        return programs
    }
}

function parseItems(content) {
    if (content != '') {
        const data = JSON.parse(content)
        return (!data || !data.channel || !Array.isArray(data.channel.item)) ? [] : data.channel.item
    } else {
        return []
    }
}

function parseStart(item) {
    return dayjs.unix(parseInt(item.pubDate) / 1000)
}

function parseStop(item) {
    return dayjs.unix(parseInt(item.endDate) / 1000)
}

function parseIcon(item) {
    return 'https://www.nhk.or.jp' + item.thumbnail
}