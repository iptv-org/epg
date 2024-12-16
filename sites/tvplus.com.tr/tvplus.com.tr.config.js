const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'tvplus.com.tr',
  days: 2,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  url({ channel }) {
    const [buildId, slug, nr] = channel.site_id.split('/')
    const channelId = [slug, nr].join('--')
    return `https://tvplus.com.tr/_next/data/${
      buildId
    }/${
      channel.lang
    }/canli-tv/yayin-akisi/${
      channelId
    }.json?title=${
      channelId
    }`
  },
  parser({ content, date }) {
    const programs = []
    if (content) {
      const data = JSON.parse(content)
      if (Array.isArray(data?.pageProps?.allPlaybillList)) {
        data.pageProps.allPlaybillList
          .filter(i => i.length && i[0].starttime.startsWith(date.format('YYYY-MM-DD')))
          .forEach(i => {
            for (const schedule of i) {
              const [, season, episode] = schedule.seasonInfo?.match(/(\d+)\. Sezon \- (\d+)\. Bölüm/) || [null, null, null]
              programs.push({
                title: schedule.name,
                description: schedule.introduce,
                category: schedule.genres,
                image: schedule.picture,
                season: season ? parseInt(season) : null,
                episode: episode ? parseInt(episode) : null,
                start: dayjs.utc(schedule.starttime),
                stop: dayjs.utc(schedule.endtime)
              })
            }
          })
      }
    }

    return programs
  },
  async channels() {
    const cheerio = require('cheerio')
    const axios = require('axios')
    const channels = []
    const data = await axios
      .get(`https://tvplus.com.tr/canli-tv/yayin-akisi`)
      .then(r => r.data)
      .catch(console.error)

    const $ = cheerio.load(data)
    const nextData = JSON.parse($('#__NEXT_DATA__').text())
    $('.channel-list-item a').toArray()
      .forEach(el => {
        const a = $(el)
        channels.push({
          lang: 'tr',
          name: a.attr('title').replace(/Yayın Akışı/, '').trim(),
          site_id: [
            nextData.buildId,
            ...a.attr('href')
              .replace(/\/canli\-tv\/yayin\-akisi\//, '')
              .split('--')
          ].join('/')
        })
      })

    return channels
  }
}
