const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const doFetch = require('@ntlab/sfetch')
const debug = require('debug')('site:sky.com')
const sortBy = require('lodash.sortby')
const path = require('path')
const fs = require('fs/promises')

dayjs.extend(utc)

doFetch.setDebugger(debug)

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
                if (start.isSame(date, 'd')) {
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
    const dataPath = path.join(__dirname, '__data__', 'content.json')
    let regions = []

    try {
      const raw = await fs.readFile(dataPath, 'utf8')
      const payload = JSON.parse(raw)
      if (Array.isArray(payload.regions)) {
        regions = payload.regions
      }
    } catch (err) {
      debug('Failed to read regions from %s: %o', dataPath, err)
      throw err
    }

    if (regions.length === 0) {
      debug('No regions defined in %s', dataPath)
      return []
    }

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
