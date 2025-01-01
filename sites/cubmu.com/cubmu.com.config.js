const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')

dayjs.extend(timezone)
dayjs.extend(utc)

module.exports = {
  site: 'cubmu.com',
  days: 2,
  url({ channel, date }) {
    return `https://servicebuss.transvision.co.id/v2/cms/getEPGData?app_id=cubmu&tvs_platform_id=standalone&schedule_date=${date.format(
      'YYYY-MM-DD'
    )}&channel_id=${channel.site_id}`
  },
  parser({ content, channel }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: parseTitle(item),
        description: parseDescription(item, channel.lang),
        episode: parseEpisode(item),
        start: parseStart(item).toISOString(),
        stop: parseStop(item).toISOString()
      })
    })

    return programs
  },
  async channels({ lang = 'id' }) {
    const axios = require('axios')
    const cheerio = require('cheerio')
    const result = await axios
      .get('https://cubmu.com/live-tv')
      .then(response => response.data)
      .catch(console.error)

    const $ = cheerio.load(result)

    // retrieve service api data
    const config = JSON.parse($('#__NEXT_DATA__').text()).runtimeConfig || {}

    const options = {
      headers: {
        Origin: 'https://cubmu.com',
        Referer: 'https://cubmu.com/live-tv'
      }
    }
    // login to service bus
    await axios
      .post(
        `https://servicebuss.transvision.co.id/tvs/login/external?email=${config.email}&password=${config.password}&deviceId=${config.deviceId}&deviceType=${config.deviceType}&deviceModel=${config.deviceModel}&deviceToken=&serial=&platformId=${config.platformId}`,
        options
      )
      .then(response => response.data)
      .catch(console.error)
    // list channels
    const subscribedChannels = await axios
      .post(
        `https://servicebuss.transvision.co.id/tvs/subscribe_product/list?platformId=${config.platformId}`,
        options
      )
      .then(response => response.data)
      .catch(console.error)

    const channels = []
    const included = []
    if (Array.isArray(subscribedChannels.channelPackageList)) {
      subscribedChannels.channelPackageList.forEach(pkg => {
        pkg.channelList.forEach(channel => {
          if (included.indexOf(channel.id) < 0) {
            included.push(channel.id)
            channels.push({
              lang,
              site_id: channel.id,
              name: channel.name
            })
          }
        })
      })
    }

    return channels
  }
}

function parseItems(content) {
  return content ? JSON.parse(content.trim()).result || [] : []
}

function parseTitle(item) {
  return item.scehedule_title
}

function parseDescription(item, lang = 'id') {
  return lang === 'id' ? item.schedule_json.primarySynopsis : item.schedule_json.secondarySynopsis
}

function parseEpisode(item) {
  return item.schedule_json.episodeName
}

function parseStart(item) {
  return dayjs.tz(item.schedule_date, 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta')
}

function parseStop(item) {
  return dayjs.tz(
    [item.schedule_date.split(' ')[0], item.schedule_end_time].join(' '),
    'YYYY-MM-DD HH:mm:ss',
    'Asia/Jakarta'
  )
}
