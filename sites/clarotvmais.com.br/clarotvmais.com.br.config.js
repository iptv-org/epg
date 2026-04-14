const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const axios = require('axios')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

dayjs.tz.setDefault('America/Sao_Paulo')

module.exports = {
  site: 'clarotvmais.com.br',
  url: function ({ date, channel }) {
    const startOfDay = Math.floor(dayjs(date).startOf('day').unix())
    const endOfDay = Math.floor(dayjs(date).endOf('day').unix())
    return `https://www.clarotvmais.com.br/avsclient/1.2/epg/livechannels?types=&channelIds=${
      channel.site_id
    }&startTime=${startOfDay}&endTime=${endOfDay}&location=SAO%20PAULO,AMAZONAS&channel=PCTV`
  },
  request: {
    headers: {
        'accept-encoding': 'gzip, deflate, br, zstd',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
    },
  },
  parser({ content }) {
    const items = parseItems(content)

    return items.map(item => {
      return {
        title: item.title,
        description: item.description,
        season: item.seasonNumber,
        episode: item.episodeNumber,
        image: item.image ? item.image.replace('{{image-size-placeholder}}', '420_236') : null,
        start: parseTime(item.startTime),
        stop: parseTime(item.endTime)
      }
    })
  },
  async channels() {
    // you may add multiple cities by changing the location parameter, dunno if it'll change
    const data = await axios
      .get(
        'https://www.clarotvmais.com.br/avsclient/1.2/epg/livechannels?types=&channelIds=&startTime=&endTime=&location=SAO%20PAULO,AMAZONAS&channel=PCTV'
      )
      .then(r => r.data)
      .catch(console.error)

    return data.response.liveChannels.map(channel => {
      return {
        site_id: channel.id,
        name: channel.name,
        lang: 'pt'
      }
    })
  }
}

function parseTime(time) {
  return dayjs(time * 1000).format('YYYY-MM-DDTHH:mm:ssZ')
}

function parseItems(content) {
  try {
    const data = JSON.parse(content)
    // if the schedule length is equal to one, pretty sure it is an empty guide (content not available)
    if (!data 
      || !data.response 
      || !Array.isArray(data.response.liveChannels[0].schedules) 
      || data.response.liveChannels[0].schedules.length === 1) return []
    return data.response.liveChannels[0].schedules
  } catch {
    return []
  }
}
