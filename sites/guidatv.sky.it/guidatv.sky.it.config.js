const dayjs = require('dayjs')

module.exports = {
  site: 'guidatv.sky.it',
  days: 2,
  url: function ({ date, channel }) {
    const [env, id] = channel.site_id.split('#')
    return `https://apid.sky.it/gtv/v1/events?from=${date.format('YYYY-MM-DD')}T00:00:00Z&to=${date
      .add(1, 'd')
      .format('YYYY-MM-DD')}T00:00:00Z&pageSize=999&pageNum=0&env=${env}&channels=${id}`
  },
  parser: function ({ content }) {
    const programs = []
    const data = JSON.parse(content)
    const items = data.events
    if (!items.length) return programs
    items.forEach(item => {
      programs.push({
        title: item.eventTitle,
        description: item.eventSynopsis,
        category: parseCategory(item),
        season: parseSeason(item),
        episode: parseEpisode(item),
        start: parseStart(item),
        stop: parseStop(item),
        url: parseURL(item),
        image: parseImage(item)
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const cheerio = require('cheerio')

    const data = await axios
      .get('https://guidatv.sky.it/canali')
      .then(r => r.data)
      .catch(console.log)

    const $ = cheerio.load(data)

    let channels = []
    $('.c-channelsCard__container').each((i, el) => {
      const name = $(el).find('.c-channelsCard__title').text()
      const url = $(el).find('.c-channelsCard__link').attr('href')
      const [, channelId] = url.match(/\/(\d+)$/)

      channels.push({
        lang: 'it',
        site_id: `DTH#${channelId}`,
        name
      })
    })

    return channels
  }
}

function parseCategory(item) {
  let category = item.content.genre.name || null
  const subcategory = item.content.subgenre.name || null
  if (category && subcategory) {
    category += `/${subcategory}`
  }
  return category
}

function parseStart(item) {
  return item.starttime ? dayjs(item.starttime) : null
}

function parseStop(item) {
  return item.endtime ? dayjs(item.endtime) : null
}

function parseURL(item) {
  return item.content.url ? `https://guidatv.sky.it${item.content.url}` : null
}

function parseImage(item) {
  const cover = item.content.imagesMap ? item.content.imagesMap.find(i => i.key === 'cover') : null

  return cover && cover.img && cover.img.url ? `https://guidatv.sky.it${cover.img.url}` : null
}

function parseSeason(item) {
  if (!item.content.seasonNumber) return null
  if (String(item.content.seasonNumber).length > 2) return null
  return item.content.seasonNumber
}

function parseEpisode(item) {
  if (!item.content.episodeNumber) return null
  if (String(item.content.episodeNumber).length > 3) return null
  return item.content.episodeNumber
}
