const axios = require('axios')
const convert = require('xml-js')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(timezone)

module.exports = {
  site: 'hoy.tv',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1h
    }
  },
  url: function ({ channel, date }) {
    return `https://epg-file.hoy.tv/hoy/OTT${channel.site_id}${date.format('YYYYMMDD')}.xml`
  },
  parser({ content, date }) {
    const data = convert.xml2js(content, {
      compact: true,
      ignoreDeclaration: true,
      ignoreAttributes: true
    })

    const programs = []

    for (let item of data.ProgramGuide.Channel.EpgItem) {
      const start = dayjs.tz(item.EpgStartDateTime._text, 'YYYY-MM-DD HH:mm:ss', 'Asia/Hong_Kong')

      if (!date.isSame(start, 'day')) {
        continue
      }

      const epIndex = item.EpisodeInfo.EpisodeIndex._text
      const subtitle = parseInt(epIndex) > 0 ? `第${epIndex}集` : undefined

      programs.push({
        title: `${item.ComScore.ns_st_pr._text}${item.EpgOtherInfo?._text || ''}`,
        sub_title: subtitle,
        description: item.EpisodeInfo.EpisodeLongDescription._text,
        start,
        stop: dayjs.tz(item.EpgEndDateTime._text, 'YYYY-MM-DD HH:mm:ss', 'Asia/Hong_Kong')
      })
    }

    return programs
  },
  async channels() {
    const data = await axios
      .get('https://api2.hoy.tv/api/v2/a/channel')
      .then(r => r.data)
      .catch(console.error)

    return data.data.map(c => {
      return {
        site_id: c.videos.id,
        name: c.name.zh_hk,
        lang: 'zh'
      }
    })
  }
}
