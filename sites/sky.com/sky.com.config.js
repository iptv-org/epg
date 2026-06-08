const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const doFetch = require('@ntlab/sfetch')
const debug = require('debug')('site:sky.com')
const path = require('path')
const fs = require('fs/promises')

dayjs.extend(utc)

doFetch.setCheckResult(false).setDebugger(debug)

module.exports = {
  site: 'sky.com',
  days: 2,
  request: {
    cache: {
      ttl: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  url({ date, channel }) {
    return `https://awk.epgsky.com/hawk/linear/schedule/${date.format('YYYYMMDD')}/${
      channel.site_id
    }`
  },
  async parser({ content, channel, date }) {
    const programs = []
    if (content) {
      const events = {}
      const ev = items => {
        if (typeof items === 'string' || Buffer.isBuffer(items)) {
          items = JSON.parse(items)
        }
        if (Array.isArray(items?.schedule)) {
          items.schedule
            .filter(schedule => schedule.sid === channel.site_id)
            .forEach(schedule => {
              if (Array.isArray(schedule.events)) {
                schedule.events.forEach(event => {
                  // use event id (eid) as unique filter
                  if (events[event.eid] === undefined) {
                    events[event.eid] = event
                  }
                })
              }
            })
        }
      }
      ev(content)
      if (Object.keys(events).length) {
        date = date.startOf('d')
        // fetch next day schedule to get 24 hours schedule
        await doFetch([module.exports.url({ channel, date: date.add(1, 'd') })], (url, res) => {
          if (res) {
            ev(res)
          }
        })
        Object.values(events)
          .forEach(event => {
            const start = dayjs.utc(event.st * 1000)
            const stop = start.add(event.d, 's')
            if (date.isSame(start, 'd') || (date.isSame(stop, 'd') && stop > date)) {
              const image = `https://images.metadata.sky.com/pd-image/${event.programmeuuid}/16-9/640`
              programs.push({
                title: event.t,
                description: event.sy,
                season: event.seasonnumber,
                episode: event.episodenumber,
                start,
                stop,
                icon: image,
                image
              })
            }
          })
      }
    }

    return programs
  },
  async channels() {
    const dataPath = path.join(__dirname, '__data__', 'regions.json')
    const regions = []

    try {
      const raw = await fs.readFile(dataPath, 'utf8')
      const payload = JSON.parse(raw)
      if (Array.isArray(payload.regions)) {
        regions.push(...payload.regions)
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
