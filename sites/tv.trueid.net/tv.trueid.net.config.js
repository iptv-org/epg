const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  delay: 1000,
  site: 'tv.trueid.net',
  days: 1,
  url({ channel }) {
    return `https://tv.trueid.net/_next/data/1380644e0f1fb6b14c82894a0c682d147e015c9d/th-${channel.lang}.json?channelSlug=${channel.site_id}&path=${channel.site_id}`
  },
  parser({ content, channel }) {
    const programs = []
    parseItems(content, channel).forEach(item => {
      programs.push({
        title: item.title,
        description: parseDescription(item, channel.lang),
        image: parseImage(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels({ token, lang = 'en' }) {
    const axios = require('axios')
    const ACCESS_TOKEN = token
      ? token
      : 'MTM4MDY0NGUwZjFmYjZiMTRjODI4OTRhMGM2ODJkMTQ3ZTAxNWM5ZDoxZmI2YjE0YzgyODk0YTBjNjgyZDE0N2UwMTVjOWQ='

    const data = await axios
      .get(`https://tv.trueid.net/api/channel/getChannelListByAllCate?lang=${lang}&country=th`, {
        headers: {
          authorization: `Basic ${ACCESS_TOKEN}`
        }
      })
      .then(r => r.data)
      .catch(console.error)

    return data.data.channelsList
      .find(i => i.catSlug === 'TrueID : All')
      .channels.map(item => {
        return {
          lang,
          site_id: item.slug,
          name: item.title
        }
      })
  }
}

function parseDescription(item, lang) {
  const description = item.info?.[`synopsis_${lang}`]
  return description && description !== '.' ? description : null
}

function parseImage(item) {
  return item.info?.image || null
}

function parseStart(item) {
  return item.start_date ? dayjs.utc(item.start_date) : null
}

function parseStop(item) {
  return item.end_date ? dayjs.utc(item.end_date) : null
}

function parseItems(content) {
  const data = content ? JSON.parse(content) : null
  return data?.pageProps?.epgList || []
}
