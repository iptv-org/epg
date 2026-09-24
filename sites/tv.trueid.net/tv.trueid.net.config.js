const axios = require('axios')
const cheerio = require('cheerio')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

module.exports = {
  delay: 1000,
  site: 'tv.trueid.net',
  days: 1,
  buildId: undefined,
  async url({ channel }) {
    if (module.exports.buildId === undefined) {
      module.exports.buildId = await module.exports.fetchBuildId()
    }
    return `https://tv.trueid.net/_next/data/${module.exports.buildId}/th-${channel.lang}.json?channelSlug=${channel.site_id}&path=${channel.site_id}`
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
  async channels({ lang = 'en' }) {
    if (module.exports.buildId === undefined) {
      module.exports.buildId = await module.exports.fetchBuildId()
    }

    const data = await axios
      .get(`https://tv.trueid.net/_next/data/${module.exports.buildId}/th-${lang}.json`)
      .then(r => r.data?.pageProps)
      .catch(console.error)

    if (!data?.channelList) {
      return []
    }

    return data.channelList
      .filter(i => i.content_type === 'livetv')
      .map(item => {
        return {
          lang,
          site_id: item.slug,
          name: item.title,
          logo: item.thumb
        }
      })
  },
  // Since the website uses Next.js, each time the developers deploy a new version, a new build ID is generated.
  // This permits us to always fetch the proper build ID before making requests.
  async fetchBuildId() {
    const data = await axios
      .get('https://tv.trueid.net/th-en')
      .then(r => r.data)
      .catch(console.error)

    if (data) {
      const $ = cheerio.load(data)
      const nextData = JSON.parse($('#__NEXT_DATA__').text())
      return nextData?.buildId || null
    } else {
      return null
    }
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
