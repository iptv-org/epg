const axios = require('axios')
const dayjs = require('dayjs')

const languages = { en: 'en_US', zh: 'zh' }

module.exports = {
  site: 'starhubtvplus.com',
  days: 2,
  url({ date, channel }) {
    return `https://waf-starhub-metadata-api-p001.ifs.vubiquity.com/v3.1/epg/schedules?locale=${
      languages[channel.lang]
    }&locale_default=${languages[channel.lang]}&device=1&in_channel_id=${
      channel.site_id
    }&gt_end=${date.unix()}&lt_start=${date.add(1, 'd').unix()}&limit=100&page=1`
  },
  async parser({ content, date, channel }) {
    const programs = []
    if (content) {
      let res = JSON.parse(content)
      while (res) {
        if (res.resources) {
          programs.push(...res.resources)
        }
        if (res.page && res.page.current < res.page.total) {
          res = await axios
            .get(
              module.exports
                .url({ date, channel })
                .replace(/page=(\d+)/, `page=${res.page.current + 1}`)
            )
            .then(r => r.data)
            .catch(console.error)
        } else {
          res = null
        }
      }
    }
    const season = s => {
      if (s) {
        const [, , n] = s.match(/(S|Season )(\d+)/) || [null, null, null]
        if (n) {
          return parseInt(n)
        }
      }
    }

    return programs.map(item => {
      return {
        title: item.title,
        subTitle: item.serie_title,
        description: item.description,
        category: item.genres,
        image: item.pictures?.map(img => img.url),
        season: season(item.serie_title),
        episode: item.episode_number,
        rating: item.rating,
        start: dayjs(item.start * 1000),
        stop: dayjs(item.end * 1000)
      }
    })
  },
  async channels({ lang = 'en' }) {
    const resources = []
    let page = 1
    while (true) {
      const items = await axios
        .get(
          `https://waf-starhub-metadata-api-p001.ifs.vubiquity.com/v3.1/epg/channels?locale=${languages[lang]}&locale_default=${languages[lang]}&device=1&limit=50&page=${page}`
        )
        .then(r => r.data)
        .catch(console.error)
      if (items.resources) {
        resources.push(...items.resources)
      }
      if (items.page && page < items.page.total) {
        page++
      } else {
        break
      }
    }

    return resources.map(ch => ({
      lang,
      site_id: ch.id,
      name: ch.title
    }))
  }
}
