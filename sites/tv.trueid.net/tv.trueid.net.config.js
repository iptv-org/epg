const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  delay: 1000,
  site: 'tv.trueid.net',
  days: 1,
  url({ channel }) {
    return `https://tv.trueid.net/_next/data/9d13441bf2f87fe680d62c50845f1037632855a3/th-${channel.lang}.json?channelSlug=${channel.site_id}&path=${channel.site_id}`
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
  async channels({ token, lang = en }) {
    const axios = require('axios')
    const ACCESS_TOKEN = token
      ? token
      : 'OWQxMzQ0MWJmMmY4N2ZlNjgwZDYyYzUwODQ1ZjEwMzc2MzI4NTVhMzpmODdmZTY4MGQ2MmM1MDg0NWYxMDM3NjMyODU1YTM='

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
