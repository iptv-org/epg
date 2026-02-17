const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'jiotv.com',
  days: 2,
  url({ date, channel }) {
    const offset = date.diff(dayjs.utc().startOf('d'), 'd')

    return `https://jiotvapi.cdn.jio.com/apis/v1.3/getepg/get?channel_id=${channel.site_id}&offset=${offset}`
  },
  parser({ content }) {
    let programs = []
    let items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.showname,
        description: item.episode_desc || item.description,
        directors: parseList(item.director),
        actors: parseList(item.starCast),
        categories: item.showGenre,
        episode: parseEpisode(item),
        keywords: item.keywords,
        icon: parseIcon(item),
        image: parseImage(item),
        start: dayjs(item.startEpoch),
        stop: dayjs(item.endEpoch)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(
        'https://jiotvapi.cdn.jio.com/apis/v3.0/getMobileChannelList/get/?langId=6&devicetype=phone&os=android&usertype=JIO&version=343'
      )
      .then(r => r.data)
      .catch(console.error)

    return data.result.map(c => {
      return {
        lang: 'en',
        site_id: c.channel_id,
        name: c.channel_name
      }
    })
  }
}

function parseEpisode(item) {
  return item.episode_num > 0 ? item.episode_num : null
}

function parseList(string) {
  return string.split(', ').filter(Boolean)
}

function parseIcon(item) {
  return item.episodeThumbnail
    ? `https://jiotvimages.cdn.jio.com/dare_images/shows/700/-/${item.episodeThumbnail}`
    : null
}

function parseImage(item) {
  return item.episodePoster
    ? `https://jiotvimages.cdn.jio.com/dare_images/shows/700/-/${item.episodePoster}`
    : null
}

function parseItems(content) {
  try {
    const data = JSON.parse(content)
    if (!data || !Array.isArray(data.epg)) return []

    return data.epg
  } catch {
    return []
  }
}
