const crypto = require('crypto')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const doFetch = require('@ntlab/sfetch')

dayjs.extend(utc)

const UDID = crypto.randomUUID()
const UUID = crypto.randomUUID()
const headers = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0',
  'channelid': 'VMPWEB',
  'webplatform': '878a6db06e0cd079b3b02408d246801d217c018f',
  'x-data-centre': btoa([UDID, UUID].join('|')),
  'x-localization': 'EN',
  'x-maxstream-version': '3.2.6'
}

module.exports = {
  site: 'maxstream.tv',
  days: 2,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    },
    headers
  },
  url({ channel }) {
    return `https://api.maxstream.tv/v1/videos/${channel.site_id}/schedule`
  },
  parser({ content, channel, date }) {
    const programs = []
    if (content && typeof content === 'string') {
      content = JSON.parse(content)
    }
    if (Array.isArray(content?.data?.data)) {
      const schedules = []
      content.data.data.forEach(item => {
        schedules.push(...item.metadata)
      })
      const cdate = date.startOf('d')
      const f = (dt, e) => (dt = dayjs.utc(dt), dt.isSame(cdate, 'd') && (e ? dt > cdate : true))
      schedules
        .filter(
          entry => entry.parentId === channel.site_id && (f(entry.startTime) || f(entry.endTime, true))
        )
        .forEach(entry => {
          const [, , , season, , , session2, , , episode] = entry.tvProgram.match(
            /((\s(\d+)[a-zA-Z]{2})?\s(Season(\s)?||S)(\d+)?)?(\s-\sEps\.(\s)?(\d+))/
          ) || [null, null, null, null, null, null, null, null, null, null]
          programs.push({
            title: entry.tvProgram,
            description: entry.description,
            start: dayjs.utc(entry.startTime),
            stop: dayjs.utc(entry.endTime),
            season: season || session2 ? parseInt(season || session2) : null,
            episode: episode ? parseInt(episode) : null,
            image: entry.thumbnail_url
          })
        })
    }

    return programs
  },
  async channels() {
    const channels = []
    const queues = [{
      url: 'https://api.maxstream.tv/v1/videos?filters%5BcontentType%5D=channel',
      params: { headers }
    }]
    await doFetch(queues, (queue, res) => {
      if (Array.isArray(res?.data?.items)) {
        queues.push(
          ...res.data.items
            .filter(item => item?.contentType === 'Channel')
            .map(item => ({
              url: module.exports.url({
                channel: { site_id: item.id }
              }),
              params: { headers },
              item
            }))
        )
      }
      if (Array.isArray(res?.data?.data) && res?.data?.isEnable && queue.item) {
        channels.push({
          lang: 'id',
          site_id: queue.item.id,
          name: queue.item.translations.id.title || queue.item.translations.en.title
        })
      }
    })

    return channels
  }
}
