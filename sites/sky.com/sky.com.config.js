const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const axios = require('axios')
const doFetch = require('../../scripts/core/multifetch')
const sortBy = require('lodash.sortby')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'sky.com',
  days: 2,
  url({ date, channel }) {
    return `https://awk.epgsky.com/hawk/linear/schedule/${date.format('YYYYMMDD')}/${
      channel.site_id
    }`
  },
  parser({ content, channel, date }) {
    const programs = []
    if (content) {
      const items = JSON.parse(content) || null
      if (Array.isArray(items.schedule)) {
        items.schedule
          .filter(schedule => schedule.sid === channel.site_id)
          .forEach(schedule => {
            if (Array.isArray(schedule.events)) {
              sortBy(schedule.events, p => p.st).forEach(event => {
                const start = dayjs.utc(event.st * 1000)
                if (start.isSame(date.tz('Europe/London'), 'd')) {
                  const image = `https://images.metadata.sky.com/pd-image/${event.programmeuuid}/16-9/640`
                  programs.push({
                    title: event.t,
                    description: event.sy,
                    season: event.seasonnumber,
                    episode: event.episodenumber,
                    start,
                    stop: start.add(event.d, 's'),
                    icon: image,
                    image
                  })
                }
              })
            }
          })
      }
    }

    return programs
  },
  async channels() {
    const regions = await axios.get('https://epgservices.sky.com/999/api/2.0/regions/json')
    .then(res => res.data.regions)
    .then(region => region.map(region => {
      if (!region || region.b === undefined || region.sb === undefined) return null
      return {
        bouquet: region.b,
        subBouquet: region.sb
      }
    }).filter(region => region !== null))

    const uniqueRegions = new Map()
    regions.forEach(region => {
      if (!region || region.bouquet === undefined || region.subBouquet === undefined) return
      const key = `${region.bouquet}-${region.subBouquet}`
      if (!uniqueRegions.has(key)) uniqueRegions.set(key, region)
    })

    const channels = {}
    const queues = Array.from(uniqueRegions.values()).map(region => ({
      t: 'c',
      url: `https://awk.epgsky.com/hawk/linear/services/${region.bouquet}/${region.subBouquet}`
    }))

    await doFetch(queues, (queue, res) => {
      // process channels
      if (queue.t === 'c') {
        if (Array.isArray(res.services)) {
          for (const ch of res.services) {
            if (channels[ch.sid] === undefined) {
              channels[ch.sid] = {
                lang: 'en',
                site_id: ch.sid,
                name: ch.t
              }
            }
          }
        }
      }
    })

    return Object.values(channels)
  }
}
